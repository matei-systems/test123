-- ============================================================================
--  Matei Loyalty — Datenbank-Schema (PostgreSQL / Supabase)
--  Multi-Tenant SaaS für digitale Treuekarten
--
--  Prinzip: Jede Zeile gehört zu genau einer Organisation (org_id).
--  Row Level Security (RLS) sorgt dafür, dass ein Mandant NIEMALS die
--  Daten eines anderen Mandanten sehen oder ändern kann — auch dann nicht,
--  wenn im Frontend ein Fehler passiert. Das ist die wichtigste
--  Sicherheitsschicht einer Supabase-SaaS.
-- ============================================================================

-- gen_random_uuid() ist in PG13+ im Core enthalten. pgcrypto als Fallback.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- ENUM-Typen (klar definierte, begrenzte Wertemengen)
-- ---------------------------------------------------------------------------
do $$ begin
  create type membership_role   as enum ('owner', 'admin', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type program_type      as enum ('stamp', 'points');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_status       as enum ('active', 'completed', 'redeemed', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_type  as enum ('stamp', 'points', 'redeem', 'adjust');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 1) profiles — 1:1 zu auth.users (Supabase Auth verwaltet Passwörter etc.)
--    Wir speichern hier nur öffentliche/anwendungsbezogene Zusatzdaten.
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2) organizations — der Mandant (das Unternehmen des Kunden)
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,                      -- für URLs, z. B. /c/mueller-cafe
  owner_id    uuid not null references auth.users(id),
  plan        text not null default 'trial',             -- trial | starter | pro
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3) memberships — welcher User gehört mit welcher Rolle zu welcher Org
--    (Basis für Rollen & Rechte / RLS)
-- ---------------------------------------------------------------------------
create table if not exists memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        membership_role not null default 'staff',
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 4) locations — Standorte/Filialen eines Unternehmens
-- ---------------------------------------------------------------------------
create table if not exists locations (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  name         text not null,
  address      text,
  city         text,
  postal_code  text,
  country      text default 'AT',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5) loyalty_programs — die "Kartenvorlage": Stempel ODER Punkte + Design
--    design (jsonb) hält Farben, Logo-Text/-URL, Karten-Titel usw.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_programs (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations(id) on delete cascade,
  name               text not null,
  type               program_type not null default 'stamp',
  stamps_required    int not null default 10,            -- für type='stamp'
  points_per_reward  int not null default 100,           -- für type='points'
  reward_description text,                                -- "1 Gratis-Kaffee"
  design             jsonb not null default '{}'::jsonb,  -- {primaryColor,textColor,logoText,...}
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6) customers — die Endkunden des Unternehmens (nicht die SaaS-User!)
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 7) cards — konkrete Karte eines Kunden für ein Programm
--    serial_number ist der eindeutige Schlüssel, den Apple/Google Wallet nutzt.
--    barcode_value ist der Inhalt des QR/Barcodes (i. d. R. == serial_number).
-- ---------------------------------------------------------------------------
create table if not exists cards (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  program_id        uuid not null references loyalty_programs(id) on delete cascade,
  customer_id       uuid not null references customers(id) on delete cascade,
  serial_number     text unique not null default gen_random_uuid()::text,
  barcode_value     text not null default gen_random_uuid()::text,
  stamps            int not null default 0,
  points            int not null default 0,
  status            card_status not null default 'active',
  apple_pass_serial text,        -- Serial des .pkpass (falls Apple Wallet)
  google_object_id  text,        -- Object-ID im Google Wallet
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 8) transactions — das UNVERÄNDERLICHE Buchungsjournal (Ledger)
--    Jeder Stempel/Punkt/Einlöse-Vorgang = 1 Zeile. Wichtig für Audit,
--    Statistiken und Missbrauchserkennung (z. B. 20 Stempel in 1 Minute).
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  card_id      uuid not null references cards(id) on delete cascade,
  location_id  uuid references locations(id) on delete set null,
  staff_id     uuid references auth.users(id) on delete set null,
  type         transaction_type not null,
  amount       int not null default 1,       -- +Stempel/+Punkte oder eingelöste Menge
  note         text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 9) rewards — Belohnungs-Katalog (v. a. für Punkte-Programme)
-- ---------------------------------------------------------------------------
create table if not exists rewards (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  program_id   uuid not null references loyalty_programs(id) on delete cascade,
  title        text not null,
  description  text,
  cost_points  int,                          -- null = automatische Stempel-Belohnung
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 10) reward_redemptions — eingelöste Belohnungen (wer, wann, welche)
-- ---------------------------------------------------------------------------
create table if not exists reward_redemptions (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  card_id      uuid not null references cards(id) on delete cascade,
  reward_id    uuid references rewards(id) on delete set null,
  staff_id     uuid references auth.users(id) on delete set null,
  redeemed_at  timestamptz not null default now(),
  note         text
);

-- ---------------------------------------------------------------------------
-- 11) campaigns — Aktionen (z. B. "Doppelte Stempel diese Woche")
-- ---------------------------------------------------------------------------
create table if not exists campaigns (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  name         text not null,
  description  text,
  type         text not null default 'bonus',   -- bonus | discount | double_stamp
  config       jsonb not null default '{}'::jsonb,
  starts_at    timestamptz,
  ends_at      timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indizes — Performance auf Tausenden Organisationen/Karten
-- ---------------------------------------------------------------------------
create index if not exists idx_memberships_user      on memberships(user_id);
create index if not exists idx_locations_org         on locations(org_id);
create index if not exists idx_programs_org          on loyalty_programs(org_id);
create index if not exists idx_customers_org         on customers(org_id);
create index if not exists idx_cards_org             on cards(org_id);
create index if not exists idx_cards_serial          on cards(serial_number);
create index if not exists idx_tx_card_created       on transactions(card_id, created_at desc);
create index if not exists idx_tx_org_created        on transactions(org_id, created_at desc);
create index if not exists idx_rewards_org           on rewards(org_id);
create index if not exists idx_redemptions_org       on reward_redemptions(org_id);
create index if not exists idx_campaigns_org         on campaigns(org_id);

-- ---------------------------------------------------------------------------
-- updated_at automatisch pflegen (Trigger)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_cards_updated on cards;
create trigger trg_cards_updated
  before update on cards
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Helfer-Funktionen für RLS (SECURITY DEFINER, damit sie memberships lesen
-- dürfen, ohne selbst in eine RLS-Endlosschleife zu laufen).
-- ---------------------------------------------------------------------------
create or replace function is_org_member(target_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(target_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS aktivieren
-- ---------------------------------------------------------------------------
alter table profiles           enable row level security;
alter table organizations      enable row level security;
alter table memberships        enable row level security;
alter table locations          enable row level security;
alter table loyalty_programs   enable row level security;
alter table customers          enable row level security;
alter table cards              enable row level security;
alter table transactions       enable row level security;
alter table rewards            enable row level security;
alter table reward_redemptions enable row level security;
alter table campaigns          enable row level security;

-- profiles: jeder sieht/ändert nur sich selbst
create policy profiles_self_select on profiles for select using (id = auth.uid());
create policy profiles_self_upsert on profiles for insert with check (id = auth.uid());
create policy profiles_self_update on profiles for update using (id = auth.uid());

-- organizations: Mitglieder dürfen lesen; nur Admins/Owner ändern; jeder
-- eingeloggte User darf eine neue Org anlegen (er wird ihr Owner).
create policy org_select on organizations for select using (is_org_member(id));
create policy org_insert on organizations for insert with check (owner_id = auth.uid());
create policy org_update on organizations for update using (is_org_admin(id));
create policy org_delete on organizations for delete using (is_org_admin(id));

-- memberships: Mitglieder der Org sehen die Mitgliederliste; Admins verwalten
create policy mem_select on memberships for select using (is_org_member(org_id));
create policy mem_write  on memberships for all    using (is_org_admin(org_id))
                                                   with check (is_org_admin(org_id));

-- Generische Vorlage für alle org-gebundenen Tabellen:
--   lesen  = Mitglied,  schreiben = Mitglied (Rollenfeinschliff optional)
create policy loc_all      on locations          for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy prog_all     on loyalty_programs   for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy cust_all     on customers          for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy cards_all    on cards              for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy tx_all       on transactions       for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy rewards_all  on rewards            for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy redeem_all   on reward_redemptions for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy camp_all     on campaigns          for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ============================================================================
-- Ende Schema
-- ============================================================================

-- ============================================================================
--  Onboarding-Trigger (für die App nötig)
-- ============================================================================

-- Beim Anlegen einer Org automatisch den Owner als Mitglied eintragen.
-- (Löst das Henne-Ei-Problem: der erste Insert könnte sonst an RLS scheitern.)
create or replace function handle_new_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into memberships(org_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end $$;

drop trigger if exists trg_org_created on organizations;
create trigger trg_org_created
  after insert on organizations
  for each row execute function handle_new_org();

-- Beim Anlegen eines Auth-Users automatisch ein profiles-Zeile erstellen.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_user_created on auth.users;
create trigger trg_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

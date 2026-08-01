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
  title              text,                                 -- Anzeigename auf der Karte
  type               program_type not null default 'stamp',
  stamps_required    int not null default 10,            -- für type='stamp'
  points_per_reward  int not null default 100,           -- für type='points'
  reward_description text,                                -- "1 Gratis-Kaffee"
  design             jsonb not null default '{}'::jsonb,  -- {primaryColor,textColor,logoText,...}
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- `create table if not exists` above is a no-op against a database that already
-- has this table from an earlier version of this schema. This app was shipped
-- with app/dashboard/programs/actions.ts writing a `title` field that never
-- existed as a column here, which made every "Programm speichern" fail with
-- `column "title" of relation "loyalty_programs" does not exist` — silently,
-- because the UI didn't surface DB errors either (fixed separately). Re-running
-- this whole file against an existing database retroactively adds it.
alter table loyalty_programs add column if not exists title text;

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
-- (drop-if-exists davor: dieses Skript muss beliebig oft re-runnable sein,
-- siehe Kommentar am Anfang des P7-Abschnitts weiter unten)
drop policy if exists profiles_self_select on profiles;
create policy profiles_self_select on profiles for select using (id = auth.uid());
drop policy if exists profiles_self_upsert on profiles;
create policy profiles_self_upsert on profiles for insert with check (id = auth.uid());
drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles for update using (id = auth.uid());

-- organizations: Mitglieder dürfen lesen; nur Admins/Owner ändern; jeder
-- eingeloggte User darf eine neue Org anlegen (er wird ihr Owner).
drop policy if exists org_select on organizations;
create policy org_select on organizations for select using (is_org_member(id));
drop policy if exists org_insert on organizations;
create policy org_insert on organizations for insert with check (owner_id = auth.uid());
drop policy if exists org_update on organizations;
create policy org_update on organizations for update using (is_org_admin(id));
drop policy if exists org_delete on organizations;
create policy org_delete on organizations for delete using (is_org_admin(id));

-- memberships: Mitglieder der Org sehen die Mitgliederliste; Admins verwalten
drop policy if exists mem_select on memberships;
create policy mem_select on memberships for select using (is_org_member(org_id));
drop policy if exists mem_write on memberships;
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

-- ============================================================================
--  P7: Team & Zugriff
--  - invitations: Mitarbeiter per E-Mail einladen, Annahme per Token.
--  - memberships.location_id: bereitet Mehr-Standort-Betriebe vor (Zuordnung
--    Mitarbeiter -> Filiale, taggt automatisch die Transaktionen dieser
--    Person mit dem Standort).
--  - RLS wird für mehrere Tabellen von "jedes Mitglied darf alles" auf
--    "lesen = Mitglied, schreiben/ändern/löschen = Admin/Owner" verschärft.
--    transactions/reward_redemptions bleiben zusätzlich ein unveränderliches
--    Journal: nur INSERT + SELECT, nie UPDATE/DELETE (Audit-Sicherheit).
--  Re-runnable: nutzt "if not exists" / "drop policy if exists" durchgehend,
--  damit dieses Skript beliebig oft gegen dieselbe Datenbank laufen darf.
-- ============================================================================

do $$ begin
  create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  email       text not null,
  role        membership_role not null default 'staff',
  token       text unique not null,
  status      invitation_status not null default 'pending',
  invited_by  uuid references auth.users(id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);

create index if not exists idx_invitations_org    on invitations(org_id);
create index if not exists idx_invitations_token  on invitations(token);
create index if not exists idx_invitations_email  on invitations(org_id, email) where status = 'pending';

alter table memberships add column if not exists location_id uuid references locations(id) on delete set null;

-- memberships.user_id zeigte bisher auf auth.users(id). PostgREST kann darüber
-- aber KEIN memberships -> profiles Embed auflösen, weil beide Tabellen nur
-- unabhängig voneinander auf auth.users zeigen, nicht direkt aufeinander -
-- das ist beim Testen der Team-Seite aufgefallen (memberships.select("...,
-- profiles(email, full_name)") lieferte 0 Zeilen). profiles.id == auth.users.id
-- ist 1:1 garantiert (siehe handle_new_user-Trigger), daher ist es sicher und
-- der Standard-Supabase-Weg, memberships.user_id stattdessen auf profiles(id)
-- zeigen zu lassen - danach funktioniert das Embed nativ.
alter table memberships drop constraint if exists memberships_user_id_fkey;
alter table memberships add constraint memberships_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table invitations enable row level security;

drop policy if exists inv_select on invitations;
create policy inv_select on invitations for select using (is_org_admin(org_id));
drop policy if exists inv_write on invitations;
create policy inv_write on invitations for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

-- profiles: zusätzlich zum bestehenden "ich sehe mich selbst" dürfen
-- Team-Mitglieder sich gegenseitig sehen (Name/E-Mail auf der Team-Seite).
-- Mehrere SELECT-Policies werden von Postgres mit OR verknüpft, die
-- bestehende profiles_self_select-Policy bleibt zusätzlich gültig.
drop policy if exists profiles_org_select on profiles;
create policy profiles_org_select on profiles for select using (
  exists (
    select 1 from memberships m1
    join memberships m2 on m1.org_id = m2.org_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id
  )
);

-- Programme, Standorte, Belohnungs-Katalog, Kampagnen: Konfiguration des
-- Betriebs -> lesen dürfen alle Mitglieder (Personal braucht das für die
-- tägliche Arbeit), ändern nur Admin/Owner.
drop policy if exists prog_all on loyalty_programs;
drop policy if exists prog_select on loyalty_programs;
create policy prog_select on loyalty_programs for select using (is_org_member(org_id));
drop policy if exists prog_insert on loyalty_programs;
create policy prog_insert on loyalty_programs for insert with check (is_org_admin(org_id));
drop policy if exists prog_update on loyalty_programs;
create policy prog_update on loyalty_programs for update using (is_org_admin(org_id));
drop policy if exists prog_delete on loyalty_programs;
create policy prog_delete on loyalty_programs for delete using (is_org_admin(org_id));

drop policy if exists loc_all on locations;
drop policy if exists loc_select on locations;
create policy loc_select on locations for select using (is_org_member(org_id));
drop policy if exists loc_insert on locations;
create policy loc_insert on locations for insert with check (is_org_admin(org_id));
drop policy if exists loc_update on locations;
create policy loc_update on locations for update using (is_org_admin(org_id));
drop policy if exists loc_delete on locations;
create policy loc_delete on locations for delete using (is_org_admin(org_id));

drop policy if exists rewards_all on rewards;
drop policy if exists rewards_select on rewards;
create policy rewards_select on rewards for select using (is_org_member(org_id));
drop policy if exists rewards_insert on rewards;
create policy rewards_insert on rewards for insert with check (is_org_admin(org_id));
drop policy if exists rewards_update on rewards;
create policy rewards_update on rewards for update using (is_org_admin(org_id));
drop policy if exists rewards_delete on rewards;
create policy rewards_delete on rewards for delete using (is_org_admin(org_id));

drop policy if exists camp_all on campaigns;
drop policy if exists camp_select on campaigns;
create policy camp_select on campaigns for select using (is_org_member(org_id));
drop policy if exists camp_insert on campaigns;
create policy camp_insert on campaigns for insert with check (is_org_admin(org_id));
drop policy if exists camp_update on campaigns;
create policy camp_update on campaigns for update using (is_org_admin(org_id));
drop policy if exists camp_delete on campaigns;
create policy camp_delete on campaigns for delete using (is_org_admin(org_id));

-- Kunden/Karten: jedes Mitglied darf lesen/anlegen/ändern (Personal gibt
-- Karten aus und stempelt), löschen ist Admin/Owner vorbehalten.
drop policy if exists cust_all on customers;
drop policy if exists cust_select on customers;
create policy cust_select on customers for select using (is_org_member(org_id));
drop policy if exists cust_insert on customers;
create policy cust_insert on customers for insert with check (is_org_member(org_id));
drop policy if exists cust_update on customers;
create policy cust_update on customers for update using (is_org_member(org_id));
drop policy if exists cust_delete on customers;
create policy cust_delete on customers for delete using (is_org_admin(org_id));

drop policy if exists cards_all on cards;
drop policy if exists cards_select on cards;
create policy cards_select on cards for select using (is_org_member(org_id));
drop policy if exists cards_insert on cards;
create policy cards_insert on cards for insert with check (is_org_member(org_id));
drop policy if exists cards_update on cards;
create policy cards_update on cards for update using (is_org_member(org_id));
drop policy if exists cards_delete on cards;
create policy cards_delete on cards for delete using (is_org_admin(org_id));

-- transactions/reward_redemptions: unveränderliches Buchungsjournal. Jedes
-- Mitglied darf Buchungen anlegen (stempeln/einlösen) und lesen, aber NIE
-- nachträglich ändern oder löschen - das ist ein Audit-Grundsatz.
drop policy if exists tx_all on transactions;
drop policy if exists tx_select on transactions;
create policy tx_select on transactions for select using (is_org_member(org_id));
drop policy if exists tx_insert on transactions;
create policy tx_insert on transactions for insert with check (is_org_member(org_id));

drop policy if exists redeem_all on reward_redemptions;
drop policy if exists redeem_select on reward_redemptions;
create policy redeem_select on reward_redemptions for select using (is_org_member(org_id));
drop policy if exists redeem_insert on reward_redemptions;
create policy redeem_insert on reward_redemptions for insert with check (is_org_member(org_id));

-- ============================================================================
--  P8: Kartendesign & Branding
--  - card-assets: öffentlicher Storage-Bucket für Hintergrundbilder/Logos.
--    Uploads laufen ausschließlich über eine Server Action mit dem
--    Service-Role-Client (RLS-Bypass, wie an jeder anderen Stelle der App,
--    an der ein privilegierter Schreibzugriff nötig ist) - daher genügt hier
--    eine öffentliche Leseberechtigung, keine zusätzlichen Schreib-Policies.
--    Pfadschema: card-assets/<org_id>/<uuid>.<ext>
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('card-assets', 'card-assets', true)
on conflict (id) do nothing;

-- ============================================================================
--  P9: Google Wallet & Apple Wallet
--  - apple_wallet_registrations: hält fest, welches Gerät für Push-Updates
--    zu welcher Karte registriert ist (Apples PassKit-Webservice-Protokoll).
--    Wird ausschließlich von den /api/wallet/apple/v1/* Endpunkten über den
--    Service-Role-Client geschrieben/gelesen - Apple-Geräte haben keine
--    Supabase-Auth-Session, die Authentifizierung läuft stattdessen über den
--    "Authorization: ApplePass <token>"-Header (siehe lib/apple-wallet.ts).
--    RLS ist aktiviert und bekommt bewusst KEINE Policies: das sperrt anon/
--    authenticated vollständig aus (Standard-Deny), nur der RLS-Bypass von
--    service_role kommt durch - genau das ist hier gewünscht.
-- ============================================================================
create table if not exists apple_wallet_registrations (
  id                      uuid primary key default gen_random_uuid(),
  device_library_id       text not null,
  push_token              text not null,
  pass_type_identifier    text not null,
  serial_number           text not null references cards(serial_number) on delete cascade,
  org_id                  uuid not null references organizations(id) on delete cascade,
  created_at              timestamptz not null default now(),
  unique (device_library_id, pass_type_identifier, serial_number)
);

create index if not exists idx_apple_reg_device on apple_wallet_registrations(device_library_id, pass_type_identifier);
create index if not exists idx_apple_reg_serial on apple_wallet_registrations(serial_number);

alter table apple_wallet_registrations enable row level security;

-- ============================================================================
--  P12: Stripe & Abonnements
--  - Abrechnungsfelder direkt auf organizations (1 Abo pro Betrieb - passt
--    zum bestehenden Multi-Tenant-Modell, keine eigene Tabelle nötig).
--  - trial_ends_at wird bei der Betriebs-Anlage gesetzt (14 Tage, siehe
--    app/dashboard/onboarding/actions.ts) - komplett ohne Kreditkarte,
--    damit die bestehende reibungslose Anmeldung erhalten bleibt. Erst wenn
--    ein Betrieb tatsächlich least Zahlungsdaten hinterlegt (Stripe
--    Checkout), übernimmt lib/billing/access.ts den Stripe-eigenen Status;
--    bis dahin zählt allein dieses Datum.
--  - subscription_status/current_period_end/etc. werden AUSSCHLIESSLICH vom
--    Stripe-Webhook geschrieben (service_role, RLS-Bypass) - siehe
--    app/api/stripe/webhook/route.ts. Server Actions bitten Stripe nur um
--    Änderungen, sie schreiben diese Felder nie selbst (ein einziger
--    Schreiber verhindert Wettlaufsituationen zwischen optimistischem
--    UI-Update und dem, was Stripe tatsächlich bestätigt).
-- ============================================================================
alter table organizations add column if not exists stripe_customer_id text;
alter table organizations add column if not exists stripe_subscription_id text;
alter table organizations add column if not exists stripe_price_id text;
alter table organizations add column if not exists subscription_status text; -- trialing|active|past_due|canceled|unpaid|incomplete|incomplete_expired|paused
alter table organizations add column if not exists plan_id text;             -- 'basic' | 'pro' | 'premium' (siehe lib/billing/plans.ts)
alter table organizations add column if not exists billing_interval text;    -- 'monthly' | 'yearly'
alter table organizations add column if not exists current_period_end timestamptz;
alter table organizations add column if not exists cancel_at_period_end boolean not null default false;
alter table organizations add column if not exists trial_ends_at timestamptz;

-- Für bereits bestehende Betriebe (vor P12 angelegt): 14 Tage ab jetzt,
-- damit niemand rückwirkend ohne Vorwarnung ausgesperrt wird.
update organizations set trial_ends_at = now() + interval '14 days' where trial_ends_at is null;

create index if not exists idx_org_stripe_customer on organizations(stripe_customer_id);

-- Spaltenschutz: Postgres-RLS ist rein zeilenbasiert - die bestehende
-- org_update-Policy (jeder Admin darf die eigene Org-Zeile aktualisieren)
-- würde ohne diese Einschränkung auch die Abrechnungsfelder für JEDEN
-- Admin beschreibbar machen, sobald sie über die REST-API direkt statt über
-- unsere Server Actions angesprochen werden - ein direkter Weg, sich selbst
-- kostenlos ein "aktives" Abo zu verschaffen. Deshalb: nur name/slug bleiben
-- für eingeloggte Nutzer beschreibbar, alles andere (inkl. aller künftigen
-- Spalten) ist implizit gesperrt und nur für service_role offen.
revoke update on organizations from authenticated, anon;
grant update (name, slug) on organizations to authenticated;

-- ============================================================================
--  P13: Rechtliche Pflichtseiten & Zustimmungs-Tracking
--  - terms_accepted_at/terms_version dokumentieren, dass und wann ein Nutzer
--    AGB + Datenschutzerklärung akzeptiert hat (Nachweispflicht). Wird beim
--    Registrieren serverseitig gesetzt (app/register/actions.ts), NIE nur
--    clientseitig geprüft - eine reine HTML-"required"-Checkbox lässt sich
--    umgehen. terms_version erlaubt es später, bei einer inhaltlichen
--    Änderung der AGB gezielt nur die Nutzer mit veralteter Version erneut
--    zur Zustimmung aufzufordern, ohne die Historie zu verlieren.
-- ============================================================================
alter table profiles add column if not exists terms_accepted_at timestamptz;
alter table profiles add column if not exists terms_version text;

-- Der AVV (Auftragsverarbeitungsvertrag, Art. 28 DSGVO) ist eine Vereinbarung
-- zwischen Matei Loyalty und dem jeweiligen BETRIEB (nicht der einzelnen
-- Person, die sich registriert hat) - ein Nutzer könnte später mehrere
-- Betriebe anlegen, die AVV-Zustimmung gehört daher auf organizations, nicht
-- auf profiles. Wird bei der Betriebs-Anlage gesetzt (app/dashboard/
-- onboarding/actions.ts), serverseitig erzwungen wie terms_accepted_at.
alter table organizations add column if not exists avv_accepted_at timestamptz;
alter table organizations add column if not exists avv_version text;

-- ============================================================================
--  P14: Admin-/Superadmin-Bereich für die Plattform (Matei Systems)
--  - platform_admins: wer darf ins Admin-Panel (/admin)? Bewusst komplett
--    getrennt von memberships/profiles - ein Betriebs-Owner ist NIEMALS
--    automatisch Plattform-Admin, und umgekehrt braucht ein Plattform-Admin
--    keine Mitgliedschaft in irgendeiner Organisation. RLS ist aktiviert,
--    bekommt aber bewusst KEINE Policies (exakt wie apple_wallet_registrations
--    weiter oben) - das sperrt anon/authenticated per Standard-Deny komplett
--    aus, nur der RLS-Bypass von service_role kommt durch. lib/admin.ts prüft
--    darüber serverseitig, ob der eingeloggte User Admin ist, und mit welcher
--    Rolle - das Admin-Panel selbst liest/schreibt danach ausschließlich über
--    den Service-Role-Client (wie an jeder anderen privilegierten Stelle der
--    App), NIE über RLS-Policies mit "is_platform_admin()"-Sonderfällen in
--    den Tabellen anderer Betriebe - ein einziger, klar auditierbarer
--    Durchsetzungspunkt statt verteilter Spezialfälle in jeder RLS-Policy.
--  - support_tickets/support_ticket_messages: Support-Fälle der Betriebe.
--    Ein Betrieb sieht/erstellt nur seine eigenen (normale is_org_member-RLS
--    wie überall sonst), Admin-Antworten und Status-Änderungen laufen über
--    den Service-Role-Client im Admin-Panel.
--  - admin_audit_log: jede schreibende Admin-Aktion (Sperren, Testphase
--    verlängern, Tarif manuell ändern) wird protokolliert - Nachvollziehbarkeit,
--    sobald mehrere Personen Admin-Zugriff haben. RLS aktiviert, keine
--    Policies (nur service_role), wie platform_admins.
--  - organizations.admin_suspended: manuelle Plattform-Sperre, unabhängig vom
--    Stripe-Abrechnungsstatus (z. B. bei Missbrauch/AGB-Verstoß) - siehe
--    lib/org.ts requireOrgRole(), das dies VOR dem Abrechnungsstatus prüft
--    und dabei ausnahmslos greift (auch für Abrechnungs-Aktionen selbst,
--    anders als eine reine Testphasen-/Zahlungs-Einschränkung).
-- ============================================================================
do $$ begin
  create type admin_role as enum ('superadmin', 'support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

create table if not exists platform_admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        admin_role not null default 'support',
  created_at  timestamptz not null default now(),
  unique (user_id)
);

alter table platform_admins enable row level security;

create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  created_by   uuid references profiles(id) on delete set null,
  subject      text not null,
  status       ticket_status not null default 'open',
  priority     ticket_priority not null default 'normal',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists support_ticket_messages (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references support_tickets(id) on delete cascade,
  author_id    uuid references profiles(id) on delete set null,
  is_admin     boolean not null default false,
  body         text not null,
  created_at   timestamptz not null default now()
);

create table if not exists admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references auth.users(id) on delete cascade,
  action       text not null,
  target_type  text not null,
  target_id    uuid,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

alter table organizations add column if not exists admin_suspended boolean not null default false;
alter table organizations add column if not exists admin_suspended_reason text;

drop trigger if exists trg_tickets_updated on support_tickets;
create trigger trg_tickets_updated
  before update on support_tickets
  for each row execute function set_updated_at();

-- Indizes - dieselbe "Tausende Organisationen"-Perspektive wie beim
-- Kern-Schema weiter oben: Listen-/Filter-/Sortier-Spalten des Admin-Panels
-- sind indiziert, damit organizations/-Listen und Support-Listen auch bei
-- sehr vielen Betrieben schnell bleiben.
create index if not exists idx_org_created_at    on organizations(created_at desc);
create index if not exists idx_org_subscription  on organizations(subscription_status);
create index if not exists idx_org_plan          on organizations(plan_id);
create index if not exists idx_org_name_lower    on organizations(lower(name));
create index if not exists idx_profiles_email    on profiles(lower(email));
create index if not exists idx_tickets_org       on support_tickets(org_id);
create index if not exists idx_tickets_status    on support_tickets(status, created_at desc);
create index if not exists idx_ticket_msgs       on support_ticket_messages(ticket_id, created_at);
create index if not exists idx_admin_audit_admin on admin_audit_log(admin_id, created_at desc);
create index if not exists idx_admin_audit_target on admin_audit_log(target_type, target_id);

alter table support_tickets         enable row level security;
alter table support_ticket_messages enable row level security;
alter table admin_audit_log         enable row level security;

drop policy if exists tickets_select on support_tickets;
create policy tickets_select on support_tickets for select using (is_org_member(org_id));
drop policy if exists tickets_insert on support_tickets;
create policy tickets_insert on support_tickets for insert with check (is_org_member(org_id) and created_by = auth.uid());

-- Nachrichten: jedes Mitglied des Betriebs sieht den ganzen Thread (inkl.
-- Admin-Antworten) und darf selbst antworten - aber NIE mit is_admin=true,
-- das ist Admin-Antworten über den Service-Role-Client vorbehalten (RLS
-- verhindert, dass ein manipulierter Client sich als Admin ausgibt).
drop policy if exists ticket_msgs_select on support_ticket_messages;
create policy ticket_msgs_select on support_ticket_messages for select using (
  exists (select 1 from support_tickets t where t.id = ticket_id and is_org_member(t.org_id))
);
drop policy if exists ticket_msgs_insert on support_ticket_messages;
create policy ticket_msgs_insert on support_ticket_messages for insert with check (
  is_admin = false
  and author_id = auth.uid()
  and exists (select 1 from support_tickets t where t.id = ticket_id and is_org_member(t.org_id))
);

-- ============================================================================
--  P15: Rate-Limiting für Auth-Endpunkte (Login/Registrierung/Passwort-Reset)
--  - Kein neuer Infrastruktur-Baustein (Redis o.ä.), sondern dieselbe
--    Postgres-Datenbank, die ohnehin schon überall die Quelle der Wahrheit
--    ist - passt zum Rest der Architektur und braucht kein zusätzliches
--    Zugangsdaten-Paar. Siehe lib/rate-limit.ts.
--  - RLS aktiviert, bewusst OHNE Policies (wie platform_admins/
--    admin_audit_log) - nur service_role liest/schreibt.
-- ============================================================================
create table if not exists rate_limit_events (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_rate_limit_key_created on rate_limit_events(key, created_at desc);

alter table rate_limit_events enable row level security;

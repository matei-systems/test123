-- ============================================================================
--  P18: Plattform-Ausbau
--  Kundenkonten, öffentliche Geschäftsprofile mit Prüfstatus, Rewards-Katalog,
--  Aktionen, atomare Punktebuchung mit Idempotenz, kurzlebige Einlöse-Codes,
--  automatische Verdachtsmarkierung, Meldungen und Kontaktanfragen.
--
--  Ausschließlich additiv und re-runnable (if not exists / create or replace /
--  drop policy if exists). Bestehende Daten bleiben unverändert; einzige
--  Datenmigration: für jedes bestehende Programm wird seine bisherige
--  Belohnung als "Hauptbelohnung" in den Rewards-Katalog übernommen.
--  Wird zusätzlich ans Ende von supabase/schema.sql angehängt.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Kundenkonten: ein Endkunden-Datensatz (customers, je Betrieb) kann mit
--    einem Matei-Konto verknüpft werden. Verknüpft wird NIE automatisch über
--    die E-Mail-Adresse (E-Mail-Bestätigung ist im Projekt deaktiviert, die
--    Adresse ist also unbestätigt) - nur über einen Beitritt im eingeloggten
--    Zustand oder über claim_card() mit der Seriennummer der Karte.
-- ---------------------------------------------------------------------------
alter table customers add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists idx_customers_user on customers(user_id) where user_id is not null;

-- Betriebe dürfen Kunden anlegen und Name/E-Mail/Telefon pflegen, aber nie
-- user_id setzen oder umbiegen (sonst könnte ein Betrieb fremde Karten in ein
-- beliebiges Kundenkonto schieben).
revoke insert, update on customers from authenticated, anon;
grant insert (org_id, full_name, email, phone) on customers to authenticated;
grant update (full_name, email, phone) on customers to authenticated;

-- Profile: Nutzer dürfen nur ihren Anzeigenamen selbst ändern (Zustimmungs-
-- Nachweise terms_* schreibt ausschließlich der Server).
revoke update on profiles from authenticated, anon;
grant update (full_name) on profiles to authenticated;

-- E-Mail-Änderungen über Supabase Auth in profiles spiegeln.
create or replace function handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is distinct from old.email then
    update profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_user_email_changed on auth.users;
create trigger trg_user_email_changed
  after update of email on auth.users
  for each row execute function handle_user_email_change();

-- ---------------------------------------------------------------------------
-- 2) Öffentliche Geschäftsprofile + Prüfstatus
--    Eigene Tabelle statt neuer Spalten auf organizations: organizations
--    enthält Abrechnungsdaten (Stripe-IDs), die nie öffentlich lesbar werden
--    dürfen - RLS ist zeilen-, nicht spaltenbasiert. business_profiles
--    enthält ausschließlich Daten, die für freigeschaltete Betriebe öffentlich
--    sein sollen.
-- ---------------------------------------------------------------------------
create or replace function slugify(input text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(
    translate(
      replace(replace(replace(replace(lower(coalesce(input, '')), 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'),
      'éèêáàâíìîóòôúùûç', 'eeeaaaiiiooouuuc'),
    '[^a-z0-9]+', '-', 'g'));
$$;

create table if not exists business_profiles (
  org_id          uuid primary key references organizations(id) on delete cascade,
  slug            text unique not null,
  display_name    text not null,
  tagline         text,
  description     text,
  category        text check (category in ('cafe','baeckerei','restaurant','friseur','kosmetik','einzelhandel','fitness','sonstiges')),
  logo_url        text,
  cover_url       text,
  address         text,
  postal_code     text,
  city            text,
  website         text,
  phone           text,
  public_email    text,
  instagram       text,
  opening_hours   jsonb not null default '[]'::jsonb,
  hours_note      text,
  is_listed       boolean not null default false,
  listing_status  text not null default 'draft' check (listing_status in ('draft','pending','approved','rejected','paused')),
  submitted_at    timestamptz,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_bp_public on business_profiles(listing_status, is_listed);
create index if not exists idx_bp_city on business_profiles(lower(city));
create index if not exists idx_bp_category on business_profiles(category);

-- Prüfentscheidungen als eigene Historie (wer, wann, warum) - getrennt vom
-- öffentlichen Profil, damit Ablehnungsgründe nie öffentlich lesbar sind.
create table if not exists business_reviews (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  decision    text not null check (decision in ('approved','rejected','paused','unpaused')),
  note        text,
  admin_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_br_org on business_reviews(org_id, created_at desc);

-- Profil automatisch für jeden neuen Betrieb anlegen (Status "draft").
create or replace function handle_new_org_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text := nullif(slugify(new.name), '');
  candidate text;
begin
  candidate := coalesce(base, 'geschaeft');
  if exists (select 1 from business_profiles where slug = candidate) then
    candidate := candidate || '-' || substr(md5(new.id::text), 1, 5);
  end if;
  insert into business_profiles (org_id, slug, display_name)
  values (new.id, candidate, new.name)
  on conflict (org_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_org_profile_created on organizations;
create trigger trg_org_profile_created
  after insert on organizations
  for each row execute function handle_new_org_profile();

-- Backfill für bestehende Betriebe (re-runnable dank on conflict).
insert into business_profiles (org_id, slug, display_name)
select o.id,
       case when exists (select 1 from business_profiles b where b.slug = coalesce(nullif(slugify(o.name), ''), 'geschaeft'))
              or exists (select 1 from organizations o2 where o2.id <> o.id and o2.created_at < o.created_at
                         and coalesce(nullif(slugify(o2.name), ''), 'geschaeft') = coalesce(nullif(slugify(o.name), ''), 'geschaeft'))
            then coalesce(nullif(slugify(o.name), ''), 'geschaeft') || '-' || substr(md5(o.id::text), 1, 5)
            else coalesce(nullif(slugify(o.name), ''), 'geschaeft') end,
       o.name
from organizations o
on conflict (org_id) do nothing;

-- Statuswechsel, die ein Betrieb selbst auslösen darf: draft/rejected ->
-- pending (einreichen, nur mit vollständigem Profil) und pending -> draft
-- (zurückziehen). Freischalten/Ablehnen/Pausieren ist ausschließlich dem
-- Admin-Panel (service_role) vorbehalten. Slug, Freischalt-Zeitpunkt und
-- org_id sind für Betriebe unveränderlich.
create or replace function guard_business_profile_update()
returns trigger language plpgsql as $$
begin
  if current_user not in ('authenticated', 'anon') then
    new.updated_at := now();
    return new;
  end if;

  new.org_id := old.org_id;
  new.slug := old.slug;
  new.approved_at := old.approved_at;
  new.submitted_at := old.submitted_at;

  if new.listing_status is distinct from old.listing_status then
    if old.listing_status in ('draft', 'rejected') and new.listing_status = 'pending' then
      if coalesce(trim(new.display_name), '') = ''
         or new.category is null
         or coalesce(trim(new.city), '') = ''
         or length(coalesce(trim(new.description), '')) < 20 then
        raise exception 'MATEI_PROFILE_INCOMPLETE';
      end if;
      new.submitted_at := now();
    elsif old.listing_status = 'pending' and new.listing_status = 'draft' then
      null;
    else
      raise exception 'MATEI_STATUS_CHANGE_NOT_ALLOWED';
    end if;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_bp_guard on business_profiles;
create trigger trg_bp_guard
  before update on business_profiles
  for each row execute function guard_business_profile_update();

-- Öffentlich sichtbar = vom Betrieb gelistet + von Matei freigeschaltet +
-- nicht plattformseitig gesperrt + Abo/Testphase aktiv (spiegelt
-- lib/billing/access.ts). SECURITY DEFINER, weil organizations selbst für
-- anon nicht lesbar ist.
create or replace function org_billing_active(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
             when o.subscription_status is null then o.trial_ends_at is not null and o.trial_ends_at > now()
             when o.subscription_status in ('trialing', 'active') then true
             else false
           end
    from organizations o where o.id = target_org), false);
$$;

create or replace function is_business_public(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from business_profiles bp
    join organizations o on o.id = bp.org_id
    where bp.org_id = target_org
      and bp.is_listed
      and bp.listing_status = 'approved'
      and not o.admin_suspended
  ) and org_billing_active(target_org);
$$;

alter table business_profiles enable row level security;
alter table business_reviews  enable row level security;

revoke insert, delete on business_profiles from authenticated, anon;

drop policy if exists bp_public_select on business_profiles;
create policy bp_public_select on business_profiles for select using (is_business_public(org_id));
drop policy if exists bp_member_select on business_profiles;
create policy bp_member_select on business_profiles for select using (is_org_member(org_id));
drop policy if exists bp_owner_select on business_profiles;
create policy bp_owner_select on business_profiles for select using (
  exists (select 1 from customers c where c.org_id = business_profiles.org_id and c.user_id = (select auth.uid()))
);
drop policy if exists bp_admin_update on business_profiles;
create policy bp_admin_update on business_profiles for update using (is_org_admin(org_id)) with check (is_org_admin(org_id));

drop policy if exists br_member_select on business_reviews;
create policy br_member_select on business_reviews for select using (is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- 3) Lesezugriff für Kundenkonten auf ihre eigenen Daten
--    (zusätzliche SELECT-Policies, werden mit den bestehenden per OR verknüpft)
-- ---------------------------------------------------------------------------
drop policy if exists cust_owner_select on customers;
create policy cust_owner_select on customers for select using (user_id = (select auth.uid()));

drop policy if exists cards_owner_select on cards;
create policy cards_owner_select on cards for select using (
  exists (select 1 from customers c where c.id = cards.customer_id and c.user_id = (select auth.uid()))
);

drop policy if exists tx_owner_select on transactions;
create policy tx_owner_select on transactions for select using (
  exists (select 1 from cards k join customers c on c.id = k.customer_id
          where k.id = transactions.card_id and c.user_id = (select auth.uid()))
);

drop policy if exists redeem_owner_select on reward_redemptions;
create policy redeem_owner_select on reward_redemptions for select using (
  exists (select 1 from cards k join customers c on c.id = k.customer_id
          where k.id = reward_redemptions.card_id and c.user_id = (select auth.uid()))
);

drop policy if exists prog_owner_select on loyalty_programs;
create policy prog_owner_select on loyalty_programs for select using (
  exists (select 1 from cards k join customers c on c.id = k.customer_id
          where k.program_id = loyalty_programs.id and c.user_id = (select auth.uid()))
);
drop policy if exists prog_public_select on loyalty_programs;
create policy prog_public_select on loyalty_programs for select using (active and is_business_public(org_id));

drop policy if exists loc_public_select on locations;
create policy loc_public_select on locations for select using (is_business_public(org_id));

-- ---------------------------------------------------------------------------
-- 4) Rewards-Katalog
--    cost_points = Kosten in Programm-Einheiten (Stempel ODER Punkte).
--    Jedes Programm hat genau eine Hauptbelohnung (is_default), die mit
--    reward_description/Schwelle des Programms synchron gehalten wird -
--    so bleibt der bestehende Programm-Editor die eine Quelle dafür.
-- ---------------------------------------------------------------------------
alter table rewards add column if not exists is_default boolean not null default false;
alter table rewards add column if not exists conditions text;
alter table rewards add column if not exists valid_from timestamptz;
alter table rewards add column if not exists valid_until timestamptz;
alter table rewards add column if not exists ended_at timestamptz;
alter table rewards add column if not exists sort_order int not null default 0;
alter table rewards add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table rewards add constraint rewards_cost_positive check (cost_points is not null and cost_points > 0);
exception when duplicate_object then null; end $$;

create unique index if not exists idx_rewards_one_default on rewards(program_id) where is_default;
create index if not exists idx_rewards_program on rewards(program_id);

create or replace function sync_default_reward()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_cost int := case when new.type = 'stamp' then new.stamps_required else new.points_per_reward end;
  v_title text := coalesce(nullif(trim(new.reward_description), ''), 'Belohnung');
begin
  if exists (select 1 from rewards where program_id = new.id and is_default) then
    update rewards set title = v_title, cost_points = v_cost, updated_at = now()
    where program_id = new.id and is_default;
  else
    insert into rewards (org_id, program_id, title, cost_points, is_default, active)
    values (new.org_id, new.id, v_title, v_cost, true, true);
  end if;
  return new;
end $$;

drop trigger if exists trg_program_default_reward on loyalty_programs;
create trigger trg_program_default_reward
  after insert or update of reward_description, stamps_required, points_per_reward, type on loyalty_programs
  for each row execute function sync_default_reward();

-- Datenmigration: bestehende Programme bekommen ihre Hauptbelohnung.
insert into rewards (org_id, program_id, title, cost_points, is_default, active)
select p.org_id, p.id, coalesce(nullif(trim(p.reward_description), ''), 'Belohnung'),
       case when p.type = 'stamp' then p.stamps_required else p.points_per_reward end, true, true
from loyalty_programs p
where not exists (select 1 from rewards r where r.program_id = p.id and r.is_default);

drop trigger if exists trg_rewards_updated on rewards;
create trigger trg_rewards_updated before update on rewards for each row execute function set_updated_at();

-- Hauptbelohnung kann nur über das Programm gelöscht werden; Belohnungen mit
-- Einlösungen werden nicht gelöscht, sondern beendet (Historie bleibt).
create or replace function guard_reward_delete()
returns trigger language plpgsql as $$
begin
  -- pg_trigger_depth() > 1: Löschung kommt per Cascade (z. B. Programm ohne
  -- Karten wird gelöscht) - die soll durchgehen.
  if current_user in ('authenticated', 'anon') and pg_trigger_depth() = 1 then
    if old.is_default then raise exception 'MATEI_DEFAULT_REWARD'; end if;
    if exists (select 1 from reward_redemptions where reward_id = old.id) then
      raise exception 'MATEI_REWARD_HAS_REDEMPTIONS';
    end if;
  end if;
  return old;
end $$;

drop trigger if exists trg_rewards_guard_delete on rewards;
create trigger trg_rewards_guard_delete before delete on rewards for each row execute function guard_reward_delete();

drop policy if exists rewards_owner_select on rewards;
create policy rewards_owner_select on rewards for select using (
  exists (select 1 from cards k join customers c on c.id = k.customer_id
          where k.program_id = rewards.program_id and c.user_id = (select auth.uid()))
);
drop policy if exists rewards_public_select on rewards;
create policy rewards_public_select on rewards for select using (active and ended_at is null and is_business_public(org_id));

-- Programme mit ausgegebenen Karten werden nicht mehr gelöscht (das würde per
-- Cascade Kartenstände UND das Buchungsjournal vernichten), sondern
-- deaktiviert.
create or replace function guard_program_delete()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and pg_trigger_depth() = 1
     and exists (select 1 from cards where program_id = old.id) then
    raise exception 'MATEI_PROGRAM_HAS_CARDS';
  end if;
  return old;
end $$;

drop trigger if exists trg_program_guard_delete on loyalty_programs;
create trigger trg_program_guard_delete before delete on loyalty_programs for each row execute function guard_program_delete();

-- ---------------------------------------------------------------------------
-- 5) Aktionen (campaigns)
--    type 'multiplier': vervielfacht im Zeitraum serverseitig jede
--      Stempel-/Punktevergabe (config.factor 2-5), optional nur für ein Programm.
--    type 'announcement': reiner Hinweis im öffentlichen Profil, ohne
--      automatische Wirkung.
--    Status ergibt sich aus active / starts_at / ends_at ("beenden" setzt ends_at).
-- ---------------------------------------------------------------------------
alter table campaigns add column if not exists program_id uuid references loyalty_programs(id) on delete cascade;
alter table campaigns add column if not exists updated_at timestamptz not null default now();
alter table campaigns alter column type set default 'announcement';

do $$ begin
  alter table campaigns add constraint campaigns_type_check check (type in ('multiplier', 'announcement'));
exception when duplicate_object then null; end $$;

drop trigger if exists trg_campaigns_updated on campaigns;
create trigger trg_campaigns_updated before update on campaigns for each row execute function set_updated_at();

drop policy if exists camp_public_select on campaigns;
create policy camp_public_select on campaigns for select using (
  active and (ends_at is null or ends_at > now()) and is_business_public(org_id)
);
drop policy if exists camp_owner_select on campaigns;
create policy camp_owner_select on campaigns for select using (
  active and (ends_at is null or ends_at > now())
  and exists (select 1 from customers c where c.org_id = campaigns.org_id and c.user_id = (select auth.uid()))
);

-- ---------------------------------------------------------------------------
-- 6) Buchungsjournal: Idempotenz + Zusatzinfos für den Kundenverlauf
-- ---------------------------------------------------------------------------
alter table transactions add column if not exists client_request_id text;
alter table transactions add column if not exists reward_id uuid references rewards(id) on delete set null;
alter table transactions add column if not exists campaign_id uuid references campaigns(id) on delete set null;
alter table transactions add column if not exists balance_after int;
alter table transactions add column if not exists purchase_amount numeric(10,2);
create unique index if not exists idx_tx_client_request on transactions(org_id, client_request_id) where client_request_id is not null;
create index if not exists idx_tx_staff_created on transactions(staff_id, created_at desc) where staff_id is not null;

alter table reward_redemptions add column if not exists cost int;

-- ---------------------------------------------------------------------------
-- 7) Einlöse-Codes: Kunde wählt im Konto eine Belohnung, erhält einen
--    10 Minuten gültigen Code (QR + 6-stelliger Kurzcode), das Personal
--    scannt ihn. Ein Code ist genau einmal einlösbar.
-- ---------------------------------------------------------------------------
create table if not exists redemption_requests (
  id          uuid primary key default gen_random_uuid(),
  token       text unique not null,
  short_code  text not null,
  org_id      uuid not null references organizations(id) on delete cascade,
  card_id     uuid not null references cards(id) on delete cascade,
  reward_id   uuid not null references rewards(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'used', 'expired', 'cancelled')),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_rr_card on redemption_requests(card_id, status);
create index if not exists idx_rr_code on redemption_requests(org_id, short_code) where status = 'pending';

alter table redemption_requests enable row level security;
revoke insert, update, delete on redemption_requests from authenticated, anon;
drop policy if exists rr_owner_select on redemption_requests;
create policy rr_owner_select on redemption_requests for select using (user_id = (select auth.uid()));

alter table reward_redemptions add column if not exists request_id uuid references redemption_requests(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 8) Automatische Verdachtsmarkierung (nur Admin-Panel / service_role)
-- ---------------------------------------------------------------------------
create table if not exists transaction_flags (
  id               uuid primary key default gen_random_uuid(),
  transaction_id   uuid references transactions(id) on delete cascade,
  org_id           uuid not null references organizations(id) on delete cascade,
  card_id          uuid references cards(id) on delete cascade,
  reason           text not null check (reason in ('velocity_card', 'velocity_staff', 'large_amount', 'velocity_redeem')),
  details          jsonb not null default '{}'::jsonb,
  status           text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note  text,
  resolved_by      uuid references auth.users(id) on delete set null,
  resolved_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists idx_flags_status on transaction_flags(status, created_at desc);
create index if not exists idx_flags_card on transaction_flags(card_id, reason, created_at desc);
alter table transaction_flags enable row level security;

create or replace function flag_suspicious_transaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  if new.type in ('stamp', 'points') then
    select count(*) into v_count from transactions
      where card_id = new.card_id and type in ('stamp', 'points') and created_at > now() - interval '24 hours';
    if v_count >= 8 and not exists (
        select 1 from transaction_flags
        where card_id = new.card_id and reason = 'velocity_card' and created_at > now() - interval '24 hours') then
      insert into transaction_flags (transaction_id, org_id, card_id, reason, details)
      values (new.id, new.org_id, new.card_id, 'velocity_card', jsonb_build_object('buchungen_24h', v_count));
    end if;

    if new.type = 'points' and new.amount >= 500 then
      insert into transaction_flags (transaction_id, org_id, card_id, reason, details)
      values (new.id, new.org_id, new.card_id, 'large_amount', jsonb_build_object('punkte', new.amount));
    end if;

    if new.staff_id is not null then
      select count(*) into v_count from transactions
        where staff_id = new.staff_id and type in ('stamp', 'points') and created_at > now() - interval '10 minutes';
      if v_count >= 40 and not exists (
          select 1 from transaction_flags f join transactions t on t.id = f.transaction_id
          where f.reason = 'velocity_staff' and t.staff_id = new.staff_id and f.created_at > now() - interval '1 hour') then
        insert into transaction_flags (transaction_id, org_id, card_id, reason, details)
        values (new.id, new.org_id, new.card_id, 'velocity_staff', jsonb_build_object('buchungen_10min', v_count));
      end if;
    end if;
  elsif new.type = 'redeem' then
    select count(*) into v_count from transactions
      where card_id = new.card_id and type = 'redeem' and created_at > now() - interval '24 hours';
    if v_count >= 3 and not exists (
        select 1 from transaction_flags
        where card_id = new.card_id and reason = 'velocity_redeem' and created_at > now() - interval '24 hours') then
      insert into transaction_flags (transaction_id, org_id, card_id, reason, details)
      values (new.id, new.org_id, new.card_id, 'velocity_redeem', jsonb_build_object('einloesungen_24h', v_count));
    end if;
  end if;
  return null;
end $$;

drop trigger if exists trg_tx_flag on transactions;
create trigger trg_tx_flag after insert on transactions for each row execute function flag_suspicious_transaction();

-- ---------------------------------------------------------------------------
-- 9) Buchungsfunktionen (einziger Weg, Salden zu ändern)
--    Jede Funktion sperrt die Kartenzeile (SELECT ... FOR UPDATE), prüft
--    Mitgliedschaft, Plattform-Sperre und Abo-Status serverseitig und
--    schreibt Saldo + Journal in EINER Datenbank-Transaktion. Zwei
--    gleichzeitige Einlösungen werden dadurch serialisiert - die zweite sieht
--    den bereits reduzierten Saldo. client_request_id macht doppelt
--    abgeschickte Formulare idempotent.
--    Fehler werden als MATEI_*-Codes geworfen und in lib/ledger.ts übersetzt.
-- ---------------------------------------------------------------------------
create or replace function earn_on_card(
  p_card_id uuid,
  p_purchase_amount numeric default null,
  p_client_request_id text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_card cards%rowtype;
  v_prog loyalty_programs%rowtype;
  v_location uuid;
  v_existing transactions%rowtype;
  v_last timestamptz;
  v_base int;
  v_factor int;
  v_campaign uuid;
  v_units int;
  v_balance int;
  v_tx uuid;
  v_note text;
begin
  if v_uid is null then raise exception 'MATEI_NOT_AUTHENTICATED'; end if;

  select * into v_card from cards where id = p_card_id for update;
  if not found then raise exception 'MATEI_CARD_NOT_FOUND'; end if;

  select m.location_id into v_location from memberships m where m.org_id = v_card.org_id and m.user_id = v_uid;
  if not found then raise exception 'MATEI_NOT_MEMBER'; end if;
  if (select o.admin_suspended from organizations o where o.id = v_card.org_id) then raise exception 'MATEI_ORG_SUSPENDED'; end if;
  if not org_billing_active(v_card.org_id) then raise exception 'MATEI_BILLING_INACTIVE'; end if;

  if p_client_request_id is not null then
    select * into v_existing from transactions where org_id = v_card.org_id and client_request_id = p_client_request_id;
    if found then
      return jsonb_build_object('duplicate', true, 'transaction_id', v_existing.id, 'units', v_existing.amount,
                                'factor', 1, 'balance', v_existing.balance_after, 'card_id', v_card.id);
    end if;
  end if;

  if v_card.status = 'inactive' then raise exception 'MATEI_CARD_INACTIVE'; end if;

  select * into v_prog from loyalty_programs where id = v_card.program_id;
  if not v_prog.active then raise exception 'MATEI_PROGRAM_INACTIVE'; end if;

  -- Doppel-Scan-Schutz, jetzt unter der Zeilensperre (vorher prüfte die App
  -- vor dem Schreiben, zwei parallele Anfragen konnten beide durchkommen).
  select max(t.created_at) into v_last from transactions t where t.card_id = v_card.id and t.type in ('stamp', 'points');
  if v_last is not null and v_last > now() - interval '30 seconds' then raise exception 'MATEI_COOLDOWN'; end if;

  if v_prog.earning_mode = 'amount' then
    if p_purchase_amount is null or p_purchase_amount < 0 then raise exception 'MATEI_AMOUNT_REQUIRED'; end if;
    if v_prog.type = 'stamp' then
      if p_purchase_amount < coalesce(v_prog.min_purchase_amount, 0) then raise exception 'MATEI_BELOW_MINIMUM'; end if;
      v_base := 1;
    else
      if coalesce(v_prog.amount_per_point, 0) <= 0 then raise exception 'MATEI_RULE_MISCONFIGURED'; end if;
      v_base := floor(p_purchase_amount / v_prog.amount_per_point)::int;
      if v_base <= 0 then raise exception 'MATEI_BELOW_MINIMUM'; end if;
    end if;
  else
    v_base := case when v_prog.type = 'stamp' then 1 else 10 end;
  end if;

  -- Aktiver Multiplikator (höchster gewinnt), Faktor auf 1-5 begrenzt.
  select c.id,
         greatest(1, least(5, case when c.config->>'factor' ~ '^[0-9]+$' then (c.config->>'factor')::int else 1 end))
    into v_campaign, v_factor
    from campaigns c
    where c.org_id = v_card.org_id and c.type = 'multiplier' and c.active
      and (c.program_id is null or c.program_id = v_card.program_id)
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
    order by 2 desc
    limit 1;
  v_factor := coalesce(v_factor, 1);
  v_units := v_base * v_factor;

  if v_prog.type = 'stamp' then
    if v_card.stamps >= v_prog.stamps_required then raise exception 'MATEI_CARD_FULL'; end if;
    v_balance := least(v_card.stamps + v_units, v_prog.stamps_required);
    v_units := v_balance - v_card.stamps;
    update cards set stamps = v_balance where id = v_card.id;
  else
    v_balance := v_card.points + v_units;
    update cards set points = v_balance where id = v_card.id;
  end if;

  v_note := nullif(concat_ws(' · ',
    case when v_prog.earning_mode = 'amount'
         then 'Einkauf: ' || replace(to_char(p_purchase_amount, 'FM999999990.00'), '.', ',') || ' €' end,
    case when v_factor > 1 then 'Aktion ×' || v_factor end), '');

  insert into transactions (org_id, card_id, location_id, staff_id, type, amount, note,
                            client_request_id, campaign_id, balance_after, purchase_amount)
  values (v_card.org_id, v_card.id, v_location, v_uid,
          (case when v_prog.type = 'stamp' then 'stamp' else 'points' end)::transaction_type,
          v_units, v_note, p_client_request_id,
          case when v_factor > 1 then v_campaign end, v_balance, p_purchase_amount)
  returning id into v_tx;

  return jsonb_build_object('duplicate', false, 'transaction_id', v_tx, 'units', v_units, 'factor', v_factor,
                            'balance', v_balance, 'type', v_prog.type, 'card_id', v_card.id);
end $$;

-- Interner Kern der Einlösung - erwartet eine bereits gesperrte Kartenzeile.
-- Nicht direkt aufrufbar (EXECUTE entzogen), nur über redeem_reward /
-- redeem_with_code.
create or replace function _redeem_on_locked_card(
  v_card cards,
  p_reward_id uuid,
  p_staff uuid,
  p_location uuid,
  p_client_request_id text,
  p_request_id uuid
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_prog loyalty_programs%rowtype;
  v_reward rewards%rowtype;
  v_balance int;
  v_after int;
  v_tx uuid;
  v_red uuid;
begin
  if v_card.status = 'inactive' then raise exception 'MATEI_CARD_INACTIVE'; end if;
  select * into v_prog from loyalty_programs where id = v_card.program_id;
  select * into v_reward from rewards where id = p_reward_id and program_id = v_card.program_id;
  if not found then raise exception 'MATEI_REWARD_NOT_FOUND'; end if;
  if not v_reward.active or v_reward.ended_at is not null then raise exception 'MATEI_REWARD_INACTIVE'; end if;
  if v_reward.valid_from is not null and v_reward.valid_from > now() then raise exception 'MATEI_REWARD_NOT_YET_VALID'; end if;
  if v_reward.valid_until is not null and v_reward.valid_until < now() then raise exception 'MATEI_REWARD_EXPIRED'; end if;

  v_balance := case when v_prog.type = 'stamp' then v_card.stamps else v_card.points end;
  if v_balance < v_reward.cost_points then raise exception 'MATEI_INSUFFICIENT_BALANCE'; end if;
  v_after := v_balance - v_reward.cost_points;

  if v_prog.type = 'stamp' then
    update cards set stamps = v_after where id = v_card.id;
  else
    update cards set points = v_after where id = v_card.id;
  end if;

  insert into reward_redemptions (org_id, card_id, reward_id, staff_id, note, cost, request_id)
  values (v_card.org_id, v_card.id, v_reward.id, p_staff, v_reward.title, v_reward.cost_points, p_request_id)
  returning id into v_red;

  insert into transactions (org_id, card_id, location_id, staff_id, type, amount, note,
                            client_request_id, reward_id, balance_after)
  values (v_card.org_id, v_card.id, p_location, p_staff, 'redeem', v_reward.cost_points, v_reward.title,
          p_client_request_id, v_reward.id, v_after)
  returning id into v_tx;

  return jsonb_build_object('duplicate', false, 'transaction_id', v_tx, 'redemption_id', v_red,
                            'cost', v_reward.cost_points, 'balance', v_after, 'reward_title', v_reward.title,
                            'type', v_prog.type, 'card_id', v_card.id);
end $$;

create or replace function redeem_reward(p_card_id uuid, p_reward_id uuid, p_client_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_card cards%rowtype;
  v_location uuid;
  v_existing transactions%rowtype;
begin
  if v_uid is null then raise exception 'MATEI_NOT_AUTHENTICATED'; end if;
  select * into v_card from cards where id = p_card_id for update;
  if not found then raise exception 'MATEI_CARD_NOT_FOUND'; end if;
  select m.location_id into v_location from memberships m where m.org_id = v_card.org_id and m.user_id = v_uid;
  if not found then raise exception 'MATEI_NOT_MEMBER'; end if;
  if (select o.admin_suspended from organizations o where o.id = v_card.org_id) then raise exception 'MATEI_ORG_SUSPENDED'; end if;
  if not org_billing_active(v_card.org_id) then raise exception 'MATEI_BILLING_INACTIVE'; end if;

  if p_client_request_id is not null then
    select * into v_existing from transactions where org_id = v_card.org_id and client_request_id = p_client_request_id;
    if found then
      return jsonb_build_object('duplicate', true, 'transaction_id', v_existing.id, 'cost', v_existing.amount,
                                'balance', v_existing.balance_after, 'card_id', v_card.id);
    end if;
  end if;

  return _redeem_on_locked_card(v_card, p_reward_id, v_uid, v_location, p_client_request_id, null);
end $$;

create or replace function create_redemption_request(p_card_id uuid, p_reward_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_card cards%rowtype;
  v_prog loyalty_programs%rowtype;
  v_reward rewards%rowtype;
  v_balance int;
  v_token text;
  v_code text;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_expires timestamptz := now() + interval '10 minutes';
begin
  if v_uid is null then raise exception 'MATEI_NOT_AUTHENTICATED'; end if;
  select k.* into v_card from cards k join customers c on c.id = k.customer_id
    where k.id = p_card_id and c.user_id = v_uid;
  if not found then raise exception 'MATEI_CARD_NOT_FOUND'; end if;
  if v_card.status = 'inactive' then raise exception 'MATEI_CARD_INACTIVE'; end if;
  if (select o.admin_suspended from organizations o where o.id = v_card.org_id) then raise exception 'MATEI_ORG_SUSPENDED'; end if;
  if not org_billing_active(v_card.org_id) then raise exception 'MATEI_BILLING_INACTIVE'; end if;

  select * into v_prog from loyalty_programs where id = v_card.program_id;
  select * into v_reward from rewards where id = p_reward_id and program_id = v_card.program_id;
  if not found then raise exception 'MATEI_REWARD_NOT_FOUND'; end if;
  if not v_reward.active or v_reward.ended_at is not null then raise exception 'MATEI_REWARD_INACTIVE'; end if;
  if v_reward.valid_from is not null and v_reward.valid_from > now() then raise exception 'MATEI_REWARD_NOT_YET_VALID'; end if;
  if v_reward.valid_until is not null and v_reward.valid_until < now() then raise exception 'MATEI_REWARD_EXPIRED'; end if;
  v_balance := case when v_prog.type = 'stamp' then v_card.stamps else v_card.points end;
  if v_balance < v_reward.cost_points then raise exception 'MATEI_INSUFFICIENT_BALANCE'; end if;

  -- Nur ein offener Code pro Karte: ein neuer Code macht den alten ungültig.
  update redemption_requests set status = 'cancelled' where card_id = v_card.id and status = 'pending';

  v_token := encode(extensions.gen_random_bytes(18), 'hex');
  for attempt in 1..8 loop
    v_code := '';
    for pos in 1..6 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % 32), 1);
    end loop;
    exit when not exists (
      select 1 from redemption_requests where org_id = v_card.org_id and short_code = v_code and status = 'pending');
  end loop;

  insert into redemption_requests (token, short_code, org_id, card_id, reward_id, user_id, expires_at)
  values (v_token, v_code, v_card.org_id, v_card.id, v_reward.id, v_uid, v_expires);

  return jsonb_build_object('token', v_token, 'short_code', v_code, 'expires_at', v_expires,
                            'reward_title', v_reward.title, 'cost', v_reward.cost_points);
end $$;

create or replace function redeem_with_code(p_code text, p_client_request_id text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_req redemption_requests%rowtype;
  v_card cards%rowtype;
  v_location uuid;
  v_code text := regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g');
  v_result jsonb;
begin
  if v_uid is null then raise exception 'MATEI_NOT_AUTHENTICATED'; end if;

  if length(v_code) = 36 then
    select * into v_req from redemption_requests where token = lower(v_code) for update;
  elsif length(v_code) = 6 then
    select * into v_req from redemption_requests
      where short_code = upper(v_code) and status = 'pending'
        and org_id in (select m.org_id from memberships m where m.user_id = v_uid)
      order by created_at desc
      limit 1
      for update;
  else
    raise exception 'MATEI_CODE_INVALID';
  end if;
  if not found then raise exception 'MATEI_CODE_INVALID'; end if;

  -- Code eines fremden Betriebs: bewusst dieselbe Meldung wie "ungültig".
  select m.location_id into v_location from memberships m where m.org_id = v_req.org_id and m.user_id = v_uid;
  if not found then raise exception 'MATEI_CODE_INVALID'; end if;
  if v_req.status = 'used' then raise exception 'MATEI_CODE_USED'; end if;
  if v_req.status <> 'pending' then raise exception 'MATEI_CODE_INVALID'; end if;
  if v_req.expires_at < now() then raise exception 'MATEI_CODE_EXPIRED'; end if;
  if (select o.admin_suspended from organizations o where o.id = v_req.org_id) then raise exception 'MATEI_ORG_SUSPENDED'; end if;
  if not org_billing_active(v_req.org_id) then raise exception 'MATEI_BILLING_INACTIVE'; end if;

  select * into v_card from cards where id = v_req.card_id for update;
  v_result := _redeem_on_locked_card(v_card, v_req.reward_id, v_uid, v_location, p_client_request_id, v_req.id);
  update redemption_requests set status = 'used', used_at = now(), used_by = v_uid where id = v_req.id;
  return v_result || jsonb_build_object('request_id', v_req.id);
end $$;

-- Karte dem eigenen Konto zuordnen. Berechtigung = Besitz der (nicht
-- erratbaren) Seriennummer, wie bei einer physischen Karte. Bereits einem
-- anderen Konto zugeordnete Karten bleiben dort.
create or replace function claim_card(p_serial text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_card cards%rowtype;
  v_owner uuid;
begin
  if v_uid is null then raise exception 'MATEI_NOT_AUTHENTICATED'; end if;
  select * into v_card from cards where serial_number = p_serial;
  if not found then raise exception 'MATEI_CARD_NOT_FOUND'; end if;
  select c.user_id into v_owner from customers c where c.id = v_card.customer_id for update;
  if v_owner is null then
    update customers set user_id = v_uid where id = v_card.customer_id;
  elsif v_owner <> v_uid then
    raise exception 'MATEI_ALREADY_CLAIMED';
  end if;
  return jsonb_build_object('card_id', v_card.id, 'org_id', v_card.org_id);
end $$;

-- Ausführungsrechte: nur eingeloggte Nutzer; interne Helfer gar nicht.
revoke all on function earn_on_card(uuid, numeric, text) from public, anon;
grant execute on function earn_on_card(uuid, numeric, text) to authenticated;
revoke all on function redeem_reward(uuid, uuid, text) from public, anon;
grant execute on function redeem_reward(uuid, uuid, text) to authenticated;
revoke all on function redeem_with_code(text, text) from public, anon;
grant execute on function redeem_with_code(text, text) to authenticated;
revoke all on function create_redemption_request(uuid, uuid) from public, anon;
grant execute on function create_redemption_request(uuid, uuid) to authenticated;
revoke all on function claim_card(text) from public, anon;
grant execute on function claim_card(text) to authenticated;
revoke all on function _redeem_on_locked_card(cards, uuid, uuid, uuid, text, uuid) from public, anon, authenticated;
revoke all on function org_billing_active(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10) Meldungen (Geschäftsprofil melden) und Kontaktanfragen
--     Schreiben ausschließlich über Server Actions (validiert + rate-limitiert,
--     service_role), Lesen nur im Admin-Panel. RLS ohne Policies = Standard-Deny.
-- ---------------------------------------------------------------------------
create table if not exists content_reports (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  reporter_user_id  uuid references auth.users(id) on delete set null,
  reporter_email    text,
  reason            text not null check (reason in ('falsche_angaben', 'unangemessen', 'betrug', 'sonstiges')),
  message           text,
  status            text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note   text,
  resolved_by       uuid references auth.users(id) on delete set null,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists idx_reports_status on content_reports(status, created_at desc);

create table if not exists contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  topic       text not null check (topic in ('kunde', 'geschaeft', 'presse', 'sonstiges')),
  message     text not null,
  user_id     uuid references auth.users(id) on delete set null,
  status      text not null default 'new' check (status in ('new', 'done')),
  handled_by  uuid references auth.users(id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists idx_contact_status on contact_messages(status, created_at desc);

alter table content_reports  enable row level security;
alter table contact_messages enable row level security;

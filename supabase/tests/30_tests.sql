set client_min_messages = warning;

-- ===== A. Grunddaten / Backfill ============================================
select tests.act_as_db();
select tests.check('A1 Slugs aus Backfill: Umlaute, ß, Namensgleichheit', $q$
  select (select slug from business_profiles where org_id = tests.id('A')) = 'cafe-sonne'
     and (select slug from business_profiles where org_id = tests.id('B')) = 'baeckerei-gross'
     and (select slug from business_profiles where org_id = tests.id('E')) = 'cafe-sonne-' || substr(md5(tests.id('E')::text), 1, 5) $q$);
select tests.check('A2 Je Programm genau eine Standard-Belohnung mit Kosten > 0', $q$
  select count(*) = 4 and bool_and(is_default) and bool_and(cost_points > 0) from rewards $q$);
select tests.check('A3 Standard-Belohnung übernimmt Titel und Kosten des Programms', $q$
  select title = 'Gratis Kaffee' and cost_points = 10 from rewards where id = tests.rid('PA') $q$);
select tests.check('A4 Profile starten als nicht gelisteter Entwurf', $q$
  select count(*) = 3 and bool_and(listing_status = 'draft') and bool_and(not is_listed) from business_profiles $q$);

-- ===== B. Geschäftsprofil: Schutzregeln ====================================
select tests.act_as(tests.id('OA'));
select tests.expect_rows('B1 Inhaber bearbeitet eigenes Profil', $q$
  update business_profiles set tagline = 'Kaffee mit Herz', city = 'Wien' where org_id = tests.id('A') $q$, 1);
select tests.expect_error('B2 Inhaber kann sich nicht selbst freischalten', $q$
  update business_profiles set listing_status = 'approved' where org_id = tests.id('A') $q$, 'MATEI_STATUS_CHANGE_NOT_ALLOWED');
select tests.expect_error('B3 Einreichen nur mit vollständigem Profil', $q$
  update business_profiles set listing_status = 'pending' where org_id = tests.id('A') $q$, 'MATEI_PROFILE_INCOMPLETE');
select tests.expect_rows('B4 Vollständiges Profil zur Prüfung einreichen', $q$
  update business_profiles set category = 'cafe', is_listed = true,
    description = 'Gemütliches Café im 7. Bezirk mit eigener Röstung.', listing_status = 'pending'
  where org_id = tests.id('A') $q$, 1);
select tests.expect_rows('B5 Slug und Prüfdaten werden still zurückgesetzt', $q$
  update business_profiles set slug = 'gekapert', approved_at = now(), submitted_at = null where org_id = tests.id('A') $q$, 1);
select tests.act_as_db();
select tests.check('B6 Status pending, Slug und Zeitstempel unverändert', $q$
  select listing_status = 'pending' and slug = 'cafe-sonne' and approved_at is null and submitted_at is not null
  from business_profiles where org_id = tests.id('A') $q$);
select tests.act_as(tests.id('SA'));
select tests.expect_rows('B7 Mitarbeiter darf Profil nicht bearbeiten', $q$
  update business_profiles set tagline = 'Mitarbeiter war hier' where org_id = tests.id('A') $q$, 0);
select tests.act_as(tests.id('OB'));
select tests.expect_rows('B8 Fremder Betrieb darf Profil nicht bearbeiten', $q$
  update business_profiles set tagline = 'Fremd' where org_id = tests.id('A') $q$, 0);
select tests.expect_error('B9 Profil löschen über API gesperrt', $q$
  delete from business_profiles where org_id = tests.id('B') $q$, 'permission denied');
select tests.expect_error('B10 Profil anlegen über API gesperrt', $q$
  insert into business_profiles (org_id, slug, display_name) values (tests.id('B'), 'x', 'x') $q$, 'permission denied');
select tests.act_as(tests.id('OA'));
select tests.expect_rows('B11 Einreichung zurückziehen (pending -> draft)', $q$
  update business_profiles set listing_status = 'draft' where org_id = tests.id('A') $q$, 1);
select tests.expect_rows('B12 Erneut einreichen', $q$
  update business_profiles set listing_status = 'pending' where org_id = tests.id('A') $q$, 1);

-- Plattform-Admin schaltet frei (Admin-Panel schreibt mit service_role)
select tests.act_as_db();
update business_profiles set listing_status = 'approved', approved_at = now(), is_listed = true;
update organizations set admin_suspended = true where id = tests.id('B');

-- ===== C. Sichtbarkeit (RLS) ===============================================
select tests.act_as(null);
select tests.check('C1 Anonym: nur freigeschaltete Betriebe mit aktivem Abo, nicht gesperrt', $q$
  select array_agg(org_id) = array[tests.id('A')] from business_profiles $q$);
select tests.check('C2 Anonym: Programme und Belohnungen nur öffentlicher Betriebe', $q$
  select (select count(*) from loyalty_programs) = 2 and (select count(*) from rewards) = 2 $q$);
select tests.check('C3 Anonym: keine Kunden, Karten, Buchungen, Einlösungen', $q$
  select (select count(*) from customers) + (select count(*) from cards) + (select count(*) from transactions)
       + (select count(*) from reward_redemptions) + (select count(*) from redemption_requests) = 0 $q$);
select tests.check('C4 Anonym: Kontaktanfragen, Meldungen, Markierungen unsichtbar', $q$
  select (select count(*) from contact_messages) + (select count(*) from content_reports) + (select count(*) from transaction_flags) = 0 $q$);
select tests.act_as(tests.id('C1'));
select tests.check('C5 Kunde sieht genau seine 4 Karten', $q$
  select count(*) = 4 and bool_and(id <> tests.id('CA2')) from cards $q$);
select tests.check('C6 Kunde sieht nur eigene Kundendatensätze', $q$
  select count(*) = 3 and bool_and(user_id = tests.id('C1')) from customers $q$);
select tests.check('C7 Kunde sieht Profile seiner Betriebe (auch gesperrte/abgelaufene)', $q$
  select count(*) = 3 from business_profiles $q$);
select tests.check('C8 Kunde sieht keine Teamdaten', $q$ select count(*) = 0 from memberships $q$);
select tests.act_as(tests.id('C2'));
select tests.check('C9 Kunde ohne Karten sieht keine Karten/Kunden', $q$
  select (select count(*) from cards) = 0 and (select count(*) from customers) = 0 $q$);
select tests.act_as(tests.id('SA'));
select tests.check('C10 Mitarbeiter sieht nur Karten des eigenen Betriebs', $q$
  select count(*) = 3 and bool_and(org_id = tests.id('A')) from cards $q$);

-- ===== D. Direktes Schreiben gesperrt ======================================
select tests.act_as(tests.id('SA'));
select tests.expect_error('D1 Saldo direkt ändern', $q$ update cards set stamps = 99 where id = tests.id('CA1') $q$, 'permission denied');
select tests.expect_error('D2 Buchung direkt anlegen', $q$
  insert into transactions (org_id, card_id, type, amount) values (tests.id('A'), tests.id('CA1'), 'stamp', 5) $q$, 'permission denied');
select tests.expect_error('D3 Einlösung direkt anlegen', $q$
  insert into reward_redemptions (org_id, card_id) values (tests.id('A'), tests.id('CA1')) $q$, 'permission denied');
select tests.expect_error('D4 Karte mit Startguthaben anlegen', $q$
  insert into cards (org_id, program_id, customer_id, stamps) values (tests.id('A'), tests.id('PA'), tests.id('KA2'), 50) $q$, 'permission denied');
select tests.expect_rows('D5 Karte normal ausgeben funktioniert weiterhin', $q$
  insert into cards (org_id, program_id, customer_id) values (tests.id('A'), tests.id('PAP'), tests.id('KA2')) $q$, 1);
select tests.expect_error('D6 Kunden einem fremden Konto zuordnen', $q$
  update customers set user_id = tests.id('C2') where id = tests.id('KA2') $q$, 'permission denied');
select tests.expect_error('D7 Kunde mit Konto-Verknüpfung anlegen', $q$
  insert into customers (org_id, full_name, user_id) values (tests.id('A'), 'X', tests.id('C2')) $q$, 'permission denied');
select tests.expect_rows('D8 Kunde normal anlegen funktioniert weiterhin', $q$
  insert into customers (org_id, full_name, email) values (tests.id('A'), 'Neuer Kunde', 'neu@example.com') $q$, 1);
select tests.expect_error('D9 Mitgliedschaft direkt anlegen', $q$
  insert into memberships (org_id, user_id, role) values (tests.id('A'), tests.id('C2'), 'owner') $q$, 'permission denied');
select tests.act_as(tests.id('OA'));
select tests.expect_error('D10 Inhaber setzt Abo-Status selbst', $q$
  update organizations set subscription_status = 'active' where id = tests.id('A') $q$, 'permission denied');
select tests.expect_error('D11 Rolle direkt ändern (Mitarbeiter -> Inhaber)', $q$
  update memberships set role = 'owner' where user_id = tests.id('SA') $q$, 'permission denied');
select tests.act_as(tests.id('C1'));
select tests.expect_rows('D12 Kunde ändert Kundendatensatz des Betriebs nicht', $q$
  update customers set full_name = 'Hacker' where id = tests.id('KA1') $q$, 0);
select tests.expect_error('D13 Einlöse-Code direkt anlegen', $q$
  insert into redemption_requests (token, short_code, org_id, card_id, reward_id, user_id, expires_at)
  values ('x', 'ABCDEF', tests.id('A'), tests.id('CA1'), tests.rid('PA'), tests.id('C1'), now() + interval '1 day') $q$, 'permission denied');
select tests.expect_error('D14 E-Mail im Profil nicht direkt änderbar', $q$
  update profiles set email = 'fake@example.com' where id = tests.id('C1') $q$, 'permission denied');
select tests.expect_rows('D15 Name im Profil änderbar', $q$
  update profiles set full_name = 'Kunde Eins' where id = tests.id('C1') $q$, 1);
select tests.expect_rows('D16 Betrieb mit manipulierten Abo-Feldern anlegen', $q$
  insert into organizations (name, slug, owner_id, subscription_status, trial_ends_at, plan)
  values ('Trick GmbH', 'trick-gmbh', tests.id('C1'), 'active', '2099-01-01', 'pro') $q$, 1);
select tests.act_as_db();
select tests.check('D17 Datenbank setzt 14 Tage Test und kein Abo', $q$
  select subscription_status is null and plan = 'trial'
     and trial_ends_at between now() + interval '13 days' and now() + interval '15 days'
  from organizations where slug = 'trick-gmbh' $q$);
select tests.check('D18 Inhaber-Mitgliedschaft und Profil automatisch angelegt', $q$
  select exists (select 1 from memberships m join organizations o on o.id = m.org_id
                 where o.slug = 'trick-gmbh' and m.user_id = tests.id('C1') and m.role = 'owner')
     and exists (select 1 from business_profiles bp join organizations o on o.id = bp.org_id
                 where o.slug = 'trick-gmbh' and bp.slug = 'trick-gmbh') $q$);

-- ===== E. Stempel/Punkte vergeben ==========================================
select tests.act_as(null);
select tests.expect_error('E1 Anonym: Buchungsfunktion nicht ausführbar', $q$ select earn_on_card(tests.id('CA1')) $q$, 'permission denied');
select tests.act_as(tests.id('C1'));
select tests.expect_error('E2 Kunde gibt sich selbst Stempel', $q$ select earn_on_card(tests.id('CA1')) $q$, 'MATEI_NOT_MEMBER');
select tests.act_as(tests.id('SA'));
select tests.expect_error('E3 Mitarbeiter: Karte eines fremden Betriebs', $q$ select earn_on_card(tests.id('CB1')) $q$, 'MATEI_NOT_MEMBER');
select tests.expect_error('E4 Unbekannte Karte', $q$ select earn_on_card(gen_random_uuid()) $q$, 'MATEI_CARD_NOT_FOUND');
select tests.expect_ok('E5 Stempel vergeben', $q$ select earn_on_card(tests.id('CA1')) $q$, 'e5');
select tests.check('E6 Ergebnis: +1, Saldo 1', $q$ select (tests.v('e5')->>'units')::int = 1 and (tests.v('e5')->>'balance')::int = 1 $q$);
select tests.act_as_db();
select tests.check('E7 Buchung im Journal: Mitarbeiter, Typ, Menge, Saldo danach', $q$
  select count(*) = 1 and bool_and(staff_id = tests.id('SA') and type = 'stamp' and amount = 1 and balance_after = 1)
  from transactions where card_id = tests.id('CA1') $q$);
select tests.check('E8 Kartensaldo = 1', $q$ select stamps = 1 from cards where id = tests.id('CA1') $q$);
select tests.act_as(tests.id('SA'));
select tests.expect_error('E9 Doppel-Scan innerhalb 30 s blockiert', $q$ select earn_on_card(tests.id('CA1')) $q$, 'MATEI_COOLDOWN');
select tests.skip_cooldown();
select tests.expect_ok('E10 Vergabe mit Request-ID', $q$ select earn_on_card(tests.id('CA1'), null, 'req-1') $q$, 'e10');
select tests.expect_ok('E11 Dieselbe Request-ID erneut (Doppelklick/Netzfehler)', $q$ select earn_on_card(tests.id('CA1'), null, 'req-1') $q$, 'e11');
select tests.check('E12 Als Duplikat erkannt, kein zweiter Stempel', $q$
  select (tests.v('e11')->>'duplicate')::boolean and tests.v('e11')->>'transaction_id' = tests.v('e10')->>'transaction_id'
     and (select stamps from cards where id = tests.id('CA1')) = 2 $q$);
select tests.expect_error('E13 Betragsregel: Betrag fehlt', $q$ select earn_on_card(tests.id('CA1P')) $q$, 'MATEI_AMOUNT_REQUIRED');
select tests.expect_error('E14 Betragsregel: unter 1 Punkt', $q$ select earn_on_card(tests.id('CA1P'), 0.50) $q$, 'MATEI_BELOW_MINIMUM');
select tests.expect_error('E15 Negativer Betrag', $q$ select earn_on_card(tests.id('CA1P'), -5) $q$, 'MATEI_AMOUNT_REQUIRED');
select tests.expect_ok('E16 12,50 € ergeben 12 Punkte', $q$ select earn_on_card(tests.id('CA1P'), 12.50) $q$, 'e16');
select tests.act_as_db();
select tests.check('E17 Journal: Notiz, Einkaufsbetrag, Saldo', $q$
  select t.note = 'Einkauf: 12,50 €' and t.purchase_amount = 12.50 and t.amount = 12 and t.balance_after = 12
     and (select points from cards where id = tests.id('CA1P')) = 12
  from transactions t where t.id = (tests.v('e16')->>'transaction_id')::uuid $q$);

insert into campaigns (org_id, name, type, config, active)
values (tests.id('A'), 'Doppelte Punkte', 'multiplier', '{"factor": 2}', true);
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('E18 Aktion x2: 10 € ergeben 20 Punkte', $q$ select earn_on_card(tests.id('CA1P'), 10) $q$, 'e18');
select tests.check('E19 Faktor 2 im Ergebnis', $q$ select (tests.v('e18')->>'units')::int = 20 and (tests.v('e18')->>'factor')::int = 2 $q$);
select tests.act_as_db();
select tests.check('E20 Aktion im Journal vermerkt', $q$
  select note = 'Einkauf: 10,00 € · Aktion ×2' and campaign_id is not null
  from transactions where id = (tests.v('e18')->>'transaction_id')::uuid $q$);
update campaigns set config = '{"factor": 50}';
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('E21 Manipulierter Faktor 50', $q$ select earn_on_card(tests.id('CA1P'), 1) $q$, 'e21');
select tests.check('E22 Faktor auf 5 begrenzt', $q$ select (tests.v('e21')->>'units')::int = 5 $q$);
select tests.act_as_db();
update campaigns set config = '{"factor": "2; drop table cards"}';
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('E23 Ungültiger Faktor', $q$ select earn_on_card(tests.id('CA1P'), 3) $q$, 'e23');
select tests.check('E24 Ungültiger Faktor zählt als x1', $q$
  select (tests.v('e23')->>'units')::int = 3 and (tests.v('e23')->>'factor')::int = 1 $q$);
select tests.act_as_db();
update campaigns set config = '{"factor": 2}', ends_at = now() - interval '1 hour';
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('E25 Nach Aktionsende', $q$ select earn_on_card(tests.id('CA1P'), 4) $q$, 'e25');
select tests.check('E26 Beendete Aktion wirkt nicht', $q$ select (tests.v('e25')->>'units')::int = 4 $q$);
select tests.act_as_db();
update campaigns set ends_at = null, program_id = tests.id('PA');
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('E27 Aktion gilt nur für ein anderes Programm', $q$ select earn_on_card(tests.id('CA1P'), 2) $q$, 'e27');
select tests.check('E28 Programmfremde Aktion wirkt nicht', $q$ select (tests.v('e27')->>'units')::int = 2 $q$);
select tests.act_as_db();
update cards set stamps = 9 where id = tests.id('CA1');
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('E29 Aktion x2 bei 9/10 Stempeln', $q$ select earn_on_card(tests.id('CA1')) $q$, 'e29');
select tests.check('E30 Auf 10 gedeckelt (+1)', $q$
  select (tests.v('e29')->>'units')::int = 1 and (tests.v('e29')->>'balance')::int = 10 $q$);
select tests.skip_cooldown();
select tests.expect_error('E31 Volle Karte nimmt keinen Stempel mehr', $q$ select earn_on_card(tests.id('CA1')) $q$, 'MATEI_CARD_FULL');
select tests.act_as_db();
update campaigns set active = false;
select tests.act_as(tests.id('OX'));
select tests.expect_error('E32 Abgelaufene Testphase: keine Vergabe', $q$ select earn_on_card(tests.id('CE1')) $q$, 'MATEI_BILLING_INACTIVE');
select tests.act_as(tests.id('OB'));
select tests.expect_error('E33 Gesperrter Betrieb: keine Vergabe', $q$ select earn_on_card(tests.id('CB1')) $q$, 'MATEI_ORG_SUSPENDED');
select tests.act_as_db();
update loyalty_programs set active = false where id = tests.id('PAP');
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_error('E34 Pausiertes Programm', $q$ select earn_on_card(tests.id('CA1P'), 5) $q$, 'MATEI_PROGRAM_INACTIVE');
select tests.act_as_db();
update loyalty_programs set active = true where id = tests.id('PAP');
update cards set status = 'inactive' where id = tests.id('CA2');
select tests.act_as(tests.id('SA'));
select tests.expect_error('E35 Deaktivierte Karte', $q$ select earn_on_card(tests.id('CA2')) $q$, 'MATEI_CARD_INACTIVE');
select tests.act_as_db();
update cards set status = 'active' where id = tests.id('CA2');

-- ===== F. Belohnung einlösen (Kasse) =======================================
select tests.act_as(tests.id('C1'));
select tests.expect_error('F1 Kunde löst nicht selbst ein', $q$ select redeem_reward(tests.id('CA1'), tests.rid('PA')) $q$, 'MATEI_NOT_MEMBER');
select tests.act_as(tests.id('SA'));
select tests.expect_ok('F2 Belohnung bei 10/10 einlösen', $q$ select redeem_reward(tests.id('CA1'), tests.rid('PA'), 'red-1') $q$, 'f2');
select tests.act_as_db();
select tests.check('F3 Saldo 0, Einlösung und Journal mit Kosten', $q$
  select (select stamps from cards where id = tests.id('CA1')) = 0
     and (select count(*) from reward_redemptions where card_id = tests.id('CA1') and reward_id = tests.rid('PA')
            and cost = 10 and staff_id = tests.id('SA') and note = 'Gratis Kaffee') = 1
     and (select count(*) from transactions where card_id = tests.id('CA1') and type = 'redeem' and amount = 10
            and balance_after = 0 and reward_id = tests.rid('PA')) = 1 $q$);
select tests.act_as(tests.id('SA'));
select tests.expect_ok('F4 Dieselbe Einlösung erneut gesendet', $q$ select redeem_reward(tests.id('CA1'), tests.rid('PA'), 'red-1') $q$, 'f4');
select tests.check('F5 Duplikat erkannt, nur eine Einlösung', $q$
  select (tests.v('f4')->>'duplicate')::boolean and (select count(*) from reward_redemptions where card_id = tests.id('CA1')) = 1 $q$);
select tests.expect_error('F6 Zweite Einlösung ohne Guthaben', $q$ select redeem_reward(tests.id('CA1'), tests.rid('PA')) $q$, 'MATEI_INSUFFICIENT_BALANCE');
select tests.expect_error('F7 Belohnung eines anderen Programms', $q$ select redeem_reward(tests.id('CA1'), tests.rid('PAP')) $q$, 'MATEI_REWARD_NOT_FOUND');
select tests.expect_error('F8 Mitarbeiter legt keine Belohnung an', $q$
  insert into rewards (org_id, program_id, title, cost_points) values (tests.id('A'), tests.id('PA'), 'Gratis alles', 1) $q$, 'row-level security');
select tests.expect_rows('F9 Mitarbeiter ändert keine Kosten', $q$ update rewards set cost_points = 1 where program_id = tests.id('PA') $q$, 0);
select tests.expect_rows('F10 Mitarbeiter ändert keine Programmregel', $q$ update loyalty_programs set stamps_required = 1 where id = tests.id('PA') $q$, 0);
select tests.act_as(tests.id('OA'));
select tests.expect_rows('F11 Inhaber legt eigene Belohnung an', $q$
  insert into rewards (org_id, program_id, title, cost_points, conditions)
  values (tests.id('A'), tests.id('PA'), 'Croissant', 3, 'Nur vormittags') $q$, 1);
select tests.expect_error('F12 Belohnung für 0 Stempel unmöglich', $q$
  insert into rewards (org_id, program_id, title, cost_points) values (tests.id('A'), tests.id('PA'), 'Gratis', 0) $q$, 'rewards_cost_positive');
select tests.act_as_db();
update cards set stamps = 3 where id = tests.id('CA1');
select tests.act_as(tests.id('SA'));
select tests.expect_ok('F13 Eigene Belohnung (3 Stempel) einlösen', $q$
  select redeem_reward(tests.id('CA1'), (select id from rewards where title = 'Croissant')) $q$, 'f13');
select tests.check('F14 Saldo 3 -> 0, Kosten 3', $q$ select (tests.v('f13')->>'balance')::int = 0 and (tests.v('f13')->>'cost')::int = 3 $q$);
select tests.act_as_db();
update cards set stamps = 10 where id = tests.id('CA1');
update rewards set active = false where title = 'Croissant';
select tests.act_as(tests.id('SA'));
select tests.expect_error('F15 Pausierte Belohnung', $q$ select redeem_reward(tests.id('CA1'), (select id from rewards where title = 'Croissant')) $q$, 'MATEI_REWARD_INACTIVE');
select tests.act_as_db();
update rewards set active = true, ended_at = now() where title = 'Croissant';
select tests.act_as(tests.id('SA'));
select tests.expect_error('F16 Beendete Belohnung', $q$ select redeem_reward(tests.id('CA1'), (select id from rewards where title = 'Croissant')) $q$, 'MATEI_REWARD_INACTIVE');
select tests.act_as_db();
update rewards set ended_at = null, valid_until = now() - interval '1 day' where title = 'Croissant';
select tests.act_as(tests.id('SA'));
select tests.expect_error('F17 Abgelaufene Belohnung', $q$ select redeem_reward(tests.id('CA1'), (select id from rewards where title = 'Croissant')) $q$, 'MATEI_REWARD_EXPIRED');
select tests.act_as_db();
update rewards set valid_until = null, valid_from = now() + interval '1 day' where title = 'Croissant';
select tests.act_as(tests.id('SA'));
select tests.expect_error('F18 Noch nicht gültige Belohnung', $q$ select redeem_reward(tests.id('CA1'), (select id from rewards where title = 'Croissant')) $q$, 'MATEI_REWARD_NOT_YET_VALID');
select tests.act_as_db();
update rewards set valid_from = null where title = 'Croissant';

-- ===== G. Einlöse-Codes (Kunde zeigt Code, Kasse scannt) ===================
select tests.act_as(null);
select tests.expect_error('G1 Anonym: kein Einlöse-Code', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'permission denied');
select tests.act_as(tests.id('C2'));
select tests.expect_error('G2 Code für fremde Karte', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'MATEI_CARD_NOT_FOUND');
select tests.act_as(tests.id('SA'));
select tests.expect_error('G3 Mitarbeiter erzeugt keinen Kunden-Code', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'MATEI_CARD_NOT_FOUND');
select tests.act_as(tests.id('C1'));
select tests.expect_error('G4 Code nur mit genug Guthaben', $q$ select create_redemption_request(tests.id('CA1P'), tests.rid('PAP')) $q$, 'MATEI_INSUFFICIENT_BALANCE');
select tests.expect_ok('G5 Code erzeugen', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'g5');
select tests.check('G6 Token 36 Hex, Kurzcode 6 Zeichen ohne Verwechsler, 10 Minuten gültig', $q$
  select tests.v('g5')->>'token' ~ '^[0-9a-f]{36}$' and tests.v('g5')->>'short_code' ~ '^[A-HJ-NP-Z2-9]{6}$'
     and (tests.v('g5')->>'expires_at')::timestamptz between now() + interval '9 minutes' and now() + interval '11 minutes' $q$);
select tests.expect_ok('G7 Zweiten Code erzeugen', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'g7');
select tests.check('G8 Neuer Code storniert den alten', $q$
  select (select status from redemption_requests where token = tests.v('g5')->>'token') = 'cancelled'
     and (select status from redemption_requests where token = tests.v('g7')->>'token') = 'pending' $q$);
select tests.act_as(tests.id('C2'));
select tests.check('G9 Anderer Kunde sieht keine fremden Codes', $q$ select count(*) = 0 from redemption_requests $q$);
select tests.act_as(tests.id('SA'));
select tests.check('G9b Eigenes Team sieht offene Codes (Vorschau an der Kasse)', $q$
  select exists (select 1 from redemption_requests where token = tests.v('g7')->>'token') $q$);
select tests.act_as(tests.id('OB'));
select tests.check('G9c Fremder Betrieb sieht keine Codes', $q$ select count(*) = 0 from redemption_requests $q$);
select tests.act_as(tests.id('OB'));
select tests.expect_error('G10 Fremder Betrieb: Token ungültig', $q$ select redeem_with_code(tests.v('g7')->>'token') $q$, 'MATEI_CODE_INVALID');
select tests.expect_error('G11 Fremder Betrieb: Kurzcode ungültig', $q$ select redeem_with_code(tests.v('g7')->>'short_code') $q$, 'MATEI_CODE_INVALID');
select tests.act_as(tests.id('SA'));
select tests.expect_error('G12 Stornierter Code', $q$ select redeem_with_code(tests.v('g5')->>'token') $q$, 'MATEI_CODE_INVALID');
select tests.expect_error('G13 Erfundener Token', $q$ select redeem_with_code(encode(extensions.gen_random_bytes(18), 'hex')) $q$, 'MATEI_CODE_INVALID');
select tests.expect_error('G14 Erfundener Kurzcode', $q$ select redeem_with_code('ZZZZZZ') $q$, 'MATEI_CODE_INVALID');
select tests.expect_error('G15 Manipulierte Eingabe (SQL-Fragment)', $q$ select redeem_with_code($x$'; update cards set stamps = 999; --$x$) $q$, 'MATEI_CODE_INVALID');
select tests.expect_ok('G16 Kurzcode einlösen (klein geschrieben, mit Bindestrich)', $q$
  select redeem_with_code(lower(substr(tests.v('g7')->>'short_code', 1, 3)) || '-' || lower(substr(tests.v('g7')->>'short_code', 4))) $q$, 'g16');
select tests.act_as_db();
select tests.check('G17 Code verbraucht, Saldo 0, Einlösung mit Code verknüpft', $q$
  select r.status = 'used' and r.used_by = tests.id('SA') and r.used_at is not null
     and (select stamps from cards where id = tests.id('CA1')) = 0
     and exists (select 1 from reward_redemptions rr where rr.request_id = r.id and rr.cost = 10)
  from redemption_requests r where r.token = tests.v('g7')->>'token' $q$);
select tests.act_as(tests.id('SA'));
select tests.expect_error('G18 Denselben Code zweimal einlösen', $q$ select redeem_with_code(tests.v('g7')->>'token') $q$, 'MATEI_CODE_USED');
select tests.act_as_db();
update cards set stamps = 10 where id = tests.id('CA1');
select tests.act_as(tests.id('C1'));
select tests.expect_ok('G19 Neuer Code', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'g19');
select tests.act_as_db();
update redemption_requests set expires_at = now() - interval '1 minute' where token = tests.v('g19')->>'token';
select tests.act_as(tests.id('SA'));
select tests.expect_error('G20 Abgelaufener Code', $q$ select redeem_with_code(tests.v('g19')->>'token') $q$, 'MATEI_CODE_EXPIRED');
select tests.check('G21 Saldo bleibt 10', $q$ select stamps = 10 from cards where id = tests.id('CA1') $q$);
select tests.act_as(tests.id('C1'));
select tests.expect_ok('G22 Code erzeugen', $q$ select create_redemption_request(tests.id('CA1'), tests.rid('PA')) $q$, 'g22');
select tests.act_as(tests.id('SA'));
select tests.expect_ok('G23 Inzwischen direkt an der Kasse eingelöst', $q$ select redeem_reward(tests.id('CA1'), tests.rid('PA')) $q$);
select tests.expect_error('G24 Danach ist der alte Code wertlos', $q$ select redeem_with_code(tests.v('g22')->>'token') $q$, 'MATEI_INSUFFICIENT_BALANCE');

-- ===== H. Karte dem Kundenkonto zuordnen ===================================
select tests.act_as(null);
select tests.expect_error('H1 Anonym: keine Übernahme', $q$ select claim_card('serial-ca2') $q$, 'permission denied');
select tests.act_as(tests.id('C2'));
select tests.expect_ok('H2 Karte per Seriennummer zuordnen', $q$ select claim_card('serial-ca2') $q$);
select tests.check('H3 Kunde sieht die Karte jetzt', $q$ select bool_or(id = tests.id('CA2')) from cards $q$);
select tests.expect_ok('H4 Erneutes Zuordnen ist idempotent', $q$ select claim_card('serial-ca2') $q$);
select tests.act_as(tests.id('C1'));
select tests.expect_error('H5 Vergebene Karte nicht übernehmbar', $q$ select claim_card('serial-ca2') $q$, 'MATEI_ALREADY_CLAIMED');
select tests.expect_error('H6 Unbekannte Seriennummer', $q$ select claim_card('gibt-es-nicht') $q$, 'MATEI_CARD_NOT_FOUND');

-- ===== I. Verdachtsmarkierung ==============================================
select tests.skip_cooldown();
select tests.act_as(tests.id('SA'));
select tests.expect_ok('I1 Buchung 7', $q$ select earn_on_card(tests.id('CA1P'), 1) $q$);
select tests.skip_cooldown();
select tests.expect_ok('I2 Buchung 8', $q$ select earn_on_card(tests.id('CA1P'), 1) $q$);
select tests.skip_cooldown();
select tests.expect_ok('I3 Buchung 9', $q$ select earn_on_card(tests.id('CA1P'), 1) $q$);
select tests.skip_cooldown();
select tests.expect_ok('I4 Große Buchung (650 €)', $q$ select earn_on_card(tests.id('CA1P'), 650) $q$);
select tests.check('I5 Markierungen für Betriebe unsichtbar', $q$ select count(*) = 0 from transaction_flags $q$);
select tests.act_as_db();
select tests.check('I6 Ab 8 Buchungen/24 h genau eine Markierung je Karte', $q$
  select count(*) = 1 from transaction_flags where card_id = tests.id('CA1P') and reason = 'velocity_card' $q$);
select tests.check('I7 Große Punktebuchung markiert', $q$
  select count(*) = 1 from transaction_flags where reason = 'large_amount' and (details->>'punkte')::int = 650 $q$);
select tests.check('I8 Viele Einlösungen (≥3/24 h) markiert', $q$
  select count(*) = 1 from transaction_flags where card_id = tests.id('CA1') and reason = 'velocity_redeem' $q$);

-- ===== J. Löschschutz und Standard-Belohnung ===============================
select tests.act_as(tests.id('OA'));
select tests.expect_error('J1 Standard-Belohnung nicht löschbar', $q$ delete from rewards where id = tests.rid('PA') $q$, 'MATEI_DEFAULT_REWARD');
select tests.expect_error('J2 Belohnung mit Einlösungen nicht löschbar', $q$ delete from rewards where title = 'Croissant' $q$, 'MATEI_REWARD_HAS_REDEMPTIONS');
select tests.expect_rows('J3 Unbenutzte Belohnung anlegen', $q$
  insert into rewards (org_id, program_id, title, cost_points) values (tests.id('A'), tests.id('PA'), 'Testbelohnung', 5) $q$, 1);
select tests.expect_rows('J4 Unbenutzte Belohnung löschbar', $q$ delete from rewards where title = 'Testbelohnung' $q$, 1);
select tests.expect_error('J5 Programm mit Karten nicht löschbar', $q$ delete from loyalty_programs where id = tests.id('PA') $q$, 'MATEI_PROGRAM_HAS_CARDS');
select tests.expect_rows('J6 Neues Programm anlegen', $q$
  insert into loyalty_programs (org_id, name, type, stamps_required, reward_description)
  values (tests.id('A'), 'Leeres Programm', 'stamp', 6, 'Gratis Tee') $q$, 1);
select tests.check('J7 Standard-Belohnung automatisch angelegt', $q$
  select count(*) = 1 from rewards r join loyalty_programs p on p.id = r.program_id
  where p.name = 'Leeres Programm' and r.is_default and r.cost_points = 6 and r.title = 'Gratis Tee' $q$);
select tests.expect_rows('J8 Programm ohne Karten löschbar', $q$ delete from loyalty_programs where name = 'Leeres Programm' $q$, 1);
select tests.act_as_db();
select tests.check('J9 Keine verwaiste Belohnung', $q$ select not exists (select 1 from rewards where title = 'Gratis Tee') $q$);
select tests.act_as(tests.id('OA'));
select tests.expect_rows('J10 Programmregel ändern', $q$
  update loyalty_programs set stamps_required = 8, reward_description = 'Großer Kaffee' where id = tests.id('PA') $q$, 1);
select tests.check('J11 Standard-Belohnung folgt (Titel und Kosten)', $q$
  select title = 'Großer Kaffee' and cost_points = 8 from rewards where id = tests.rid('PA') $q$);

-- ===== K. Sonstiges =========================================================
select tests.act_as_db();
update auth.users set email = 'kunde1-neu@example.com' where id = tests.id('C1');
select tests.check('K1 E-Mail-Änderung landet im Profil', $q$
  select email = 'kunde1-neu@example.com' from profiles where id = tests.id('C1') $q$);
select tests.act_as(tests.id('SA'));
select tests.expect_error('K2 Interne Einlöse-Funktion nicht aufrufbar', $q$
  select _redeem_on_locked_card((select c from cards c where c.id = tests.id('CA1')), tests.rid('PA'), tests.id('SA'), null, null, null) $q$,
  'permission denied');
select tests.expect_error('K3 Abo-Prüfung nicht direkt aufrufbar', $q$ select org_billing_active(tests.id('A')) $q$, 'permission denied');
select tests.act_as_db();
insert into business_reviews (org_id, decision, note) values (tests.id('A'), 'approved', 'Alles in Ordnung');
select tests.act_as(tests.id('SA'));
select tests.check('K4 Team sieht Prüfentscheidungen des eigenen Betriebs', $q$ select count(*) = 1 from business_reviews $q$);
select tests.act_as(tests.id('C2'));
select tests.check('K5 Kunde sieht keine Prüfentscheidungen', $q$ select count(*) = 0 from business_reviews $q$);
select tests.act_as_db();

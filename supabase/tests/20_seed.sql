-- Testdaten: Betrieb A (aktiv), Betrieb B (wird gesperrt), Betrieb E
-- (abgelaufene Testphase, gleicher Name wie A -> Slug-Suffix).
-- Nutzer: OA Inhaber A, SA Mitarbeiter A, OB Inhaber B, OX Inhaber E,
-- C1 Kunde mit Karten bei A/B/E, C2 Kunde ohne Karten.
insert into tests.ids (name, id) values
  ('OA', '10000000-0000-4000-8000-0000000000a1'), ('SA', '10000000-0000-4000-8000-0000000000a2'),
  ('OB', '10000000-0000-4000-8000-0000000000b1'), ('OX', '10000000-0000-4000-8000-0000000000e1'),
  ('C1', '10000000-0000-4000-8000-0000000000c1'), ('C2', '10000000-0000-4000-8000-0000000000c2'),
  ('A', '20000000-0000-4000-8000-00000000000a'), ('B', '20000000-0000-4000-8000-00000000000b'),
  ('E', '20000000-0000-4000-8000-00000000000e'),
  ('PA', '30000000-0000-4000-8000-0000000000a1'), ('PAP', '30000000-0000-4000-8000-0000000000a2'),
  ('PB', '30000000-0000-4000-8000-0000000000b1'), ('PE', '30000000-0000-4000-8000-0000000000e1'),
  ('KA1', '40000000-0000-4000-8000-0000000000a1'), ('KA2', '40000000-0000-4000-8000-0000000000a2'),
  ('KB1', '40000000-0000-4000-8000-0000000000b1'), ('KE1', '40000000-0000-4000-8000-0000000000e1'),
  ('CA1', '50000000-0000-4000-8000-0000000000a1'), ('CA1P', '50000000-0000-4000-8000-0000000000a2'),
  ('CA2', '50000000-0000-4000-8000-0000000000a3'), ('CB1', '50000000-0000-4000-8000-0000000000b1'),
  ('CE1', '50000000-0000-4000-8000-0000000000e1');

insert into auth.users (id, email) values
  (tests.id('OA'), 'owner-a@example.com'), (tests.id('SA'), 'staff-a@example.com'),
  (tests.id('OB'), 'owner-b@example.com'), (tests.id('OX'), 'owner-x@example.com'),
  (tests.id('C1'), 'kunde1@example.com'), (tests.id('C2'), 'kunde2@example.com');

insert into organizations (id, name, slug, owner_id, trial_ends_at) values
  (tests.id('A'), 'Café Sonne', 'cafe-sonne', tests.id('OA'), now() + interval '10 days'),
  (tests.id('B'), 'Bäckerei Groß', 'baeckerei-gross', tests.id('OB'), now() + interval '10 days'),
  (tests.id('E'), 'Café Sonne', 'cafe-sonne-alt', tests.id('OX'), now() - interval '1 day');

-- Mitarbeiter (direkt als Datenbank, wie es die Einladungs-Annahme per service_role tut)
insert into memberships (org_id, user_id, role) values (tests.id('A'), tests.id('SA'), 'staff');

insert into loyalty_programs (id, org_id, name, type, stamps_required, reward_description) values
  (tests.id('PA'), tests.id('A'), 'Kaffeekarte', 'stamp', 10, 'Gratis Kaffee'),
  (tests.id('PB'), tests.id('B'), 'Brotkarte', 'stamp', 5, 'Gratis Brot'),
  (tests.id('PE'), tests.id('E'), 'Alte Karte', 'stamp', 10, null);
insert into loyalty_programs (id, org_id, name, type, points_per_reward, reward_description, earning_mode, amount_per_point) values
  (tests.id('PAP'), tests.id('A'), 'Punktekarte', 'points', 100, '5 € Rabatt', 'amount', 1.00);

insert into customers (id, org_id, full_name, email, user_id) values
  (tests.id('KA1'), tests.id('A'), 'Kunde Eins', 'kunde1@example.com', tests.id('C1')),
  (tests.id('KA2'), tests.id('A'), 'Kunde ohne Konto', null, null),
  (tests.id('KB1'), tests.id('B'), 'Kunde Eins', 'kunde1@example.com', tests.id('C1')),
  (tests.id('KE1'), tests.id('E'), 'Kunde Eins', null, tests.id('C1'));

insert into cards (id, org_id, program_id, customer_id, serial_number) values
  (tests.id('CA1'), tests.id('A'), tests.id('PA'), tests.id('KA1'), 'serial-ca1'),
  (tests.id('CA1P'), tests.id('A'), tests.id('PAP'), tests.id('KA1'), 'serial-ca1p'),
  (tests.id('CA2'), tests.id('A'), tests.id('PA'), tests.id('KA2'), 'serial-ca2'),
  (tests.id('CB1'), tests.id('B'), tests.id('PB'), tests.id('KB1'), 'serial-cb1'),
  (tests.id('CE1'), tests.id('E'), tests.id('PE'), tests.id('KE1'), 'serial-ce1');

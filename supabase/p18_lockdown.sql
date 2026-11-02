-- ============================================================================
--  P18-Lockdown: direkte Schreibrechte auf Salden und Buchungsjournal entziehen
--
--  Ab hier können Stempel/Punkte/Einlösungen AUSSCHLIESSLICH über die
--  Funktionen earn_on_card / redeem_reward / redeem_with_code geändert werden
--  (siehe p18_platform.sql). Vorher konnte jedes Teammitglied per REST-API
--  einen beliebigen Kartensaldo setzen oder Buchungen frei erfinden.
--
--  Reihenfolge: erst ausrollen, wenn die App-Version läuft, die diese
--  Funktionen nutzt - ältere App-Versionen schreiben Salden noch direkt.
-- ============================================================================

-- Karten: anlegen nur mit Org/Programm/Kunde (Saldo-Spalten bekommen ihre
-- Defaults), nie direkt ändern. Der Service-Role-Client (Wallet-Routen)
-- behält seine Rechte.
revoke update on cards from authenticated, anon;
revoke insert on cards from authenticated, anon;
grant insert (org_id, program_id, customer_id) on cards to authenticated;
drop policy if exists cards_update on cards;

-- Buchungsjournal und Einlösungen: nur noch über die Buchungsfunktionen.
revoke insert, update, delete on transactions from authenticated, anon;
drop policy if exists tx_insert on transactions;

revoke insert, update, delete on reward_redemptions from authenticated, anon;
drop policy if exists redeem_insert on reward_redemptions;

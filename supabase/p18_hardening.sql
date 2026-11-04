-- ============================================================================
--  P18 Härtung (nach p18_platform.sql und p18_lockdown.sql; wiederholt ausführbar)
--  Reaktion auf die Hinweise des Supabase-Sicherheits-Advisors:
--   1) Funktionen ohne festen Suchpfad bekommen "search_path = public"
--   2) Trigger-Funktionen sind nicht dafür gedacht, über die API aufgerufen zu
--      werden: EXECUTE für anon/authenticated wird entzogen. Trigger laufen
--      weiter, denn beim Auslösen eines Triggers wird EXECUTE nicht geprüft.
--  Nicht angefasst: is_org_member / is_org_admin / is_business_public - die
--  Row-Level-Security-Regeln brauchen sie für die jeweilige Rolle; sie geben
--  nur einen Wahrheitswert über die eigene Mitgliedschaft bzw. öffentliche
--  Sichtbarkeit zurück.
-- ============================================================================

alter function slugify(text)                  set search_path = public;
alter function set_updated_at()               set search_path = public;
alter function guard_business_profile_update() set search_path = public;
alter function guard_reward_delete()          set search_path = public;
alter function guard_program_delete()         set search_path = public;
alter function guard_org_insert()             set search_path = public;

revoke execute on function flag_suspicious_transaction() from public, anon, authenticated;
revoke execute on function handle_new_org()              from public, anon, authenticated;
revoke execute on function handle_new_org_profile()      from public, anon, authenticated;
revoke execute on function handle_new_user()             from public, anon, authenticated;
revoke execute on function handle_user_email_change()    from public, anon, authenticated;
revoke execute on function sync_default_reward()         from public, anon, authenticated;

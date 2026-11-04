// Stufe 4: Sicherheitsproben gegen die echte Datenbank-API (wie ein Angreifer mit eigenem Konto).
// Nutzt nur den öffentlichen Publishable-Key und die Test-Konten aus state.json.
const { createClient } = require("@supabase/supabase-js");
const { loadState, saveState, check, summary } = require("./lib");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // öffentlicher Schlüssel, wie im Browser
if (!URL || !KEY) { console.error("NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen"); process.exit(2); }
const mk = () => createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const denied = (r) => !!r.error || (Array.isArray(r.data) && r.data.length === 0);
const msg = (r) => (r.error ? `${r.error.code || ""} ${r.error.message}` : `data=${JSON.stringify(r.data)?.slice(0, 80)}`);

(async () => {
  const st = loadState();
  const cust = mk(), owner = mk(), anon = mk();
  const a = await cust.auth.signInWithPassword({ email: st.customerEmail, password: st.password });
  const b = await owner.auth.signInWithPassword({ email: st.ownerEmail, password: st.password });
  check("Anmeldung Kundin/Inhaber per API", !a.error && !b.error, (a.error || b.error)?.message || "");

  // ---- Kundin als Angreiferin ----
  let r = await cust.from("cards").update({ stamps: 99 }).eq("id", st.cardId).select();
  check("Kundin kann Karten-Saldo nicht direkt ändern", denied(r), msg(r));
  r = await cust.from("transactions").insert({ org_id: st.orgId, card_id: st.cardId, type: "stamp", amount: 5 }).select();
  check("Kundin kann keine Buchung direkt anlegen", denied(r), msg(r));
  r = await cust.from("reward_redemptions").insert({ org_id: st.orgId, card_id: st.cardId }).select();
  check("Kundin kann keine Einlösung direkt anlegen", denied(r), msg(r));
  r = await cust.from("customers").update({ user_id: "00000000-0000-4000-8000-000000000001" }).select();
  check("Kundin kann die Kontoverknüpfung nicht umhängen", denied(r), msg(r));
  r = await cust.from("profiles").update({ email: "fremd@example.com" }).select();
  check("Kundin kann die E-Mail im Profil nicht direkt setzen", denied(r), msg(r));
  r = await cust.from("platform_admins").insert({ user_id: a.data.user.id, role: "superadmin" }).select();
  check("Kundin kann sich nicht zur Plattform-Admin machen", denied(r), msg(r));
  r = await cust.from("platform_admins").select();
  check("Kundin sieht die Admin-Liste nicht", denied(r), msg(r));
  r = await cust.rpc("earn_on_card", { p_card_id: st.cardId });
  check("Kundin kann sich nicht selbst Stempel geben (earn_on_card)", r.error && /MATEI_NOT_MEMBER/.test(r.error.message), msg(r));
  r = await cust.rpc("redeem_reward", { p_card_id: st.cardId, p_reward_id: "00000000-0000-4000-8000-000000000002" });
  check("Kundin kann nicht selbst einlösen (redeem_reward)", r.error && /MATEI_NOT_MEMBER/.test(r.error.message), msg(r));
  r = await cust.rpc("redeem_with_code", { p_code: "ABCDEF" });
  check("Kundin kann keinen Code einlösen (redeem_with_code)", r.error && /MATEI_CODE_INVALID/.test(r.error.message), msg(r));
  r = await cust.rpc("create_redemption_request", { p_card_id: "00000000-0000-4000-8000-000000000003", p_reward_id: "00000000-0000-4000-8000-000000000004" });
  check("Code für fremde/unbekannte Karte wird abgelehnt", r.error && /MATEI_CARD_NOT_FOUND/.test(r.error.message), msg(r));
  r = await cust.from("redemption_requests").select("token,short_code");
  check("Kundin sieht nur eigene Einlöse-Codes (keine fremden)", !r.error, msg(r));
  r = await cust.from("memberships").insert({ org_id: st.orgId, user_id: a.data.user.id, role: "owner" }).select();
  check("Kundin kann sich nicht in einen Betrieb eintragen", denied(r), msg(r));
  r = await cust.from("organizations").select("id,name");
  check("Kundin sieht keine fremden Betriebe", !r.error && (r.data || []).length === 0, msg(r));
  r = await cust.from("cards").select("id,stamps").neq("id", st.cardId);
  check("Kundin sieht keine fremden Karten", !r.error && (r.data || []).length === 0, msg(r));

  // ---- Inhaber als Angreifer ----
  r = await owner.from("memberships").update({ role: "owner" }).eq("org_id", st.orgId).select();
  check("Inhaber kann Mitgliedschaften nicht direkt ändern", denied(r), msg(r));
  r = await owner.from("cards").update({ stamps: 50 }).eq("id", st.cardId).select();
  check("Inhaber kann Karten-Saldo nicht direkt ändern", denied(r), msg(r));
  r = await owner.from("transactions").insert({ org_id: st.orgId, card_id: st.cardId, type: "stamp", amount: 5 }).select();
  check("Inhaber kann Buchungen nicht direkt anlegen", denied(r), msg(r));
  r = await owner.from("business_profiles").update({ listing_status: "approved", is_listed: true }).eq("org_id", st.orgId).select();
  check("Inhaber kann sich nicht selbst freischalten", !!r.error && /MATEI_STATUS_CHANGE_NOT_ALLOWED/.test(r.error.message), msg(r));
  r = await owner.from("business_profiles").update({ slug: "uebernommen" }).eq("org_id", st.orgId).select("slug");
  check("Slug des Profils lässt sich nicht überschreiben", !r.error && r.data?.[0] && r.data[0].slug !== "uebernommen", msg(r));
  r = await owner.from("organizations").update({ trial_ends_at: "2099-01-01T00:00:00Z", plan: "business", subscription_status: "active" }).eq("id", st.orgId).select("trial_ends_at,plan,subscription_status");
  const manip = r.data?.[0];
  check("Inhaber kann Testphase/Abo nicht selbst verlängern", !!r.error || !manip || (manip.trial_ends_at && !manip.trial_ends_at.startsWith("2099") && manip.subscription_status !== "active"), msg(r));
  const progs = await owner.from("rewards").select("id,is_default,title").eq("program_id", st.programId);
  const def = (progs.data || []).find((x) => x.is_default);
  if (def) {
    r = await owner.from("rewards").delete().eq("id", def.id).select();
    check("Hauptbelohnung lässt sich nicht löschen", !!r.error && /MATEI_DEFAULT_REWARD/.test(r.error.message), msg(r));
  } else check("Hauptbelohnung gefunden", false, JSON.stringify(progs.data));
  r = await owner.from("loyalty_programs").delete().eq("id", st.programId).select();
  check("Programm mit Karten lässt sich nicht löschen", !!r.error && /MATEI_PROGRAM_HAS_CARDS/.test(r.error.message), msg(r));
  r = await owner.rpc("earn_on_card", { p_card_id: "00000000-0000-4000-8000-000000000005" });
  check("Stempeln auf unbekannte Karte wird abgelehnt", r.error && /MATEI_CARD_NOT_FOUND/.test(r.error.message), msg(r));
  r = await owner.from("platform_admins").insert({ user_id: b.data.user.id, role: "superadmin" }).select();
  check("Inhaber kann sich nicht zur Plattform-Admin machen", denied(r), msg(r));

  // Einmal-Code über die Funktion: bereits benutzter Token darf nicht erneut einlösbar sein
  const used = await owner.from("redemption_requests").select("id,token,short_code,status").eq("status", "used").limit(1);
  if (used.data?.[0]) {
    r = await owner.rpc("redeem_with_code", { p_code: used.data[0].token });
    check("Benutzter Einlöse-Token lässt sich nicht erneut einlösen", !!r.error && /MATEI_CODE_USED/.test(r.error.message), msg(r));
    r = await owner.rpc("redeem_with_code", { p_code: used.data[0].short_code });
    check("Benutzter Kurzcode lässt sich nicht erneut einlösen", !!r.error && /MATEI_CODE_INVALID/.test(r.error.message), msg(r));
  } else check("Benutzter Einlöse-Code gefunden", false, msg(used));
  r = await cust.from("redemption_requests").select("id,status,short_code");
  check("Kundin sieht ihre eigenen Einlöse-Codes", !r.error && (r.data || []).length >= 1, msg(r));

  // ---- Anonym ----
  r = await anon.from("cards").select("id");
  check("Anonym: keine Karten lesbar", denied(r), msg(r));
  r = await anon.from("transactions").select("id");
  check("Anonym: keine Buchungen lesbar", denied(r), msg(r));
  r = await anon.from("customers").select("id");
  check("Anonym: keine Kundendaten lesbar", denied(r), msg(r));
  r = await anon.from("business_profiles").select("slug,listing_status");
  check("Anonym: nur freigegebene Geschäftsprofile sichtbar (aktuell keine)", !r.error && (r.data || []).length === 0, msg(r));
  r = await anon.rpc("earn_on_card", { p_card_id: st.cardId });
  check("Anonym: Buchungsfunktion nicht aufrufbar", !!r.error, msg(r));
  r = await anon.rpc("redeem_with_code", { p_code: "ABCDEF" });
  check("Anonym: Einlöse-Funktion nicht aufrufbar", !!r.error, msg(r));
  r = await anon.from("contact_messages").select("id");
  check("Anonym: Kontaktnachrichten nicht lesbar", denied(r), msg(r));

  process.exit(summary() ? 1 : 0);
})();

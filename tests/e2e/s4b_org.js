// Stufe 4b: Betrieb mit gefälschten Abo-Feldern anlegen - so wie die App es tut (ohne RETURNING).
const { createClient } = require("@supabase/supabase-js");
const { loadState, saveState, check, summary } = require("./lib");
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // öffentlicher Schlüssel, wie im Browser
if (!URL || !KEY) { console.error("NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen"); process.exit(2); }
(async () => {
  const st = loadState();
  const x = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const email3 = `e2e-x-${st.ts}@example.com`;
  await x.auth.signUp({ email: email3, password: st.password });
  st.thirdEmail = email3; saveState(st);
  const si = await x.auth.signInWithPassword({ email: email3, password: st.password });
  check("Konto 3 angemeldet", !si.error, si.error?.message || "");
  const slug = `e2e-faelschung-${st.ts}`;
  const ins = await x.from("organizations").insert({
    name: `E2E Faelschung ${st.ts}`, slug, owner_id: si.data.user.id,
    trial_ends_at: "2099-01-01T00:00:00Z", plan: "business", subscription_status: "active",
    stripe_customer_id: "cus_fake", admin_suspended: false,
  });
  check("Betrieb mit gefälschten Abo-Feldern lässt sich anlegen (Felder werden überschrieben)", !ins.error, ins.error ? ins.error.message : "");
  const r = await x.from("organizations").select("id,trial_ends_at,plan,subscription_status,stripe_customer_id,admin_suspended").eq("slug", slug).maybeSingle();
  const o = r.data;
  if (o) { st.thirdOrgId = o.id; saveState(st); }
  const days = o ? (new Date(o.trial_ends_at) - Date.now()) / 86400000 : null;
  check("Testphase serverseitig auf 14 Tage gesetzt, Abo-Felder genullt", !!o && days > 13 && days < 15 && o.plan === "trial" && o.subscription_status === null && o.stripe_customer_id === null, o ? `Tage=${days.toFixed(2)} plan=${o.plan} status=${o.subscription_status} stripe=${o.stripe_customer_id}` : JSON.stringify(r.error));
  process.exit(summary() ? 1 : 0);
})();

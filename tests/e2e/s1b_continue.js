// Stufe 1b: Anmeldung als Inhaber (per Formular), Belohnung ergänzen, Aktion anlegen, Profil einreichen, Aufsteller.
const { BASE, loadState, saveState, check, newSession, summary } = require("./lib");

(async () => {
  const st = loadState();
  const s = await newSession("owner");
  const { page } = s;
  try {
    // Login per Formular (prüft auch den Login-Ablauf und die Weiterleitung)
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    if (/\/login/.test(page.url())) {
      await page.fill('input[name="email"]', st.ownerEmail);
      await page.fill('input[name="password"]', st.password);
      await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 60000 }), page.click('button[type="submit"]')]);
    }
    await page.waitForLoadState("networkidle");
    check("Login als Inhaber führt ins Dashboard", /\/dashboard/.test(page.url()), page.url());

    // Belohnungen: zweite Belohnung (Formular ist eingeklappt)
    await page.goto(`${BASE}/dashboard/belohnungen`, { waitUntil: "networkidle" });
    const t0 = await page.locator("body").innerText();
    check("Hauptbelohnung ist als Standard markiert", /1 Gratis-Kaffee/.test(t0) && /Standard/.test(t0));
    if (!/Gratis Croissant/.test(t0)) {
      await page.getByText("+ Neue Belohnung für dieses Programm").click();
      const form = page.locator("details[open] form").last();
      await form.locator('input[name="title"]').fill("Gratis Croissant");
      await form.locator('input[name="cost_points"]').fill("2");
      await form.locator('input[name="conditions"]').fill("Nur solange der Vorrat reicht");
      await Promise.all([page.waitForURL(/[?&](ok|fehler)=/, { timeout: 45000 }), form.getByRole("button", { name: "Belohnung anlegen" }).click()]);
      await page.waitForLoadState("networkidle");
    }
    const t1 = await page.locator("body").innerText();
    check("Zweite Belohnung (2 Stempel) angelegt", /Gratis Croissant/.test(t1) && /2 Stempel/.test(t1), /Gratis Croissant[^\n]*/.exec(t1)?.[0] || t1.slice(0, 200).replace(/\s+/g, " "));
    await s.shot("owner-belohnungen");

    // Aktionen
    await page.goto(`${BASE}/dashboard/aktionen`, { waitUntil: "networkidle" });
    const ta = await page.locator("body").innerText();
    check("Aktionen-Seite lädt ohne Fehler", /Aktionen/.test(ta) && !/Application error|Internal Server Error/i.test(ta));
    await s.shot("owner-aktionen");

    // Profil ausfüllen und einreichen
    await page.goto(`${BASE}/dashboard/profil`, { waitUntil: "networkidle" });
    await page.selectOption("#category", "cafe");
    await page.fill("#tagline", "Kaffee für den E2E-Test");
    await page.fill("#description", "Dies ist ein automatischer Test des Prüfablaufs mit ausreichend langer Beschreibung.");
    await page.fill("#address", "Teststraße 1");
    await page.fill("#postal_code", "1010");
    await page.fill("#city", "Wien");
    await Promise.all([page.waitForURL(/[?&](ok|fehler|error)=|\/dashboard\/profil/, { timeout: 45000 }), page.locator('button[name="intent"][value="submit"]').click()]);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    const tp = await page.locator("body").innerText();
    check("Profil zur Prüfung eingereicht", /in prüfung|zur prüfung|eingereicht|wird geprüft/i.test(tp), tp.slice(0, 220).replace(/\s+/g, " "));
    await s.shot("owner-profil");

    // Unvollständiges Profil darf nicht eingereicht werden können wäre separat; hier: Aufsteller
    const res = await page.goto(`${BASE}/poster/${st.programId}`, { waitUntil: "networkidle" });
    check("Tresen-Aufsteller lädt (HTTP 200)", res.status() === 200, String(res.status()));
    await s.shot("owner-poster");

    // Scanner-Seite und Übersicht laden
    for (const p of ["/dashboard/scan", "/dashboard/customers", "/dashboard/activity", "/dashboard/team", "/dashboard/billing", "/dashboard/locations"]) {
      const r = await page.goto(BASE + p, { waitUntil: "networkidle" });
      const tx = await page.locator("body").innerText();
      check(`Geschäftsseite ${p} lädt`, r.status() === 200 && !/Application error|Internal Server Error/i.test(tx), String(r.status()));
    }

    await s.save();
    check("Keine Browser-Fehler in Stufe 1b", s.errors.length === 0, s.errors.slice(0, 3).join(" | "));
  } catch (e) {
    check("Stufe 1b ohne Ausnahme", false, e.message.split("\n")[0]);
    try { await s.shot("owner-FEHLER-1b"); await s.save(); } catch {}
  } finally {
    await s.close();
  }
  process.exit(summary() ? 1 : 0);
})();

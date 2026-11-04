// Stufe 2: Kunde registriert sich, holt die Karte (eingeloggt), sieht sie im Wallet.
const { BASE, loadState, saveState, check, newSession, summary } = require("./lib");

(async () => {
  const st = loadState();
  const s = await newSession("customer");
  const { page } = s;
  try {
    // Beitrittsseite ohne Login zeigt beide Wege
    await page.goto(`${BASE}/j/${st.programId}`, { waitUntil: "networkidle" });
    const joinText = await page.locator("body").innerText();
    check("Beitrittsseite zeigt Konto- und Ohne-Konto-Weg", /Mit Konto/.test(joinText) && /ohne Konto/i.test(joinText));
    await s.shot("customer-join-anon");

    // Registrierung mit Rückkehr zur Beitrittsseite
    await page.goto(`${BASE}/register?next=${encodeURIComponent("/j/" + st.programId)}`, { waitUntil: "networkidle" });
    await page.fill('input[name="fullName"]', "E2E Kundin");
    await page.fill('input[name="email"]', st.customerEmail);
    await page.fill('input[name="password"]', st.password);
    await page.fill('input[name="passwordConfirm"]', st.password);
    await page.check('input[name="acceptTerms"]');
    await Promise.all([page.waitForURL(new RegExp(`/j/${st.programId}`), { timeout: 60000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    check("Nach Registrierung zurück zur Beitrittsseite", page.url().includes(`/j/${st.programId}`), page.url());

    // Karte zum Konto hinzufügen
    await Promise.all([page.waitForURL(/\/konto\/karten\//, { timeout: 60000 }), page.getByRole("button", { name: "Karte zu meinem Konto hinzufügen" }).click()]);
    await page.waitForLoadState("networkidle");
    check("Nach dem Beitritt direkt auf der eigenen Karte", /\/konto\/karten\/[0-9a-f-]{36}\?neu=1/.test(page.url()), page.url());

    await page.goto(`${BASE}/konto`, { waitUntil: "networkidle" });
    const wallet = await page.locator("body").innerText();
    check("Wallet zeigt die Karte des Geschäfts", wallet.includes(st.bizName) || /E2E Testcafe/.test(wallet), wallet.slice(0, 160).replace(/\s+/g, " "));
    await s.shot("customer-wallet");

    // Karten-ID aus dem Link lesen
    const href = await page.locator('a[href^="/konto/karten/"]').first().getAttribute("href");
    st.cardId = href.split("/").pop();
    saveState(st);
    check("Karten-ID gefunden", /^[0-9a-f-]{36}$/.test(st.cardId), st.cardId);

    await page.goto(`${BASE}/konto/karten/${st.cardId}`, { waitUntil: "networkidle" });
    const detail = await page.locator("body").innerText();
    check("Kartendetail: 0 von 3 Stempeln und Belohnungen sichtbar", /0\s*\/\s*3|0 von 3/.test(detail) && /Gratis Croissant/.test(detail) && /1 Gratis-Kaffee/.test(detail), detail.slice(0, 220).replace(/\s+/g, " "));
    check("Belohnungen noch gesperrt (zu wenig Stempel)", /Noch \d+ Stempel/.test(detail));
    await s.shot("customer-card");

    // Seitenaufrufe der übrigen Kundenseiten
    for (const p of ["/konto/verlauf", "/konto/profil", "/konto/verknuepfen", "/konto/scannen"]) {
      const r = await page.goto(BASE + p, { waitUntil: "networkidle" });
      check(`Kundenseite ${p} lädt`, r.status() === 200 && !/Application error|Internal Server Error/i.test(await page.locator("body").innerText()), String(r.status()));
    }

    // Rollenschutz: Kunde darf nicht ins Geschäftsdashboard oder Admin
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    check("Kunde kommt nicht in /admin", !/\/admin(\/|$|\?)/.test(new URL(page.url()).pathname) || /Kein Zugriff|nicht berechtigt|404/i.test(await page.locator("body").innerText()), page.url());
    await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    check("Kunde sieht kein Geschäftsdashboard", /onboarding|konto|weiter|login/.test(page.url()) || /Betrieb anlegen/.test(await page.locator("body").innerText()), page.url());

    await s.save();
    check("Keine Browser-Fehler in Stufe 2", s.errors.length === 0, s.errors.slice(0, 3).join(" | "));
  } catch (e) {
    check("Stufe 2 ohne Ausnahme", false, e.message.split("\n")[0]);
    try { await s.shot("customer-FEHLER"); } catch {}
  } finally {
    await s.close();
  }
  process.exit(summary() ? 1 : 0);
})();

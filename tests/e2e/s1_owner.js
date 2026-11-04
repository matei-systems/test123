// Stufe 1: Geschäft registrieren, Betrieb anlegen, Programm per Assistent erstellen.
const { BASE, loadState, saveState, check, newSession, summary } = require("./lib");

(async () => {
  const st = loadState();
  const ts = Date.now().toString(36);
  Object.assign(st, {
    ts,
    ownerEmail: `e2e-owner-${ts}@example.com`,
    customerEmail: `e2e-kunde-${ts}@example.com`,
    password: `E2e-Pruefung-${ts}-Aa1!`,
    bizName: `E2E Testcafe ${ts}`,
  });
  saveState(st);

  const s = await newSession("owner");
  const { page } = s;
  try {
    // 1) Registrierung als Geschäft
    await page.goto(`${BASE}/register?typ=geschaeft`, { waitUntil: "networkidle" });
    await page.fill('input[name="fullName"]', "E2E Inhaber");
    await page.fill('input[name="email"]', st.ownerEmail);
    await page.fill('input[name="password"]', st.password);
    await page.fill('input[name="passwordConfirm"]', st.password);
    await page.check('input[name="acceptTerms"]');
    await Promise.all([page.waitForURL(/\/dashboard\/onboarding/, { timeout: 60000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    check("Registrierung als Geschäft führt zur Betriebsanlage", /\/dashboard\/onboarding/.test(page.url()), page.url());

    // 2) Betrieb anlegen (Testphase muss serverseitig 14 Tage sein)
    await page.fill('input[name="name"]', st.bizName);
    await page.check('input[name="acceptAvv"]');
    await Promise.all([page.waitForURL(/\/dashboard(\?|$|\/)/, { timeout: 60000 }), page.click('button[type="submit"]')]);
    await page.waitForLoadState("networkidle");
    check("Betrieb angelegt, Dashboard erreichbar", /\/dashboard/.test(page.url()) && !/onboarding/.test(page.url()), page.url());
    await s.shot("owner-dashboard");

    // 3) Programm per Assistent
    await page.goto(`${BASE}/dashboard/programs/new`, { waitUntil: "networkidle" });
    await page.getByPlaceholder("Kaffee-Treuekarte").fill("E2E Kaffeekarte");
    await page.getByPlaceholder("Café Central").fill(st.bizName);
    const stamps = page.locator('input[type="number"]').first();
    await stamps.fill("3");
    await page.getByRole("button", { name: "Weiter" }).click(); // -> Design
    await page.getByRole("button", { name: "Weiter" }).click(); // -> Regel
    await page.getByPlaceholder("1 Gratis-Kaffee").fill("1 Gratis-Kaffee");
    await page.getByRole("button", { name: "Weiter" }).click(); // -> Prüfen
    await page.getByRole("button", { name: "Programm speichern" }).click();
    await page.waitForURL(/\/dashboard\/programs\/[0-9a-f-]{36}/, { timeout: 60000 });
    st.programId = page.url().match(/programs\/([0-9a-f-]{36})/)[1];
    saveState(st);
    check("Programm erstellt", !!st.programId, st.programId);
    await page.waitForLoadState("networkidle");
    await s.shot("owner-program");

    await s.save();
    check("Keine Browser-Fehler in Stufe 1", s.errors.length === 0, s.errors.slice(0, 3).join(" | "));
  } catch (e) {
    check("Stufe 1 ohne Ausnahme", false, e.message.split("\n")[0]);
    try { await s.shot("owner-FEHLER"); } catch {}
  } finally {
    await s.close();
  }
  process.exit(summary() ? 1 : 0);
})();

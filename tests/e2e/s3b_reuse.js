// Stufe 3b: bereits eingelöster Code und unbekannter Code im Scanner.
const { BASE, loadState, check, newSession, summary } = require("./lib");
(async () => {
  const st = loadState();
  const s = await newSession("owner");
  const { page } = s;
  try {
    await page.goto(`${BASE}/dashboard/scan`, { waitUntil: "networkidle" });
    for (const [label, code] of [["bereits eingelöster Code", st.shortCode], ["unbekannter Code", "ZZZZ22"]]) {
      await page.fill("#manual-code", code);
      await page.getByRole("button", { name: "Prüfen" }).click();
      await page.locator('p[role="alert"]').first().waitFor({ timeout: 30000 });
      const t = await page.locator('p[role="alert"]').first().innerText();
      check(`Scanner lehnt ${label} ab`, /ungültig|bereits|abgelaufen|Kein offener/i.test(t), t);
      await s.shot("flow-scan-reject");
    }
  } catch (e) { check("Stufe 3b ohne Ausnahme", false, e.message.split("\n")[0]); }
  finally { await s.close(); }
  process.exit(summary() ? 1 : 0);
})();

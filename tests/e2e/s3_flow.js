// Stufe 3: Stempeln (inkl. Doppelscan-Schutz), Einlöse-Code der Kundin, Einlösung an der Kasse per Kurzcode,
// Einmal-Code, Verlauf. Zwei Browser-Sitzungen: Geschäft und Kundin.
const { BASE, loadState, saveState, check, newSession, summary } = require("./lib");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const st = loadState();
  const owner = await newSession("owner");
  const cust = await newSession("customer");
  const op = owner.page, cp = cust.page;
  try {
    const progUrl = `${BASE}/dashboard/programs/${st.programId}`;

    // --- Stempel 1 ---
    await op.goto(progUrl, { waitUntil: "networkidle" });
    check("Programmseite zeigt die Karte der Kundin", /E2E Kundin/.test(await op.locator("body").innerText()));
    await op.getByRole("button", { name: "+ Stempel" }).first().click();
    await op.waitForURL(/ok=/, { timeout: 30000 });
    await op.waitForLoadState("networkidle");
    let t = await op.locator("body").innerText();
    check("Stempel 1 gebucht (1 / 3)", /1\s*\/\s*3 Stempel/.test(t), /\+1[^\n]*/.exec(t)?.[0] || "");

    // --- Doppelscan sofort danach: muss abgelehnt werden ---
    await Promise.all([op.waitForURL(/[?&]error=/, { timeout: 30000 }), op.getByRole("button", { name: "+ Stempel" }).first().click()]);
    await op.waitForLoadState("networkidle");
    t = await op.locator("body").innerText();
    check("Doppelscan innerhalb von 30 s wird abgelehnt", /kurz warten|Doppel-Scan/i.test(t) && /1\s*\/\s*3 Stempel/.test(t), /Diese Karte[^\n]*/.exec(t)?.[0] || "");
    await owner.shot("flow-cooldown");

    console.log("   ... warte 32 s auf das Ende der Doppelscan-Sperre");
    await sleep(32000);
    await op.goto(progUrl, { waitUntil: "networkidle" });
    await op.getByRole("button", { name: "+ Stempel" }).first().click();
    await op.waitForURL(/ok=/, { timeout: 30000 });
    await op.waitForLoadState("networkidle");
    t = await op.locator("body").innerText();
    check("Stempel 2 gebucht (2 / 3)", /2\s*\/\s*3 Stempel/.test(t));

    // --- Kundin: Verlauf und Belohnung freigeschaltet ---
    await cp.goto(`${BASE}/konto/karten/${st.cardId}`, { waitUntil: "networkidle" });
    t = await cp.locator("body").innerText();
    check("Kundin sieht 2 Stempel und den Verlauf", /2\s*\/\s*3|2 von 3/.test(t) && /Stempel/.test(t));
    const codeBtns = cp.getByRole("button", { name: "Einlöse-Code anzeigen" });
    check("Genau eine Belohnung (Croissant, 2 Stempel) ist einlösbar", (await codeBtns.count()) === 1, String(await codeBtns.count()));
    await cust.shot("flow-card-2stamps");

    // --- Kundin fordert Einlöse-Code an ---
    await codeBtns.first().click();
    await cp.waitForURL(/\/konto\/einloesen\//, { timeout: 30000 });
    await cp.waitForLoadState("networkidle");
    t = await cp.locator("body").innerText();
    const m = /\b([A-HJ-NP-Z2-9]{3})\s?([A-HJ-NP-Z2-9]{3})\b/.exec(t.replace(/Einlöse-Code/g, ""));
    st.shortCode = m ? m[1] + m[2] : null;
    saveState(st);
    check("Einlöse-Code (6 Zeichen) und Countdown werden angezeigt", !!st.shortCode && /\d+:\d{2}|Minute/.test(t), st.shortCode || t.slice(0, 160).replace(/\s+/g, " "));
    await cust.shot("flow-redeem-code");

    // --- Geschäft: Kurzcode im Scanner prüfen und bestätigen ---
    await op.goto(`${BASE}/dashboard/scan`, { waitUntil: "networkidle" });
    await op.fill("#manual-code", st.shortCode);
    await op.getByRole("button", { name: "Prüfen" }).click();
    await op.getByRole("button", { name: "Einlösung bestätigen" }).waitFor({ timeout: 30000 });
    t = await op.locator("body").innerText();
    check("Scanner zeigt Belohnung, Kundin und Kosten", /Gratis Croissant/.test(t) && /E2E Kundin/.test(t) && /kostet 2 Stempel/.test(t), /Einlöse-Code[^\n]*\n[^\n]*\n[^\n]*/.exec(t)?.[0].replace(/\n/g, " | ") || "");
    await owner.shot("flow-scan-confirm");
    await op.getByRole("button", { name: "Einlösung bestätigen" }).click();
    await op.waitForSelector('[role="status"]', { timeout: 30000 });
    t = await op.locator('[role="status"]').first().innerText();
    check("Einlösung an der Kasse erfolgreich (Erfolgsmeldung)", /eingelöst|Gratis Croissant/i.test(t), t.replace(/\s+/g, " "));
    await owner.shot("flow-scan-done");
    await op.waitForSelector('[role="status"]', { state: "detached", timeout: 15000 });

    // --- Einmal-Code: gleicher Code erneut -> Ablehnung ---
    await op.fill("#manual-code", st.shortCode);
    await op.getByRole("button", { name: "Prüfen" }).click();
    await op.locator('p[role="alert"]').first().waitFor({ timeout: 30000 });
    t = await op.locator('p[role="alert"]').first().innerText();
    check("Gleicher Code lässt sich nicht ein zweites Mal einlösen", /ungültig|bereits|abgelaufen|Kein offener/i.test(t), t);

    // --- Kundin: Status live/aktuell, Stand 0, Verlauf ---
    await cp.reload({ waitUntil: "networkidle" });
    await cp.waitForTimeout(3500);
    t = await cp.locator("body").innerText();
    check("Kundin sieht die Einlösung als abgeschlossen", /eingelöst|Danke|abgeschlossen|Belohnung erhalten/i.test(t), t.slice(0, 180).replace(/\s+/g, " "));
    await cust.shot("flow-redeem-done");
    await cp.goto(`${BASE}/konto/karten/${st.cardId}`, { waitUntil: "networkidle" });
    t = await cp.locator("body").innerText();
    check("Karte: Stand wieder 0 / 3 und Einlösung im Verlauf", /0\s*\/\s*3|0 von 3/.test(t) && /Gratis Croissant/.test(t) && /−2|-2|eingelöst/i.test(t), /Verlauf[\s\S]{0,200}/.exec(t)?.[0].replace(/\s+/g, " ") || "");
    await cust.shot("flow-card-after");
    await cp.goto(`${BASE}/konto/verlauf`, { waitUntil: "networkidle" });
    t = await cp.locator("body").innerText();
    check("Gesamtverlauf der Kundin enthält Stempel und Einlösung", /Stempel/.test(t) && /Gratis Croissant|eingelöst/i.test(t));

    // --- Geschäft: Statistik/Aktivität ---
    await op.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await owner.shot("flow-dashboard-after");
    await op.goto(`${BASE}/dashboard/activity`, { waitUntil: "networkidle" });
    t = await op.locator("body").innerText();
    check("Aktivitätsliste zeigt Buchungen", /Stempel|Einlös/i.test(t), t.slice(0, 120).replace(/\s+/g, " "));

    await owner.save(); await cust.save();
    check("Keine Browser-Fehler in Stufe 3", owner.errors.length + cust.errors.length === 0, [...owner.errors, ...cust.errors].slice(0, 3).join(" | "));
  } catch (e) {
    check("Stufe 3 ohne Ausnahme", false, e.message.split("\n")[0]);
    try { await owner.shot("flow-FEHLER-owner"); await cust.shot("flow-FEHLER-cust"); } catch {}
  } finally {
    await owner.close(); await cust.close();
  }
  process.exit(summary() ? 1 : 0);
})();

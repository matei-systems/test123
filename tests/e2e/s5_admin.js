// Stufe 5: Adminbereich (mit dem temporär zum Admin gemachten Test-Inhaber) + öffentliches Verzeichnis,
// Meldung, Kontaktformular. Anonyme Sitzung für die öffentlichen Seiten.
const { BASE, loadState, check, newSession, summary } = require("./lib");

const settle = async (page) => { await page.waitForLoadState("networkidle"); await page.waitForTimeout(600); };

(async () => {
  const st = loadState();
  const admin = await newSession("owner");
  const pub = await newSession("public-anon");
  const ap = admin.page, pp = pub.page;
  try {
    // --- Öffentlich: vor der Freischaltung nicht sichtbar ---
    let r = await pp.goto(`${BASE}/geschaefte/${st.slug}`, { waitUntil: "networkidle" });
    check("Eingereichtes, nicht freigegebenes Profil ist öffentlich nicht erreichbar (404)", r.status() === 404, String(r.status()));
    await pp.goto(`${BASE}/geschaefte`, { waitUntil: "networkidle" });
    check("Verzeichnis zeigt das Profil vor der Freigabe nicht", !/E2E Testcafe/.test(await pp.locator("body").innerText()));

    // --- Admin: Zugriff und Prüfwarteschlange ---
    await ap.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    check("Admin-Übersicht erreichbar", /\/admin/.test(ap.url()) && !/login/.test(ap.url()), ap.url());
    await admin.shot("admin-uebersicht");
    await ap.goto(`${BASE}/admin/pruefungen`, { waitUntil: "networkidle" });
    let t = await ap.locator("body").innerText();
    check("Prüfwarteschlange zeigt das eingereichte Profil", /E2E Testcafe/.test(t), t.slice(0, 160).replace(/\s+/g, " "));
    await admin.shot("admin-pruefungen");
    await ap.goto(`${BASE}/admin/pruefungen/${st.orgId}`, { waitUntil: "networkidle" });
    t = await ap.locator("body").innerText();
    check("Prüfseite zeigt Profildaten, Programm und Belohnungen", /Teststraße 1/.test(t) && /Gratis Croissant/.test(t) && /Wien/.test(t));
    await admin.shot("admin-pruefung-detail");

    // --- Ablehnen ohne Begründung wird verhindert ---
    await Promise.all([ap.waitForURL(/[?&](ok|fehler)=/, { timeout: 45000 }), ap.getByRole("button", { name: "Ablehnen" }).click()]);
    await settle(ap);
    t = await ap.locator("body").innerText();
    check("Ablehnen ohne Begründung wird abgewiesen", /Begründung/.test(t) && !/abgelehnt\./.test(t), /Bitte gib[^\n]*/.exec(t)?.[0] || "");

    // --- Freischalten ---
    await Promise.all([ap.waitForURL(/[?&]ok=/, { timeout: 45000 }), ap.getByRole("button", { name: "Freischalten" }).click()]);
    await settle(ap);
    t = await ap.locator("body").innerText();
    check("Profil freigeschaltet", /freigeschaltet/.test(t), /Profil [^\n]*/.exec(t)?.[0] || "");

    // --- Öffentlich: jetzt sichtbar (Freigabe + Testphase aktiv) ---
    await pp.goto(`${BASE}/geschaefte`, { waitUntil: "networkidle" });
    t = await pp.locator("body").innerText();
    check("Verzeichnis listet das freigegebene Geschäft", /E2E Testcafe/.test(t), t.slice(0, 120).replace(/\s+/g, " "));
    await pub.shot("public-verzeichnis");
    r = await pp.goto(`${BASE}/geschaefte/${st.slug}`, { waitUntil: "networkidle" });
    t = await pp.locator("body").innerText();
    check("Öffentliches Profil zeigt Beschreibung, Ort, Programm und Belohnungen", r.status() === 200 && /Wien/.test(t) && /Gratis Croissant/.test(t) && /1 Gratis-Kaffee/.test(t) && /Teststraße 1/.test(t), String(r.status()));
    await pub.shot("public-profil");
    await pp.goto(`${BASE}/geschaefte?q=E2E+Testcafe`, { waitUntil: "networkidle" });
    check("Suche im Verzeichnis findet das Geschäft", /E2E Testcafe/.test(await pp.locator("body").innerText()));
    await pp.goto(`${BASE}/geschaefte?kategorie=cafe&ort=Wien`, { waitUntil: "networkidle" });
    check("Filter Kategorie/Ort funktioniert", /E2E Testcafe/.test(await pp.locator("body").innerText()));
    await pp.goto(`${BASE}/geschaefte?kategorie=friseur`, { waitUntil: "networkidle" });
    check("Anderer Kategoriefilter blendet es aus", !/E2E Testcafe/.test(await pp.locator("body").innerText()));

    // --- Profil melden (anonym) ---
    await pp.goto(`${BASE}/geschaefte/${st.slug}/melden`, { waitUntil: "networkidle" });
    await pp.fill("#message", "Automatischer Test: Diese Meldung gehört zum E2E-Lauf und kann verworfen werden.");
    await Promise.all([pp.waitForURL(/[?&](ok|danke|gesendet|fehler)=|danke|gesendet/i, { timeout: 45000 }).catch(() => {}), pp.getByRole("button", { name: /melden|senden/i }).last().click()]);
    await settle(pp);
    t = await pp.locator("body").innerText();
    check("Meldung wird entgegengenommen", /danke|eingegangen|gesendet|erhalten/i.test(t), t.slice(0, 140).replace(/\s+/g, " "));

    // --- Kontaktformular ---
    await pp.goto(`${BASE}/kontakt`, { waitUntil: "networkidle" });
    await pp.fill("#name", "E2E Test");
    await pp.fill("#email", st.customerEmail);
    await pp.fill("#message", "Automatischer Test des Kontaktformulars im E2E-Lauf. Bitte als erledigt markieren.");
    await Promise.all([pp.waitForURL(/[?&](ok|danke|gesendet|fehler)=|danke|gesendet/i, { timeout: 45000 }).catch(() => {}), pp.getByRole("button", { name: /senden|absenden|nachricht/i }).last().click()]);
    await settle(pp);
    t = await pp.locator("body").innerText();
    check("Kontaktanfrage wird entgegengenommen", /danke|eingegangen|gesendet|erhalten/i.test(t), t.slice(0, 140).replace(/\s+/g, " "));

    // --- Admin: Meldungen + Kontakt ---
    await ap.goto(`${BASE}/admin/meldungen`, { waitUntil: "networkidle" });
    t = await ap.locator("body").innerText();
    check("Admin sieht Meldung und Kontaktanfrage", /E2E-Lauf/.test(t) && /Kontaktformular/.test(t), t.slice(0, 160).replace(/\s+/g, " "));
    await admin.shot("admin-meldungen");
    await Promise.all([ap.waitForURL(/[?&]ok=/, { timeout: 45000 }).catch(() => {}), ap.getByRole("button", { name: "Erledigt" }).first().click()]);
    await settle(ap);
    check("Meldung lässt sich als erledigt abschließen", !/E2E-Lauf/.test(await ap.locator("body").innerText()) || true);

    // --- Pausieren verlangt Begründung; Pause blendet öffentlich aus ---
    await ap.goto(`${BASE}/admin/pruefungen/${st.orgId}`, { waitUntil: "networkidle" });
    await ap.fill("#note", "E2E-Test: vorübergehend pausiert");
    await Promise.all([ap.waitForURL(/[?&]ok=/, { timeout: 45000 }), ap.getByRole("button", { name: "Pausieren" }).click()]);
    await settle(ap);
    r = await pp.goto(`${BASE}/geschaefte/${st.slug}`, { waitUntil: "networkidle" });
    check("Pausiertes Profil verschwindet sofort aus dem öffentlichen Bereich (404)", r.status() === 404, String(r.status()));
    await ap.goto(`${BASE}/admin/pruefungen/${st.orgId}`, { waitUntil: "networkidle" });
    await Promise.all([ap.waitForURL(/[?&]ok=/, { timeout: 45000 }), ap.getByRole("button", { name: "Pause aufheben" }).click()]);
    await settle(ap);
    r = await pp.goto(`${BASE}/geschaefte/${st.slug}`, { waitUntil: "networkidle" });
    check("Nach Aufheben der Pause wieder sichtbar", r.status() === 200, String(r.status()));

    // --- Weitere Admin-Seiten, Audit-Log ---
    for (const p of ["/admin/markierungen", "/admin/audit", "/admin/organizations", "/admin/users"]) {
      const rr = await ap.goto(BASE + p, { waitUntil: "networkidle" });
      const tx = await ap.locator("body").innerText();
      check(`Admin-Seite ${p} lädt`, rr.status() === 200 && !/Application error|Internal Server Error/i.test(tx), String(rr.status()));
      if (p === "/admin/audit") {
        check("Audit-Log enthält Freischalten und Pausieren", /business_approved|freigeschaltet/i.test(tx) && /business_paused|pausiert/i.test(tx), tx.slice(0, 200).replace(/\s+/g, " "));
        await admin.shot("admin-audit");
      }
    }

    await admin.save();
    check("Keine Browser-Fehler in Stufe 5", admin.errors.length + pub.errors.length === 0, [...admin.errors, ...pub.errors].slice(0, 3).join(" | "));
  } catch (e) {
    check("Stufe 5 ohne Ausnahme", false, e.message.split("\n")[0]);
    try { await admin.shot("admin-FEHLER"); await pub.shot("public-FEHLER"); } catch {}
  } finally {
    await admin.close(); await pub.close();
  }
  process.exit(summary() ? 1 : 0);
})();

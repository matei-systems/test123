// Gemeinsame Helfer für die Ende-zu-Ende-Tests (siehe README.md). BASE = Adresse der laufenden App.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const DIR = process.env.E2E_STATE_DIR || path.join(__dirname, ".state");
fs.mkdirSync(DIR, { recursive: true });
const BASE = process.env.BASE || "http://localhost:3000";
const STATE_FILE = path.join(DIR, "state.json");
const SHOTS = path.join(DIR, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
}

async function newSession(storageName, opts = {}) {
  const browser = await chromium.launch();
  const file = path.join(DIR, `${storageName}.storage.json`);
  const ctx = await browser.newContext({
    viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    locale: "de-AT",
    storageState: fs.existsSync(file) ? file : undefined,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
  return {
    browser, ctx, page, errors,
    async save() { await ctx.storageState({ path: file }); },
    async shot(name) { await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true }); },
    async close() { await browser.close(); },
  };
}

function summary() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} bestanden`);
  if (failed.length) { console.log("FEHLGESCHLAGEN:"); failed.forEach((f) => console.log(" - " + f.name + (f.detail ? ": " + f.detail : ""))); }
  return failed.length;
}

module.exports = { BASE, loadState, saveState, check, newSession, summary, SHOTS };

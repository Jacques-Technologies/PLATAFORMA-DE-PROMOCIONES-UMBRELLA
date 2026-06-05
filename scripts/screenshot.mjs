// Screenshots de la app live para comparar con el .pen
// Uso: node scripts/screenshot.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const CHROME = "/home/daniel/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const BASE = process.env.BASE_URL ?? "https://que-pollo-jtech.web.app";
const EMAIL = process.env.ADMIN_EMAIL ?? "daniel@jtech.mx";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "QuePolloc5a8128d!";

mkdirSync("/tmp/que-pollo-shots", { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const page = await ctx.newPage();

console.log("→ /login");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/que-pollo-shots/01-login.png" });

console.log("→ /forgot-password");
await page.goto(`${BASE}/forgot-password`, { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/que-pollo-shots/02-forgot.png" });

console.log("→ /login → fill + submit");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASSWORD);
await page.getByRole("button", { name: /iniciar sesi/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 }).catch(() => {});
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "/tmp/que-pollo-shots/03-listado.png", fullPage: false });

console.log("→ click Ver detalle");
const verBtn = page.getByRole("button", { name: /ver detalle/i }).first();
if (await verBtn.count()) {
  await verBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/que-pollo-shots/04-detalle.png" });
}

await browser.close();
console.log("✓ Screenshots in /tmp/que-pollo-shots");

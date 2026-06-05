// Probar el flujo de descarga XLS desde el browser
import { chromium } from "playwright-core";
const CHROME = "/home/daniel/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome";
const BASE = "https://que-pollo-jtech.web.app";
const EMAIL = "daniel@jtech.mx";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "QuePolloa53fc6c1!";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 800 },
  acceptDownloads: true,
});
const page = await ctx.newPage();

page.on("console", (msg) => console.log(`[browser ${msg.type()}]`, msg.text()));
page.on("pageerror", (err) => console.log("[browser pageerror]", err.message));

console.log("→ login");
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASSWORD);
await page.getByRole("button", { name: /iniciar sesi/i }).click();
await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 15000 });
await page.waitForLoadState("networkidle");

// Capturar las request a la function callable
page.on("request", (req) => {
  if (req.url().includes("export_registros_xls") || req.url().includes("cloudfunctions") || req.url().includes("run.app")) {
    console.log("[req]", req.method(), req.url());
  }
});
page.on("response", async (res) => {
  if (res.url().includes("export_registros_xls") || res.url().includes("cloudfunctions") || res.url().includes("run.app")) {
    const body = await res.text().catch(() => "(no body)");
    console.log("[res]", res.status(), body.length, "bytes");
    try {
      const json = JSON.parse(body);
      const url = json?.result?.url;
      console.log("URL:", url);
      if (url) {
        const dl = await fetch(url);
        console.log("download status:", dl.status, "ctype:", dl.headers.get("content-type"));
      }
    } catch {}
  }
});

console.log("→ click Descargar XLS");
const popupPromise = page.waitForEvent("popup", { timeout: 15000 }).catch(() => null);
await page.getByRole("button", { name: /descargar xls/i }).click();
const popup = await popupPromise;
if (popup) {
  console.log("popup url:", popup.url());
  await popup.close();
}
await page.waitForTimeout(3000);

await browser.close();

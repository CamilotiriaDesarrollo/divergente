/* Captura los 3 demos de /metodologias en varios puntos del scroll.
   Uso: node .demo-shots/shoot.js  */
const puppeteer = require("puppeteer-core");
const path = require("path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = __dirname;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.log("CONSOLE ERROR:", m.text());
  });

  await page.goto("http://localhost:3001/metodologias", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 3500)); // hidratación + fuentes

  const info = await page.evaluate(() => {
    const c = document.querySelector("[data-scroll-container]");
    if (!c) return { error: "no scroll container" };
    const wraps = [...document.querySelectorAll(".demo-wrap")].map((w) => {
      const r = w.getBoundingClientRect();
      return { top: r.top + c.scrollTop, height: r.height };
    });
    return { scrollHeight: c.scrollHeight, wraps };
  });
  console.log(JSON.stringify(info, null, 2));
  if (info.error || !info.wraps.length) {
    await browser.close();
    process.exit(1);
  }

  const shots = [];
  for (let d = 0; d < info.wraps.length; d++) {
    const { top, height } = info.wraps[d];
    const span = height - 900;
    for (const frac of [0.05, 0.5, 0.95]) {
      const y = Math.round(top + span * frac);
      await page.evaluate((yy) => {
        document.querySelector("[data-scroll-container]").scrollTop = yy;
      }, y);
      await new Promise((r) => setTimeout(r, 600));
      const name = `demo${d + 1}-p${Math.round(frac * 100)}.png`;
      await page.screenshot({ path: path.join(OUT, name) });
      shots.push(name);
      console.log("shot:", name, "scrollTop:", y);
    }
  }
  await browser.close();
  console.log("DONE", shots.join(", "));
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});

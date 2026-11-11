// Checks the header in both states: over the hero, and scrolled past it.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024], [393, 852]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.shots/state-${w}-top.png` });
  // Temporary spacer so the page can scroll past the hero (test only).
  await page.evaluate(() => { const d = document.createElement('div'); d.style.height = '2000px'; document.querySelector('main').append(d); });
  await page.evaluate(() => window.scrollTo(0, document.getElementById('hero').offsetHeight + 50));
  await page.waitForTimeout(300);
  const v = await page.$eval('header', (e) => e.dataset.variant);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await page.screenshot({ path: `.shots/state-${w}-scrolled.png`, clip: { x: 0, y: 0, width: w, height: 120 } });
  console.log(w, 'scrolled header =', v, '| horizontal overflow =', overflow);
  await page.close();
}
await browser.close();

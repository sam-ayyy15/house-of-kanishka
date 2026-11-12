// Measures the login page's red script and photo in Sign in vs Create account.
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w, h] of [[1440, 900], [1440, 760], [1280, 1000]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);
  const box = () => p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top + scrollY, b.width, b.height].map(Math.round).join(','); };
    return { script: r('[class*="script"]'), photo: r('[class*="photo"]') };
  });
  const signin = await box();
  await p.getByRole('button', { name: /create account/i }).first().click();
  await p.waitForTimeout(800);
  const create = await box();
  await p.screenshot({ path: `.shots/login-create-${w}x${h}.png`, fullPage: true });
  await p.getByRole('button', { name: /^sign in$/i }).first().click();
  await p.waitForTimeout(800);
  const back = await box();
  console.log(`${w}x${h}`, 'same in Create:', JSON.stringify(signin) === JSON.stringify(create), 'same after back:', JSON.stringify(signin) === JSON.stringify(back));
  console.log('   signin', JSON.stringify(signin));
  console.log('   create', JSON.stringify(create));
  await p.close();
}
await b.close();

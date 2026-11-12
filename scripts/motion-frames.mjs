// Captures pairs of frames of the animated homepage sections, to confirm they move.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: 'header{visibility:hidden!important}' });
const go = async (sel) => { await page.evaluate((s) => document.querySelector(s).scrollIntoView({ behavior: 'instant', block: 'center' }), sel); };
// Who We Are
await go('section[aria-labelledby="who-we-are-title"] [data-loop]');
await page.waitForTimeout(700);
const who = page.locator('section[aria-labelledby="who-we-are-title"] [data-loop]');
await who.screenshot({ path: '.shots/mf-who-a.png' });
await page.waitForTimeout(1800);
await who.screenshot({ path: '.shots/mf-who-b.png' });
console.log('satin filter:', await page.evaluate(() => { const r = document.querySelector('img[aria-hidden="true"][class*=ripple]'); return r ? getComputedStyle(r).filter + ' display=' + getComputedStyle(r).display : 'missing'; }));
// Accessories
const acc = page.locator('section[aria-labelledby="accessories-title"]');
await go('section[aria-labelledby="accessories-title"]');
await page.waitForTimeout(1500);
const rot = () => page.evaluate(() => [...document.querySelectorAll('section[aria-labelledby="accessories-title"] li[data-n]')].map((e) => getComputedStyle(e).rotate).join(' '));
const r1 = await rot(); await acc.screenshot({ path: '.shots/mf-acc-a.png' });
await page.waitForTimeout(3500);
const r2 = await rot();
console.log('accessories rotate:', r1, '->', r2);
await page.hover('section[aria-labelledby="accessories-title"] a[data-n="06"]');
await page.waitForTimeout(700);
await acc.screenshot({ path: '.shots/mf-acc-hover.png' });
await page.mouse.move(5, 5);
// Newsletter: mid-reveal and at rest
await page.evaluate(() => document.querySelector('section[aria-labelledby="newsletter-title"]').scrollIntoView({ behavior: 'instant', block: 'center' }));
const nl = page.locator('section[aria-labelledby="newsletter-title"]');
await page.waitForTimeout(380);
await nl.screenshot({ path: '.shots/mf-nl-a.png' });
await page.waitForTimeout(2600);
await nl.screenshot({ path: '.shots/mf-nl-b.png' });
await page.hover('section[aria-labelledby="newsletter-title"] button');
await page.waitForTimeout(600);
await page.locator('section[aria-labelledby="newsletter-title"] form').screenshot({ path: '.shots/mf-nl-btn.png' });
console.log('overflow:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'errors:', errors.length ? errors : 'none');
await browser.close();

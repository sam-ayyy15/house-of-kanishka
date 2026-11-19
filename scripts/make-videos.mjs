// Prepares the client's two films (reference/images/v1.MP4 and v2.MP4, H.264) for the site.
//
//   npm run videos
//
// For each film: the original MP4 is copied to public/media (every browser plays H.264) and a
// poster is made from its first frame.
//
// The site no longer ships a WebM. The WebMs this script used to write were frozen (the
// canvas frame grab returned the same picture every time), and Chrome, Edge and Firefox
// choose WebM first, so visitors saw a still image. Don't reintroduce one without checking
// that its frames actually change.
//
// No system ffmpeg needed: Chrome decodes the films and sharp writes the images.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';

const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome';
const OUT = 'public/media';
const ORIGIN = 'http://films.local';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
// Serve the films from one made-up origin, so their frames can be read back from a canvas.
await page.route(`${ORIGIN}/**`, (route) => {
  const name = new URL(route.request().url()).pathname.slice(1);
  if (!name) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>films</title>' });
  return route.fulfill({ contentType: 'video/mp4', body: readFileSync(`reference/images/${name}`) });
});
await page.goto(`${ORIGIN}/`);

/** Opens a film in the page and works out its frame rate from a short stretch of playback. */
async function open(file) {
  return page.evaluate(async (file) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.src = `/${file}`;
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve;
      video.onerror = () => reject(new Error(`cannot decode ${file}: ${video.error?.message}`));
    });
    const times = [];
    await new Promise((resolve) => {
      const onFrame = (_now, meta) => {
        times.push(meta.mediaTime);
        if (times.length < 30 && !video.ended) video.requestVideoFrameCallback(onFrame);
        else resolve();
      };
      video.requestVideoFrameCallback(onFrame);
      video.play();
    });
    video.pause();
    const steps = times.slice(1).map((t, i) => t - times[i]).filter((d) => d > 0).sort((a, b) => a - b);
    const fps = Math.round(1 / steps[steps.length >> 1]);
    window.film = video;
    return { width: video.videoWidth, height: video.videoHeight, duration: video.duration, fps };
  }, file);
}

/** Frame i of the open film, as PNG bytes. */
async function frame(i, fps) {
  const data = await page.evaluate(
    async ([i, fps]) => {
      const video = window.film;
      await new Promise((resolve) => {
        video.onseeked = resolve;
        video.currentTime = (i + 0.5) / fps; // the middle of the frame, never a boundary
      });
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      return canvas.toDataURL('image/png');
    },
    [i, fps],
  );
  return Buffer.from(data.split(',')[1], 'base64');
}

// ---------- MP4 + poster for each film ----------
for (const [file, name] of [['v1.MP4', 'campaign'], ['v2.MP4', 'promo']]) {
  const film = await open(file);
  const png = await frame(0, film.fps);
  await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/${name}-poster.jpg`);
  copyFileSync(`reference/images/${file}`, `${OUT}/${name}.mp4`);
  console.log(`${name}: ${film.width}x${film.height}, ${film.duration.toFixed(1)} s at ${film.fps} fps`);
}

await browser.close();

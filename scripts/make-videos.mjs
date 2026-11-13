// Prepares the client's two films (reference/images/v1.MP4 and v2.MP4, H.264) for the site.
//
//   npm run videos
//
// For each film: a light WebM (the originals are 9–11 MB for 4 s), the original MP4 as the
// fallback for browsers without WebM, and a poster (first frame).
//
// No system ffmpeg needed: Chrome decodes the films, sharp writes the images, and
// Playwright's bundled ffmpeg (VP8 only, fed JPEG frames) writes the WebM.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome';
const FFMPEG = process.env.FFMPEG ?? `${homedir()}/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux`;
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

// ---------- Light WebM + MP4 fallback + poster for each film ----------
for (const [file, name] of [['v1.MP4', 'campaign'], ['v2.MP4', 'promo']]) {
  const film = await open(file);
  const count = Math.floor(film.duration * film.fps);
  const ffmpeg = spawn(
    FFMPEG,
    ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(film.fps), '-i', 'pipe:0',
      '-c:v', 'libvpx', '-b:v', '2600k', '-quality', 'good', '-cpu-used', '1', '-auto-alt-ref', '0', '-an', `${OUT}/${name}.webm`],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  for (let i = 0; i < count; i++) {
    const png = await frame(i, film.fps);
    const jpeg = await sharp(png).jpeg({ quality: 96, chromaSubsampling: '4:4:4' }).toBuffer();
    if (!ffmpeg.stdin.write(jpeg)) await new Promise((resolve) => ffmpeg.stdin.once('drain', resolve));
    if (i === 0) await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toFile(`${OUT}/${name}-poster.jpg`);
  }
  ffmpeg.stdin.end();
  await new Promise((resolve) => ffmpeg.on('close', resolve));
  copyFileSync(`reference/images/${file}`, `${OUT}/${name}.mp4`);
  console.log(`${name}: ${count} frames at ${film.fps} fps, ${film.width}x${film.height}`);
}

await browser.close();

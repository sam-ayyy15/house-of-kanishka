// LOCAL-ONLY placeholder for the campaign video (A02): a slow Ken Burns zoom over the
// campaign still that eases in and back out, so the loop is seamless. Output is git-ignored.
// Uses Playwright's bundled ffmpeg, which only takes piped JPEG frames and writes VP8/WebM.
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';

const FFMPEG = process.env.FFMPEG ?? `${homedir()}/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux`;
const W = 1280, H = 800, FPS = 24, SECONDS = 6;
const src = sharp('public/placeholders/campaign.jpg');
const { width: sw, height: sh } = await src.metadata();
const srcBuf = await src.toBuffer();

const ff = spawn(FFMPEG, [
  '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', 'pipe:0',
  '-c:v', 'libvpx', '-b:v', '1500k', '-auto-alt-ref', '0', '-an', 'public/placeholders/campaign-loop.webm',
], { stdio: ['pipe', 'inherit', 'inherit'] });

const frames = FPS * SECONDS;
for (let i = 0; i < frames; i++) {
  const t = (1 - Math.cos((2 * Math.PI * i) / frames)) / 2; // 0 → 1 → 0, eased
  const zoom = 1 + 0.08 * t;
  const cw = Math.round(sw / zoom), ch = Math.round(sh / zoom);
  const left = Math.round((sw - cw) * (0.5 + 0.15 * t)), top = Math.round((sh - ch) * 0.4);
  const frame = await sharp(srcBuf).extract({ left, top, width: cw, height: ch })
    .resize(W, H, { fit: 'cover' }).jpeg({ quality: 92 }).toBuffer();
  if (!ff.stdin.write(frame)) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('wrote campaign-loop.webm');

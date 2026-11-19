import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { delhiveryReachable } from '@/lib/delhivery';
import { syncDelhivery } from '@/lib/delhivery-sync';

/**
 * The Delhivery tracking sync (lib/delhivery-sync.ts), called every 2 hours by
 * .github/workflows/delhivery-sync.yml with `Authorization: Bearer <CRON_SECRET>`.
 * Anyone without the secret gets 401; nothing about orders is ever returned, only counts.
 */
export const maxDuration = 120;

const digest = (s: string) => createHash('sha256').update(s).digest();

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return new Response('CRON_SECRET not set', { status: 503 });
  const given = req.headers.get('authorization') ?? '';
  // Compared as hashes so the check takes the same time whatever was sent.
  if (!timingSafeEqual(digest(given), digest(`Bearer ${secret}`))) return new Response('Unauthorized', { status: 401 });
  if (!delhiveryReachable) return Response.json({ skipped: 'Delhivery is not set up' });

  const result = await syncDelhivery();
  return Response.json(result);
}

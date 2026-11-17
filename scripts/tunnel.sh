#!/usr/bin/env bash
# Opens a temporary public address for the local site, so webhooks (Clerk, Razorpay, Shiprocket)
# can reach this computer while testing. Start `npm run dev` first, then `npm run tunnel`.
# The address changes every run: paste the new one into each service's webhook settings.
set -euo pipefail
PORT="${PORT:-3000}"
exec cloudflared tunnel --url "http://localhost:${PORT}"

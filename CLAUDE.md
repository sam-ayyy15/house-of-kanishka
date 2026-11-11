# Project: Vivienne Rôse website rebuild

## Source of truth
- `VIVIENNE_ROSE_WEBSITE_SPECIFICATION.md` is the blueprint. Read it before building anything.
- Every value in it is tagged:
  - [C] Confirmed: follow it exactly.
  - [E] Estimate: start from it, then tune it by comparing against the reference images.
  - [D] Described only: a doc-only feature. Do NOT build it unless asked.
  - [M] Missing: ask before inventing anything.
- Do not add features, animations or creative changes that the spec doesn't evidence.

## Reference images (`reference/`)
- `reference/screenshots/`: the 4 original mockups (PDP, PLP, mobile, homepage). These are the most accurate references for layout, colour and type.
- `reference/video-frames/`: one still per homepage section, taken from the promo reel, numbered in page order (01 hero … 08 newsletter).
  - The fisheye warp, red tile wall and camera moves belong to the promo video only. Never reproduce them.
  - Look at the CENTRE tile of each frame. The tiles around it are neighbouring sections.
  - `03b-campaign-motion-sequence.jpg` shows that the campaign background is a moving video loop.
- `reference/DESCRIPTION_OF_VIVIENNE_ROSE.txt`: the agency's case-study text. Features listed there are mostly [D].
- When checking work, screenshot the page at 1440 px and 393 px wide and compare it with the matching reference image.

## Assets
- The photos and video belong to someone else. Use them only as local placeholders and never ship them.
- Keep placeholder images at the same aspect ratio and background treatment the spec lists in section 11.

## Stack
- Next.js (App Router) + React. Use CSS custom properties from spec section 12.2.
- Square corners everywhere. Brand red is #A20F15.

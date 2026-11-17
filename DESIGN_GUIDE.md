# House of Kanishka – Design Guide for new frontend

A summary of how the finished site looks and moves, taken from the code (`app/globals.css`, `app/fonts.ts`,
`components/**`). **Every new screen built during the backend phases must follow it**: policy
pages, checkout states, the invoice, tracking, the account area, the admin area, forms and emails.

The spec is still the source of truth for existing pages. This guide covers new pages and features
the spec doesn't describe. Copy the patterns already used on the site, and only invent something
new when nothing here fits.

---

## 1. Colour (tokens in `app/globals.css :root`)

| Token | Value | Use |
|---|---|---|
| `--vr-red` | `#A20F15` | Brand red: primary action (`.btn-red`), red sections (Help hero), loading/progress lines, the free-shipping bar, `::selection`, the text cursor, errors |
| script red (literal) | `#D10000` | **Only** for the house script lettering ("Who we are", "Welcome to the house", the intro name). Not a UI colour |
| `--vr-black` | `#000` | Text, `.btn-black`, the lotus on white |
| `--vr-white` | `#FFF` | Page background (always set explicitly) |
| `--vr-grey-tile` | `#F7F7F7` | Product tiles, skeleton tiles, outline-button hover |
| `--vr-grey-blob` | `#F7F6F9` | Soft editorial blobs behind content |
| `--vr-grey-oval` | `#F3F3F3` | Oval backgrounds |
| `--vr-text-muted` | `#767676` | Secondary text, placeholders, inactive tabs (4.5:1 contrast) |
| `--vr-border` | `#E6E6E6` | 1 px hairlines: inputs, row dividers, progress-bar tracks |

Rules: no new colours, no gradients in the UI (the only exceptions are the soft radial pool behind text on
the error cloth and the mask edges of the pen and wipe effects), **no shadows**, **square corners everywhere**
(`border-radius: 0` is applied to every element). Hover darkening: black → `#262626`,
red → `color-mix(in srgb, var(--vr-red) 86%, black)`. There is no dark theme.

## 2. Typography (`app/fonts.ts`, all placeholders until licensed fonts arrive)

| Role | Font (variable) | Where |
|---|---|---|
| Display serif | Instrument Serif 400 + true italic (`--font-serif`) | Page titles, section and row titles, statements, logo, big numbers |
| Hero italic | Playfair Display italic 500 (`--font-hero-italic`) | Only the hero word "rose" |
| Script | Mrs Saint Delafield (`--font-script`) | Short decorative phrases, always tilted (−3° to −9°), usually in script red, positioned so they overlap a photo or edge |
| UI sans | Inter (`--font-sans`) | Everything functional: nav, labels, buttons, body, prices |

Type scale actually used:
- **Page title** `.page-title`: serif `clamp(34px, 4.6vw, 66px)`, line-height 1.1, `text-wrap: balance`, rises in on load.
- **Hero heading** (red pages): serif `clamp(40px, 6.4vw, 92px)`, line-height 1.05, italic for the emphasised words.
- **Row title** (Help and Account pattern): serif `clamp(32px, 3.8vw, 54px)`, line-height 1.05, preceded by a small italic index such as `(01)` at 0.38em, raised.
- **Overlay title**: serif `clamp(22px, 2.4vw, 36px)`.
- **Eyebrow** `<Eyebrow>`: sans 14px, weight 500, uppercase, letter-spacing +0.05em.
- **Nav**: sans 15px, weight 500, uppercase, +0.04em.
- **Button** `.btn`: sans 15px, weight 500, uppercase, +0.06em, height 48px.
- **Field label** `.field > span`: sans 12px, weight 500, uppercase, +0.05em. **Input text 16px** (keeps iOS from zooming in).
- **Underline link** `<UnderlineLink>`: sans 16px, weight 500, uppercase, +0.08em, 1 px line 7 px below. `.text-link` is the 13px version.
- **Body**: 13px / 1.5 base. Reading text is 15px / 1.6 (account and help bodies, ledes).
- **Product name / price**: sans 16px (12px on mobile), +0.02em.
- **Script sizes**: about 54–150px, line-height 0.75–1.
- Prices always use `formatPrice()` (`lib/format.ts`): `₹8,100`, with Indian digit grouping and `INR` where a currency code is needed.

Voice: uppercase sans for anything you act on; serif for anything you read as a heading; italic serif
for the emotional half of a sentence; script only for a short flourish of 1–4 words.

## 3. Layout

- Side padding `--pad-x: clamp(20px, 4vw, 64px)`. Header padding `--header-pad-x`. Gutter `--gutter`.
- Header height `--header-h`: 80px, or 56px at 1023px and below (the mobile header is also used on tablet portrait).
- Vertical section padding `--section-py: clamp(64px, 8vw, 120px)`.
- Plain pages: `<main className="page">` (top padding clears the fixed header, `min-height` 80vh).
- Breakpoint for the stacked layout: `max-width: 1023px`. Check every page at **1440px and 393px**.
- Generous white space. Content columns are narrow (`max-width` about 420–560px for forms and reading text).

### Page patterns to reuse
1. **Numbered rows** (Help, Account): each row is a grid of `5fr / 6fr` columns with a 1 px top border and 56px padding.
   Serif title with an italic `(0n)` index on the left, content on the right. **Use this for policy pages, account sections, order details and admin settings.**
2. **Split auth layout** (`AuthView.module.css`): a sticky portrait with a red script phrase hanging off its
   lower edge on the left, one form at a time (max 420px) on the right. The photo is hidden below 1024px.
3. **Red hero with giant travelling type** (Help): a `--vr-red` section, giant black uppercase serif text
   rotated −17° drifting slowly, white serif heading. Use it for big moments such as the order-confirmed
   background or the coming-soon accessories teaser.
4. **Cloth stage** (404, error and offline pages): a satin backdrop, white lotus, white script, serif title, white button.
   **Use it for every error or not-found state, including the hidden admin area's 404.**
5. **Soft blob and script watermark**: a `--vr-grey-blob` shape and a huge faint script word behind content.
6. **Drawer** (`<Drawer>`): a full-height white side panel up to 480px wide, a 32% black backdrop, sliding in over 400ms
   and out over 300ms. **Use it for admin edit panels, quick actions and mobile account navigation.**
7. **Skeletons** (`components/skeleton`): grey tiles that pulse gently in opacity, a faint lotus in each image tile,
   and a 1 px red line travelling under the header. Every new route that loads data gets a `loading.tsx` in this style.

## 4. Components to reuse

| Need | Use |
|---|---|
| Label above a heading | `<Eyebrow>` |
| Primary or secondary action | `.btn .btn-red` (main action, e.g. pay or place order), `.btn .btn-black`, `.btn .btn-outline`; `.btn-split` for label + price |
| Link-style action | `<UnderlineLink>` / `.text-link` |
| Form field | `<label className="field"><span>Label</span><input/></label>`; two fields side by side → a `.two` grid |
| Inline result message | `<p className="status" role="status">` with space reserved (`min-height`), so nothing jumps when it appears; errors in `--vr-red` |
| Secondary text | `.muted` |
| Side panel | `<Drawer>` |
| Breadcrumb trail | `<Breadcrumbs>` |
| Brand mark and success moments | `<Emblem bloom="load" \| "view" \| "none">` |
| Script flourish | `<Handwriting text="…">` inside `data-write="load"` or `data-reveal="write"` |
| Headline entrance | `<RiseWords text="…">` inside `data-rise="load"` or `data-reveal="words"` |
| Progress | The `FreeShippingBar` design: 2px `--vr-border` track with a `--vr-red` fill that grows with `scaleX` over 900ms |
| Icons | `lucide-react` with thin strokes, as in `components/icons.tsx`. No emoji |
| Focus | Keep the global `:focus-visible` 1 px outline in the current text colour |

## 5. Motion vocabulary (globals.css "Motion" and "Motion layer 2")

Tokens: `--ease-out: cubic-bezier(0.22,1,0.36,1)` (default), `--ease-in-out: cubic-bezier(0.65,0,0.35,1)`,
`--dur-fast 200ms` (hover), `--dur-base 400ms` (drawers, tabs, forms), `--dur-slow 800ms` (reveals),
`--stagger 80ms`. The big curtain-style transitions use `cubic-bezier(0.76,0,0.24,1)`. The pen effect uses
`cubic-bezier(0.37,0,0.63,1)`.

| Effect | How to trigger it | Feel |
|---|---|---|
| Rise | `data-reveal="rise"` (scroll) / `animation: vr-rise` (load) | opacity 0→1, 16px up, 800ms |
| Fade | `data-reveal="fade"` / `vr-fade` | opacity only |
| Word rise | `data-reveal="words"` / `data-rise="load"` + `<RiseWords>` | each word slides out of its own mask, 900ms, 45ms between words |
| Curtain | `data-reveal="curtain"` on a positioned photo wrapper | a page-coloured cover lifts (1100ms) while the photo settles from 1.12× scale (1700ms) |
| Settle | `data-reveal="settle"` | a full-width photo eases back from 1.08× over 2400ms |
| Handwriting | `data-write="load"` / `data-reveal="write"` + `<Handwriting>` | each letter is uncovered by a slanted pen edge with a brief wet-ink blur, 95ms between letters |
| Lotus unfold | `<Emblem bloom delay>` | unfolds from a closed bud: grows from small while its petals fan out from the heart, inner petals first, 2600ms (`components/emblem-unfold.ts`). The whole drawing moves as one, so lines never part or cross. Never animate the petals separately |
| Parallax | `data-parallax` (CSS scroll timeline) | ±4%, never more than 10% |
| Underline redraw | `<UnderlineLink>` hover | the line retracts to the right, then redraws from the left, 600ms |
| Button press | `.btn:active` | scale 0.985, instant |
| Page change | View Transitions | old page fades out over 220ms, new page rises 12px over 520ms; the header stays still |
| Loops | `data-loop` | only run while on screen (RevealObserver) |

Rules (from the luxury-motion-system skill and the code):
- Animate **only transform, opacity and masks**. No bounce, elastic, spin or shake. Rises are 24px at most.
- Content is visible without JavaScript. RevealObserver only hides content still **below the fold**, and each
  element animates **once**. Nothing replays when scrolling back.
- `prefers-reduced-motion: reduce` turns every animation and transition off globally. New code must not work around this.
- Prefer CSS. Add JavaScript animation only for sequences CSS can't do (and never load two animation libraries).
- Use IntersectionObserver, never scroll listeners. Delays use `--reveal-delay` / `--rise-delay` / `--write-delay`, and the `delay` prop of `<Emblem>`.
- Layered timing for every entrance: eyebrow → title (+80–100ms) → body → actions.
- Big sequences can be skipped by a click (like the intro) and play once per visit.
- Signature moments are already defined, so reuse them rather than inventing new ones:
  - **lotus bloom** for "working / success"
  - **handwritten script** for warmth ("Thank you", "Welcome back")
  - **red hairline** for progress or loading
  - **split screen opening** (intro) for a big reveal

## 6. Recipes for the planned screens

- **Policy pages (Phase 0)**: `.page` + `.page-title` rising in + numbered rows; the body text rises in as you scroll;
  a sticky contents list whose current item is marked by the red hairline.
- **Forms (Phase 2, everywhere)**: the `.field` design. On focus the border goes black and a 1 px red line draws
  under the field (scaleX, `--dur-base`). Errors slide down into the reserved status space, in red, with no shaking.
  While submitting, the button label is replaced by a small `<Emblem bloom="load">`. Success shows a lotus bloom
  and a `<Handwriting>` thank-you line, like the newsletter thanks.
- **Sign-in success**: the form fades out, then a centred lotus blooms and "Welcome back" is written in script red, then the next page opens.
- **Account area**: numbered rows. Desktop has a left column of serif section links, mobile has a scrollable row of
  tabs (like the listing pages). The red hairline slides under the current section.
- **Checkout states**: the steps fold into a one-line summary with a rise and fade. Before Razorpay opens, a white veil
  fades in over the page with a centred lotus. "Confirming payment" keeps the lotus blooming in a loop at low opacity.
  Failure uses calm serif copy with an outline retry button, never a red alarm screen.
- **Invoice / confirmation**: a white paper sheet on a light grey (`--vr-grey-tile`) stage, or on the red hero
  pattern for extra drama. The lines appear with the `rise` stagger (80ms), the totals count up, the total is written with
  `<Handwriting>`, and the stamp is `<Emblem>` in `--vr-red` with a small scale-settle.
- **Tracking timeline**: a 1 px vertical `--vr-border` track and a red fill that grows (scaleY) to the current
  stage. Each stage title is serif with a small lotus as its marker, blooming in as the line reaches it.
- **Coming-soon accessories**: the current section layout, with the prices and buttons replaced by "coming soon"
  in serif italic, a `<Handwriting>` flourish, and the newsletter-style email field and lotus.
- **Admin**: the same tokens and type. A denser layout (body 13px, numbered rows for settings, simple tables
  with 1 px dividers). `<Drawer>` for editing. Rows rise in one after another, numbers count up, and saving shows a lotus bloom
  instead of a toast. Every animation stays under 400ms and can be interrupted.
- **Emails and the PDF bill**: white background, serif headings, sans uppercase labels, a `--vr-red` accent,
  the lotus at the top, square edges. The fonts are embedded in the PDF. Emails fall back to system serif and sans.

## 7. Done checklist for any new frontend

- [ ] Only tokens from §1. Square corners. No shadows. Fonts from §2.
- [ ] Reuses a page pattern (§3) and components (§4) wherever possible.
- [ ] Motion only from §5: transform, opacity and masks; layered timing; plays once; can be skipped.
- [ ] Reduced motion shows the finished state with nothing moving.
- [ ] A loading skeleton and error states in the house style. The 404 uses the cloth stage.
- [ ] Screenshots at 1440px and 393px, no horizontal scroll, input text ≥ 16px on mobile.
- [ ] Keyboard focus visible, `role="status"` for messages, script phrases have a readable text version.
- [ ] The user is told which animations were added and where.

## 8. Added during the backend phases (use these, don't rebuild them)

- **Form pieces** (`components/form`): `<Field>`, `<TextAreaField>`, `<SelectField>`, `<SubmitButton>` (lotus while busy),
  `<FormStatus>` (message eases down), `<FormThanks>` (lotus + script), and `keepValues(action)` so a form keeps what
  was typed when the server answers with an error.
- **House controls** (globals.css): selects are square with a thin chevron (`.field select` or `select.house`); checkboxes
  inside `.check` and radios with `className="house"` are 18px hairline squares that fill with a black square when chosen.
- **`<CountUp>`**: amounts and counts that count up once (`plain` for a bare number).
- **`<AccountNav sections label>`**: serif section links with the sliding red hairline (account and admin).
- **Skeletons**: `SectionSkeleton` for pages inside the account/admin shell, `PageSkeleton` for standalone pages.
- **Finished step**: a small red lotus opens beside the title (checkout). **Open/closed row**: a plus whose upright stroke
  folds away (account orders).
- **Printing**: mark site chrome with `data-chrome`; it is hidden in print so a bill prints alone.
- **Decorative side panel**: grey blob + lotus + two-line script hanging off its edge (`/track`), hidden below 1024px.

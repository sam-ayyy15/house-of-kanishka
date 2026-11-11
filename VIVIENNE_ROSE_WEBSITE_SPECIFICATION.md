# VIVIENNE RÔSE — Website Reverse-Engineering Specification

**Version:** 1.0 · **Date:** 11 Nov 2026 · **Status:** Blueprint only (nothing built yet)

**Sources analysed**

| ID | Source | What it shows |
|----|--------|---------------|
| **V** | `ymozciwa4vz7hmpux7fx.mp4`: 1600×1200, 30 fps, 14.4 s, H.264 | A presentation reel: a wall of homepage section tiles on a red background, seen through a fisheye (barrel) lens. The camera snaps from tile to tile. It is **not** a browser screen recording, so there are no real clicks, scrolls or hover states. 72 frames were extracted at 5 fps, plus 10 fps crops of the sections that animate. |
| **S1** | Screenshot "UI Design – Product Page" | Desktop product page (PDP) inside an iPad frame |
| **S2** | Screenshot "Dresses" | Mobile product listing page (PLP), left; desktop PLP, right (cropped on the right edge) |
| **S3** | Screenshot "UI Design – Adaptive Layouts" | Three iPhone screens: mobile hero, mobile New Arrivals, mobile "Golden Hour Paris" collection |
| **S4** | Screenshot (composite) | Desktop homepage. Left strip: Campaign, then Who We Are, then New Collection. Right: Hero, then Our New Arrivals |
| **D** | `DESCRIPTION_OF_VIENNE_ROSE.txt` | Agency case-study text: features, tech stack, claimed results |

**Confidence legend** (used throughout)

- **[C] Confirmed**: directly visible in V or S1–S4.
- **[E] Estimate**: measured or inferred from pixels. Treat it as a starting value and tune it against the reference images.
- **[D] Described only**: stated in the document but not visible in any visual material.
- **[M] Missing**: not present in any source. A decision is needed before building.

> **Measurement method.** Pixel values were taken from the mockups and scaled to a **1440 px desktop** viewport and a **393 px mobile** viewport (the iPhone 14/15 Pro width shown in S3). Mockup screens are small (the S1 tablet screen is about 732 px wide; the S4 homepage half is about 580 px wide), so every px value is **±10–15 %**. Colours were sampled from flat regions of the WebP screenshots by modal value, so expect ±2 per channel from compression.

---

## Table of contents

- [1. Findings at a glance](#1-findings-at-a-glance)
- [2. Design system](#2-design-system)
- [3. Global components](#3-global-components)
- [4. Page: Homepage](#4-page-homepage)
- [5. Page: Product listing (PLP), "Dresses"](#5-page-product-listing-plp-dresses)
- [6. Page: Product detail (PDP)](#6-page-product-detail-pdp)
- [7. Responsive behaviour](#7-responsive-behaviour)
- [8. Motion and interaction inventory](#8-motion-and-interaction-inventory)
- [9. Functionality: described vs evidenced](#9-functionality-described-vs-evidenced)
- [10. Content and copy inventory (verbatim)](#10-content-and-copy-inventory-verbatim)
- [11. Asset inventory](#11-asset-inventory)
- [12. Technical implementation requirements](#12-technical-implementation-requirements)
- [13. Discrepancies, errors and open questions](#13-discrepancies-errors-and-open-questions)
- [Appendix A: Presentation-reel timeline (not site behaviour)](#appendix-a-presentation-reel-timeline-not-site-behaviour)
- [Appendix B: Build checklist](#appendix-b-build-checklist)

---

## 1. Findings at a glance

- **Pages with visual evidence:** Homepage (8 sections), PLP "Dresses" (desktop and mobile), PDP "Carnivorous Rose Blazer" (desktop/tablet). **[C]**
- **Pages with no visual evidence:** cart/shopping bag, checkout, login/account, search, menu overlay, footer, "The Brand" page, accessories listing, size guide, order tracking, wishlist page. **[M]**
- **Visual language:** a pure white canvas, one saturated brand red (`#A20F15`), black type, a high-contrast editorial serif for display, a neutral grotesk for UI labels, and a signature script used as decoration. Products are shown as full-length cut-outs on white or on very light grey. **[C]**
- **Signature devices** **[C]**
  1. Hero lockup: an upright serif "there she", a large italic serif "*rose*" and a script signature "jamilie sea" underneath.
  2. Script overlays in brand red that sit across the edge of a photo ("Looking for our stories").
  3. A **double-ellipse photo mask** (two overlapping ovals) on red, with giant black serif letters behind it ("NEW COLLECTION").
  4. Small numbered italic labels "(01)–(06)" in the Accessories section.
  5. Small uppercase sans "eyebrow" labels above every headline.
- **Section page order (homepage):** inferred from the reel sequence and confirmed in part by S4. Hero, New Arrivals, Campaign, Who We Are, New Collection, Accessories, Promo + Services, Newsletter, then Footer **[M]**.

---

## 2. Design system

### 2.1 Colour tokens

| Token | Hex | Where observed | Confidence |
|---|---|---|---|
| `--vr-red` | `#A20F15` | ADD TO CART button (S1); "Golden Hour Paris" section background (S3, S4); presentation backdrop | **[C]** sampled; the modal value is identical across 4 sources |
| `--vr-red-script` | `#A20F15` (sampled darkest red in script ≈ `#A91313`) | "Looking for our stories" script | **[E]**: anti-aliasing makes it read lighter. Use the brand red. |
| `--vr-black` | `#000000` | Headlines, nav, logo, PDP title on white | **[C]** |
| `--vr-near-black` | `#060606` | Darkest areas of the hero photo (part of the photo, not a CSS colour) | **[C]** (photo) |
| `--vr-white` | `#FFFFFF` | Page canvas, product rows | **[C]** |
| `--vr-grey-tile` | `#F7F7F7` | PDP image tile backgrounds (S1) | **[C]** |
| `--vr-grey-blob` | `#F7F6F9` | Soft blob behind "Add the perfect touch to your look" (S2) | **[C]** |
| `--vr-grey-oval` | `#F3F3F3` | Oval behind "Ball Earrings" product (S4) | **[C]** |
| `--vr-grey-photo` | `#F2F4F5` | Studio background of the "Halter Long Dress" photo (S4) | **[C]** (photo) |
| `--vr-warm-grey` | `#E1D9D5` | Studio background inside the double-ellipse mask (S3, S4) | **[C]** (photo) |
| `--vr-text-muted` | ≈ `#999999` (sampled `#929292`–`#A4A4A4`) | Inactive tabs: PDP DETAILS / SHIPPING & RETURNS / SIZE GUIDE; PLP MIDI \| MAXI / JUMPSUITS… | **[E]** |
| `--vr-border` | ≈ `#E6E6E6` | Select boxes, newsletter input, heart button outline | **[E]**: the hairlines are too thin to sample reliably |
| `--vr-script-watermark` | ≈ `#E8E8E8` | Faint script watermark behind the PLP editorial block | **[E]** |

No gradients appear in the UI. Shading comes only from photography. **[C]**

### 2.2 Typography

Three families are used. **None of the font names are confirmed.** The candidates below are visual matches to test, not identifications.

| Role | Observed characteristics | Candidate matches to test | Confidence |
|---|---|---|---|
| **Display serif** (logo, headlines, section titles, category list, prices in titles) | High-contrast transitional/didone serif with fine hairlines and a slightly condensed body. It has a **true italic** that is used inline ("*effortlessly complementing your life and style*", "*discover new collections*", "*rose*"). Its "J" descends below the baseline. | Commercial: Ivy Presto Display, Editorial New, Canela Condensed. Free: **Instrument Serif** (closest match for the condensed italic), Gloock, Bodoni Moda (for the hero "rose" italic) | **[E]** |
| **Script** ("Looking for our stories", "jamilie sea", watermark) | Fast monoline-ish signature script with long entry and exit strokes and an exaggerated L/k/f | Commercial: Amalfi Coast, Hello Valentina, Brittany Signature. Free fallback: Mrs Saint Delafield, Monsieur La Doulaise | **[E]** |
| **UI sans** (nav, eyebrows, buttons, product names, prices, body copy) | Neutral neo-grotesk. Labels are uppercase with slightly open tracking; body copy renders like Helvetica/Arial | Helvetica Neue / Arial (system); free: Inter, Arimo | **[E]** |

> **Action:** run a 2× crop of the hero, the newsletter heading and the script through a font identifier, or get the files from the original designer, before building. Font choice is the biggest single risk to visual accuracy.

#### Type scale (desktop 1440 px; mobile 393 px)

| Style | Family | Desktop size / line-height | Mobile | Case / tracking | Where | Conf. |
|---|---|---|---|---|---|---|
| `display-hero-upright` | Serif | ~100–110 px / 0.9 | ~64 px | lowercase | "there she" | **[E]** |
| `display-hero-italic` | Serif italic | ~200–220 px / 0.8; overlaps the line above | ~120 px | lowercase | "rose" | **[E]** |
| `script-hero` | Script | ~36–40 px | ~22 px | lowercase | "jamilie sea", overlapping the bottom-right of "rose" | **[E]** |
| `h1-page` | Serif | ~46–48 px / 1.15 | ~28 px | Title Case | PDP title (3 lines), PLP "Dresses" | **[E]** |
| `h2-section` | Serif | ~44–48 px / 1.1 | ~24 px | Title Case | "Our New Arrivals", "Add the perfect touch to your look" | **[E]** |
| `h2-statement` | Serif + italic run | ~44–48 px / 1.25, centred | n/a [M] | Sentence | Who We Are paragraph | **[E]** |
| `h2-newsletter` | Serif + italic run | ~56–64 px / 1.15, centred | n/a [M] | Sentence | Newsletter heading | **[E]** |
| `h3-overlay` | Serif | ~28–32 px / 1.1, 2 lines | ~28 px | Title Case | "ASH X COS 2025", "Golden Hour Paris", "Season Of Grace", promo headline (~48 px) | **[E]** |
| `category-list` | Serif | ~44 px / 1.1 | n/a [M] | Title Case | Bags, Belts, Scarves… | **[E]** |
| `index-label` | Serif italic | ~40–44 px for item labels "(01)"; ~14 px superscript before category names | n/a [M] | — | Accessories | **[E]** |
| `script-overlay` | Script | ~100–110 px | n/a [M] | Sentence | "Looking for our stories" | **[E]** |
| `logo` | Serif | ~28–30 px | ~20 px | "Vivienne Rôse" | Header centre (desktop), left (mobile) | **[E]** |
| `nav` | Sans | 12–13 px, weight 500 | — | UPPERCASE, +0.04 em | Header links | **[E]** |
| `eyebrow` | Sans | 10–11 px, weight 500 | 12 px | UPPERCASE, +0.05 em | WHO WE ARE, ACCESSORIES, SUBSCRIBE, CAMPAING, NEW COLLECTION, ROSE MOOD | **[E]** |
| `product-name` | Sans | 12 px, weight 500–600 | 11 px | UPPERCASE | "FLOWING HALTER DRESS" | **[E]** |
| `price` | Sans | 12 px, weight 400 | 11 px | "€80,95" (comma decimal) | Under the product name | **[C]** format / **[E]** size |
| `body` | Sans | 13 px / 1.5 | 13 px | Sentence | PDP description, service-card copy (~11 px) | **[E]** |
| `link-underlined` | Sans | 12 px, weight 500 | 12 px | UPPERCASE, 1 px underline offset ~6 px | VIEW ALL, DISCOVER THE COLLECTION, VIEW ACCESSORIES, LEARN MORE, CONTACT US, FILTER | **[C]** style / **[E]** size |
| `button` | Sans | 12–14 px, weight 500 | — | UPPERCASE | ADD TO CART, SUBSCRIBE | **[E]** |

### 2.3 Spacing, grid and layout

| Item | Value | Conf. |
|---|---|---|
| Reference desktop width | 1440 px | **[E]** |
| Horizontal page padding | Measures **~40 px** on the PDP (S1) and **~64 px** on the homepage (S4). Pick one token (e.g. `--pad-x: clamp(20px, 4vw, 64px)`) and check it against both. | **[E]** conflicting |
| Product-image gutter (PDP, PLP) | ~32 px desktop; ~0–8 px mobile 2-up grid (cut-outs float on white, so the gutter is not visible) | **[E]** |
| PDP top area | 2 equal columns (title on the left; info starting at 50 % of the content width) | **[C]** layout / **[E]** exact split |
| Section vertical padding (white sections) | ~100–120 px top and bottom | **[E]** |
| Full-bleed sections (Hero, Campaign, New Collection, Promo) | ≈ 100 vh (aspect ratio ~1.56:1 at desktop; S4 hero ≈ 914 px tall at 1440) | **[E]** |
| Header height | ~80 px desktop, ~56 px mobile | **[E]** |
| Corner radii | **0 everywhere.** Buttons, inputs, tiles and images all have square corners. The only curves are the ellipse and blob shapes. | **[C]** |
| Shadows | None in the UI | **[C]** |
| Borders | 1 px hairlines on inputs, selects and the wishlist button only | **[C]** presence / **[E]** colour |

### 2.4 Iconography **[C]** (style) / **[E]** (exact glyphs)

Icons are thin-stroke outlines (~1.25–1.5 px) and monochrome: black on white surfaces, white on photos and red.

| Icon | Where |
|---|---|
| Menu: two horizontal lines, the lower one shorter (desktop: before "SHOP"; mobile: far right) | Header |
| Shopping bag (rectangular tote outline) | Mobile header |
| Search (magnifier) | Mobile header |
| Heart (filled, brand red) | PDP wishlist button |
| Delivery truck | Promo service: Free Shipping |
| Circular arrows | Promo service: Easy Returns |
| Telephone handset | Promo service: 24/7 Customer Support |
| Chevron-down | PDP size select |
| Solid black dot (colour swatch) | PDP colour select |

Suggested set: Lucide or Phosphor "light" weight. **[E]**

### 2.5 Imagery rules **[C]**

- **Product shots:** full-length model cut-outs on transparent or white backgrounds (PLP, New Arrivals). PDP garments are ghost-mannequin or flat cut-outs centred on `#F7F7F7` tiles.
- **Accessories:** cut-out objects with no background, scattered freely.
- **Editorial/campaign:** full-bleed, warm, high-contrast fashion photography. The campaign section is **motion footage** (see 8.1).
- **Shapes:** ellipse, double-ellipse and soft "cloud/heart" blob containers in light neutral fills.

---

## 3. Global components

### 3.1 Header / navigation

**Desktop (≥ tablet landscape)** **[C]** (S1, S2, S4, V)

```
[≡] SHOP   NEW ARRIVALS   THE BRAND        Vivienne Rôse        SEARCH   LOGIN   SHOPPING BAG (0)
```

- Three zones: left links, logo centred on the viewport, right utility links.
- Left: the menu icon sits immediately before "SHOP" (they read as one trigger), then "NEW ARRIVALS" and "THE BRAND". Link gap ~20–24 px. **[E]**
- Right: "SHOPPING BAG (0)" shows the cart count in brackets, with a single space before the bracket. **[C]**
- **Variant A, transparent over hero:** white text and logo over the hero photo (S4, V). **[C]**
- **Variant B, solid white:** black text on white (S1 PDP, S2 PLP, V newsletter tile). **[C]**
- **Sticky behaviour:** **[E]/[M]**. The white header appears directly above mid-page content in the newsletter tile (V 12.6 s), which suggests either a sticky header that turns solid after the hero or a separate frame. Recommended implementation: sticky, transparent while it overlaps the hero, white after that. Confirm with the client.
- No bottom border visible. **[C]**

**Mobile** **[C]** (S2, S3)

```
Vivienne Rôse                       [bag] [search] [≡]
```

- The logo is left-aligned. Three icons sit on the right with ~20 px gaps.
- Over the hero (S3 left) and over the red collection screen (S3 right), the header is transparent with white logo and icons.
- **PLP variant:** the logo position shows the text "FILTER" instead (S2 mobile). This is either a page-specific header or the logo is replaced by a filter trigger on listing pages. **[C]** observed / intent **[M]**.

**Menu overlay / drawer opened by ≡:** **[M]**. Not shown anywhere.

### 3.2 Footer **[M]**

No footer appears in any source. The Newsletter section is the last observed section. The footer needs a design decision.

### 3.3 Buttons and links

| Component | Spec | Conf. |
|---|---|---|
| **Primary button: red** (ADD TO CART) | Background `--vr-red`; white uppercase sans. **Label left-aligned, price right-aligned in the same button** ("ADD TO CART … €502,00 EUR"). ~377 × 40 px at desktop; padding-x ~12 px; square corners. | **[C]** layout / **[E]** size |
| **Primary button: black** (SUBSCRIBE) | Background `#000`; white uppercase sans; ~187 × 48 px; square; joined to the input with ~10 px gap | **[C]** / **[E]** |
| **Icon button: outline** (wishlist ♥) | 40 × 40 px square, 1 px `--vr-border`, white fill, red filled heart, ~18 px gap from ADD TO CART | **[C]** / **[E]** |
| **Text link: underlined** | Uppercase sans, 1 px underline the full width of the text, sitting ~4–6 px below the baseline. Black on white; white on photos. | **[C]** |
| Hover / focus / active / disabled states | Not shown | **[M]** |

### 3.4 Form controls

| Control | Spec | Conf. |
|---|---|---|
| Select: colour | Box ~330 × 36 px, 1 px border, uppercase value "BLACK" on the left, solid black dot swatch on the right | **[C]** / **[E]** |
| Select: size | Same box, value "XS/34" (letter size + EU size), chevron-down on the right | **[C]** / **[E]** |
| Text input: email | ~400 × 48 px, 1 px border, placeholder "Enter your email address" in grey ~13 px; filled state shown with the value "hello@phenomenon-" | **[C]** / **[E]** |
| Validation and error states | Not shown | **[M]** |

> The small red "•••" badge visible inside the email input in V is almost certainly a **browser password-manager extension overlay**, not part of the design. **Do not reproduce it.** **[E]**

### 3.5 Product card

Two card types are visible.

1. **Cut-out card** (PLP, New Arrivals): image only, on white, no frame. Name and price appear **below** in New Arrivals (S4, V) as `PRODUCT NAME` (uppercase, medium) on one line and `€80,95` under it, left-aligned to the image's left edge (S4) or centred under a featured item (V). **[C]**
2. **Framed card** (New Arrivals 3rd item, S4): photo with its own light-grey studio background (~0.84 aspect, roughly 5:6), with name and price below. **[C]**
3. **Oval card** (accessory in New Arrivals, S4; PLP editorial block, S2): object on a light-grey **ellipse** (~0.72 w:h) or no background; name and price below; smaller scale. **[C]**

PLP cards show **no name or price in the screenshots**. They may sit below the crop or appear on hover. **[M]**

### 3.6 Eyebrow + title overlay block

The block is used on Campaign, New Collection and the mobile collection screen:

```
EYEBROW (sans 10–11 px uppercase)
Title Line One (serif ~28–32 px)
Title Line Two
```

The text is white on photo or red. The eyebrow-to-title gap is ~8–10 px. **[C]** / **[E]**

---

## 4. Page: Homepage

**Section order:** inferred from the reel's camera path (V 0–14.4 s visits the sections in this order and then loops) and confirmed for adjacent pairs in S4. **[E]** high confidence.

| # | Section | Background | Height |
|---|---|---|---|
| 4.1 | Hero "there she rose" | Full-bleed photo (dark) | ≈ 100 vh |
| 4.2 | Our New Arrivals | White | auto |
| 4.3 | Campaign mosaic | Full-bleed **video** | ≈ 100 vh |
| 4.4 | Who We Are | White | auto |
| 4.5 | New Collection: Golden Hour Paris | `--vr-red` | ≈ 100 vh |
| 4.6 | Accessories | White | ≈ 100 vh |
| 4.7 | Promo + Services | Full-bleed photo (red set) | ≈ 100 vh |
| 4.8 | Newsletter | White | ~70 vh |
| 4.9 | Footer | **[M]** | **[M]** |

### 4.1 Hero, "there she rose"

**Evidence:** S3 (mobile), S4 (desktop), V 0.0 s and 14.2 s. **[C]**

- **Background:** full-bleed portrait photo. A woman in a pink/coral tailored jacket with gold hoop earrings, lit dramatically against a near-black background (`#060606`). The subject sits left of centre; the right third is dark.
- **Header:** Variant A (transparent, white).
- **Lockup** (centred horizontally, vertical centre at ~55–60 % of the hero height): **[C]** composition / **[E]** sizes
  - Line 1: "there she" in the upright serif, white, lowercase.
  - Line 2: "*rose*" in the italic serif, white, about twice the size of line 1. It overlaps line 1 slightly (negative leading).
  - Line 3: "jamilie sea" in the script, white, small, overlapping the lower-right of "rose".
  - The lockup is about 30 % of the viewport width on desktop and about 70 % on mobile.
- **CTA:** "DISCOVER THE COLLECTION" underlined text link, white, centred, ~90 % down the hero. **[C]**
- **Mobile (S3):** same photo cropped tighter to the face (`object-position` about 40 % 30 %). The lockup sits in the lower half, slightly right of centre. No CTA is visible in the mobile frame (it may be below the fold). **[C]** / **[M]**
- **Motion:** none observed. The hero is static in all V frames. **[C]**

### 4.2 Our New Arrivals

**Evidence:** S4 (desktop, variant A), V 1.2 s and 4.8 s (variant B), S3 middle (mobile). **The two desktop variants differ. See issue Q3.**

**Shared header row** **[C]**: "Our New Arrivals" (`h2-section`, left) and "VIEW ALL" (underlined link, right), on the same baseline.

**Variant A, S4 (editorial asymmetric row)** **[C]**

| Slot | Width (approx. % of content) | Content |
|---|---|---|
| 1 | ~26 % | Cut-out model on white, "FLOWING HALTER DRESS €80,95" (magenta halter midi dress) |
| 2 | ~22 %, vertically centred and higher | Gold heart earrings on a `#F3F3F3` ellipse, "BALL EARRINGS €80,95" |
| 3 | ~40 % | Framed photo on `#F2F4F5` (~0.84 ratio), "HALTER LONG DRESS €80,95" (shows a cream blazer and trousers) |

The bottoms of slots 1 and 3 align, with captions on the same baseline. Slot 2's caption sits higher.

**Variant B, V (model row)** **[C]**

- A single row of 4–5 full-length cut-out models on white: patterned maxi dress, cream strapless top with trousers, magenta halter dress, brown midi dress with chain belt, cream halter jumpsuit.
- **One item (the magenta dress) is rendered about 15–20 % taller than its neighbours** and is the only one with a centred caption: "LACE TRIM SCULPTURAL MIDI DRESS / €98,00".
- This reads as a **featured or hover state**. Because V is a static reel, whether it is hover-driven, auto-cycling or simply static is **[M]**.

**Mobile (S3)** **[C]**: title "New Arrivals" (no "Our"), with VIEW ALL on the right. A **2-column grid** of cut-out models with no visible captions.

### 4.3 Campaign mosaic

**Evidence:** S4 (top-left), V 1.8–3.4 s. **[C]**

- **Background:** full-bleed **video**. A woman with long beaded braids in a voluminous red-orange ruffled/tulle garment moves (head turn, fabric motion, shallow depth of field) against a warm pink-white backdrop. Frame-by-frame comparison shows real subject motion, not a camera move. **[C]**
- **Four corner labels** (white eyebrow + title, see 3.6), positioned as a % of the section box: **[C]** text / **[E]** position

| Label | Eyebrow | Title | Left | Top |
|---|---|---|---|---|
| TL | CAMPAING | ASH X COS / 2025 | ~5 % | ~6 % |
| TR | ROSE MOOD | Golden / Hour Paris | ~52 % | ~5 % |
| BL | CAMPAING | Midnight / Rôse | ~27 % | ~82 % |
| BR | NEW COLLECTION | Autumn / Edition Paris | ~76 % | ~82 % |

- The labels are probably links to their campaigns or collections. Destinations are **[M]**.
- **Mobile layout:** **[M]**

### 4.4 Who We Are

**Evidence:** S4 (left middle), V 4.8 s. **[C]**

- White background. Content centred.
- Eyebrow "WHO WE ARE", then the statement in 3 centred lines:
  > Inspired by Parisian elegance and modern simplicity, / we create pieces that move with you, *effortlessly* / *complementing your life and style*

  The italic run starts at "effortlessly".
- **Image:** a portrait photo (woman in a cream wrap blazer on a light grey studio background), roughly square (~0.97 w:h), about 37 % of the viewport width, centred, ~40 px below the text.
- **Script overlay:** "Looking for our stories" in `--vr-red`, 2 lines ("Looking" / "for our stories" with "for" dropped and offset left). It is set at a slight upward angle (about −5°) and **overlaps the bottom ~25 % of the image**, starting left of the image's left edge. **[C]**
- **Tilt conflict:** in V every frame shows the photo **rotated or skewed by about 3–4°**, like a pinned print. In S4 it is straight. See Q4.

### 4.5 New Collection: Golden Hour Paris

**Evidence:** S4 (bottom-left), S3 (mobile), V 7.2 s. **[C]**

- **Background:** solid `--vr-red`.
- **Giant type:** "NEW COLLECTION" in the display serif, black, at an extreme size (cap height ~35–45 % of the section height). It is cropped by the section edges and only partially legible ("NEW / COLLECT…"), roughly 2 lines. **Rotated diagonally, rising to the right, at every breakpoint:** about −15 to −20° on desktop (S4, V 7.2 s) and about −20 to −30° on mobile (S3). **[C]** direction / **[E]** angle
- **Double-ellipse mask:** two vertical ellipses side by side, each ~30 % of the section width and ~70 % of its height, overlapping by ~25 % of their width and centred. They are filled with a studio photo (`#E1D9D5` background) of a model in a black long blazer-coat with red buttons, holding a red box bag. **[C]**
  - The ellipses sit **above** the giant letters (the letters pass behind them). **[C]**
  - The model is fully clipped by the ovals: nothing extends past the mask (checked in S4 and V 7.2 s). **[C]**
  - **Mobile:** the two ellipses overlap far more and form one tall rounded shape with a notch at top centre (a heart-like top). It spans ~85 % of the screen width. **[C]**
- **Labels** (white, see 3.6):
  - Top-left: "NEW COLLECTION / Golden Hour Paris" (~4 % left, ~8 % top).
  - Bottom-right: "NEW COLLECTION / Season Of Grace" (~75 % left, ~82 % top).
  - Mobile shows only the top label, set larger (~28 px title, single line "Golden Hour Paris") under the header. **[C]**
- **Motion:** none observed. **[C]**

### 4.6 Accessories

**Evidence:** V 9.0 s (full tile), V 1.0 s and 10.6 s (partial). **[C]**

- White background. A centre text block with six cut-out accessory images scattered around it, each with an italic serif index label.
- **Centre block** (horizontally centred, vertically ~47–62 %):
  - Eyebrow "ACCESSORIES".
  - Two rows of category names (serif ~44 px), each preceded by a small superscript italic index:
    - Row 1: `⁽⁰¹⁾Bags  ⁽⁰²⁾Belts  ⁽⁰³⁾Scarves`
    - Row 2: `⁽⁰⁴⁾Glasses  ⁽⁰⁵⁾Jewelry  ⁽⁰⁶⁾Hats`
- **Scattered items.** Positions are % of the section box (left, top) for the image bounding box; the label is placed beside the image as noted. **[E]**

| # | Item | Box (left–right, top–bottom) | Label position |
|---|---|---|---|
| (01) | Black leather triangular/pyramid tote with top handle | 41–56 %, 7–33 % | top-right of image |
| (02) | Brown leather belt with silver buckle | 6–25 %, 29–36 % | above-left of image |
| (03) | White silk scarf with red border and blue/floral print, tied | 9–19 %, 57–84 % | left of image |
| (04) | Black rectangular sunglasses (tortoiseshell temples) | 35–62 %, 77–89 % | bottom-right of image |
| (05) | Two stacked bangles (cream/marbled and burgundy, silver inlay) | 79–90 %, 64–79 % | top-right of image |
| (06) | Red wool beret | 68–90 %, 29–44 % | right of image |

- The category numbers match the item numbers (01 Bags is the bag; 06 Hats is the beret, and so on). **[C]**
- Interaction (for example, hovering a category highlights its item) is **[M]**. The numbering suggests it, but nothing shows it.
- **Mobile:** **[M]**

### 4.7 Promo + Services

**Evidence:** V 10.6 s (full tile), V 1.0 s and 12.6 s (partial). **[C]**

- **Background:** full-bleed photo. A woman with wind-blown hair, eyes closed, in a white blazer with gold hoops, shot against a saturated red backdrop close to `--vr-red`. The subject is right of centre.
- **Headline** (top-left, ~4 % left, ~8 % top), white serif ~48 px, 2 lines:
  > Up to 50% Off. / Don't miss out
- **Services row** (bottom, ~76–94 % top), 3 columns starting at ~4 %, ~36 % and ~71 % left, each ~26 % wide. Each column is white text: icon (16 px), title (serif ~20 px), body (sans ~11 px / 1.4, 2 lines) and an underlined link.

| Icon | Title | Body | Link |
|---|---|---|---|
| Truck | Free Shipping | Enjoy free shipping on all orders above $350. Get your favorite styles delivered to your door. | VIEW ALL |
| Circular arrows | Easy Returns | Not the right fit? No problem. We offer hassle-free returns within 30 days of purchase. | LEARN MORE |
| Phone | 24/7 Customer Support | Have questions? Our customer support team is here to help you anytime, day or night. | CONTACT US |

- The text in columns 2 and 3 is partly blurred in V where it crosses the white blazer. The copy above was reconstructed from three frames (V 1.0, 10.6, 12.6 s). **[C]** with minor uncertainty on "hassle-free".
- **Legibility note:** columns 2 and 3 sit over the white blazer, so white text has poor contrast there (see 12.6, Accessibility).

### 4.8 Newsletter

**Evidence:** V 12.6 s (full tile), V 0.0 and 9.0 s (partial). **[C]**

- White background, with the header in Variant B directly above (see 3.1).
- Centred content block, roughly vertically centred:
  - Eyebrow "SUBSCRIBE".
  - Heading (serif ~56–64 px, 3 centred lines):
    > Join the Vivienne Rôse world  be / the first to *discover new collections* / and exclusive offers.

    The italic run is "discover new collections". Note the **double space and missing punctuation** after "world" (Q6).
  - Form row: email input (~400 × 48) and black "SUBSCRIBE" button (~187 × 48), with a ~10 px gap. The whole row is centred.
- Success, error and consent text are **[M]**.

### 4.9 Footer **[M]**

---

## 5. Page: Product listing (PLP), "Dresses"

**Evidence:** S2. **[C]** The desktop view is cropped at the right edge.

### 5.1 Desktop

```
[Header Variant B]
Dresses                                                              FILTER
VIEW ALL   MIDI | MAXI   JUMPSUITS   SATIN   PARTY          SORT BY  ASCENDING PRICE ▾?
[ cut-out ][ cut-out ][ cut-out ][ cut-out ][ cut-out ]     ← 5-column grid
[ editorial block: blob + "Add the perfect touch to your look" + 2 accessories | large lifestyle images ]
```

- **Title:** "Dresses" (`h1-page`, left).
- **Sub-category tabs:** uppercase sans; active "VIEW ALL" in black, the rest in `--vr-text-muted`; ~28 px gaps. "MIDI | MAXI" uses a literal pipe. **[C]**
- **FILTER:** top-right, uppercase, with a 1 px underline. What it opens is **[M]**.
- **SORT BY:** "SORT BY" in grey, then the current value in black ("ASCENDING PR…", cropped, so presumably "ASCENDING PRICE"). The control type (dropdown or cycle) is **[M]**.
- **Grid:** 5 columns of full-length cut-out models on white. No captions are visible. Products (left to right): black-and-white patterned halter maxi dress; cream strapless top with trousers; brown sleeveless midi dress with chain belt; cream halter jumpsuit; brown satin tie-front top with wide trousers. **[C]**
- **Editorial interstitial** (appears after the first row): **[C]**
  - A large soft blob shape in `--vr-grey-blob` (two overlapping circles forming a "cloud/heart") spans ~60 % of the width.
  - On the blob: "Add the perfect touch to your look" (`h2-section`, centred, 2 lines) and a "VIEW ACCESSORIES" underlined link.
  - Below on the blob: 2 accessory cards. "PACK OF 3 RIGID BRACELETS / €20,00" (wood, cream and gold bangles); "MINI BAG WITH METAL HANDLE / €55,00" (gold mesh shoulder bag with a sculptural gold handle). Captions are centred under the items.
  - Right side: two large lifestyle cut-outs (a model in a pink floral satin cowl-neck midi dress, front and back views), overlapping the blob edge.
  - A faint script watermark in light grey sits behind the right side (partly legible, possibly "Halter collection"). **[E]**
- **Pagination / infinite scroll / load more:** **[M]**

### 5.2 Mobile

- Header: "FILTER" left, then bag, search and ≡ icons right (see 3.1).
- Sub-category tabs: a **horizontally scrollable** row (cut off at "SA…"). Active tab in black, the rest grey. **[C]**
- No page title visible (it may be scrolled out of view, or omitted on mobile). **[M]**
- Grid: **2 columns** of cut-outs, no captions visible. **[C]**

---

## 6. Page: Product detail (PDP)

**Evidence:** S1 (desktop layout in an iPad frame), V tile (title + 1 image, alternate crop). **[C]**

### 6.1 Layout (desktop / tablet landscape)

```
[Header Variant B]
┌──────────────────────────────┬──────────────────────────────────────────────┐
│ Carnivorous Rose             │ DESCRIPTION  DETAILS  SHIPPING & RETURNS  SIZE GUIDE │
│ Blazer - Black/White         │ <description paragraph, ~4 lines>            │
│ Silk Rose                    │ [BLACK            ●] [XS/34              ⌄]  │
│                              │ [ADD TO CART      €502,00 EUR] [♥]           │
└──────────────────────────────┴──────────────────────────────────────────────┘
[ image tile 1 ]   [ image tile 2 ]   [ image tile 3 ]          ← 3 × 4:5 tiles, #F7F7F7
```

| Element | Spec | Conf. |
|---|---|---|
| Title | "Carnivorous Rose Blazer - Black/White Silk Rose", `h1-page`, 3 lines, left column, top ~40 px below the header | **[C]** / **[E]** |
| Info column | Starts at ~50 % of the content width; right edge aligned with the right image tile | **[C]** / **[E]** |
| Tabs | DESCRIPTION (active, black), DETAILS, SHIPPING & RETURNS, SIZE GUIDE (grey). No underline on the active tab; the active state is shown by colour only. | **[C]** |
| Tab panel | Body text, ~13 px / 1.5, full width of the info column (~620 px) | **[C]** / **[E]** |
| Variant row | Two equal selects (~330 px each, ~8 px gap): colour (value plus swatch dot) and size (value plus chevron) | **[C]** / **[E]** |
| Purchase row | Red ADD TO CART button with the price inside on the right (~377 × 40), then the outline heart button (40 × 40) | **[C]** / **[E]** |
| Gallery | **3 equal columns**, image tiles ~4:5 (≈ 0.81 measured), background `#F7F7F7`, ~32 px gutter. Starts ~488 px from the top of the page at 1440. Views: front (rose pinned at the lapel, stem as a belt), front (rose at the lapel, stem hanging), back (stem tied at the waist). | **[C]** / **[E]** |
| More images / zoom / 360 / video | Not shown (D claims 360° and zoom) | **[D]** |
| Related products / reviews / breadcrumbs | Not shown (D claims these) | **[D]** / **[M]** |

### 6.2 Tab content

- **DESCRIPTION** (verbatim, including the source's typos; see Q6):
  > With a play on surrealism, the Carnivorous Rose Blazer featuresonly one lapel, the other being consumed by the large silk rose. Using the stem decoratively against the slightly boxier fit of the blazer, or as a means of creatively tying the blazer around thewaist for a cinching effect, it will create a gorgeoussilhouette.
- **DETAILS / SHIPPING & RETURNS / SIZE GUIDE:** content **[M]**. The Promo section suggests a 30-day return policy and free shipping above $350 (currency conflict, Q7).

### 6.3 Mobile PDP **[M]**

Not shown. Suggested stacking order, consistent with other mobile screens but **unconfirmed**: title, gallery (swipe), tabs, selects, purchase row.

---

## 7. Responsive behaviour

| Breakpoint | Evidence | Behaviour |
|---|---|---|
| **Desktop** ≥ 1280 px | S2, S4, V | Full 3-zone header; 5-column PLP; 3-column PDP gallery; full-bleed 100 vh feature sections. **[C]** |
| **Tablet landscape** ~1024–1366 px | S1 (iPad frame) | **Uses the desktop layout unchanged** (full text nav, 2-column PDP top, 3-column gallery). **[C]** |
| **Tablet portrait** 768–1023 px | none | **[M]**. Recommend the mobile header plus a 3-column grid. |
| **Mobile** ≤ 767 px (393 reference) | S2, S3 | Left logo, icon-only header; 2-column product grids; horizontally scrolling sub-category tabs; hero lockup scaled and repositioned to the lower half; collection mask merges into a single tall notched shape; giant type rotates more steeply than on desktop. **[C]** |

Rules that carry across all breakpoints **[C]**: white canvas, square corners, cut-out product imagery, eyebrow-plus-serif title pattern.

---

## 8. Motion and interaction inventory

### 8.1 Confirmed (visible in source)

| # | Behaviour | Evidence | Notes |
|---|---|---|---|
| M1 | **Campaign background is moving footage** (subject turns head, ruffles move, focus shifts) | V 1.8–3.4 s; consecutive 10 fps crops differ in subject pose | Implement as a muted, looping, autoplaying `<video playsinline>` with a poster frame. Loop length is **[M]** (only ~1.5 s visible). |
| M2 | **Featured product enlarged** in the New Arrivals row (taller than siblings, only one with a caption) | V 1.2 s | Static in the reel. Trigger (hover / auto-cycle / static) is **[M]**. |
| M3 | **Active tab colour state** (black vs grey) | S1, S2 | Static state only. |
| M4 | **Filled input state** | V 12.6 s ("hello@phenomenon-") | Input value colour is near-black. |
| M5 | **Horizontal overflow scroll** on mobile sub-category tabs | S2 mobile (tab cut off at the edge) | Implied by the cropping. |

### 8.2 Not evidenced: requires a decision **[M]**

Hover states on links, buttons and product cards; page transitions; scroll-triggered reveals; parallax; header shrink or colour change on scroll; menu, cart and search open/close animations; image zoom; the Who We Are photo tilt (Q4). D mentions "subtle animations and smooth transitions" **[D]** but gives no specifics. **Do not invent these.** Specify them with the client, or keep the build static except for M1, M2 and M5.

### 8.3 Presentation-only effects: **do not implement**

The fisheye/barrel lens distortion, the red tile-wall backdrop, the 3D curvature of tiles and the snap camera moves exist only in the promotional reel (see Appendix A). They are not website behaviour.

---

## 9. Functionality: described vs evidenced

| Feature (from D) | Visual evidence | Status |
|---|---|---|
| Fully responsive grid / mobile shopping | Mobile PLP, home and collection screens | **[C]** |
| High-resolution product imagery | PDP, PLP | **[C]** |
| Size guide | "SIZE GUIDE" tab label | **[C]** label / content **[M]** |
| Detailed product specifications | "DETAILS" tab label | **[C]** label / content **[M]** |
| Wishlist / save for later | Heart button on PDP | **[C]** button / list page **[M]** |
| Filtering | FILTER control, sub-category tabs, SORT BY | **[C]** controls / filter panel **[M]** |
| Search | "SEARCH" link, search icon | **[C]** entry point / UI **[M]** |
| Login / account | "LOGIN" link | **[C]** entry point / UI **[M]** |
| Cart | "SHOPPING BAG (0)", bag icon | **[C]** entry point / cart UI **[M]** |
| Email newsletter | Newsletter section | **[C]** |
| Shipping, returns, support info | Promo services row, PDP tab | **[C]** |
| Video integration | Campaign video background | **[C]** (as background; product videos **[D]**) |
| Professional palette with rose and neutral tones | Observed palette is **brand red + black/white + neutrals**. "Rose" appears only as the pink hero jacket. | **[C]** with discrepancy (Q8) |
| 360° product view, zoom | — | **[D]** |
| Advanced search (Elasticsearch) | — | **[D]** |
| Personalised recommendations, size/fit recommendations | — | **[D]** |
| Secure checkout, one-click checkout, saved payment methods | — | **[D]** |
| Multiple payment gateways (Stripe, PayPal), multiple currencies | Prices shown in EUR only ("€502,00 EUR") | **[D]** |
| Order tracking, history, status notifications | — | **[D]** |
| Customer reviews and ratings (with photos) | — | **[D]** |
| Gift wrapping, personalisation | — | **[D]** |
| Loyalty programme, member-only deals | — | **[D]** |
| Social media integration / sharing, influencer collaborations | — | **[D]** |
| Live chat / chatbot | — | **[D]** |
| Dark and light theme options | — | **[D]** |
| Virtual try-on | — | **[D]** |
| Style guides, lookbooks, outfit suggestions | Campaign and collection sections are lookbook-like entry points | **[D]** (pages not shown) |
| Mobile app integration | — | **[D]** |
| WCAG accessibility compliance | Several contrast risks observed (12.6) | **[D]** |

> **Scope recommendation:** build **[C]** items to visual parity first. Treat every **[D]** item as a separate feature with its own design, because none of them has a visual specification to reverse-engineer.

---

## 10. Content and copy inventory (verbatim)

Spelling, casing and spacing are preserved exactly as they appear in the sources. `[sic]` marks a probable error.

**Brand:** Vivienne Rôse (UI) · Vivienne Rosé (D) · see Q1

**Header:** SHOP · NEW ARRIVALS · THE BRAND · SEARCH · LOGIN · SHOPPING BAG (0)

**Hero:** there she · rose · jamilie sea · DISCOVER THE COLLECTION

**New Arrivals:** Our New Arrivals (desktop) · New Arrivals (mobile) · VIEW ALL
- FLOWING HALTER DRESS €80,95
- BALL EARRINGS €80,95
- HALTER LONG DRESS €80,95 (image shows a blazer suit [sic])
- LACE TRIM SCULPTURAL MIDI DRESS €98,00

**Campaign:** CAMPAING [sic] / ASH X COS 2025 · ROSE MOOD / Golden Hour Paris · CAMPAING [sic] / Midnight Rôse · NEW COLLECTION / Autumn Edition Paris

**Who We Are:** WHO WE ARE · Inspired by Parisian elegance and modern simplicity, we create pieces that move with you, *effortlessly complementing your life and style* · Looking for our stories

**New Collection:** NEW COLLECTION / Golden Hour Paris · NEW COLLECTION / Season Of Grace · (giant) NEW COLLECTION

**Accessories:** ACCESSORIES · (01) Bags · (02) Belts · (03) Scarves · (04) Glasses · (05) Jewelry · (06) Hats

**Promo:** Up to 50% Off. Don't miss out · Free Shipping / Enjoy free shipping on all orders above $350. Get your favorite styles delivered to your door. / VIEW ALL · Easy Returns / Not the right fit? No problem. We offer hassle-free returns within 30 days of purchase. / LEARN MORE · 24/7 Customer Support / Have questions? Our customer support team is here to help you anytime, day or night. / CONTACT US

**Newsletter:** SUBSCRIBE · Join the Vivienne Rôse world  be the first to *discover new collections* and exclusive offers. · Enter your email address · SUBSCRIBE

**PLP:** Dresses · VIEW ALL · MIDI | MAXI · JUMPSUITS · SATIN · PARTY · FILTER · SORT BY ASCENDING PR… · Add the perfect touch to your look · VIEW ACCESSORIES · PACK OF 3 RIGID BRACELETS €20,00 · MINI BAG WITH METAL HANDLE €55,00

**PDP:** Carnivorous Rose Blazer - Black/White Silk Rose · DESCRIPTION · DETAILS · SHIPPING & RETURNS · SIZE GUIDE · (description in 6.2) · BLACK · XS/34 · ADD TO CART · €502,00 EUR

**Price format:** `€` prefix, comma decimal separator, two decimals (`€80,95`). On the PDP button the ISO code is appended (`€502,00 EUR`). **[C]**

---

## 11. Asset inventory

> **Licensing warning.** All photography, video and product imagery in the reference belongs to the original designer, brand or stock and model sources. Several product shots look like retail catalogue imagery. **None of it may be reused.** Each asset below must be re-shot, licensed or replaced with placeholders of the **same aspect ratio, crop and background treatment**.

| ID | Asset | Type | Ratio / size (desktop) | Background | Used in |
|---|---|---|---|---|---|
| A01 | Hero portrait (pink jacket, dark bg) | Photo | Full-bleed ~16:10; mobile crop ~9:19.5 | Near-black | 4.1 |
| A02 | Campaign footage (red-orange ruffle garment) | **Video**, muted loop + poster JPG | Full-bleed ~16:10 | Warm pink/white | 4.3 |
| A03 | Who We Are portrait (cream wrap blazer) | Photo | ~1:1 (0.97), ~540 px wide | Light grey studio | 4.4 |
| A04 | Collection model (black coat, red buttons, red bag) | Photo | Fits a double-ellipse mask ~860 × 640 | `#E1D9D5` studio | 4.5 |
| A05 | Promo portrait (white blazer, red set) | Photo | Full-bleed ~16:10 | Red | 4.7 |
| A06–A11 | Accessories ×6: bag, belt, scarf, sunglasses, bangles, beret | Transparent **PNG/WebP cut-outs** | ~150–380 px wide | None | 4.6 |
| A12–A16 | PLP model cut-outs ×5 (+ mobile set) | Transparent cut-outs, full length | ~1:2.6 (tall) | None/white | 5, 4.2B, mobile NA |
| A17 | Flowing Halter Dress (cut-out) | Cut-out | ~1:2.6 | None | 4.2A |
| A18 | Ball Earrings (cut-out) | Cut-out on CSS ellipse | ellipse ~0.72 | `#F3F3F3` | 4.2A |
| A19 | Halter Long Dress (framed studio) | Photo | ~5:6 (0.84) | `#F2F4F5` | 4.2A |
| A20–A22 | PDP blazer: front-belted, front-hanging, back | Cut-outs centred in tiles | Tile 4:5 | `#F7F7F7` tile | 6 |
| A23–A24 | PLP accessories: bracelets pack, mini bag | Cut-outs | small | Blob | 5 |
| A25–A26 | PLP lifestyle: pink floral dress front/back | Cut-outs | tall | None | 5 |
| A27 | Script watermark text | **Live text** (script font, light grey) preferred over an image | — | — | 5 |
| A28 | Logo "Vivienne Rôse" | **Live text** in the display serif, or SVG wordmark **[M]** (no vector supplied) | — | — | Header |
| A29 | Icons (menu, bag, search, heart, truck, returns, phone, chevron) | SVG | 16–20 px | — | Global |
| A30 | Double-ellipse mask and blob shapes | **SVG `clipPath`** / CSS | — | — | 4.5, 5 |
| A31 | Favicon / OG images | — | — | — | **[M]** |

**Image delivery:** AVIF/WebP with JPEG fallback. Cut-outs need alpha (WebP/AVIF with alpha, or PNG). Provide 1×/2× and responsive `srcset` widths of 640 / 1080 / 1600 / 2400. The video needs H.264 MP4 plus WebM, ≤ 4 MB, 1920 px wide, with a poster image.

---

## 12. Technical implementation requirements

### 12.1 Stack (per D; **[D]** unless noted)

| Layer | D says | Note for the rebuild |
|---|---|---|
| Frontend | React + **Next.js** | App Router, React Server Components, `next/image`, `next/font` (self-host the licensed fonts) |
| Commerce | **Shopify** API integration | Shopify Storefront API (headless) for products, variants, cart and checkout handoff |
| Backend | Node.js + Express API | Only needed for custom services (newsletter, loyalty, recommendations); otherwise use Next.js route handlers |
| Database | PostgreSQL | Customer and loyalty data, if not kept in Shopify |
| CMS | Headless CMS | Editorial sections (hero, campaign, collection, accessories, promo, newsletter copy) as CMS-driven blocks |
| Search | Elasticsearch | Or Shopify Search & Discovery / Algolia for the visible SEARCH entry point |
| Payments | Stripe and PayPal | Via Shopify Checkout, or custom if headless checkout is required |
| Infra | AWS | Or Vercel for the Next.js front end + AWS for services |
| Analytics / Email | "Advanced tracking", automated campaigns | GA4/Segment + Klaviyo/Mailchimp for the newsletter form |

### 12.2 Design tokens (CSS custom properties)

```css
:root {
  /* colour */
  --vr-red: #A20F15;
  --vr-black: #000000;
  --vr-white: #FFFFFF;
  --vr-grey-tile: #F7F7F7;
  --vr-grey-blob: #F7F6F9;
  --vr-grey-oval: #F3F3F3;
  --vr-text-muted: #999999;   /* estimate */
  --vr-border: #E6E6E6;       /* estimate */

  /* type families – placeholders until Q2 resolved */
  --font-serif: "Instrument Serif", "Times New Roman", serif;
  --font-script: "Mrs Saint Delafield", cursive;
  --font-sans: "Helvetica Neue", Arial, "Inter", sans-serif;

  /* layout – estimates */
  --pad-x: clamp(20px, 4vw, 64px);
  --gutter: clamp(8px, 2.2vw, 32px);
  --header-h: 80px;           /* 56px ≤ 767px */
  --section-py: clamp(64px, 8vw, 120px);
  --radius: 0;
}
```

### 12.3 Component list

`Header` (variants: `transparent`, `solid`; mobile: `logo` or `filter` slot) · `MenuDrawer` [M] · `HeroLockup` · `UnderlineLink` · `Eyebrow` · `OverlayLabel` (eyebrow + title) · `ProductCard` (variants: `cutout`, `framed`, `oval`, `featured`) · `NewArrivalsRow` · `VideoBackground` · `CampaignMosaic` · `StatementWithScript` (Who We Are) · `MaskedCollection` (double-ellipse + giant type) · `AccessoriesConstellation` · `PromoServices` · `NewsletterForm` · `CategoryTabs` (scrollable on mobile) · `FilterTrigger` / `SortControl` · `EditorialBlob` · `PdpInfo` (tabs, selects, purchase row) · `PdpGallery` · `Footer` [M]

### 12.4 Key implementation notes

1. **Hero lockup:** build it as live text, not an image, so it stays accessible and scalable. Use `font-size: clamp()` for each line. "rose" gets `margin-top: -0.25em`; "jamilie sea" is absolutely positioned at roughly right 5 %, bottom 0 of the "rose" box.
2. **Double-ellipse mask:** use an SVG `<clipPath clipPathUnits="objectBoundingBox">` containing two `<ellipse>` elements (desktop: cx 0.33 / 0.67, rx 0.33, ry 0.5; mobile: cx 0.4 / 0.6, rx 0.4, ry 0.5). Apply it to the photo container. Layer order: giant type, then the masked photo. Rotate the giant type at every breakpoint: `transform: rotate(-17deg)` on desktop, `rotate(-25deg)` on mobile **[E]**.
3. **Giant type:** a single text node with `font-size: ~22vw`, `line-height: 0.8`, `overflow: hidden` on the section, `pointer-events: none`, `aria-hidden="true"`.
4. **Accessories constellation:** use CSS Grid or absolute positioning with % coordinates from the 4.6 table, inside an `aspect-ratio: 1440/900` box on desktop. Mobile layout is **[M]**; a fallback is a 2-column grid with the category list on top.
5. **Script overlay:** an absolutely positioned live text element with `rotate(-5deg)`, `z-index` above the image and `color: var(--vr-red)`.
6. **Campaign video:** `<video autoplay muted loop playsinline preload="metadata" poster>`. Respect `prefers-reduced-motion` by pausing and showing the poster.
7. **Tabs:** WAI-ARIA tabs pattern (`role="tablist"`, arrow-key navigation) for the PDP and the PLP sub-categories. Mobile sub-category tabs use `overflow-x: auto; scroll-snap-type: x proximity`, with the scrollbar hidden.
8. **ADD TO CART** is a single `<button>` containing two spans (label and price) with `justify-content: space-between`.
9. **Price formatting:** `Intl.NumberFormat('fr-FR' | 'de-DE', { style: 'currency', currency: 'EUR' })`. Note that the source puts the `€` prefix before the number, which no common locale does by default. Format manually (`€` + `80,95`) to match.
10. **Header colour switch:** use an `IntersectionObserver` on the hero to toggle the `transparent` and `solid` classes. Transition timing is **[M]**.

### 12.5 Performance

- Preload the hero image and the display-serif font (`<link rel="preload">`). Lazy-load everything below the fold.
- Lazy-load the campaign video with an IntersectionObserver. Never autoplay on `Save-Data`.
- Cut-outs as WebP/AVIF with alpha. Target Lighthouse LCP < 2.5 s on 4G mobile.

### 12.6 Accessibility (D claims WCAG [D]; these risks are visible in the design)

| Risk | Where | Mitigation (no visual change) |
|---|---|---|
| White ~11 px text over the white blazer | Promo services columns 2 and 3 | Subtle text-shadow or a gradient scrim behind the text row, or reposition the subject in the crop |
| Grey inactive tabs (`#999` on white ≈ 2.8:1) | PDP, PLP | Darken to `#767676` (4.5:1), which is visually very close |
| Small uppercase 10–11 px eyebrows | Global | Keep ≥ 11 px with tracking; they are decorative, so ensure the headings carry the meaning |
| Script text unreadable to screen readers | Hero, Who We Are | Real text plus `aria-label`, or a visually hidden equivalent |
| Giant decorative type | New Collection | `aria-hidden="true"` |
| Red button white text (`#A20F15` vs white ≈ 8.0:1) | ADD TO CART | Passes |

---

## 13. Discrepancies, errors and open questions

| # | Issue | Evidence | Decision needed |
|---|---|---|---|
| **Q1** | Brand name spelling differs: **"Vivienne Rôse"** (circumflex ô, all UI) vs **"Vivienne Rosé"** (acute é, D) vs "VIENNE_ROSE" (file name) | S1–S4, V vs D | Which is canonical? This spec uses the UI spelling. |
| **Q2** | Font families unidentified | — | Obtain the files or confirm candidates (2.2). |
| **Q3** | Two different desktop **New Arrivals** layouts: an asymmetric 3-item editorial row (S4) vs a 5-model row with an enlarged featured item (V) | S4 vs V | One section with breakpoint or state variants, or two separate sections (e.g. the home row and a "you may also like" row)? |
| **Q4** | **Who We Are photo** is tilted ~3–4° in V but straight in S4 | V 4.8 s vs S4 | Static tilt, scroll or hover animation, or an older design version? |
| **Q5** | Header sticky/solid behaviour not shown | V 12.6 s | Confirm sticky + transparent-to-white. |
| **Q6** | Copy errors: "CAMPAING" (×2), "featuresonly", "thewaist", "gorgeoussilhouette", "world  be" (double space, missing punctuation), product "HALTER LONG DRESS" shown on a blazer, identical €80,95 price on three different items | S1, S4, V | Fix in the build or reproduce verbatim? Recommendation: fix. They look like placeholder or typo errors. |
| **Q7** | Currency conflict: prices in **EUR** but the free-shipping threshold is **$350** | V vs S1/S4 | Which currency and threshold? D also claims multi-currency **[D]**. |
| **Q8** | D says "rose and neutral tones". The visuals use a deep **brand red** `#A20F15` | D vs all | Visuals take precedence (this spec follows them). |
| **Q9** | Hero script "jamilie sea": a signature, a photographer credit or placeholder text? | S3, S4, V | Confirm the copy. |
| **Q10** | The mobile PLP header shows "FILTER" where the logo normally sits | S2 | Intended per-page header, or a mockup shortcut? |
| **Q11** | Missing pages and states: footer, menu, search, login/account, bag/cart, checkout, The Brand, campaign/collection landing pages, accessories PLP, mobile PDP, tablet portrait, all hover/focus/error/empty/loading states | — | Need designs, or approval to extrapolate from this system. |
| **Q12** | Link destinations for all CTAs and corner labels | — | Provide a sitemap. |
| **Q13** | D "Results & Impact" and "Business Value" are marketing claims with no metrics | D | Not build requirements. Ignored. |

---

## Appendix A: Presentation-reel timeline (not site behaviour)

The 14.4 s reel shows a wall of section tiles (~920 × 590 px each at 1600×1200, ~35 px red gutters, `#A20F15` backdrop) through a **barrel/fisheye distortion**. The camera **snaps** between tiles. Each move lasts ~0.6–0.8 s with a strong ease-out (peak ~100 px/frame, decelerating to 0), followed by a ~0.6–1.2 s hold. The reel loops seamlessly back to the hero. Camera motion was measured by phase correlation between consecutive frames.

| Time (s) | Camera move | Tile centred |
|---|---|---|
| 0.0–0.3 | hold | Hero |
| 0.3–1.0 | horizontal | New Arrivals (featured-item row) |
| 1.8–2.6 | vertical | Campaign (video playing) |
| 3.4–4.4 | vertical | Who We Are |
| 5.4–7.0 | diagonal | New Collection: Golden Hour Paris |
| 7.8–8.8 | horizontal | Accessories |
| 9.4–10.6 | vertical | Promo + Services |
| 11.0–12.6 | diagonal | Newsletter (with solid header) |
| 13.0–14.0 | horizontal | Hero (loop point) |

The visiting order is the basis for the homepage section order in §4. This reel is useful as a **marketing asset template** but is **not** a website interaction to build.

---

## Appendix B: Build checklist

- [ ] Resolve Q1–Q12 (especially fonts, New Arrivals variant, footer and missing pages)
- [ ] Source or licence replacement assets matching §11 ratios
- [ ] Tokens and fonts (§2, §12.2)
- [ ] Header (both variants, mobile, sticky)
- [ ] Homepage sections 4.1–4.8 at 1440 / 1024 / 393
- [ ] PLP desktop and mobile
- [ ] PDP desktop (mobile once designed)
- [ ] Campaign video and reduced-motion fallback
- [ ] Overlay screenshots at 1440 and 393 on top of S1–S4 (50 % opacity) and tune the [E] values
- [ ] Accessibility pass (§12.6)
- [ ] Wire Shopify Storefront API: products, variants, cart count in "SHOPPING BAG (n)"
- [ ] Scope and design every [D] feature separately before implementation

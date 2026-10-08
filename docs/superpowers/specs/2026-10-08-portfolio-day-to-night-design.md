# Portfolio: "Day → Night" Design Spec

- **Date:** 2026-10-08
- **Status:** Draft for review
- **Chosen concept:** O · Day → Night (combines A · 3D Room, C · Cinematic Scroll and D · Synthwave)
- **Prototype:** [`2026-10-08-portfolio-day-to-night-prototype.html`](./2026-10-08-portfolio-day-to-night-prototype.html). Open it in a browser and pick tab **O**. Tabs A, C and D show the ideas it's built from.

---

## 1. Goal and audience

A personal portfolio website for a **software engineer**. Its readers are mainly **recruiters and hiring managers** for developer roles, with other developers as a secondary audience.

The site should be **memorable** (a creative, 3D, "this person has taste" first impression) and still **easy to skim**: someone short on time should find who you are, what you've built, your stack and how to contact you in under a minute.

### What you told me vs. what I assumed

| You said | I assumed (correct me if wrong) |
|---|---|
| Developer portfolio | Main goal: get interviews or job offers |
| "Very nice and creative UI, can include 3D" | 3D must never block reading the content |
| Liked A (room), C (cinematic scroll), D (synthwave), then chose O | Single-page site plus simple project detail pages |
| Doesn't have to be strictly 3D | A non-WebGL fallback is fine as long as it looks good |

### Success criteria

1. Every key fact (name, role, projects, skills, contact) is real HTML text, readable with WebGL disabled.
2. Lighthouse (mobile): Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95.
3. First text appears before the 3D scene loads (LCP < 2.5 s on 4G).
4. Holds 60 fps on a mid-range laptop and ≥ 30 fps on a mid-range phone.
5. Works with keyboard only and respects `prefers-reduced-motion`.

---

## 2. Concept

The whole site is **one day in your room**. A low-poly 3D room is fixed in the background. As the visitor scrolls:

- the **camera** moves from object to object in the room
- the **light** changes from morning sun to noon, golden hour and finally neon synthwave night
- a **clock** in the corner shows the time of day
- each **time of day is a section** of the portfolio, with editorial-style text laid over the side of the screen the camera isn't framing

The day ends at midnight with a wide shot of the neon-lit room and a contact call to action.

---

## 3. Section storyboard

| # | Time | Section | Camera focus | Light | Text side | Content |
|---|---|---|---|---|---|---|
| 0 | 07:30 | **Hero** | Wide isometric room | Warm morning | Left | "Hi, I'm {Name}." + one-line role + scroll cue |
| 1 | 09:00 | **About** | Coffee mug on the desk | Bright morning | Right | 2–3 sentence bio, current role, location/remote |
| 2 | 13:00 | **Projects** | Monitor | Neutral noon | Left | 3–4 project cards (title, stack, one-line impact). The monitor shows the hovered project |
| 3 | 18:30 | **Skills** | Bookshelf | Golden hour | Right | Skill tags grouped by area (Frontend / Backend / Infra) |
| 4 | 23:00 | **After hours** | Window (synthwave sunset outside) | Night + neon strips on | Left | Side projects, open source, experiments |
| 5 | 00:00 | **Contact** | Wide room, night | Deep night | Centre-bottom | "Let's build something together." + email, GitHub, LinkedIn, résumé |

A thin **time scrubber** on the right edge lists the six times. The current one is highlighted, and clicking one scrolls to that section.

---

## 4. Visual design

### Day/night palette

| Token | Day value | Night value |
|---|---|---|
| Background | `#f3e6d6` → `#e3eef8` | `#3a1f3d` → `#07051a` |
| Text | `#1d1610` | `#ffffff` |
| Accent | `#6b5cff` | Neon gradient `#ff6ad5 → #ffd36a → #6affc8` |
| Room walls / floor | Cream `#ece4d8` / wood `#b98d64` | Same materials, lit purple/pink by the neon |
| Neon strips | Off (`#3a3a44`) | Pink `#ff2ad4`, cyan `#2af0ff` |

The **text colour flips** when the lighting crosses into evening (sections 3–5 use light text). Headings in the night sections use the neon gradient.

### Typography

- **Headings:** Inter Tight 800 (tight tracking, large sizes `clamp(32px, 4.4vw, 64px)`)
- **Body:** Inter 400/500
- **Kickers, clock and scrubber:** JetBrains Mono 600, letter-spaced (`07:30 · MORNING`)
- The fonts are self-hosted subsets (WOFF2), with `font-display: swap`

### UI chrome

- Top-left: name / logo. Top-right: clock pill (`☀ 13:00` / `☾ 23:00`), its colour following the theme.
- Project cards: frosted glass (`backdrop-filter: blur(8px)`) on day backgrounds and a dark glass variant at night.
- Minimal nav: Work · About · Contact · Résumé ↗ (anchors into the scroll sections).

---

## 5. Interactions

| Interaction | Behaviour |
|---|---|
| **Scroll** | Page progress `p ∈ [0,1]` maps to keyframe position `f = p × 5`. Camera, look target, view offset and lighting interpolate between keyframes `⌊f⌋` and `⌈f⌉` with smoothstep. Values ease towards the target with frame-rate-independent damping (`k = 1 − e^(−8·dt)`) |
| **Mouse parallax** | Camera nudged ±0.25 (x) / ±0.15 (y) units by pointer position. Desktop only |
| **Project hover/focus** | The monitor's screen texture swaps to that project's screenshot with a quick fade. Without hover it cycles through them slowly |
| **Project click** | Opens `/projects/<slug>`, a plain, fast, readable detail page (no 3D) |
| **Time scrubber** | Click a time to smooth-scroll to its section. Keyboard focusable |
| **Clock** | Shows a time interpolated from the keyframe times (07:30 → 00:00) |
| **Reduced motion** | The camera **cuts** between keyframes instead of gliding (with a 300 ms cross-fade), parallax is off, and idle animations stop |

---

## 6. Tech stack and architecture

| Choice | Why |
|---|---|
| **Astro** (static output) + **TypeScript** | Content ships as real HTML (SEO and accessibility). The 3D scene is one client-side island. Markdown content collections handle projects |
| **three** (npm, latest stable) | Same API as the prototype. No React needed for one canvas |
| No GSAP or Lenis | The scroll → keyframe mapping is a ~60-line module (as in the prototype). Native scroll keeps accessibility simple |
| **Vitest** + **Playwright** | Unit tests for the interpolation maths, smoke and visual tests for pages |

### File structure

```
portfolio/
├─ astro.config.mjs
├─ src/
│  ├─ config.ts                # name, role, email, socials, résumé URL, skills, section copy
│  ├─ content/
│  │  └─ projects/*.md         # one file per project (frontmatter below)
│  ├─ pages/
│  │  ├─ index.astro           # the six scroll sections + <RoomCanvas/>
│  │  └─ projects/[slug].astro # project detail pages
│  ├─ components/
│  │  ├─ Section.astro         # time kicker + heading + slot, left/right/centre alignment
│  │  ├─ ProjectCard.astro
│  │  ├─ TimeScrubber.astro
│  │  ├─ Clock.astro
│  │  └─ RoomCanvas.astro      # mounts the scene, renders the static fallback
│  ├─ scene/
│  │  ├─ main.ts               # bootstraps renderer, loop, resize, visibility, context-loss
│  │  ├─ room.ts               # buildRoom(): meshes, materials, named handles (mug, monitor, shelf, window, neon)
│  │  ├─ keyframes.ts          # camera + lighting keyframe data (tables in §7)
│  │  ├─ timeline.ts           # pure functions: progress → interpolated state
│  │  ├─ lighting.ts           # applies a lighting state to lights, background, neon, window
│  │  ├─ monitor.ts            # canvas texture for the monitor; project screenshot swapping
│  │  └─ textures.ts           # synthwave window texture, poster, code-screen texture
│  └─ styles/global.css        # tokens, day/night themes (data-theme attribute)
├─ public/
│  ├─ projects/*.webp          # screenshots (1280×800, also used on the monitor)
│  ├─ fallback/*.webp          # pre-rendered stills for the 6 sections (no-WebGL fallback)
│  └─ resume.pdf
└─ tests/
   ├─ timeline.test.ts
   └─ e2e/*.spec.ts
```

### Module boundaries

- `timeline.ts` is **pure**: it takes `(progress, keyframes)` and returns `{camera, lookAt, viewOffset, lighting, clockMinutes, theme}`. It has no Three.js imports, so it's easy to test.
- `lighting.ts` and `room.ts` are the only places that touch materials and lights.
- `main.ts` wires scroll/pointer → `timeline` → `lighting` + camera → render. It also exposes `setTheme(dark)` events, so the HTML switches text colour when `theme` changes.
- **Page ↔ scene communication** uses DOM `CustomEvent`s (`portfolio:project-focus`, `portfolio:theme`). The scene never queries page layout beyond the scroll position.

---

## 7. 3D scene

### Room (v1: built in code, as in the prototype)

An 8 × 8 floor with back and left walls, a window on the back wall, a desk with a monitor, keyboard and mug, a chair, a bookshelf with procedurally coloured books, a poster on the left wall, a plant, a pendant lamp, a rug and **neon LED strips** along the top of both walls and under the desk. All meshes use `MeshStandardMaterial` with `flatShading` for the low-poly look. The book colours use a seeded RNG, so the room looks the same on every visit.

The **window** is two stacked planes: a sky-colour plane (lerped per keyframe) and a synthwave sunset texture whose opacity is the `night` value.

### Camera keyframes (from the prototype)

| # | Position | Look at | View offset* |
|---|---|---|---|
| 0 | (12, 9.5, 12) | (−0.5, 1.3, −0.5) | +0.20 |
| 1 | (1.4, 2.35, −1.6) | (0.1, 1.75, −2.8) | −0.20 |
| 2 | (−1.15, 2.7, 0.1) | (−1.4, 2.35, −3.5) | +0.20 |
| 3 | (−0.6, 2.3, 1.9) | (−3.6, 1.9, 0.5) | −0.20 |
| 4 | (3.1, 2.5, 1.4) | (1.3, 3, −4) | +0.22 |
| 5 | (11, 8.2, 11) | (−0.5, 2, −0.5) | 0 |

\* The view offset is a horizontal frustum shift as a fraction of viewport width (`camera.setViewOffset`). A positive value pushes the subject right, so text fits on the left. It is reduced to 30% on narrow screens.

### Lighting presets (from the prototype)

| # | Background | Sky (window) | Hemi sky / ground / intensity | Sun colour / intensity | Lamp | Night (neon, window) |
|---|---|---|---|---|---|---|
| 0 | `#f3e6d6` | `#ffd9a8` | `#fff1de` / `#c9a27a` / 0.80 | `#ffd2a1` / 0.90 | 0 | 0 |
| 1 | `#f6ecdf` | `#bfe3ff` | `#ffffff` / `#c9b8a0` / 0.85 | `#fff1dc` / 1.00 | 0 | 0 |
| 2 | `#e3eef8` | `#8fd0ff` | `#ffffff` / `#b8c4d0` / 0.95 | `#ffffff` / 1.05 | 0 | 0 |
| 3 | `#3a1f3d` | `#ff9a5a` | `#ffb37a` / `#5a2a3a` / 0.60 | `#ff8a4c` / 1.00 | 0.6 | 0.15 |
| 4 | `#0c0820` | `#1a0533` | `#5a48b0` / `#120a24` / 0.30 | `#6a5cff` / 0.20 | 0.5 | 1 |
| 5 | `#07051a` | `#1a0533` | `#4a3a9a` / `#0a0618` / 0.26 | `#6a5cff` / 0.18 | 0.5 | 1 |

The neon point lights are scaled to **0.3×** because the cream walls overexpose otherwise. The prototype hit this exact bug.

### Renderer settings

- `antialias: true` and `pixelRatio = min(devicePixelRatio, 2)` (1.5 on mobile)
- PCF soft shadows from one directional light, with a 2048 shadow map (1024 on mobile) and `shadow.bias = −0.0008`
- **Render on demand:** render only when scroll, pointer or an interpolation is still settling, plus a 30 fps idle tick at night for the neon shimmer. Pause when the tab is hidden.

---

## 8. Content model

`src/config.ts` holds the name, role, one-line tagline, about paragraph, location, email, GitHub, LinkedIn, résumé path, skills grouped by area, and the "after hours" items.

`src/content/projects/<slug>.md`:

```yaml
---
title: Realtime Chat
summary: WebSockets + Redis chat for 10k daily users, p99 latency 40ms
stack: [TypeScript, Node, Redis, WebSockets]
screenshot: /projects/realtime-chat.webp
links: { live: https://…, repo: https://github.com/… }
featured: true      # shown in the Projects section (max 4)
order: 1
---
Longer case study in Markdown: problem → approach → result → what I'd do next.
```

Cards in section 2 come from `featured: true`, sorted by `order`. Every project gets a detail page.

---

## 9. Responsive behaviour

| Width | Layout |
|---|---|
| ≥ 1024 px | Full experience as above (text column ≈ 42% wide, subject framed by the view offset) |
| 760–1023 px | Same, with the view offset reduced and a slightly narrower text column |
| < 760 px | The canvas fills the screen with the subject framed in the **top half** (vertical view offset). Text sits in a **bottom card** with a translucent background. Parallax is off and the scrubber becomes a small dot row |

---

## 10. Performance budget

| Item | Budget |
|---|---|
| JS (gzipped) for the home page | ≤ 200 KB (three ≈ 150 KB + scene ≈ 20 KB + page ≈ 10 KB) |
| Fonts | ≤ 80 KB total (subset WOFF2) |
| Images on the home page | Monitor screenshots lazy-loaded after the scene starts, ≤ 150 KB each (WebP) |
| Scene start | `RoomCanvas` initialises after `DOMContentLoaded` **and** first paint (`requestIdleCallback`, 1.5 s timeout), so text is never blocked |

---

## 11. Accessibility, fallbacks and error handling

- **Content first:** all sections are semantic HTML (`<header>`, `<section aria-labelledby>`, `<h2>`). The canvas is `aria-hidden="true"`.
- **Keyboard:** the scrubber, nav, cards and links are focusable in reading order, with a visible focus ring in both themes. Focusing a project card triggers the same monitor swap as hover.
- **Contrast:** the text colour switches with the theme. The day/night switch point is set so every section meets WCAG AA (checked in tests).
- **No WebGL / init failure:** `RoomCanvas` shows `public/fallback/<n>.webp` stills that cross-fade with scroll (pre-rendered from the scene). The site is fully usable.
- **WebGL context lost:** switch to the fallback stills, and try one restore on `webglcontextrestored`.
- **Asset load failure** (e.g. a screenshot 404): the monitor keeps its default code-screen texture, and the error is logged in development only.
- **Low-power devices:** if the first 60 frames average under 24 fps, shadows are turned off and the pixel ratio is lowered to 1.

---

## 12. Testing

| Layer | What |
|---|---|
| Unit (Vitest) | `timeline.ts`: keyframe interpolation at boundaries (0, 1, exact keyframes, midpoints), clock minutes, theme switch point, reduced-motion cut behaviour |
| E2E (Playwright) | Home page renders all six section headings **with WebGL disabled**. The scrubber jumps to the right section. Project card focus fires `portfolio:project-focus`. Project pages render |
| Visual | Playwright screenshots at `p = 0, 0.4, 0.8, 1` on desktop and mobile viewports, compared to baselines |
| Audits | Lighthouse CI on the home page and one project page, failing below the thresholds in §1. axe-core in E2E |

---

## 13. Deployment

- Static build (`astro build`), deployed to **Vercel**. The output is plain static files, so any static host works.
- Custom domain `yourname.dev` (replace with yours) with HTTPS.
- Open Graph image: a pre-rendered still of the night room with your name.

---

## 14. Out of scope for v1 (possible later additions)

- Replacing the code-built room with a **Blender model** with **baked day/night lightmaps** blended in a shader (higher visual quality, same timeline)
- **"Power On" easter egg** (concept P): clicking the monitor at night boots a synthwave OS with the portfolio inside
- Starting the day at the **visitor's local time**
- Blog/notes section, analytics, CMS, i18n

---

## 15. Content needed from you

1. Your name as it should appear, your role title and a one-line tagline
2. The About paragraph (2–3 sentences), plus your current role and location/remote preference
3. 3–4 featured projects: title, one-line impact, stack, links and a screenshot (1280×800)
4. Skills grouped into Frontend / Backend / Infra (6–10 total)
5. "After hours" items: side projects, open source, interests
6. Email, GitHub, LinkedIn and a résumé PDF
7. Domain name, if you already have one

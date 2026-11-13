# AD Factory: Project Knowledge

Living reference for how the site works, why it is built this way, and what has bitten us before. For the day-to-day status and to-do list, see the Current State note in the vault. This file is for knowledge that should survive across sessions and machines. Add new findings at the bottom of the relevant section.

Last updated: 2026-11-13 (after the themed Projects screen shipped).

## 1. Concept and non-negotiables

- Portfolio/landing page for Austin's work (art, music, games, school and personal projects). Factory idea: things move from prototype, to in production, to shipped.
- Look: a CRT monitor with a blue on-screen-display menu. Brutalist, minimal, industrial, retro-futurist.
- Four screens: About, Projects, Media, Contact. Home is the OSD menu.
- Most visitors will arrive from Instagram, so **mobile matters**.
- **Hard rule: desktop and mobile are separate on purpose.** Mobile work must not change desktop. Desktop rules live in `@media (min-width:1000px) and (min-height:560px) and (pointer:fine)`. Mobile-only rules use `@media not all and (min-width:1000px) and (min-height:560px) and (pointer:fine)`. Phones and tablets never get the desktop layout.

## 2. Stack and layout

- Astro (static), base path `/ADFactory`, plain CSS, small TypeScript scripts, three.js. Repo `devxaustin/ADFactory`, GitHub Pages.
- Monkey Island (Phaser game) lives in `games/monkey-island`, is built by `npm run build` into `public/monkey-island/`, and is served at `/monkey-island/`.
- Key files:
  - `src/data/site.ts`: editable content, 3D model slots, `projectCategories` (themes, colours, models).
  - `src/content/projects/*.md`: one file per project. Front matter: `stage` (prototype/production/shipped), `progress`, `links`, `category`. Link `href` may be a full URL or a path starting with `/`. Schema in `src/content.config.ts`.
  - `src/pages/index.astro`: all five screens. `src/layouts/Base.astro`: monitor frame, bottom bar, CRT layer, per-category colour layers.
  - `src/scripts/`: `router`, `menu`, `projects`, `tv`, `static`, `crt`, `models`.
  - `src/styles/`: `tokens.css` (colours, fonts), `crt.css`, `global.css` (everything else, desktop block near the end).

## 3. Systems worth understanding

### 3.1 3D models (`src/scripts/models.ts`)
- Rendered at low resolution (`PIXEL=3`) and scaled up with hard pixels so they match the pixel grid. `FIT=3.0` sizes each model.
- Slots take `file`, `rotate` (degrees), `textures`, `tint`. If a file is missing, a procedural stand-in is drawn (gear, phone, cartridge, TV, controller, iPod).
- Stages only render while on screen (IntersectionObserver). Desktop only. Reduced motion stops spinning.
- Projects stage: one model per category, springs for position and size, a spin boost on change, pointer tilt, rim lights that take the category accent. `sway: true` makes a flat model sway and whirl once on change instead of spinning fully (a continuous spin leaves flat models facing backwards).
- Keep model files small. Shrink textures to 1024x1024 JPEG. Anything inside `public/` is published, so keep big originals elsewhere.

### 3.2 Projects screen (`src/scripts/projects.ts`)
- Two levels: `browse` (category list plus big model) and `open` (project list plus detail panel). Esc, Backspace or Left steps back a level before the router sees it (capture-phase key handler).
- Theme is data-driven. Each category in `projectCategories` has `accent`, `accent2`, `onAccent`, `bg`, `theme` and `model`.
- JS sets `data-proj-cat` and `data-proj-theme` on `<html>`, plus CSS variables. CSS has default (xbox) values on `:root` and overrides under `html[data-pane='projects'][data-proj-theme='ipod']`. Adding a new look means adding an override block, a colour layer rule, and (optionally) an orb skin.
- Colour field: `.proj-layer` per category lives inside `.monitor` (Base.astro) so it covers the header and bottom bar. Active layer cross-fades with opacity.
- Current categories: Games (green, controller model, Xbox-dashboard inspired) and Music (white/silver, blue highlight, iPod model).

### 3.3 Media TV (`src/scripts/tv.ts`)
- YouTube iframe driven through the postMessage API (`enablejsapi=1`). YouTube controls are off (`controls=0`, `fs=0`, `disablekb=1`); the site draws its own Play/Pause, seek, volume and mute.
- Video unloads when leaving the screen so audio cannot continue.
- Opening straight on `#media` loads the first channel.

### 3.4 CRT layer
- Pixel grid, scanlines, RGB fringing, glare, vignette, rolling band, flicker, static noise (`crt.css`, `static.ts`). `burst(canvas, n)` fires a static burst on screen changes.
- Game has its own copy of the effect (`games/monkey-island/crt.css`). `?crt=0` turns it off.

## 4. Design decisions and why

- No Xbox logo, X sphere or other trademarks. We take palette and layout cues only. Same for the iPod stand-in: generic silver player, no Apple marks.
- Movement and animation are the point of the Projects screen. Choosing a category slides the model aside and shows options on the same page.
- Full-glass colour change per category rather than only an accent colour (Austin chose "fuller palette change").
- One model per category, procedural stand-ins first so the site works before real models exist; swap in `.glb` later through `file`.
- Colour switching feature was removed from the site earlier; may return in another form.

## 5. Workflow and tooling

- Local dev: `npm install`, then `npm run dev`. Full build: `npm run build` (builds the game first, then Astro).
- Deploy: push to `main`; the GitHub Action (`withastro/action@v3`) builds and deploys Pages. Pages source must be **GitHub Actions**.
- Working in Claude sessions: the Windows PC (`C:\dev\factory-site`) was connected through the desktop app bridge. A chat is bound to one device, so a new device (the MacBook) needs a new chat started from the desktop app there. Claude's cloud workspace can clone the public repo read-only but cannot push unless the GitHub account is linked.
- Screenshot testing in the cloud workspace: headless Chrome via Playwright with software GL (`--use-gl=swiftshader`). Animations run slowly there, so judge speeds in a real browser.
- Build check used before pushing: `npm ci && npm run build` of the pushed commit.

## 6. Gotchas we have hit

| Symptom | Cause | Fix |
|---|---|---|
| Game CRT overlay "not showing" | Changes were not pushed yet | Commit and push, then check the live site |
| Live site shows the old version after a push | Bookmark served from browser cache or pointed at a different address | Hard refresh (Ctrl/Cmd+Shift+R), or open the link fresh from Settings, Pages |
| Colour wash did not cover the header and bottom bar | It was inside the pane | Move it into `.monitor` with `z-index:-1`, select via `html[data-pane]` |
| Detail panel meter animated at page load | Animation not tied to the open state | Tie it to `.proj-view.is-open` |
| Panel glitch animation not playing | Specificity beaten by the crt-on rule | Use `.proj-view.is-open .proj-detail.is-on.swap` |
| Category list reappeared late | `visibility` transition delay on the base rule | Delay only on the open-state rule |
| Flat 3D model faces away after the spin | Continuous spin ends at an arbitrary angle | Use `sway` and an eased whirl that returns to front |
| Buttons invisible in the light (iPod) theme | Theme `.btn` override beat `.btn.primary` on specificity | Exclude `.primary`, hover and active states in the override |
| Recursive device listing capped at 2000 entries | `node_modules` | List subfolders one at a time |
| `public/monkey-island/` shows as modified | Game build output is gitignored but a few old files are still tracked | Optional cleanup: `git rm -r --cached public/monkey-island` |

## 7. Open items (short list)

- Mobile pass: review every screen on phone sizes without touching desktop. Test on a real phone.
- More Projects categories (Art, School, Software), each with its own theme and model.
- Replace placeholder content: sample projects, About draft text, stand-in TV channels.
- Delete unused files: `src/scripts/carousel.ts`, `src/components/ProjectSlide.astro`, `ProjectCard.astro`, `TestCard.astro`, and `cd.fbx` with `cd-textures/` once nothing references them.
- Check YouTube controls on the deployed site.

## 8. Added from the MacBook session

(Add notes here.)

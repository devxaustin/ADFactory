# AD Factory: Project Knowledge

Living reference for how the site works, why it is built this way, and what has bitten us before. For the day-to-day status and to-do list, see the Current State note in the vault. This file is for knowledge that should survive across sessions and machines. Add new findings at the bottom of the relevant section.

Last updated: 2026-11-13 (after the mobile pass, the About overhaul with the 3D logo and intro, and the Projects carousel).

## 1. Concept and non-negotiables

- Portfolio/landing page for Austin's work (art, music, games, school and personal projects). Factory idea: things move from prototype, to in production, to shipped.
- Look: a CRT monitor with a blue on-screen-display menu. Brutalist, minimal, industrial, retro-futurist.
- Four screens: About, Projects, Media, Contact. Home is the OSD menu.
- Most visitors will arrive from Instagram, so **mobile matters**.
- **Hard rule: desktop and mobile are separate on purpose.** Mobile work must not change desktop. Desktop rules live in `@media (min-width:1000px) and (min-height:560px) and (pointer:fine)`. Mobile-only rules use `@media not all and (min-width:1000px) and (min-height:560px) and (pointer:fine)`. Phones and tablets never get the desktop layout.
  - **Exception, by Austin's request:** the Projects screen now uses the phone layout at every size (see 3.2), and the About stage is frameless on both. Check desktop after any change to either.
  - Do not decide phone vs desktop once at load in JS. Use a live `matchMedia(...).matches` (see section 6).

## 2. Stack and layout

- Astro (static), base path `/ADFactory`, plain CSS, small TypeScript scripts, three.js. Repo `devxaustin/ADFactory`, GitHub Pages.
- Monkey Island (Phaser game) lives in `games/monkey-island`, is built by `npm run build` into `public/monkey-island/`, and is served at `/monkey-island/`.
- Key files:
  - `src/data/site.ts`: editable content, 3D model slots, `projectCategories` (themes, colours, models).
  - `src/content/projects/*.md`: one file per project. Front matter: `stage` (prototype/production/shipped), `progress`, `links`, `category`. Link `href` may be a full URL or a path starting with `/`. Schema in `src/content.config.ts`.
  - `src/pages/index.astro`: all five screens. `src/layouts/Base.astro`: monitor frame, bottom bar, CRT layer, per-category colour layers.
  - `src/scripts/`: `router`, `menu`, `projects`, `tv`, `static`, `crt`, `models`, plus `swipe` (phone gestures), `about` (About boot and counters) and `intro` (three-act intro).
  - `src/data/logo.ts`: traced outline of the AD monogram (`LOGO_OUTER`, `LOGO_HOLE`, `LOGO_ASPECT`) used to extrude the 3D logo.
  - `src/styles/`: `tokens.css` (colours, fonts), `crt.css`, `global.css` (everything else, desktop block near the end).

## 3. Systems worth understanding

### 3.1 3D models (`src/scripts/models.ts`)
- Rendered at low resolution (`PIXEL=3`) and scaled up with hard pixels so they match the pixel grid. `FIT=3.0` sizes each model.
- Slots take `file`, `rotate` (degrees), `textures`, `tint`. If a file is missing, a procedural stand-in is drawn (gear, phone, cartridge, TV, controller, iPod).
- Stages only render while on screen (IntersectionObserver). Phones render at about 30fps with a low-power GPU hint. Reduced motion stops spinning.
- The About stage is `kind: 'logo'`: the AD monogram extruded from `logo.ts` (`buildLogo`), in a pivot group named `spiny` that spins on Y. Three finishes swapped by `setLogoState`: 0 wireframe (blueprint material plus edge lines), 1 cast (concrete), 2 polished (brushed metal). The stage listens for `logostate` and `logoreset` events.
- Projects stage: one model per category, springs for position and size, a spin boost on change, pointer tilt, rim lights that take the category accent. `sway: true` makes a flat model sway and whirl once on change instead of spinning fully (a continuous spin leaves flat models facing backwards).
- Keep model files small. Shrink textures to 1024x1024 JPEG. Anything inside `public/` is published, so keep big originals elsewhere.

### 3.2 Projects screen (`src/scripts/projects.ts`)
- Two levels: `browse` (category list plus big model) and `open` (project list plus detail panel). Esc, Backspace or Left steps back a level before the router sees it (capture-phase key handler).
- Theme is data-driven. Each category in `projectCategories` has `accent`, `accent2`, `onAccent`, `bg`, `theme` and `model`.
- JS sets `data-proj-cat` and `data-proj-theme` on `<html>`, plus CSS variables. CSS has default (xbox) values on `:root` and overrides under `html[data-pane='projects'][data-proj-theme='ipod']`. Adding a new look means adding an override block, a colour layer rule, and (optionally) an orb skin.
- Colour field: `.proj-layer` per category lives inside `.monitor` (Base.astro) so it covers the header and bottom bar. Active layer cross-fades with opacity.
- Current categories: Games (green, controller model, Xbox-dashboard inspired) and Music (white/silver, blue highlight, iPod model).
- **Layout is now the phone layout at every size**: the model sits centred in its glass orb, with the category name and dots underneath. The category rows stay in the DOM for keyboards and screen readers but are visually hidden. The bottom quick tabs are hidden on this screen (`html[data-pane='projects'] .osd-tabs`); Menu and Esc leave it.
- **Desktop carousel** (`initProjectsStage` in `models.ts`, hit tests in `projects.ts`): every category's model shows at once. The chosen one is big in the middle, the others sit smaller to the side (`CAROUSEL_GAP`, `SIDE_X` must stay in sync). Click a side model to bring it to the middle, click the middle one to open it. Hover does not select. No auto-cycling on desktop.
- **Phones**: one model at a time, tap to open, swipe to browse, and the categories auto-cycle until the user touches the screen. Open view: tapping a project folds the other lines away (`data-pick`) and shows its details.
- Poses: separate phone and desktop `POSE` tables, chosen live each frame. Desktop models and orb are bigger (orb `min(70%, 60vh)`).

### 3.3 Media TV (`src/scripts/tv.ts`)
- YouTube iframe driven through the postMessage API (`enablejsapi=1`). YouTube controls are off (`controls=0`, `fs=0`, `disablekb=1`); the site draws its own Play/Pause, seek, volume and mute.
- Video unloads when leaving the screen so audio cannot continue.
- Opening straight on `#media` loads the first channel.

### 3.4 About screen, intro and Reboot
- About fits one screen with no scrolling, on desktop and phones (flexible stage, tightening rules at short heights). Measured OK at 1280x800, 1440x900, 1000x600, 375x812, 375x667, 390x844. Landscape phones are not designed or tested.
- The 3D logo floats on the screen with no frame, with a soft pulsing glow behind it and a drop-shadow. "Factory output" counters (prototypes / in production / shipped) are counted from the projects collection and also switch the logo finish.
- Three-act intro (`intro.ts`): act 1 blue wireframe on white blueprint, act 2 concrete pour with flashing red lights and caution tape, act 3 CRT powers on and the metal logo drops, bounces, then flies to its resting spot in the About stage and hands over to the live stage logo. It plays on the first About visit per session. Overlay `#intro.intro-screen` is moved to `<body>`. States on `<html>`: `intro`, `intro-hold`, `boot`. Events: `intro:done` (detail `{handoff}`), `intro:replay`.
- Session flags in `sessionStorage`: `adf-intro` (intro seen), `adf-booted`, `adf-boot`. The Reboot button (top right of the About screen) clears them and replays the intro.
- Dev hook: `window.__intro.seek(t)` / `.pause(bool)` (dev builds only) for testing without waiting.
- Skipped entirely, and Reboot is hidden, when the visitor has Reduce Motion on.

### 3.5 Phone layout and gestures
- Phones and tablets have no monitor frame: a Menu button plus page dots (`.m-dots`) along the top and big thumb-sized controls below. Swipe rules are in `swipe.ts`: on a 3D model, browse what it shows; on the TV picture, change channel; elsewhere, flip pages; in an open Projects category, swipe right to step back.
- The home menu and Projects are "the object is the button": tap to open, swipe to browse, name and dots underneath.

### 3.6 CRT layer
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
| Intro overlay 0x0 and invisible | Overlay class `.intro` collided with `<html class="intro">` | Overlay class is `.intro-screen` |
| Intro overlay invisible | It sat inside `.monitor main`, which is hidden during the intro | Move it to `document.body` at the start of `run()` |
| "WebGL context lost" console warning after the intro | Our own `forceContextLoss()` cleanup triggered the listener | Remove the listener before disposing |
| Both Projects models showed on a phone-sized screen | Phone vs desktop was decided once at load, so resizing or device emulation kept the desktop carousel | Check `matchMedia(...).matches` live (`phone()` in the projects stage) |
| About overflowed or left a gap on phones | Fixed stage height and a max-height cap | Flexible stage (`flex: 1 1 8rem`, `max-height: 30rem`) and bottom padding to clear the dock |
| iPhone shows no intro, no Reboot, no spinning models, no animations | Most likely iOS Reduce Motion is on. Every effect respects `prefers-reduced-motion`. Chrome on iPhone uses the same WebKit setting. Not yet confirmed on the device | Turn off Reduce Motion in iOS Settings, Accessibility, Motion, or add an on-site Motion override (see open items) |
| Dev console shows a 500 error | Stale request from dev-server hot reloads | Ignore unless it persists after a restart |
| `public/monkey-island/` shows as modified | Game build output is gitignored but a few old files are still tracked | Optional cleanup: `git rm -r --cached public/monkey-island` |

## 7. Open items (short list)

- Mobile pass is mostly done (Austin tested on an iPhone 13 and it works as intended apart from motion). Still to review: Media and Contact on phones, landscape phones, tablets.
- Contact screen overhaul is next (not started). Ideas offered: a working rotary dial that opens GitHub and LinkedIn, an operator switchboard, a ringing phone. Austin has not picked one.
- Possible on-site Motion on/off switch that overrides the system Reduce Motion setting for this site only (default would still follow the system). Not built; waiting on Austin.
- Do not build a production-log career timeline (Austin rejected it).
- More Projects categories (Art, School, Software), each with its own theme and model.
- Replace placeholder content: sample projects, About draft text, stand-in TV channels.
- Delete unused files (verify first, `carousel.ts` still exists): `src/scripts/carousel.ts`, `src/components/ProjectSlide.astro`, `ProjectCard.astro`, `TestCard.astro`, and `cd.fbx` with `cd-textures/` once nothing references them.
- Check YouTube controls on the deployed site.

## 8. Added from the MacBook session

- This session ran on the MacBook through the desktop app bridge (folder `/Users/austindevereux/Desktop/Desktop/Filing Cabinet/ADFactory`, dev server `http://localhost:4321/ADFactory/`). The shell there cannot delete files by default, so git leaves `.lock` files under `.git`; move them aside (for example `mv .git/index.lock .git/stale-index-lock`) rather than deleting.
- Work done: the mobile pass (phone layout, swipe gestures, tap-the-object menus), the About overhaul (3D logo, three-act intro, Reboot, counters, one-screen layout, frameless stage with glow and shadow), and the Projects change (phone layout at every size, desktop carousel with click-to-select, phone-only auto-cycling). Details are in sections 3.2, 3.4 and 3.5.
- Small changes: Reboot button moved to the top right of About (on phones the "Drag to rotate" hint moved to the bottom right of the logo area); mobile About stage grows to fill spare height; Projects bottom tabs hidden; live phone/desktop checks in the Projects stage.
- Testing tip: when screenshots look dark or stale during the intro, use `window.__intro.seek(t)` and `.pause(true)` instead of waiting.

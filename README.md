# Motion Portfolio — interaction rebuild v2

Next.js App Router / React / GSAP ScrollTrigger / a small original WebGL gallery renderer.

This replaces the original generic scaffold. It reconstructs the reference's interaction structure from measured desktop and WebKit/mobile captures; it is not a claim of pixel-identical imagery or licensed typography.

## Run

Node 22 recommended. `npm install`, `npm run build`, `npm start`. For development: `npm run dev`.

## Content and media

Edit **data/projects.ts** for name, project titles, categories, descriptions, colors, email and social links. There are eleven configurable project slots. Original project-one through project-four URLs are preserved. Add your own files under **public/assets**:

- `hero.jpg`: fullscreen home image, transformed into the center canvas tile.
- `brand.svg`: optional own wordmark, used in the header.
- `portrait.jpg`: Info portrait.
- `project-01-cover.jpg` … `project-11-cover.jpg`: project covers.
- `project-01-a.jpg`, `project-01-b.jpg`, `project-01-c.jpg`, etc.: galleries. Extend the gallery array for more frames.
- Optional `video` path on a project (local mp4/webm) enables an inline, muted-by-default player with native controls.

Missing files are detected at build time. Designed numbered color plates are shown instead of broken JPEG requests. **The plates are placeholders, not reference artwork.** Adding media requires rebuilding/redeploying. Existing original flat asset filenames remain compatible.

Display typography uses an externally hosted Google Fonts stylesheet (Barlow Condensed). It is a substitute, not the reference's licensed Kaneda Gothic. No font files or original website assets are included. Replace the stylesheet with your own licensed font setup for a closer typographic match.

## What changed

- Pinned full-viewport homepage: desktop scroll drives a reversible exponential fullscreen-to-five-column collage, with outer scale 1→1.5 and damped pointer panning.
- Coarse-pointer/narrow-screen homepage: explicit tap starts a two-second transition to a three-column 2x canvas; drag, bounds, inertial release, labels and back-to-intro are separate from desktop.
- Eight-link fullscreen navigation, desktop media preview and a centered mobile menu. Keyboard trapping, Escape, inert background and scroll-lock cleanup included.
- Real category URLs for all six categories, vertically looping image planes, wheel/touch input, velocity-dependent WebGL distortion, synchronized titles/counts, keyboard controls and a non-WebGL fallback.
- Desktop projects: the intro and gallery move horizontally in response to vertical scrolling. Under 480px: vertical intro followed by a separately pinned horizontal filmstrip. Reduced-motion mode is a normal vertical reading layout.
- Gallery lightbox, Next Up progression, masked headings, route curtains, Info layout and missing-route handling.
- Safe-area spacing, stable viewport height, responsive recalculation without full-page reloads, scoped animation teardown and safe media failures.

## Validation

`.github/workflows/portfolio-qa.yml` builds the exact branch, type-checks it and runs browser tests on Chromium desktop and WebKit iPhone emulation. Screenshots, traces on failure and the test report are retained as workflow artifacts. A successful build alone is not a visual-fidelity signoff or a physical-iPhone performance test.

## Deployment

The existing Vercel project is Git-connected to main. Work is validated on `fix/reference-motion-v2` before main is fast-forwarded. No environment variables are required. Preview content defaults to noindex; update metadata before launching your final portfolio.

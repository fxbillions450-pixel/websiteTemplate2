# Motion Portfolio Scaffold
Original implementation inspired by the interaction language audited on oshanehoward.com. No third-party imagery, SVGs, copy, or source code is included.

## Run
npm install
npm run dev

## Deploy
Push to GitHub and import into Vercel, or run `npm run build && npm start`.

## Customize
1. Put JPG/PNG/WebP/SVG/video assets in `public/assets/`.
2. Edit `data/projects.ts` for projects/gallery paths.
3. Edit hero text in `app/page.tsx` and biography in `app/info/page.tsx`.
4. Main motion/layout values live in `app/globals.css`.

## Included interaction systems
- full-screen loading transition
- responsive hero reveal
- desktop scroll / mobile tap language
- draggable pointer/touch project world
- hover/tap project image activation
- full-screen staggered menu
- Lenis smooth scrolling
- GSAP ScrollTrigger reveal system
- responsive project detail/gallery template
- animated NEXT UP project navigation
- mobile 100svh handling and touch behavior
- reduced-motion fallback
- missing-asset placeholders

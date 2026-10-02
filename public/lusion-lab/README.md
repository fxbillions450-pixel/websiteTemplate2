# Motion Lab — reversible character emergence

Independent Lusion-style prototype with three representative scenes: procedural hollow-cross physics, matched RGB/depth image interaction, and an 18-second reversible portal journey. This is not a complete or frame-identical reconstruction of Lusion's website.

## Journey behavior
Scroll naturally until the cinematic section fills the viewport. It starts automatically at normal speed. There is no snap, transport slider, percentage, hold-to-slow or exit button. Upward scroll always takes control and reverses the scene.

At the end the same 3D explorer crosses the contracting corridor frame and settles against the dark page. Autoplay stops. The character stays visible without a timer while you read; continued downward scrolling moves into ordinary content. It then scrolls out with its containing section before the final footer. Reverse scroll retraces the handoff and the tunnel. No duplicate character, screenshot substitution, modal or route switch is used.

Keyboard Space pauses/resumes the cinematic motion; Escape pauses. Reduced-motion preference disables automatic progression, not native scrolling. The existing Scenes menu and depth-detail dialog remain available outside the cinematic sequence.

## Source files
`ending-handoff.js` owns the two-pass rendering and responsive final pose. `ending-handoff.css` owns the document layering. `journey-player.js` owns the cinematic coordinate and after-scroll position. `main.js` builds the original scenes. `motion-runtime.js` retains GPU tile transforms and adaptive resolution.

The `#journey-range` marker determines cinematic distance. `#continuation` is ordinary editable page content. The final `.page-footer` is outside the sticky context so the explorer does not remain fixed over the whole website.

## Run
Serve this folder with a static HTTP server. The modular source uses pinned Three.js imports from jsDelivr. The build script generates a bundled `index.html` and a completely self-contained `standalone.html`; the latter requires no library download. No original Lusion models, photographs or fonts are included. Three.js is distributed under its MIT license.

## Verification
The repository workflow runs desktop Chromium, touch-enabled Chromium and WebKit at phone widths, including actual visible-character pixel checks, stationary hold, subsequent page scroll, reversal and orientation changes. Refer to the accompanying result JSON files for executed results. Browser emulation is not a physical-phone frame-rate certification.

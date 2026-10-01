# Fluidity and responsive rendering

This pass preserves the accepted 18-second, 1x, fully-visible-entry journey and native reverse scrolling, without adding controls or changing the artwork.

- 960 wall tiles and 60 light tiles keep static instance buffers; a vertex shader evaluates the existing transforms and inverse-scale normals. Only five uniforms change each frame.
- Shader preparation happens ahead of entry. Only visible scenes render. Stationary depth/tunnel scenes stop drawing; hidden tabs stop the render loop.
- Resolution adapts within bounded steps after sustained slow or fast frame samples. It never changes the timeline duration. Mobile maximum is 1.35 device pixels per CSS pixel; desktop maximum is 1.7; adaptive minimum is 0.85 (or the lower native ratio).
- Pointer movement is coalesced per frame, reusable physics vectors avoid per-step allocations, and the depth spring is integrated in bounded steps.
- Native scroll intent remains immediate. Manual wheel steps have a short frame-rate-independent visual catch-up; automatic movement reads the fractional playback cursor. Upward intent never gets overridden by automatic forward playback.
- Resize measurements are batched and guarded. Portrait, landscape, narrow phones and tablet sizing are included in executable tests. Pinch zoom does not trigger document repositioning.

Run lusion-performance-unit.mjs and lusion-performance-qa.mjs in the same isolated environment as the main lab tests. Evidence is written to evidence/. Actual test results belong to the workflow artifact, not to this source specification.

No claim of universal 60 FPS or physical-phone validation is made. Headless/software rendering timings are not hardware performance benchmarks. This is an independent prototype, not a frame-identical copy of the reference website.

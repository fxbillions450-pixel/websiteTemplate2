# Reversible character emergence

The cinematic range remains 700svh with an 18-second forward timeline. Autoplay stops at the end of `#journey-range`, independently of the ordinary content below it.

The exit uses one WebGL renderer and the same character instance in two passes: a contracting viewport for the corridor, then a full transparent viewport for the character and glass. The character is never copied into a still image and the ending text cannot cover it with an opaque background.

The outer story contains a native sticky canvas and ordinary flowing continuation content. The final footer sits outside that sticky context, so the character releases naturally instead of remaining permanently fixed. Upward scrolling reverses the same transforms. Resizing preserves both cinematic progress and the relative position after completion.

No journey transport controls, modal, automatic route change, scroll lock or position snapping is added. The existing hero, depth-card, tunnel shaders, quality adaptation and early scene timings are retained. The helmet visor is moved forward to avoid intersecting the helmet shell.

Tests: `lusion-ending-qa.mjs` checks actual suit pixels, 3-second stationary hold, continued native scrolling, phone touch, rotation, backward traversal, multiple viewports and absence of added controls. Runtime tests cover two-pass visibility and renderer-state restoration. Browser emulation is not physical-phone performance certification.

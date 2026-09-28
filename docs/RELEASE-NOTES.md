# Motion portfolio release notes

## 2026-09-28-motion-5

The user-approved homepage, touch-entry timing, collage geometry, mobile header/menu, typography, project layouts and route-transition files remain unchanged from commit 77ef6ad15d26eaa3a6b84a7eac27a569026863b2.

This release only repairs category rendering compatibility:
- Match GLSL precision declarations in vertex and fragment stages.
- Supply a readable project-colored background when WebGL is unavailable.
- Hide an unusable canvas without disabling its wheel/pointer interaction layer.
- Add forced-no-WebGL readability/navigation checks and a real-renderer check when WebGL exists.

The source uses Barlow Condensed, DM Sans and Bodoni Moda through an external Google Fonts stylesheet. These are substitutes, not the reference's licensed typefaces. No font files or original reference artwork are distributed.

Images and copy remain configurable in data/projects.ts; place your own media in public/assets. Missing files deliberately show numbered placeholders. Mobile device approval and automated iPhone/WebKit emulation are distinct evidence; automated tests do not certify every physical device or frame-perfect visual identity.

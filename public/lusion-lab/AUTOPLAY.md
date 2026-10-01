# Journey autoplay revision

The native-scroll/WebGL engine, hero and depth renderer are unchanged. A separate small playback controller is the only automatic writer of the document scroll coordinate.

- The slider and percentage are hidden from layout and accessibility and the input is disabled. Their internal renderer bindings are retained.
- Entering the journey aligns the view and starts hands-free playback. The default run is 28 seconds of active playback, plus entry and transition time. Slow motion reduces both travel and autonomous motion.
- Manual scrolling can take priority. Pause, Leave, and reduced-motion preferences are respected. Background tabs and open dialogs do not advance the journey.
- The old outro section is removed. The end transitions to a distinct full-screen #arrival view with its own visual composition, title, focus, history, replay and return controls. The old page is invisible, inert and removed from document flow.
- Browser Back restores the journey paused, preventing a navigation loop. Forward, deep links and reload restore the destination.
- Only preview/lusion-lab-20261001 is updated. The production portfolio branch is not modified.

Run the updated scripts/lusion-lab-qa.mjs after bundling. Report actual test outcomes; these instructions are not proof of a passed run.

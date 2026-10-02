/* One continuous, reversible native-scroll timeline. No snapping, scroll locks,
 * route changes, synthetic wheel events, or per-frame playback-rate clamping.
 * The graphics loop calls step() before rendering. A fallback loop keeps the
 * ending accessible even when the optional graphics module fails to load.
 */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const journey = $('#journey'), sticky = $('.journey-sticky'), arrival = $('#arrival');
  const menuElement=$('#menu'),detailElement=$('#detail'),stageElement=$('#tunnel-stage');
  if (!journey || !sticky || !arrival) return;
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const data = { version: 'journey-emergence-001', duration: 18, playbackRate: 1,
    mode: 'before', progress: 0, renderProgress: 0, postScroll: 0, postViewport: 0, starts: 0, auto: false,
    reverse: false, fullyVisible: false, elapsed: 0 };
  window.__journeyPlayer = data;
  let top = 0, span = 1, height = 1, cursor = scrollY, lastWritten = scrollY;
  let lastTime = null, inputUntil = 0, reverse = false, armed = true;
  let touching = false, fingerY = 0, pointerActive = false, layoutDirty = true;
  let attached = false, fallbackFrame = null, previousY = scrollY, previousFull = false;
  let wasSuspended = true, lastUI = '', resizing = false;
  let lastEnding = -1, lastHeader = -1, lastFull = null, lastDark = -1, lastPost = -1;
  let visualProgress = 0, smoothingTime = null;
  const round = n => Math.round(n * 100000) / 100000;
  const hasDialog = () => Boolean(menuElement?.open || detailElement?.open);
  const isPaused = () => document.body.classList.contains('motion-paused');
  const ready = () => stageElement.dataset.ready === 'true';
  const failed = () => stageElement.classList.contains('error');
  const write = y => {
    cursor = y;
    window.scrollTo({ top: y, behavior: 'instant' });
    lastWritten = scrollY;
  };
  function measure(preserve = false) {
    const p = data.progress, post = data.postViewport, oldTop = top, oldSpan = span;
    top = journey.getBoundingClientRect().top + scrollY;
    height = sticky.clientHeight;
    span = Math.max(1, $('#journey-range').offsetHeight - height);
    if (preserve && oldSpan > 1 && p > 0 && previousY >= oldTop - 1) {
      write(top + p * span + (p >= 1 ? post * height : 0));
      previousY = scrollY;
    }
    layoutDirty = false;
  }
  function intent(direction) {
    if (hasDialog()) return;
    const relevant = scrollY >= top - height && scrollY <= top + span + height;
    if (!relevant || !direction) return;
    reverse = direction < 0;
    data.reverse = reverse;
    data.auto = false;
    armed = direction > 0;
    cursor = scrollY;
    inputUntil = performance.now() + 220;
  }
  addEventListener('wheel', e => {
    if (!e.ctrlKey && Math.abs(e.deltaY) > .1) intent(Math.sign(e.deltaY));
  }, { passive: true });
  // Touch events outlive pointercancel when the browser takes over native pan.
  addEventListener('touchstart', e => {
    if (hasDialog() || e.touches.length !== 1) return;
    touching = true; fingerY = e.touches[0].clientY;
    data.auto = false; cursor = scrollY;
  }, { passive: true });
  addEventListener('touchmove', e => {
    if (!touching || e.touches.length !== 1) return;
    const y = e.touches[0].clientY, delta = fingerY - y;
    if (Math.abs(delta) > 1) intent(Math.sign(delta));
    fingerY = y;
  }, { passive: true });
  const endTouch = () => { touching = false; inputUntil = performance.now() + 320; cursor = scrollY; };
  addEventListener('touchend', endTouch, { passive: true });
  addEventListener('touchcancel', endTouch, { passive: true });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' && e.clientX >= document.documentElement.clientWidth - 2) {
      pointerActive = true; data.auto = false;
    }
  }, { passive: true });
  addEventListener('pointerup', () => { pointerActive = false; }, { passive: true });
  addEventListener('keydown', e => {
    if (hasDialog() || e.target.closest('input,textarea,button,a,[contenteditable=true]')) return;
    if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) intent(-1);
    if (['ArrowDown', 'PageDown', 'End'].includes(e.key)) intent(1);
    // No visible transport controls. Native upward scrolling is always available.
    if (data.fullyVisible && (e.code === 'Space' || e.key === 'Escape')) {
      e.preventDefault();
      if (e.key !== 'Escape' || !isPaused()) $('#pause')?.click();
    }
  });
  $('#pause')?.addEventListener('click', () => { lastTime = null; cursor = scrollY; });
  $('#menu')?.addEventListener('close', () => { lastTime = null; cursor = scrollY; inputUntil = performance.now() + 250; });
  $('#menu')?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    data.auto = false; reverse = false; armed = true; lastTime = null;
  }));
  function updateUI(p) {
    const ending = round(smooth((p - .91) / .09) * (1 - smooth(data.postViewport / .8)));
    const dark = round(smooth((p - .86) / .07));
    if (dark !== lastDark) { lastDark = dark; journey.style.setProperty('--ending-dark', String(dark)); }
    const postY = Math.min(data.postScroll, height);
    if (postY !== lastPost) { lastPost = postY; arrival.style.transform = `translateY(${-postY}px)`; }
    if (ending !== lastEnding) { lastEnding = ending;
    arrival.style.opacity = String(ending);
    arrival.style.visibility = ending > 0 ? 'visible' : 'hidden';
    arrival.style.setProperty('--arrival-reveal', String(ending)); }
    const key = String(p > .97 && data.postViewport < .8);
    if (key !== lastUI) { lastUI = key; arrival.setAttribute('aria-hidden', String(p <= .97 || data.postViewport >= .8)); }
    // Fade over scroll distance, not a CSS mode change that repositions the stage.
    const headerFade = round(1 - smooth((scrollY - top + height * .18) / (height * .18)));
    if (headerFade !== lastHeader) { lastHeader = headerFade;
    document.documentElement.style.setProperty('--journey-header-opacity', String(headerFade)); }
    const hideHeader = data.fullyVisible || (data.progress >= 1 && data.postViewport < 2.5);
    if (lastFull !== hideHeader) { lastFull = hideHeader;
    document.body.classList.toggle('journey-full', hideHeader); }
  }
  function step(time) {
    if (resizing) { lastTime = time; return; }
    if (layoutDirty) measure();
    let y = scrollY;
    const viewportHeight = window.innerHeight;
    // Zero pre-entry movement: both edges must cover the viewport naturally.
    const full = y >= top - 1 && y <= top + span + 1 && height >= viewportHeight - 1;
    data.fullyVisible = full;
    let dt = lastTime === null ? 0 : Math.max(0, (time - lastTime) / 1000);
    lastTime = time;
    const blocked = document.hidden || hasDialog() || isPaused() || preference.matches || resizing || !ready() || failed();
    // Native scroll from touch momentum, a scrollbar, or assistive technology
    // takes priority. Never pull the reader back to a stored automatic cursor.
    const external = Math.abs(y - lastWritten) > 2;
    if (external) {
      const dy = y - previousY;
      if (dy < -2) { reverse = true; armed = false; }
      data.auto = false; cursor = y; lastWritten = y;
      inputUntil = Math.max(inputUntil, time + 90);
    }
    if (y < top - 2) { data.auto = false; armed = true; cursor = y; }
    if (blocked) { data.auto = false; cursor = y; dt = 0; }
    if (wasSuspended || !previousFull) dt = 0;
    wasSuspended = blocked;
    if (!blocked && full && !touching && !pointerActive && time >= inputUntil && !reverse && armed && y < top + span - .5) {
      if (!data.auto) { data.auto = true; data.starts++; cursor = y; dt = 0; }
      const next = Math.min(top + span, cursor + span * dt / data.duration);
      if (next > cursor) write(next);
      data.elapsed += dt;
      y = scrollY;
      if (cursor >= top + span - .5) { data.auto = false; armed = false; }
    }
    let p = clamp((y - top) / span);
    if (y >= top + span - 1) p = 1;
    data.progress = p;
    data.postScroll = Math.max(0, y - top - span);
    data.postViewport = data.postScroll / Math.max(1, height);
    // Autoplay uses its fractional cursor directly. Manual wheel steps get a
    // short, frame-rate-independent visual catch-up; input itself is never delayed.
    const visualDt = smoothingTime === null ? 1 : Math.max(0,(time-smoothingTime)/1000);
    smoothingTime = time;
    const goal = data.auto ? clamp((cursor-top)/span) : p;
    if(data.auto || preference.matches || y < top - 1 || p === 1) visualProgress = goal;
    else visualProgress += (goal-visualProgress)*(1-Math.exp(-visualDt*26));
    if(Math.abs(goal-visualProgress)<.00001)visualProgress=goal;
    data.renderProgress = visualProgress;
    data.reverse = reverse;
    data.mode = p >= 1 ? 'ended' : y < top - 1 ? 'before' : blocked && isPaused() ? 'paused' : data.auto ? 'playing' : reverse ? 'reverse' : 'manual';
    data.telemetry = { top, span, height, y, cursor, dt, blocked, touching, inputUntil, time, reverse };
    updateUI(data.renderProgress);
    previousY = y; previousFull = full;
  }
  data.step = step;
  data.connectRenderer = () => { attached = true; cancelAnimationFrame(fallbackFrame); lastTime = null; };
  function fallback(time) { step(time); if (!attached) fallbackFrame = requestAnimationFrame(fallback); }
  function resize() {
    if (resizing) return;
    const p = data.progress, post = data.postViewport, preserve = previousY >= top - 1 && p > 0;
    resizing = true;
    requestAnimationFrame(() => {
      measure();
      if (preserve) { write(top + p * span + (p >= 1 ? post * height : 0)); previousY = scrollY; data.progress = data.renderProgress = visualProgress = p; }
      lastTime = null; resizing = false;
    });
  }
  addEventListener('resize', resize, { passive: true });
  window.visualViewport?.addEventListener('resize', () => {
    // Browser-chrome changes resize the scene. Pinch zoom must not move the document.
    if(Math.abs((window.visualViewport?.scale||1)-1)<.01) resize();
  }, { passive: true });
  const observer = new ResizeObserver(() => { layoutDirty = true; });
  observer.observe(journey); observer.observe(sticky); observer.observe($('#journey-range'));
  for(const id of ['#interaction','#depth']){const element=$(id);if(element)observer.observe(element);}
  document.addEventListener('visibilitychange', () => { lastTime = null; wasSuspended = true; });
  preference.addEventListener('change', () => { data.auto = false; lastTime = null; });
  addEventListener('popstate', () => { data.auto = false; reverse = true; armed = false; lastTime = null; layoutDirty = true; });
  addEventListener('pagehide', e => { cancelAnimationFrame(fallbackFrame); if(!e.persisted)observer.disconnect(); });
  addEventListener('pageshow', e => { if(e.persisted){lastTime=null;smoothingTime=null;layoutDirty=true;wasSuspended=true;if(!attached)fallbackFrame=requestAnimationFrame(fallback);} });
  measure(); updateUI(0); fallbackFrame = requestAnimationFrame(fallback);
})();

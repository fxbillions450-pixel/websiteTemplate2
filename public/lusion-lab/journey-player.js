/* Native scroll has one writer during autoplay. The existing renderer reads
 * that same coordinate. Destination navigation never animates camera meshes.
 */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), journey=$('#journey'), sticky=$('.journey-sticky');
  const content=$('#content'), arrival=$('#arrival'), header=$('.header'), veil=$('#journey-veil');
  const toggle=$('#journey-toggle'), motionPause=$('#pause'), slowButton=$('#slow');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), duration=28;
  const data={version:'journey-autoplay-003',mode:'idle',progress:0,starts:0,arrivals:0,duration};
  window.__journeyPlayer=data;
  let top=0,length=1,height=1,raf=0,last=0,cursor=scrollY,written=scrollY;
  let mode='idle',armed=true,touching=false,manualUntil=0,startY=0,entryTime=0;
  let transitionToken=0,animation=null,restoreY=0,resizing=false,uiKey='';
  const baseURL=()=>location.pathname+location.search;
  const isPaused=()=>document.body.classList.contains('motion-paused');
  const modalOpen=()=>Boolean($('#menu')?.open||$('#detail')?.open);
  const ready=()=>$('#tunnel-stage').dataset.ready==='true';
  const failed=()=>$('#tunnel-stage').classList.contains('error')||/could not start|needs WebGL/.test($('#tunnel-stage .stage-loading').textContent);
  const nowReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  history.scrollRestoration='manual';
  function measure(){if(mode==='arrival')return;top=journey.getBoundingClientRect().top+scrollY;height=sticky.offsetHeight;length=Math.max(1,journey.offsetHeight-height);}
  function write(y){cursor=y;window.scrollTo({top:y,behavior:'instant'});written=scrollY;}
  function setMode(value){mode=value;data.mode=value;document.body.dataset.journeyMode=value;document.body.classList.toggle('journey-playing',['entering','playing','waiting'].includes(value));}
  function syncControl(){
    const paused=isPaused()||mode==='waiting',broken=failed();
    data.mode=isPaused()&&['playing','entering'].includes(mode)?'paused':mode;
    const key=data.mode+':'+paused+':'+broken;
    if(key===uiKey)return;uiKey=key;
    toggle.textContent=paused?'Play journey':'Pause';
    toggle.setAttribute('aria-pressed',String(!paused&&['playing','entering'].includes(mode)));
    toggle.setAttribute('aria-label',paused?'Play journey automatically':'Pause journey');
    $('#journey-skip').hidden=!broken;document.body.dataset.journeyMode=data.mode;
  }
  function pauseMotion(value){if(isPaused()!==value&&window.__motionLab)motionPause.click();}
  function start(fromCurrent=false){
    if(!ready()||failed()||modalOpen()||['arrival','transitioning'].includes(mode))return;
    measure();armed=true;data.starts++;manualUntil=0;
    if(fromCurrent||scrollY>=top){setMode('playing');cursor=scrollY;written=scrollY;}else{startY=scrollY;entryTime=0;setMode('entering');}
    $('#status').textContent='Journey playing automatically. You can pause, scroll, or leave at any time.';
  }
  function cancelTransition(){transitionToken++;if(animation){animation.cancel();animation=null;}veil.style.opacity='0';veil.hidden=true;document.body.style.overflow='';}
  function showArrival(){
    setMode('arrival');data.progress=1;data.arrivals++;pauseMotion(true);
    // Keep measurable renderer dimensions, but remove the old view from flow,
    // intersections, focus, hit testing and visibility. There is no old footer.
    content.classList.add('view-dormant');content.inert=true;
    header.hidden=true;header.inert=true;arrival.hidden=false;
    document.body.classList.add('arrival-page');document.title='The other side — Motion Lab';write(0);$('#arrival-title').focus({preventScroll:true});
  }
  async function finish(){
    if(['arrival','transitioning'].includes(mode))return;
    measure();restoreY=top+length*.9;write(top+length);setMode('transitioning');pauseMotion(true);content.inert=true;document.body.style.overflow='hidden';
    const token=++transitionToken;veil.hidden=false;veil.style.opacity='0';
    try{
      animation=veil.animate([{opacity:0},{opacity:1}],{duration:nowReduced()?1:760,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});await animation.finished;
      if(token!==transitionToken)return;
      history.replaceState({...history.state,motionLabReturnY:restoreY},'',baseURL()+'#journey');
      history.pushState({motionLabArrival:true,motionLabReturnY:restoreY},'',baseURL()+'#arrival');showArrival();
      animation.cancel();veil.style.opacity='1';animation=veil.animate([{opacity:1},{opacity:0}],{duration:nowReduced()?1:1000,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});await animation.finished;
      if(token!==transitionToken)return;
      animation.cancel();animation=null;veil.hidden=true;veil.style.opacity='0';document.body.style.overflow='';
    }catch(e){if(e.name!=='AbortError'){console.error(e);cancelTransition();}}
  }
  function restoreView({home=false,replay=false,y=null}={}){
    cancelTransition();arrival.hidden=true;content.classList.remove('view-dormant');content.style.top='';content.inert=false;header.hidden=false;header.inert=false;
    document.body.classList.remove('arrival-page');document.title='Motion Lab — interactive Lusion-style study';setMode(replay?'playing':home?'idle':'waiting');
    measure();armed=false;write(home?0:replay?top:(y??restoreY));data.progress=clamp((scrollY-top)/length);pauseMotion(!replay&&!home);
    if(replay){data.starts++;armed=true;}last=0;manualUntil=0;(home?$('.brand'):toggle).focus({preventScroll:true});syncControl();
    // The dormant renderer must remeasure its document coordinates on return.
    requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
  }
  function leave(){if(mode==='transitioning')cancelTransition();measure();setMode('idle');armed=false;write(Math.max(0,top-height*.92));data.progress=0;armed=true;if(location.hash==='#journey')history.replaceState({...history.state},'',baseURL()+'#depth');$('#depth-stage').focus({preventScroll:true});}
  toggle.addEventListener('click',()=>{if(['waiting','idle'].includes(mode)){pauseMotion(false);start(true);}else pauseMotion(!isPaused());syncControl();});
  $('#journey-leave').addEventListener('click',leave);$('#journey-skip').addEventListener('click',finish);
  $('#arrival-replay').addEventListener('click',()=>{history.replaceState({motionLabReturnY:restoreY},'',baseURL()+'#journey');restoreView({replay:true});});
  $('#arrival-home').addEventListener('click',()=>{history.replaceState({},'',baseURL()+'#interaction');restoreView({home:true});});
  addEventListener('popstate',()=>{if(history.state?.motionLabArrival||location.hash==='#arrival'){cancelTransition();showArrival();}else if(['arrival','transitioning'].includes(mode))restoreView({y:history.state?.motionLabReturnY??restoreY});});
  addEventListener('hashchange',()=>{if(location.hash==='#arrival'&&mode!=='arrival'){cancelTransition();showArrival();}else if(mode==='arrival'&&location.hash!=='#arrival')restoreView({home:location.hash==='#interaction'});});
  addEventListener('wheel',e=>{if(mode==='transitioning'){e.preventDefault();return;}if(['playing','entering'].includes(mode)){manualUntil=performance.now()+(e.deltaY<0?1150:450);if(mode==='entering')setMode('playing');}},{passive:false});
  addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&!e.target.closest('button,a,input')&&mode!=='arrival')touching=true;},{passive:true});
  const release=()=>{if(touching)manualUntil=performance.now()+500;touching=false;};addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&['playing','entering','waiting'].includes(mode)&&!modalOpen()){leave();return;}if(['PageUp','ArrowUp','PageDown','ArrowDown','Home','End',' '].includes(e.key)&&!e.target.closest('button,input'))manualUntil=performance.now()+(['PageUp','ArrowUp'].includes(e.key)?1150:500);});
  addEventListener('resize',()=>{const p=data.progress,active=['playing','waiting'].includes(mode);resizing=true;requestAnimationFrame(()=>{measure();if(active)write(top+p*length);resizing=false;last=0;});});
  document.addEventListener('visibilitychange',()=>{last=0;});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)pauseMotion(true);});
  $('#menu').addEventListener('close',()=>{last=0;manualUntil=performance.now()+150;});
  const resizeObserver=new ResizeObserver(()=>{if(mode!=='arrival')measure();});resizeObserver.observe(journey);
  function tick(time){
    // Playback follows elapsed visible time, not the renderer's physics timestep.
    // Pauses, menus, resizing and tab visibility consume no playback time.
    const dt=last?Math.max(0,(time-last)/1000):0;last=time;
    if(!['arrival','transitioning'].includes(mode)){
      measure();data.progress=clamp((scrollY-top)/length);
      const inEntry=top-scrollY<=height*.35&&top+journey.offsetHeight-scrollY>=height*.98;
      if(top-scrollY>height*.65){armed=true;if(mode!=='idle')setMode('idle');}
      const suspended=document.hidden||modalOpen()||resizing||isPaused();
      if(ready()&&!failed()&&!suspended){
        if(mode==='idle'&&armed&&inEntry)start();
        if(mode==='entering'&&!touching&&time>=manualUntil){entryTime+=dt;const p=clamp(entryTime/.65),e=1-(1-p)**3;write(startY+(top-startY)*e);if(p===1){setMode('playing');write(top);}}
        else if(mode==='playing'){
          if(scrollY<top-height*.35){setMode('idle');armed=false;}
          else if(!touching&&time>=manualUntil){if(Math.abs(scrollY-written)>2)cursor=scrollY;const rate=slowButton.getAttribute('aria-pressed')==='true'?.16:1;write(Math.min(top+length,Math.max(top,cursor)+length*dt/duration*rate));data.progress=clamp((scrollY-top)/length);if(data.progress>=.9998)finish();}
        }
      }
    }
    if(mode==='arrival'&&window.__motionLab)pauseMotion(true);
    syncControl();raf=requestAnimationFrame(tick);
  }
  if(location.hash==='#arrival')showArrival();else measure();raf=requestAnimationFrame(tick);
  addEventListener('pagehide',()=>{cancelAnimationFrame(raf);resizeObserver.disconnect();cancelTransition();});
})();

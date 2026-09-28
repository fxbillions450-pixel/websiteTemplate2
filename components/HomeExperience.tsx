'use client';
import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {Project,site as SiteDefinition} from '@/data/projects';
import Asset from './Asset';
import Loader from './Loader';
import {TransitionLink,useNavigation} from './SiteShell';
import gsap from 'gsap';
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const expo=(t:number)=>t<=0?0:t>=1?1:t<.5?Math.pow(2,20*t-10)/2:(2-Math.pow(2,-20*t+10))/2;
const desktopPositions=[[4,.613],[0,.613],[2,.707],[2,.071],[4,.300],[0,.300],[3,.550],[3,.236],[1,.550],[1,.236],[2,.389]];
const touchPositions=[[2,.762],[0,.762],[1,.669],[1,.180],[2,.045],[0,.045],[2,.395],[0,.395],[1,.974],[1,-.144],[1,.425]];
type MotionState={progress:number;target:number;manual:number;panX:number;panY:number;targetX:number;targetY:number;width:number;height:number;touch:boolean;reduced:boolean;opened:boolean;raf:number;time:number;motion:null|{from:number;to:number;start:number;duration:number}};
export default function HomeExperience({projects,site}:{projects:Project[];site:typeof SiteDefinition}){
 const root=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null),world=useRef<HTMLDivElement>(null),intro=useRef<HTMLDivElement>(null);
 const highlight=useRef<HTMLDivElement>(null),cards=useRef<(HTMLAnchorElement|null)[]>([]);
 const [loaded,setLoaded]=useState(false),[opened,setOpened]=useState(false),[active,setActive]=useState(-1);
 const {menuOpen}=useNavigation();const menu=useRef(menuOpen);menu.current=menuOpen;
 const model=useRef<MotionState>({progress:0,target:0,manual:0,panX:0,panY:0,targetX:0,targetY:0,width:1440,height:900,touch:false,reduced:false,opened:false,raf:0,time:0,motion:null});
 const drag=useRef({down:false,x:0,y:0,startX:0,startY:0,lastX:0,lastY:0,lastTime:0,vx:0,vy:0,moved:false,suppressUntil:0});
 const activate=()=>{
  const m=model.current;
  if(m.touch||m.reduced){if(m.motion?.to===1||m.manual===1)return;m.motion={from:m.manual,to:1,start:performance.now(),duration:m.reduced?0:2000};}
  else window.scrollTo({top:(root.current?.offsetTop||0)+m.height*2,behavior:'smooth'});
 };
 const reset=()=>{
  const m=model.current;m.targetX=m.targetY=0;setActive(-1);
  if(m.touch||m.reduced)m.motion={from:m.manual,to:0,start:performance.now(),duration:m.reduced?0:1400};
  else window.scrollTo({top:0,behavior:'smooth'});
 };
 useLayoutEffect(()=>{
  const m=model.current;let alive=true;
  const measure=()=>{
   m.touch=matchMedia('(pointer: coarse)').matches||innerWidth<768;m.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   m.width=stage.current?.clientWidth||innerWidth;m.height=stage.current?.clientHeight||innerHeight;
   if(root.current){root.current.style.height=m.touch||m.reduced?'100svh':'300svh';root.current.dataset.touch=String(m.touch);}
   if(m.reduced)m.manual=1;
  };measure();
  const render=(now:number)=>{
   if(!alive)return;const dt=Math.min(64,Math.max(1,now-(m.time||now-16)));m.time=now;
   // Keep touch progression on the canvas's own RAF clock, independent of unrelated reveal timelines.
   if(m.motion){const t=m.motion.duration?clamp((now-m.motion.start)/m.motion.duration,0,1):1;m.manual=mix(m.motion.from,m.motion.to,t);if(t===1)m.motion=null;}
   if(!menu.current)m.target=m.touch||m.reduced?m.manual:clamp((scrollY-(root.current?.offsetTop||0))/(m.height*2),0,1);
   m.progress=m.touch||m.reduced?m.target:mix(m.progress,m.target,1-Math.exp(-dt/180));if(Math.abs(m.progress-m.target)<.0004)m.progress=m.target;
   const t=expo(m.progress),scale=1+m.progress*(m.touch?1:.5),xs=m.touch?touchPositions:desktopPositions;
   const cardW=m.width*(m.touch?.28337:.15556),cardH=m.height*(m.touch?.17454:.22278);
   cards.current.forEach((el,i)=>{
    if(!el)return;const [col,row]=xs[i%xs.length],x=m.touch?m.width*(.03494+col*.32335):m.width*(.02222+col*.2),y=m.height*row;
    el.style.width=`${mix(m.width,cardW,t)}px`;el.style.height=`${mix(m.height,cardH,t)}px`;el.style.transform=`translate3d(${x*t}px,${y*t}px,0)`;el.style.setProperty('--caption',String(clamp((m.progress-.82)/.18,0,1)));
   });
   m.panX=mix(m.panX,m.targetX,1-Math.exp(-dt/130));m.panY=mix(m.panY,m.targetY,1-Math.exp(-dt/130));
   if(world.current)world.current.style.transform=`translate3d(${m.panX*t}px,${m.panY*t}px,0) scale(${scale})`;
   if(intro.current){intro.current.style.opacity=String(1-clamp((m.progress-.25)/.18,0,1));intro.current.style.pointerEvents=m.progress>.4?'none':'auto';}
   const isOpen=m.progress>.995;if(isOpen!==m.opened){m.opened=isOpen;setOpened(isOpen);root.current?.setAttribute('data-explored',String(isOpen));}
   document.body.dataset.homeTone=m.progress>.4?'dark':'light';root.current?.style.setProperty('--exploration',String(m.progress));m.raf=requestAnimationFrame(render);
  };m.raf=requestAnimationFrame(render);
  const explore=()=>activate();
  // iOS can defer compatibility clicks while text-reveal transforms are finishing.
  const touchStart=(event:TouchEvent)=>{if((event.target as Element)?.closest('.home-intro')&&root.current?.classList.contains('is-loaded')&&!m.opened&&!menu.current)activate();};
  const resize=()=>{measure();m.targetX=clamp(m.targetX,-m.width*.6,m.width*.6);m.targetY=clamp(m.targetY,-m.height*.7,m.height*.7);};
  document.addEventListener('touchstart',touchStart,{capture:true,passive:true});window.addEventListener('resize',resize);window.addEventListener('portfolio:explore',explore);
  return()=>{alive=false;cancelAnimationFrame(m.raf);document.removeEventListener('touchstart',touchStart,true);window.removeEventListener('resize',resize);window.removeEventListener('portfolio:explore',explore);delete document.body.dataset.homeTone;};
 },[]);
 useEffect(()=>{
  if(!loaded)return;
  const context=gsap.context(()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){gsap.fromTo('.hero-word',{yPercent:105},{yPercent:0,duration:1.15,stagger:.09,ease:'expo.out'});gsap.fromTo('.explore-trigger',{opacity:0,y:20},{opacity:1,y:0,duration:.8,delay:.35});}},root);
  if(location.hash==='#work')activate();return()=>context.revert();
 },[loaded]);
 useEffect(()=>{
  const m=model.current;if(active<0||!m.opened||!highlight.current)return;const [col,row]=(m.touch?touchPositions:desktopPositions)[active%11],x=m.touch?m.width*(.03494+col*.32335):m.width*(.02222+col*.2);
  gsap.to(highlight.current,{left:x-5,top:m.height*row-5,width:m.width*(m.touch?.28337:.15556)+10,height:m.height*(m.touch?.17454:.22278)+10,duration:.5,ease:'expo.out',overwrite:true});
 },[active]);
 const focusCard=(i:number)=>{
  setActive(i);const m=model.current;if(!m.opened)return;const [col,row]=(m.touch?touchPositions:desktopPositions)[i%11];
  m.targetX=clamp((.5-(m.touch?.03494+col*.32335+.141685:.02222+col*.2+.07778))*m.width*(m.touch?2:1.5),-m.width*.62,m.width*.62);m.targetY=clamp((.5-row-(m.touch?.08727:.11139))*m.height*(m.touch?2:1.5),-m.height*.85,m.height*.85);
 };
 const selected=projects[Math.max(0,active)];
 return <div ref={root} id="work" className={`home-experience ${loaded?'is-loaded':''} ${opened?'is-explored':''}`} data-version="motion-rebuild-2">
  <Loader assets={[site.hero,...projects.map(p=>p.cover)]} onReady={()=>setLoaded(true)}/>
  <section ref={stage} className="home-stage" aria-label="Interactive portfolio" onPointerDown={e=>{
   const m=model.current;if(!m.opened||menu.current||e.button!==0)return;Object.assign(drag.current,{down:true,x:e.clientX,y:e.clientY,startX:m.targetX,startY:m.targetY,lastX:e.clientX,lastY:e.clientY,lastTime:performance.now(),vx:0,vy:0,moved:false});
  }} onPointerMove={e=>{
   const m=model.current,d=drag.current;if(!m.opened||menu.current)return;
   if(d.down){const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.hypot(dx,dy)>8){d.moved=true;stage.current?.setPointerCapture(e.pointerId);}
    if(d.moved){e.preventDefault();m.targetX=clamp(d.startX+dx,-m.width*.65,m.width*.65);m.targetY=clamp(d.startY+dy,-m.height*.85,m.height*.85);const now=performance.now(),delta=Math.max(8,now-d.lastTime);d.vx=(e.clientX-d.lastX)/delta;d.vy=(e.clientY-d.lastY)/delta;d.lastX=e.clientX;d.lastY=e.clientY;d.lastTime=now;setActive(-1);}
   }else if(e.pointerType==='mouse'&&!m.touch){m.targetX=(.5-e.clientX/m.width)*m.width*.6;m.targetY=(.5-e.clientY/m.height)*m.height*.6;}
  }} onPointerUp={e=>{
   const m=model.current,d=drag.current;if(!d.down)return;d.down=false;if(d.moved){d.suppressUntil=performance.now()+350;m.targetX=clamp(m.targetX+d.vx*90,-m.width*.65,m.width*.65);m.targetY=clamp(m.targetY+d.vy*90,-m.height*.85,m.height*.85);}if(stage.current?.hasPointerCapture(e.pointerId))stage.current.releasePointerCapture(e.pointerId);
  }} onPointerCancel={()=>{drag.current.down=false;drag.current.suppressUntil=performance.now()+300;}} onKeyDown={e=>{
   if(!opened)return;const m=model.current;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();m.targetX=clamp(m.targetX+(e.key==='ArrowLeft'?90:e.key==='ArrowRight'?-90:0),-m.width*.65,m.width*.65);m.targetY=clamp(m.targetY+(e.key==='ArrowUp'?90:e.key==='ArrowDown'?-90:0),-m.height*.85,m.height*.85);}if(e.key==='Escape')reset();
  }}>
   <div ref={world} className={`home-world ${active>=0&&opened?'has-hover':''}`}>
    {projects.map((p,i)=><a key={p.slug} href={`/work/${p.slug}`} ref={el=>{cards.current[i]=el;}} className={`home-tile ${active===i?'is-active':''}`} style={{zIndex:i+1,'--caption':0} as CSSProperties} tabIndex={opened?0:-1} aria-label={`Open ${p.title}`} onFocus={()=>focusCard(i)} onMouseEnter={()=>{if(model.current.opened&&!model.current.touch)setActive(i);}} onMouseLeave={()=>setActive(-1)} onClick={e=>{e.preventDefault();if(!model.current.opened||performance.now()<drag.current.suppressUntil)return;window.dispatchEvent(new CustomEvent('portfolio:open-project',{detail:`/work/${p.slug}`}));}}><Asset src={i===projects.length-1?(site.hero||p.cover):p.cover} alt={p.title} number={p.number} palette={p.palette} priority={i===projects.length-1}/><span className="tile-caption">{p.title}</span></a>)}
    <div ref={highlight} className={`home-highlight ${active>=0&&opened?'visible':''}`}/><div className="canvas-signature" aria-hidden="true">{site.name}<small>[{site.subtitle}]</small></div>
   </div>
   <div ref={intro} className="home-intro"><h1 aria-label={site.name}>{site.name.split(' ').map((word,i)=><span className="hero-word-mask" key={i}><span className="hero-word">{word}</span></span>)}</h1>
    <button className="explore-trigger" onClick={activate}><span className="for-mouse">«« SCROLL TO EXPLORE »»</span><span className="for-touch">«« TAP TO EXPLORE »»</span></button><button className="intro-tap-surface" aria-label="Explore the portfolio" onClick={activate} tabIndex={-1}/>
   </div>
   <div className="home-work-label" aria-hidden="true"><span key={`title-${active}`} className="work-label-title">{active>=0?selected.title:''}</span><span key={`category-${active}`}>{active>=0?selected.category:''}</span></div>
   {opened&&<div className="canvas-controls"><button onClick={reset}>[BACK TO INTRO]</button><span className="for-touch">HOLD & DRAG TO EXPLORE</span><span className="for-mouse">MOVE YOUR MOUSE TO EXPLORE</span><TransitionLink href="/work-categories/advertising">[INDEX ↗]</TransitionLink></div>}
   <ProjectNavigationBridge/>
  </section>
 </div>;
}
function ProjectNavigationBridge(){const {go}=useNavigation();useEffect(()=>{const open=(e:Event)=>go((e as CustomEvent<string>).detail);window.addEventListener('portfolio:open-project',open);return()=>window.removeEventListener('portfolio:open-project',open);},[go]);return null;}

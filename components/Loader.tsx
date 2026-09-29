'use client';
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {projects} from '@/data/projects';
import Asset from './Asset';
/** Asset readiness precedes the film-stack reveal; no arbitrary fabricated loading percentages. */
export default function Loader({assets=[],onReady}:{assets?:string[];onReady?:()=>void}){
  const root=useRef<HTMLDivElement>(null),callback=useRef(onReady);callback.current=onReady;
  const [value,setValue]=useState(0),[done,setDone]=useState(false);
  useEffect(()=>{
    let cancelled=false,timeline:gsap.core.Timeline|null=null;const timers:ReturnType<typeof setTimeout>[]=[];
    const later=(fn:()=>void,ms:number)=>{const id=setTimeout(fn,ms);timers.push(id);};
    let already=false;try{already=!!sessionStorage.getItem('portfolio-loaded-v2');}catch{}
    if(already||matchMedia('(prefers-reduced-motion: reduce)').matches){setDone(true);callback.current?.();return;}
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const started=performance.now();let completed=0;
    const sources=[...new Set(assets.filter(Boolean))].slice(0,12);
    const tasks=[new Promise<void>(resolve=>{document.fonts.ready.then(()=>resolve());later(resolve,1600);}),...sources.map(src=>new Promise<void>(resolve=>{
      const image=new window.Image();image.onload=()=>resolve();image.onerror=()=>resolve();image.src=src;later(resolve,2500);
    }))];
    tasks.forEach(task=>task.then(()=>{completed++;if(!cancelled)setValue(Math.round(completed/tasks.length*100));}));
    Promise.allSettled(tasks).then(()=>{
      if(cancelled)return;
      later(()=>{
        if(cancelled||!root.current)return;setValue(100);
        const frames=root.current.querySelectorAll('.loader-film');
        timeline=gsap.timeline({onComplete:()=>{
          if(cancelled)return;try{sessionStorage.setItem('portfolio-loaded-v2','1');}catch{}
          document.body.style.overflow=previous;callback.current?.();setDone(true);
        }});
        timeline.to(root.current.querySelector('.loader-readout'),{xPercent:-65,duration:1.55,ease:'expo.out'},0)
          .to(root.current.querySelector('.loader-readout'),{xPercent:-120,autoAlpha:0,duration:.65,ease:'expo.in'},1.15)
          .fromTo(root.current.querySelector('.loader-cinema'),{scale:.9},{scale:1,duration:3.4,ease:'none'},.4)
          .fromTo(frames,{clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0)',duration:1.4,stagger:.2,ease:'power3.inOut'},.4);
      },Math.max(0,950-(performance.now()-started)));
    });
    return()=>{cancelled=true;timers.forEach(clearTimeout);timeline?.kill();document.body.style.overflow=previous;};
  },[]);
  if(done)return null;
  return <div ref={root} className="loader" role="status" aria-label="Loading portfolio">
    <div className="loader-cinema" aria-hidden="true">{projects.map((p,i)=><div className="loader-film" key={p.slug}><Asset src={assets[i]||p.cover} number={p.number} palette={p.palette} priority/></div>)}</div>
    <div className="loader-readout"><div className="loader-row"><span>LOADING</span><span aria-live="polite">{value}%</span></div><div className="loader-track"><span style={{transform:`scaleX(${value/100})`}}/></div></div>
  </div>;
}

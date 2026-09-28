'use client';
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
export default function Loader({assets=[],onReady}:{assets?:string[];onReady?:()=>void}){
  const root=useRef<HTMLDivElement>(null),callback=useRef(onReady);callback.current=onReady;
  const [value,setValue]=useState(0),[done,setDone]=useState(false);
  useEffect(()=>{
    let cancelled=false;const timers:ReturnType<typeof setTimeout>[]=[];
    const later=(fn:()=>void,ms:number)=>{const id=setTimeout(fn,ms);timers.push(id);};
    const already=sessionStorage.getItem('portfolio-loaded-v2');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(already||reduced){setDone(true);callback.current?.();return;}
    const started=performance.now();let completed=0;
    const sources=[...new Set(assets.filter(Boolean))].slice(0,12);
    const tasks=[new Promise<void>(resolve=>{document.fonts.ready.then(()=>resolve());later(resolve,1400);}),...sources.map(src=>new Promise<void>(resolve=>{
      const image=new window.Image();image.onload=()=>resolve();image.onerror=()=>resolve();image.src=src;later(resolve,2000);
    }))];
    tasks.forEach(task=>task.then(()=>{completed++;if(!cancelled)setValue(Math.round(completed/tasks.length*100));}));
    Promise.allSettled(tasks).then(()=>{
      if(cancelled)return;
      later(()=>{if(cancelled)return;setValue(100);sessionStorage.setItem('portfolio-loaded-v2','1');gsap.to(root.current,{clipPath:'inset(0 0 100% 0)',duration:.85,ease:'expo.inOut',onStart:()=>callback.current?.(),onComplete:()=>setDone(true)});},Math.max(0,850-(performance.now()-started)));
    });
    return ()=>{cancelled=true;timers.forEach(clearTimeout);gsap.killTweensOf(root.current);};
  },[]);
  if(done)return null;
  return <div ref={root} className="loader" role="status" aria-live="polite"><div className="loader-row"><span>LOADING</span><span>{value}%</span></div><div className="loader-track"><span style={{transform:`scaleX(${value/100})`}}/></div></div>;
}

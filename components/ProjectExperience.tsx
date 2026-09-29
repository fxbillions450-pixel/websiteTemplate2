'use client';
import {useLayoutEffect,useRef,useState,useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {Project} from '@/data/projects';
import Asset from './Asset';
import {TransitionLink} from './SiteShell';
gsap.registerPlugin(ScrollTrigger);
export default function ProjectExperience({project,next}:{project:Project;next:Project}){
 const root=useRef<HTMLDivElement>(null),rail=useRef<HTMLDivElement>(null),film=useRef<HTMLDivElement>(null),strip=useRef<HTMLDivElement>(null);
 const progress=useRef<HTMLDivElement>(null),lightbox=useRef<HTMLDialogElement>(null),[photo,setPhoto]=useState(0);
 const images=[project.cover,...project.gallery];
 const rotations=[project.coverRotation,...project.galleryRotations];
 useLayoutEffect(()=>{
  let active=true;const mm=gsap.matchMedia();
  const context=gsap.context(()=>{
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.from('.project-copy > *',{y:45,autoAlpha:0,stagger:.08,duration:1.05,ease:'expo.out',delay:.15});
   mm.add({desktop:'(min-width: 480px)',mobile:'(max-width: 479px)',reduce:'(prefers-reduced-motion: reduce)'},ctx=>{
    const {desktop,reduce}=ctx.conditions!;if(reduce)return;
    const target=desktop?rail.current:strip.current,trigger=desktop?root.current:film.current;
    const distance=()=>Math.max(0,(target?.scrollWidth||0)-innerWidth);
    const movement=gsap.to(target,{x:()=>-distance(),ease:'none',scrollTrigger:{trigger,start:'top top',end:()=>`+=${distance()}`,pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1,onUpdate:self=>{if(progress.current)progress.current.style.transform=`scaleX(${self.progress})`;}}});
    if(desktop){
     gsap.utils.toArray<HTMLElement>('.gallery-frame').forEach(el=>gsap.from(el.querySelector('.media'),{scale:.2,autoAlpha:0,ease:'power2.out',scrollTrigger:{trigger:el,containerAnimation:movement,start:'left 98%',end:'left 45%',scrub:true}}));
     gsap.from('.next-project-image',{scale:0,ease:'expo.out',scrollTrigger:{trigger:'.next-project',containerAnimation:movement,start:'left 95%',end:'left 35%',scrub:true}});
    }
   });
  },root);
  let width=innerWidth;const refresh=()=>{if(innerWidth!==width){width=innerWidth;ScrollTrigger.refresh();}};
  window.addEventListener('resize',refresh);document.fonts.ready.then(()=>{if(active)ScrollTrigger.refresh();});
  return()=>{active=false;window.removeEventListener('resize',refresh);mm.revert();context.revert();};
 },[]);
 useEffect(()=>{const el=lightbox.current;const unlock=()=>{document.body.style.overflow='';};el?.addEventListener('close',unlock);return()=>{el?.removeEventListener('close',unlock);document.body.style.overflow='';};},[]);
 const show=(i:number)=>{setPhoto(i);lightbox.current?.showModal();document.body.style.overflow='hidden';};
 return <main className="project-page" data-project={project.slug}>
  <div ref={root} className="project-experience"><div ref={rail} className="project-rail">
   <section className="project-intro">
    <div className="project-cover">{project.video?<video src={project.video} poster={project.cover||undefined} controls playsInline muted preload="metadata"/>:<button aria-label="Enlarge cover image" onClick={()=>show(0)}><Asset src={project.cover} alt={`${project.title} — ${project.coverName}`} number={project.number} palette={project.palette} rotation={project.coverRotation} priority/></button>}<span className="project-cover-caption">{project.coverName}</span></div>
    <div className="project-copy"><TransitionLink className="eyebrow" href={`/work-categories/${project.category.toLowerCase()}`}>[{project.category}]</TransitionLink><h1>{project.title}</h1><p>{project.description}</p><div className="project-credits"><span>[{project.year}]</span><span>Photography / Direction</span></div><span className="project-scroll-cue">SCROLL TO EXPLORE →</span></div>
   </section>
   <section ref={film} className="project-film-section" aria-label="Project gallery"><div ref={strip} className="project-film">
    {project.gallery.map((src,i)=><figure className={`gallery-frame ${i%2?'landscape':'portrait'}`} key={src}><button onClick={()=>show(i+1)} aria-label={`Enlarge ${project.galleryNames[i]}`}><Asset src={src} alt={`${project.title} — ${project.galleryNames[i]}`} number={`${project.number}.${i+1}`} palette={project.palette} rotation={project.galleryRotations[i]}/></button><figcaption><span>{project.galleryNames[i]}</span><span>{String(i+2).padStart(2,'0')} / {String(images.length).padStart(2,'0')}</span></figcaption></figure>)}
    <section className="next-project"><h2>NEXT UP</h2><TransitionLink href={`/work/${next.slug}`} className="next-project-link"><div className="next-project-image"><Asset src={next.cover} number={next.number} palette={next.palette} rotation={next.coverRotation} alt={next.title}/></div><span>[{next.category}]</span><h3>{next.title} ↗</h3></TransitionLink><TransitionLink href="/#work" className="back-to-work">[BACK TO ALL WORK]</TransitionLink></section>
   </div></section>
  </div></div>
  <div ref={progress} className="project-progress" aria-hidden="true"/>
  <dialog ref={lightbox} className="lightbox" aria-label="Image viewer" onClick={e=>{if(e.target===e.currentTarget)lightbox.current?.close();}} onKeyDown={e=>{if(e.key==='ArrowRight')setPhoto(i=>(i+1)%images.length);if(e.key==='ArrowLeft')setPhoto(i=>(i+images.length-1)%images.length);}}><button className="lightbox-close" onClick={()=>lightbox.current?.close()}>[CLOSE]</button><div className="lightbox-image"><Asset key={photo} src={images[photo]} alt={`${project.title} — ${photo===0?project.coverName:project.galleryNames[photo-1]}`} number={`${project.number}.${photo}`} palette={project.palette} rotation={rotations[photo]}/></div><div className="lightbox-controls"><button aria-label="Previous image" onClick={()=>setPhoto(i=>(i+images.length-1)%images.length)}>←</button><span>{photo===0?project.coverName:project.galleryNames[photo-1]} · {photo+1} / {images.length}</span><button aria-label="Next image" onClick={()=>setPhoto(i=>(i+1)%images.length)}>→</button></div></dialog>
 </main>;
}

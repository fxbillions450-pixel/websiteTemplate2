'use client';
import {useLayoutEffect,useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import type {site as SiteDefinition} from '@/data/projects';
import Asset from './Asset';
import {TransitionLink} from './SiteShell';
gsap.registerPlugin(ScrollTrigger);
export default function InfoExperience({site}:{site:typeof SiteDefinition}){
  const root=useRef<HTMLElement>(null);
  useLayoutEffect(()=>{
    const mm=gsap.matchMedia();mm.add('(prefers-reduced-motion: no-preference)',()=>{
      const context=gsap.context(()=>{
        gsap.from('.info-title span',{yPercent:110,stagger:.09,duration:1.2,ease:'expo.out'});
        gsap.from('.info-portrait',{clipPath:'inset(12% 8% 12% 8%)',duration:1.35,ease:'expo.out'});
        gsap.utils.toArray<HTMLElement>('[data-info-reveal]').forEach(el=>gsap.from(el,{y:50,autoAlpha:0,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}}));
      },root);return()=>context.revert();
    });return()=>mm.revert();
  },[]);
  return <main ref={root} className="info-page"><div className="info-portrait"><Asset src={site.portrait} alt={`Portrait of ${site.name}`} number="INFO" palette={['#4c5146','#cbcbb7']} priority/></div><div className="info-copy"><h1 className="info-title">{site.name.split(' ').map((word,i)=><span key={i}>{word}</span>)}</h1><p className="info-intro" data-info-reveal>{site.description}</p><section data-info-reveal><h2>ABOUT</h2><p>Replace this biography with your own story, approach and background. The portrait, name, disciplines and contact details are configured centrally, independently of the animation system.</p></section><section id="contact" data-info-reveal><h2>DIRECT INQUIRIES</h2>{site.email?<a className="info-contact" href={`mailto:${site.email}`}>{site.email} ↗</a>:<p>Add your contact email in <code>data/projects.ts</code>.</p>}</section><section data-info-reveal><h2>SELECTED WORK</h2><TransitionLink href="/work-categories/advertising">Advertising ↗</TransitionLink><TransitionLink href="/work-categories/editorial">Editorial ↗</TransitionLink><TransitionLink href="/work-categories/motion">Motion ↗</TransitionLink></section><footer data-info-reveal><span>© {site.name}. 2026</span><TransitionLink href="/">[BACK HOME]</TransitionLink></footer></div></main>;
}

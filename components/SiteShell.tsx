'use client';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname,useRouter} from 'next/navigation';
import {createContext,useCallback,useContext,useEffect,useLayoutEffect,useRef,useState,type ReactNode,type MouseEvent,type CSSProperties} from 'react';
import gsap from 'gsap';
import {categories,type Project,type site as SiteDefinition} from '@/data/projects';
import Asset from './Asset';
type Site=typeof SiteDefinition;
type NavState={go:(url:string)=>void;menuOpen:boolean};
const Navigation=createContext<NavState>({go:()=>{},menuOpen:false});
export const useNavigation=()=>useContext(Navigation);
export function TransitionLink({href,children,className='',onClick,style,ariaLabel}:{href:string;children:ReactNode;className?:string;onClick?:(e:MouseEvent<HTMLAnchorElement>)=>void;style?:CSSProperties;ariaLabel?:string}){
 const {go}=useNavigation();return <Link href={href} className={className} style={style} aria-label={ariaLabel} onClick={e=>{
  onClick?.(e);if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0)return;
  if(href.startsWith('/')&&!href.startsWith('//')){e.preventDefault();go(href);}
 }}>{children}</Link>;
}
export default function SiteShell({children,site,projects}:{children:ReactNode;site:Site;projects:Project[]}){
 const pathname=usePathname(),router=useRouter();
 const [open,setOpen]=useState(false),[mounted,setMounted]=useState(false),[preview,setPreview]=useState(0);
 const main=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDivElement>(null),toggle=useRef<HTMLButtonElement>(null);
 const curtain=useRef<HTMLDivElement>(null),pending=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),first=useRef(true);
 const close=useCallback(()=>{setOpen(false);toggle.current?.focus({preventScroll:true});},[]);
 const go=useCallback((href:string)=>{
  if(pending.current)return;const next=new URL(href,location.origin);
  if(next.pathname===location.pathname){close();if(next.hash==='#work')window.dispatchEvent(new Event('portfolio:explore'));else window.scrollTo({top:0,behavior:'smooth'});return;}
  pending.current=true;setOpen(false);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.fromTo(curtain.current,{scaleY:0,transformOrigin:'bottom'},{scaleY:1,duration:reduced?0:.38,ease:'expo.inOut',onStart:()=>curtain.current?.setAttribute('data-active','true'),onComplete:()=>{
   router.push(href,{scroll:false});timer.current=setTimeout(()=>{pending.current=false;gsap.to(curtain.current,{scaleY:0,duration:.4,onComplete:()=>curtain.current?.removeAttribute('data-active')});},5000);
  }});
 },[router,close]);
 useLayoutEffect(()=>{
  setOpen(false);setMounted(false);if(first.current){first.current=false;return;}
  if(timer.current)clearTimeout(timer.current);window.scrollTo(0,0);
  const tween=gsap.to(curtain.current,{scaleY:0,transformOrigin:'top',duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:.6,ease:'expo.inOut',onComplete:()=>{pending.current=false;curtain.current?.removeAttribute('data-active');main.current?.focus({preventScroll:true});}});
  return()=>{tween.kill();};
 },[pathname]);
 useEffect(()=>{
  if(open){setMounted(true);const id=requestAnimationFrame(()=>dialog.current?.querySelector<HTMLAnchorElement>('a')?.focus({preventScroll:true}));return()=>cancelAnimationFrame(id);}
  const id=setTimeout(()=>setMounted(false),1100);return()=>clearTimeout(id);
 },[open]);
 useEffect(()=>{
  // Only acquire/restore the scroll lock when this menu actually owns it.
  // Capturing a loader's lock on a closed menu's initial effect restored stale "hidden" later.
  if(!open){main.current?.removeAttribute('inert');return;}
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';main.current?.setAttribute('inert','');
  return()=>{document.body.style.overflow=previous;main.current?.removeAttribute('inert');};
 },[open]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);gsap.killTweensOf(curtain.current);},[]);
 const menuItems=[{name:'Home',href:'/'},...categories.map(name=>({name,href:`/work-categories/${name.toLowerCase()}`})),{name:'Info',href:'/info'}];
 const activeProject=projects[preview%projects.length];
 return <Navigation.Provider value={{go,menuOpen:open}}>
  <a className="skip-link" href="#page-content">Skip to content</a>
  <header className={`site-header ${open?'on-menu':''}`}>
   <TransitionLink href="/" className="brand" ariaLabel={`${site.name} — home`}>{site.logo?<Image src={site.logo} alt={site.name} width={160} height={66} unoptimized/>:<span>{site.name.split(' ').map((w,i)=><span key={i}>{w}</span>)}</span>}</TransitionLink>
   <span className="header-description">[{site.subtitle}]</span>
   <button ref={toggle} className="menu-toggle" aria-label={open?'[CLOSE]':'[MENU]'} aria-expanded={open} aria-controls="site-menu" onClick={()=>setOpen(v=>!v)}><span className="menu-label-window" aria-hidden="true"><span className="menu-label-open">[MENU]</span><span className="menu-label-close">[CLOSE]</span></span></button>
  </header>
  <div ref={dialog} id="site-menu" className={`site-menu ${open?'is-open':''}`} role="dialog" aria-modal="true" aria-label="Site navigation" hidden={!mounted&&!open} onKeyDown={e=>{
   if(e.key==='Escape'){e.preventDefault();close();}
   if(e.key==='Tab'){
    const links=Array.from(dialog.current?.querySelectorAll<HTMLElement>('a,button')||[]),firstLink=links[0],lastLink=links[links.length-1];
    if(e.shiftKey&&document.activeElement===firstLink){e.preventDefault();lastLink?.focus();}else if(!e.shiftKey&&document.activeElement===lastLink){e.preventDefault();firstLink?.focus();}
   }
  }}>
   <nav aria-label="Main navigation">{menuItems.map((item,index)=><span className="menu-line" key={item.name} style={{'--menu-index':index} as CSSProperties} onMouseEnter={()=>setPreview(index)} onFocus={()=>setPreview(index)}><TransitionLink href={item.href} ariaLabel={item.name}><span className="menu-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span className="menu-name">{item.name}</span><span className="menu-arrow" aria-hidden="true">↗</span></TransitionLink></span>)}</nav>
   <div className="menu-preview" key={preview}><Asset src={activeProject.cover} number={activeProject.number} palette={activeProject.palette} rotation={activeProject.coverRotation} alt=""/></div>
   <button className="menu-close-accessible" onClick={close}>Close menu</button>
   <footer className="menu-footer"><span>© {site.name}. 2026</span><span>{site.instagram&&<a href={site.instagram} rel="noopener noreferrer" target="_blank">Instagram</a>}{site.linkedin&&<a href={site.linkedin} rel="noopener noreferrer" target="_blank">LinkedIn</a>}</span></footer>
  </div>
  <div id="page-content" tabIndex={-1} ref={main} className="page-content">{children}</div>
  <div ref={curtain} className="route-curtain" aria-hidden="true"><span>{site.name}</span></div>
 </Navigation.Provider>;
}

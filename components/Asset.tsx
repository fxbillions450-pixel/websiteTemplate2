'use client';
import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
export default function Asset({src='',alt='',className='',number='01',palette=['#3d5442','#c3cbaa'],priority=false}: {
  src?:string;alt?:string;className?:string;number?:string;palette?:readonly string[];priority?:boolean;
}) {
  const [failed,setFailed]=useState(false);
  return <div className={`media ${className}`} style={{'--ink':palette[0],'--paper':palette[1]} as CSSProperties}>
    {src&&!failed ? <Image src={src} alt={alt} fill unoptimized sizes="(max-width: 479px) 100vw, 70vw" priority={priority} onError={()=>setFailed(true)} draggable={false}/> :
      <div className="media-placeholder" role="img" aria-label={alt||`Media slot ${number}`}>
        <div className="plate-shape" aria-hidden="true"/><span className="plate-kicker">YOUR IMAGE HERE</span>
        <span className="plate-number" aria-hidden="true">{number}</span><span className="plate-foot">IMAGE / {number}</span>
      </div>}
  </div>;
}

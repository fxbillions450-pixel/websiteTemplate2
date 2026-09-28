import type {Metadata,Viewport} from 'next';
import type {CSSProperties} from 'react';
import './globals.css';
import './calibration.css';
import './fidelity.css';
import SiteShell from '@/components/SiteShell';
import {getProjects,getSite} from '@/lib/content';
export const metadata:Metadata={title:{default:'Motion Portfolio',template:'%s — Motion Portfolio'},description:'An interactive image-making portfolio. Desktop scroll exploration and touch-first mobile canvas.',robots:{index:false,follow:false}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#fded05'};
export default function RootLayout({children}:{children:React.ReactNode}){
 const site=getSite();const columns=Math.max(5,...site.name.split(/\s+/).map(word=>word.length));
 return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Bodoni+Moda:wght@400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/></head><body style={{'--name-columns':columns} as CSSProperties}><SiteShell site={site} projects={getProjects()}>{children}</SiteShell></body></html>;
}

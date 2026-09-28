import type {Metadata,Viewport} from 'next';
import './globals.css';
import './calibration.css';
import SiteShell from '@/components/SiteShell';
import {getProjects,getSite} from '@/lib/content';
export const metadata:Metadata={title:{default:'Motion Portfolio',template:'%s — Motion Portfolio'},description:'An interactive image-making portfolio. Desktop scroll exploration and touch-first mobile canvas.',robots:{index:false,follow:false}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#fded05'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/></head><body><SiteShell site={getSite()} projects={getProjects()}>{children}</SiteShell></body></html>;
}

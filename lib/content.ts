import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { projects, site } from '@/data/projects';
/** Resolve local media at build time: missing user-supplied assets never generate broken-image network requests. */
export function mediaPath(src: string): string {
  if (!src || !src.startsWith('/assets/') || src.includes('..')) return '';
  return existsSync(path.join(process.cwd(),'public',src)) ? src : '';
}
export function getProjects() {
  return projects.map(p=>({...p,cover:mediaPath(p.cover),gallery:p.gallery.map(mediaPath),video:p.video?mediaPath(p.video):undefined}));
}
export function getSite() { return {...site,hero:mediaPath(site.hero),portrait:mediaPath(site.portrait),logo:mediaPath(site.logo)}; }

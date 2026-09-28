import {notFound} from 'next/navigation';
import {projects} from '@/data/projects';
import {getProjects} from '@/lib/content';
import ProjectExperience from '@/components/ProjectExperience';
export function generateStaticParams(){return projects.map(p=>({slug:p.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return{title:projects.find(p=>p.slug===slug)?.title||'Project'};}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const all=getProjects(),i=all.findIndex(p=>p.slug===slug);if(i<0)notFound();
  return <ProjectExperience project={all[i]} next={all[(i+1)%all.length]}/>;
}

import {notFound} from 'next/navigation';
import {categories} from '@/data/projects';
import {getProjects} from '@/lib/content';
import CategoryExperience from '@/components/CategoryExperience';
export function generateStaticParams(){return categories.map(c=>({category:c.toLowerCase()}));}
export async function generateMetadata({params}:{params:Promise<{category:string}>}){const {category}=await params;return{title:categories.find(c=>c.toLowerCase()===category)||'Work'};}
export default async function CategoryPage({params}:{params:Promise<{category:string}>}){
  const {category}=await params,label=categories.find(c=>c.toLowerCase()===category);if(!label)notFound();
  const projects=getProjects().filter(p=>p.categories.includes(label));
  return <CategoryExperience category={label} projects={projects}/>;
}

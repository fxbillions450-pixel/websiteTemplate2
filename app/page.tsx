import HomeExperience from '@/components/HomeExperience';
import {getProjects,getSite} from '@/lib/content';
export default function Home(){return <main><HomeExperience projects={getProjects()} site={getSite()}/></main>;}

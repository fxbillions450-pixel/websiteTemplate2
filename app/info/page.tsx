import InfoExperience from '@/components/InfoExperience';
import {getSite} from '@/lib/content';
export const metadata={title:'Info'};
export default function Info(){return <InfoExperience site={getSite()}/>;}

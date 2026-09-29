import photoProjects from './photo-projects.json';

export const categories = ['Entertainment', 'Editorial', 'Portrait', 'Exhibitions'] as const;
export type Category = typeof categories[number];
export type Project = {
  slug: string; title: string; category: Category; categories: Category[]; year: string;
  description: string; cover: string; coverName: string; coverRotation: number;
  gallery: string[]; galleryNames: string[]; galleryRotations: number[]; video?: string;
  palette: [string, string]; number: string;
};
export const site = {
  name: 'Andy Lorgis', shortName: 'AL',
  subtitle: 'Photographer, Creative Director & Filmmaker',
  description: 'An independent practice in image-making, art direction and moving image.',
  email: '', instagram: '', linkedin: '',
  hero: '/assets/projects/5e-soirees-de-louange-sandra/01.jpg',
  portrait: '/assets/projects/7e-soiree-de-louange-sandra/02.jpg',
  logo: '/assets/brand.svg',
};
const descriptions = [
  'Photographic coverage of the 5e soirées de louange Sandra.',
  'Photographic coverage of the 6e soirée de Louanges Sandra.',
  'Photographic coverage of the 7e Soirée de Louange Sandra.',
  'A photographic series from the Masterclass Festival Gospel 2026.',
];
export const projects: Project[] = photoProjects.map((project,index) => ({
  slug:project.slug,title:project.title,category:index===3?'Exhibitions':'Entertainment',
  categories:index===3?['Exhibitions','Editorial','Portrait']:['Entertainment','Editorial','Portrait'],
  year:'2026',number:String(index+1).padStart(2,'0'),palette:project.palette as [string,string],
  description:descriptions[index],cover:project.images[0]?.src??'',coverName:project.images[0]?.name??'',
  coverRotation:project.images[0]?.rotation??0,
  gallery:project.images.slice(1).map(image=>image.src),galleryNames:project.images.slice(1).map(image=>image.name),
  galleryRotations:project.images.slice(1).map(image=>image.rotation??0),
}));
export const getProject = (slug: string) => projects.find(p=>p.slug===slug);
export const categorySlug = (category: string) => category.toLowerCase();

export const categories = ['Advertising', 'Editorial', 'Motion', 'Portrait', 'Entertainment', 'Exhibitions'] as const;
export type Category = typeof categories[number];
export type Project = {
  slug: string; title: string; category: Category; categories: Category[]; year: string;
  description: string; cover: string; gallery: string[]; video?: string;
  palette: [string, string]; number: string;
};
export const site = {
  name: 'YOUR NAME', shortName: 'YN',
  subtitle: 'Photographer, Creative Director & Filmmaker',
  description: 'An independent practice in image-making, art direction and moving image.',
  email: '', instagram: '', linkedin: '',
  hero: '/assets/hero.jpg', portrait: '/assets/portrait.jpg', logo: '/assets/brand.svg',
};
const names = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven'];
const groups: Category[] = ['Advertising','Editorial','Motion','Portrait','Editorial','Entertainment','Portrait','Advertising','Motion','Entertainment','Exhibitions'];
const tones: [string,string][] = [
  ['#75423c','#e3b9a6'],['#2d473e','#b8c4ad'],['#344961','#b1c2d3'],['#685645','#d9c5a8'],
  ['#624943','#d9b8b4'],['#333745','#abb5c9'],['#5c6551','#d3d9b8'],['#7b5639','#efd0a5'],
  ['#62494f','#e1c3cb'],['#375259','#b4d2d1'],['#3d5442','#c3cbaa'],
];
/** Replace only this configuration and the files in public/assets. Animation code is independent of content. */
export const projects: Project[] = names.map((name,i) => {
  const number = String(i+1).padStart(2,'0');
  return {slug:`project-${name}`,title:`PROJECT ${name.toUpperCase()}`,category:groups[i],
    categories: [groups[i], ...(i===10 ? ['Advertising' as Category] : [])],year:'2026',number,palette:tones[i],
    description:'Add your project story here. Describe the idea, your role, and the people behind the work. All text and media are editable in data/projects.ts.',
    cover:`/assets/project-${number}-cover.jpg`,
    gallery:['a','b','c'].map(letter=>`/assets/project-${number}-${letter}.jpg`),
  };
});
export const getProject = (slug: string) => projects.find(p=>p.slug===slug);
export const categorySlug = (category: string) => category.toLowerCase();

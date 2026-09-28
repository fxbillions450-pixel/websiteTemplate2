export type Project={slug:string;title:string;category:string;year:string;description:string;cover:string;gallery:string[]};
export const projects:Project[]=[
{slug:'project-one',title:'PROJECT ONE',category:'ADVERTISING',year:'2026',description:'Replace this copy with your project description.',cover:'/assets/project-01-cover.jpg',gallery:['/assets/project-01-a.jpg','/assets/project-01-b.jpg','/assets/project-01-c.jpg']},
{slug:'project-two',title:'PROJECT TWO',category:'EDITORIAL',year:'2026',description:'A second configurable project.',cover:'/assets/project-02-cover.jpg',gallery:['/assets/project-02-a.jpg','/assets/project-02-b.jpg']},
{slug:'project-three',title:'PROJECT THREE',category:'MOTION',year:'2026',description:'Motion project placeholder.',cover:'/assets/project-03-cover.jpg',gallery:['/assets/project-03-a.jpg','/assets/project-03-b.jpg']},
{slug:'project-four',title:'PROJECT FOUR',category:'PORTRAIT',year:'2026',description:'Portrait project placeholder.',cover:'/assets/project-04-cover.jpg',gallery:['/assets/project-04-a.jpg','/assets/project-04-b.jpg']}];
export const getProject=(slug:string)=>projects.find(p=>p.slug===slug);

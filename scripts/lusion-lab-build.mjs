import {build} from 'esbuild';
import fs from 'node:fs/promises';
await build({entryPoints:['site/main.js'],bundle:true,format:'iife',minify:true,target:['es2022'],outfile:'site/bundle.js',legalComments:'inline'});
let html=await fs.readFile('site/index.html','utf8');
html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'').replace(/<script type="module">[\s\S]*?<\/script>/,'<script src="./bundle.js"></script>');
await fs.writeFile('site/index.html',html);
let standalone=html;
for(const file of ['style.css','journey-player.css']){
 const text=await fs.readFile('site/'+file,'utf8');
 standalone=standalone.replace(`<link rel="stylesheet" href="./${file}">`,()=>'<style>'+text+'</style>');
}
for(const file of ['bundle.js','journey-player.js']){
 const text=await fs.readFile('site/'+file,'utf8');
 standalone=standalone.replace(`<script src="./${file}"></script>`,()=>'<script>'+text.replace(/<\/script/gi,'<\\/script')+'</script>');
}
await fs.writeFile('site/standalone.html',standalone);
await fs.copyFile('node_modules/three/LICENSE','THREE-LICENSE.txt');
console.log('Created source-equivalent offline page including autoplay, destination route and styles.');

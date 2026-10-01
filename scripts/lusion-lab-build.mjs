import {build} from 'esbuild';
import fs from 'node:fs/promises';
const output=await build({entryPoints:['site/main.js'],bundle:true,format:'iife',minify:true,target:['es2022'],write:false,legalComments:'inline'});
const engine=output.outputFiles[0].text;
const loader=`(()=>{let loading;window.__startMotionLab=()=>{if(loading)return loading;try{${engine}loading=Promise.resolve(window.__motionLab);}catch(error){document.querySelectorAll('.stage-loading').forEach(el=>el.textContent='Graphics could not start. Reload this page with WebGL enabled.');console.error(error);loading=Promise.resolve(null);}return loading;};if(location.hash!=='#arrival')window.__startMotionLab();})();`;
await fs.writeFile('site/bundle.js',loader);
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
console.log('Created source-equivalent offline page with lazy graphics on the destination.');

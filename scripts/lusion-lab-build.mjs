import {build} from 'esbuild';
import fs from 'node:fs/promises';
const result = await build({entryPoints:['site/main.js'],bundle:true,format:'iife',minify:true,target:['es2022'],write:false,legalComments:'inline'});
await fs.writeFile('site/bundle.js', result.outputFiles[0].text);
let html = await fs.readFile('site/index.html','utf8');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/,'').replace(/<script type="module">[\s\S]*?<\/script>/,'<script src="./bundle.js"></script>');
await fs.writeFile('site/index.html',html);
let standalone = html;
for (const f of ['style.css','journey-player.css','ending-handoff.css']) {
 const css = await fs.readFile('site/'+f,'utf8');
 standalone = standalone.replace(new RegExp('<link\\b[^>]*href="\\./'+f.replace('.','\\.')+'"[^>]*>'),()=>'<style>'+css+'</style>');
}
for (const f of ['journey-player.js','bundle.js']) {
 const code = await fs.readFile('site/'+f,'utf8');
 standalone = standalone.replace(`<script src="./${f}"></script>`,()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');
}
if (/<(?:script|link)[^>]*(?:src|href)="\.\//.test(standalone)) throw new Error('Standalone contains a local dependency');
await fs.writeFile('site/standalone.html',standalone);
await fs.copyFile('node_modules/three/LICENSE','THREE-LICENSE.txt');
console.log('Built continuous-scroll source and self-contained offline HTML.');

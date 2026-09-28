'use client';
import {useEffect,useRef,useState} from 'react';
import type {Project} from '@/data/projects';
import Asset from './Asset';
import {TransitionLink,useNavigation} from './SiteShell';
const mod=(n:number,d:number)=>((n%d)+d)%d;
const limit=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
/** Matching precision across shader stages is required for shared uniforms and varyings. */
const vertex=`precision mediump float;attribute vec2 aPosition;uniform vec4 uRect;uniform vec2 uViewport;uniform float uVelocity;varying vec2 vUv;
void main(){vUv=aPosition;vec2 p=uRect.xy+aPosition*uRect.zw;
p.x+=sin(aPosition.y*3.14159265)*uVelocity*32.0;
p.y+=sin(aPosition.x*3.14159265)*uVelocity*9.0;
gl_Position=vec4(p.x/uViewport.x*2.0-1.0,1.0-p.y/uViewport.y*2.0,0.0,1.0);}`;
const fragment=`precision mediump float;uniform sampler2D uImage;uniform vec2 uTextureSize;uniform vec2 uBoxSize;uniform float uVelocity;varying vec2 vUv;
void main(){vec2 uv=vUv;float a=uTextureSize.x/uTextureSize.y;float b=uBoxSize.x/uBoxSize.y;
if(a>b)uv.x=(uv.x-.5)*b/a+.5;else uv.y=(uv.y-.5)*a/b+.5;
vec4 color=texture2D(uImage,uv);float shift=uVelocity*.0008;color.r=texture2D(uImage,uv+vec2(shift,0.)).r;color.b=texture2D(uImage,uv-vec2(shift,0.)).b;gl_FragColor=color;}`;
export default function CategoryExperience({category,projects}:{category:string;projects:Project[]}){
  const root=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const model=useRef({target:0,current:0,pitch:600,velocity:0,width:1440,height:900,active:0,reduced:false});
  const [active,setActive]=useState(0),[gpu,setGpu]=useState(false);const {go,menuOpen}=useNavigation();const menu=useRef(menuOpen);menu.current=menuOpen;
  const drag=useRef({down:false,startY:0,lastY:0,lastTime:0,velocity:0,moved:false});
  const selected=projects[active]||projects[0];
  useEffect(()=>{
    if(!canvas.current||!projects.length)return;
    const el=canvas.current,m=model.current;let alive=true,raf=0,lastTime=0;
    const gl=(()=>{try{return el.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});}catch{return null;}})();
    let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null;
    const textures:{texture:WebGLTexture|null;width:number;height:number}[]=[];
    const images:HTMLImageElement[]=[];
    const shader=(type:number,source:string)=>{if(!gl)return null;const s=gl.createShader(type);if(!s)return null;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);return null;}return s;};
    if(gl){
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
      if(vs&&fs){program=gl.createProgram();if(program){gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);program=null;}}gl.deleteShader(vs);gl.deleteShader(fs);}
      if(program){
        gl.useProgram(program);const points:number[]=[];
        for(let y=0;y<24;y++)for(let x=0;x<24;x++)points.push(x/24,y/24,(x+1)/24,y/24,x/24,(y+1)/24,x/24,(y+1)/24,(x+1)/24,y/24,(x+1)/24,(y+1)/24);
        buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
        const attribute=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
        projects.forEach(p=>{
          const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          const plate=document.createElement('canvas');plate.width=512;plate.height=640;const c=plate.getContext('2d')!;
          c.fillStyle=p.palette[0];c.fillRect(0,0,512,640);const grad=c.createLinearGradient(0,0,512,640);grad.addColorStop(0,p.palette[1]);grad.addColorStop(1,p.palette[0]);c.fillStyle=grad;c.beginPath();c.arc(380,260,285,0,Math.PI*2);c.fill();c.fillStyle=p.palette[1];c.font='900 250px Arial';c.fillText(p.number,20,560);c.font='500 13px Arial';c.fillText('YOUR IMAGE HERE',25,35);c.fillText('IMAGE / '+p.number,25,610);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,plate);const data={texture,width:512,height:640};textures.push(data);
          if(p.cover){const image=new Image();images.push(image);image.onload=()=>{if(!alive)return;data.width=image.naturalWidth;data.height=image.naturalHeight;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);};image.src=p.cover;}
        });setGpu(true);
      }
    }
    const uniform=(name:string)=>gl&&program?gl.getUniformLocation(program,name):null;
    const uniforms={rect:uniform('uRect'),viewport:uniform('uViewport'),velocity:uniform('uVelocity'),textureSize:uniform('uTextureSize'),box:uniform('uBoxSize')};
    const resize=()=>{const ratio=m.target/m.pitch;m.width=root.current?.clientWidth||innerWidth;m.height=root.current?.clientHeight||innerHeight;m.pitch=m.height*.82;m.target=ratio*m.pitch;m.current=m.target;m.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const dpr=Math.min(devicePixelRatio||1,2);el.width=Math.round(m.width*dpr);el.height=Math.round(m.height*dpr);gl?.viewport(0,0,el.width,el.height);};
    resize();
    const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);let color=rgb(projects[0].palette[1]);
    const render=(time:number)=>{
      if(!alive)return;const dt=Math.min(64,Math.max(1,time-(lastTime||time-16)));lastTime=time;
      const previous=m.current;m.current=m.reduced?m.target:m.current+(m.target-m.current)*(1-Math.exp(-dt/130));m.velocity=limit((m.current-previous)/dt,-2.6,2.6);
      const index=mod(Math.round(m.current/m.pitch),projects.length);if(index!==m.active){m.active=index;setActive(index);}
      const desired=rgb(projects[index].palette[1]);color=color.map((v,i)=>v+(desired[i]-v)*.045);
      if(gl&&program){
        gl.clearColor(color[0],color[1],color[2],1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(uniforms.viewport,m.width,m.height);gl.uniform1f(uniforms.velocity,m.reduced?0:m.velocity);
        const base=Math.round(m.current/m.pitch),mobile=m.width<768;
        const height=m.height*(mobile?.59:.67),width=mobile?m.width*.79:Math.min(m.width*.34,height*.9);
        for(let slot=base-2;slot<=base+2;slot++){
          const idx=mod(slot,projects.length),tex=textures[idx],y=(m.height-height)/2+slot*m.pitch-m.current;
          if(y>m.height+80||y+height< -80)continue;
          gl.bindTexture(gl.TEXTURE_2D,tex.texture);gl.uniform4f(uniforms.rect,(m.width-width)/2,y,width,height);gl.uniform2f(uniforms.textureSize,tex.width,tex.height);gl.uniform2f(uniforms.box,width,height);gl.drawArrays(gl.TRIANGLES,0,24*24*6);
        }
      }
      raf=requestAnimationFrame(render);
    };raf=requestAnimationFrame(render);
    const wheel=(e:WheelEvent)=>{if(menu.current)return;e.preventDefault();m.target+=(Math.abs(e.deltaY)>Math.abs(e.deltaX)?e.deltaY:e.deltaX)*(e.deltaMode===1?16:1)*.75;};
    el.addEventListener('wheel',wheel,{passive:false});window.addEventListener('resize',resize);
    const lost=(e:Event)=>{e.preventDefault();setGpu(false);};el.addEventListener('webglcontextlost',lost);
    return()=>{alive=false;cancelAnimationFrame(raf);el.removeEventListener('wheel',wheel);el.removeEventListener('webglcontextlost',lost);window.removeEventListener('resize',resize);images.forEach(i=>{i.onload=null;});textures.forEach(t=>gl?.deleteTexture(t.texture));if(buffer)gl?.deleteBuffer(buffer);if(program)gl?.deleteProgram(program);};
  },[projects]);
  const step=(direction:number)=>{const m=model.current;m.target=(Math.round(m.target/m.pitch)+direction)*m.pitch;};
  return <main ref={root} className="category-experience" style={{backgroundColor:selected.palette[1],color:'#000'}} tabIndex={0} aria-label={`${category} project explorer`} onKeyDown={e=>{
    if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(e.key)){e.preventDefault();step(e.key==='ArrowDown'||e.key==='ArrowRight'?1:-1);}
  }}>
    <canvas ref={canvas} className="category-canvas" style={{opacity:gpu?1:0}} data-renderer={gpu?'webgl':'fallback'} aria-label="Scroll or swipe through projects" onPointerDown={e=>{if(menu.current||e.button!==0)return;Object.assign(drag.current,{down:true,startY:e.clientY,lastY:e.clientY,lastTime:performance.now(),velocity:0,moved:false});e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{
      const d=drag.current;if(!d.down)return;const now=performance.now(),delta=d.lastY-e.clientY;model.current.target+=delta;d.velocity=delta/Math.max(8,now-d.lastTime);d.lastY=e.clientY;d.lastTime=now;if(Math.abs(e.clientY-d.startY)>8)d.moved=true;
    }} onPointerUp={e=>{
      const d=drag.current,m=model.current;if(!d.down)return;d.down=false;if(d.moved)m.target+=d.velocity*130;
      else if(Math.abs(e.clientX-m.width/2)<m.width*(m.width<768?.4:.18)&&Math.abs(e.clientY-m.height/2)<m.height*.34)go(`/work/${projects[m.active].slug}`);
      if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    }} onPointerCancel={()=>{drag.current.down=false;}}/>
    {!gpu&&<div className="category-fallback"><Asset src={selected.cover} number={selected.number} palette={selected.palette} alt={selected.title}/></div>}
    <div className="category-heading"><span className="category-heading-title" key={selected.slug}>{selected.title}</span><h1>{category}</h1></div>
    <div className="category-bottom"><div className="category-pager"><button onClick={()=>step(-1)} aria-label="Previous project">↑</button><span aria-live="polite">{String(active+1).padStart(2,'0')} / {String(projects.length).padStart(2,'0')}</span><button onClick={()=>step(1)} aria-label="Next project">↓</button></div><span className="category-instruction">SCROLL / SWIPE TO EXPLORE</span><TransitionLink href={`/work/${selected.slug}`} className="category-open">[VIEW PROJECT ↗]</TransitionLink></div>
  </main>;
}

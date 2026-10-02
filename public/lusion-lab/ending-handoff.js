/* Two passes, one renderer and one character. The corridor contracts into its
 * own viewport; the explorer and glass are drawn over the full transparent
 * canvas. The ordinary document behind it is never hidden or reparented.
 * No animation timers: identical scroll coordinates give identical poses.
 */
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
export function endingPose(width,height,postViewport=0){
 const portrait=width/height<.85, smallLandscape=height<500&&width>height;
 const drift=smooth((postViewport-.1)/1.25);
 return {
  x:portrait ? .50+.29*smooth((postViewport-.1)/.5) : .71+.09*drift,
  y:portrait ? .63-.12*drift : .53-.03*drift,
  scale:(portrait?.82:smallLandscape?.87:1.1)*(1-.20*drift)
 };
}
export function composeEmergence(s,backdrop,character,glass,progress){
 const reveal=smooth((progress-.87)/.13);
 if(reveal===0){s.renderer.render(s.scene,s.camera);return;}
 const r=s.renderer,scene=s.scene;
 const bg=scene.background,oldAuto=r.autoClear,oldAlpha=r.getClearAlpha();
 const charVisible=character.visible,glassVisible=glass.visible,fogDensity=scene.fog?.density;
 r.autoClear=false;
 try{
  r.setScissorTest(false);r.setViewport(0,0,s.width,s.height);
  scene.background=null;r.setClearColor(0x000000,0);r.clear(true,true,true);
  const scale=1-reveal;
  if(scale>.001){
   const w=Math.max(1,s.width*scale),h=Math.max(1,s.height*scale);
   const x=(s.width-w)/2,y=(s.height-h)/2;
   r.setViewport(x,y,w,h);r.setScissor(x,y,w,h);r.setScissorTest(true);
   backdrop.visible=true;character.visible=false;glass.visible=false;
   scene.background=bg;r.render(scene,s.camera);
  }
  // Discard the backdrop's depth, not its color; the explorer may cross the frame.
  r.setScissorTest(false);r.setViewport(0,0,s.width,s.height);r.clearDepth();
  backdrop.visible=false;character.visible=charVisible;glass.visible=glassVisible;
  scene.background=null;if(scene.fog)scene.fog.density=fogDensity*(1-reveal);
  r.render(scene,s.camera);
 }finally{
  backdrop.visible=true;character.visible=charVisible;glass.visible=glassVisible;
  scene.background=bg;if(scene.fog)scene.fog.density=fogDensity;
  r.autoClear=oldAuto;r.setClearAlpha(oldAlpha);r.setScissorTest(false);r.setViewport(0,0,s.width,s.height);
 }
}

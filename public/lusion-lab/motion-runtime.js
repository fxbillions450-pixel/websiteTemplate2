/** Runtime-only optimizations. Geometry, palettes and the 18-second timeline
 * remain authored in main.js. No scroll interception, snapping or UI controls.
 */
export class FrameBudget {
  constructor(maxRatio, minRatio = .85) {
    this.max = maxRatio; this.min = Math.min(minRatio, maxRatio);
    this.ratio = maxRatio; this.ema = 16.67; this.samples = 0;
    this.slowMs = 0; this.fastMs = 0; this.cooldown = 1400;
  }
  sample(ms) {
    // Don't mistake first-frame compilation, tab restoration or a screenshot
    // stall for sustained graphics load.
    if (!Number.isFinite(ms) || ms < 3 || ms > 120) return false;
    this.ema += (ms - this.ema) * .07; this.samples++;
    this.cooldown = Math.max(0, this.cooldown - ms);
    this.slowMs = this.ema > 23 ? this.slowMs + ms : 0;
    this.fastMs = this.ema < 17.8 ? this.fastMs + ms : 0;
    if (this.cooldown || this.samples < 35) return false;
    let next = this.ratio;
    if (this.slowMs > 1100) next = Math.max(this.min, this.ratio - .15);
    else if (this.fastMs > 7000) next = Math.min(this.max, this.ratio + .1);
    if (Math.abs(next - this.ratio) < .001) return false;
    this.ratio = Math.round(next * 100) / 100;
    this.slowMs = this.fastMs = 0; this.cooldown = 3000;
    return true;
  }
}

/** Compute the original 960 tile transforms on the GPU instead of allocating
 * and uploading their matrices on the main thread every frame. Each instance
 * retains the original row/side/column and identical XYZ rotation order.
 */
export function createTunnelTiles(T, scene, material, lightMaterial) {
  const uniforms = {
    uTravel: { value: 0 }, uRadius: { value: 4.7 },
    uFold: { value: 0 }, uBright: { value: 0 }, uProgress: { value: 0 }
  };
  const common = `
    attribute vec3 aTile;
    uniform float uTravel, uRadius, uFold, uBright, uProgress;
    mat3 tileRX(float a){ float s=sin(a),c=cos(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c); }
    mat3 tileRY(float a){ float s=sin(a),c=cos(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c); }
    mat3 tileRZ(float a){ float s=sin(a),c=cos(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.); }
    void tileFrame(out vec3 center,out vec3 scale,out mat3 basis){
      float z=5.-mod(aTile.x*3.6+uTravel,108.);
      float depth=(5.-z)/108.;
      float twist=uFold*(depth*2.8+sin(depth*8.)*.35);
      float along=aTile.z*uRadius/4.;
      bool horizontal=mod(aTile.y,2.)<.5;
      float x=horizontal?along:(aTile.y<1.5?uRadius:-uRadius);
      float y=horizontal?(aTile.y<.5?uRadius:-uRadius):along;
      center=vec3(x*cos(twist)-y*sin(twist)+sin(depth*4.5+uProgress*3.)*uFold*4.,
                  x*sin(twist)+y*cos(twist)+sin(depth*5.4)*uFold*2.5,z);
      scale=vec3(horizontal?uRadius*.24:.36,horizontal?.36:uRadius*.24,mix(3.36,2.8,uBright));
      basis=tileRX(horizontal?uFold*sin(depth*6.)*.32:0.)
           *tileRY(horizontal?0.:uFold*sin(depth*5.)*.35)*tileRZ(twist);
    }`;
  function make(count, mat, isLight) {
    const geometry = new T.BoxGeometry(1, 1, 1);
    const attributes = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      attributes[i*3] = Math.floor(i/(isLight?2:32));
      attributes[i*3+1] = isLight ? i%2 : Math.floor(i%32/8);
      attributes[i*3+2] = isLight ? 0 : i%8-3.5;
    }
    geometry.setAttribute('aTile', new T.InstancedBufferAttribute(attributes, 3));
    const mesh = new T.InstancedMesh(geometry, mat, count);
    const identity = new T.Matrix4();
    for (let i=0; i<count; i++) mesh.setMatrixAt(i,identity);
    mesh.instanceMatrix.setUsage(T.StaticDrawUsage);
    mesh.frustumCulled = false;
    mat.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      if (isLight) {
        shader.vertexShader = 'attribute vec3 aTile;uniform float uTravel,uRadius;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
          vec3 transformed=position*vec3(.05,.09,1.6)
            +vec3(aTile.y<.5?-uRadius*.985:uRadius*.985,-uRadius*.72,5.-mod(aTile.x*3.6+uTravel,108.));`);
      } else {
        shader.vertexShader = common + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          vec3 tileCenter,tileScale;mat3 tileBasis;
          tileFrame(tileCenter,tileScale,tileBasis);
          #include <beginnormal_vertex>
          objectNormal=tileBasis*(objectNormal/tileScale);`);
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
          'vec3 transformed=tileBasis*(position*tileScale)+tileCenter;');
      }
    };
    mat.customProgramCacheKey = () => isLight ? 'motion-light-tiles-v1' : 'motion-tunnel-tiles-v1';
    scene.add(mesh); return mesh;
  }
  const blocks=make(960,material,false), lights=make(60,lightMaterial,true);
  return {blocks,lights,update(progress,travel,radius,fold,bright){
    uniforms.uProgress.value=progress; uniforms.uTravel.value=travel;
    uniforms.uRadius.value=radius; uniforms.uFold.value=fold; uniforms.uBright.value=bright;
  },dispose(){blocks.geometry.dispose();lights.geometry.dispose();blocks.dispose();lights.dispose();}};
}

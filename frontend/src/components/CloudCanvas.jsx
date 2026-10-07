import React, { useEffect, useRef } from 'react';
import { vertexShader, fragmentShader } from '../shaders/clouds.js';
export default function CloudCanvas({ progress = 0.5, seed = 2, thermal = false, playing = false, difference = false, className = '' }) {
  const ref = useRef(null); const uniforms = useRef({});
  useEffect(() => {
    const canvas = ref.current; const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    const compile = (type, source) => { const shader=gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader); if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(shader));return null;} return shader; };
    const vs=compile(gl.VERTEX_SHADER,vertexShader), fs=compile(gl.FRAGMENT_SHADER,fragmentShader); if(!vs||!fs)return;
    const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    uniforms.current={t:gl.getUniformLocation(program,'t'),seed:gl.getUniformLocation(program,'seed'),thermal:gl.getUniformLocation(program,'thermal'),resolution:gl.getUniformLocation(program,'resolution'),difference:gl.getUniformLocation(program,'differenceMode')};
    let visible=true, raf=0, time=performance.now(), value=Number(progress);const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);};
    const draw=now=>{if(!visible){raf=0;return;}if(playing&&!reduced)value=(value+(now-time)/1000*.12)%1;time=now;gl.uniform1f(uniforms.current.t,value);gl.uniform1f(uniforms.current.seed,Number(seed));gl.uniform1f(uniforms.current.thermal,thermal?1:0);gl.uniform1f(uniforms.current.resolution,canvas.width/canvas.height);gl.uniform1f(uniforms.current.difference,difference?1:0);gl.drawArrays(gl.TRIANGLES,0,6);raf=requestAnimationFrame(draw);};
    const obs=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(draw);else if(!visible&&raf){cancelAnimationFrame(raf);raf=0;}},{threshold:.01});obs.observe(canvas);const ro=new ResizeObserver(resize);ro.observe(canvas);resize();raf=requestAnimationFrame(draw);
    return()=>{obs.disconnect();ro.disconnect();cancelAnimationFrame(raf);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.deleteBuffer(buffer);};
  }, [seed, thermal, playing, difference]);
  useEffect(()=>{const u=uniforms.current;if(!u.t)return;const c=ref.current;const gl=c?.getContext('webgl');if(gl)gl.uniform1f(u.t,Math.min(1,Math.max(0,Number(progress)||0)));},[progress]);
  return <canvas ref={ref} className={`cloud-canvas ${className}`} aria-label="Procedurally generated thermal infrared cloud-field visualization" role="img"/>;
}

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export default function Reveal({children,className='',delay=0}){const ref=useRef(null);useEffect(()=>{const el=ref.current;if(!el||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const tween=gsap.fromTo(el,{y:28,opacity:0},{y:0,opacity:1,duration:.8,delay,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});return()=>{tween.scrollTrigger?.kill();tween.kill();};},[delay]);return <div ref={ref} className={className}>{children}</div>}

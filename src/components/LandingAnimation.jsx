import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { motion } from 'framer-motion';

gsap.registerPlugin(TextPlugin);

const vertexShader = `
  uniform float uTime;
  uniform float uFlow;
  uniform float uCorruption;
  varying vec3 vColor;
  void main() {
    vec3 pos = position;
    pos.z = mod(pos.z + uTime * 5.0, 400.0) - 200.0;
    pos.z += uFlow * 100.0;
    pos.x += sin(pos.z * 0.1 + uTime * 3.0) * uCorruption * 10.0;
    pos.y += cos(pos.z * 0.1 + uTime * 3.0) * uCorruption * 10.0;
    vColor = color;
    vec4 viewPosition = viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = (150.0 / -viewPosition.z);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  uniform float uOpacity;
  void main() {
    float strength = 1.0 - distance(gl_PointCoord, vec2(0.5)) * 2.0;
    gl_FragColor = vec4(vColor, strength * uOpacity);
  }
`;

const LandingAnimation = ({ onFinish }) => {
  const [stage, setStage] = useState("boot");
  const mountRef = useRef(null);
  const hudRef = useRef(null);
  const logRef = useRef(null);
  const titleRef = useRef(null);
  const staticRef = useRef(null);
  const oldTvGlitchRef = useRef(null);
  const terminatedRef = useRef(null);
  const progressBarRef = useRef(null);
  const diagnosticsRef = useRef(null);

  const phaseRef = useRef(null);
  const threatRef = useRef(null);
  const architectStatusRef = useRef(null);
  const userStatusRef = useRef(null);
  const alertRef = useRef(null);

  const mouse = useRef(new THREE.Vector2(0,0));
  const isFlowing = useRef(false);

  useEffect(() => {
    if (stage !== "anim") return;

    let masterTl;
    let animationFrameId;
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.6, 0.2);
    composer.addPass(bloomPass);
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 0.95;
    vignettePass.uniforms['darkness'].value = 0.8;
    composer.addPass(vignettePass);

    const landscapeGeo = new THREE.BufferGeometry();
    const landscapeCount = 75000;
    const positions = new Float32Array(landscapeCount * 3);
    const colors = new Float32Array(landscapeCount * 3);
    const colorBlue = new THREE.Color('#00f6ff');
    const colorWhite = new THREE.Color('#ffffff');
    const colorRed = new THREE.Color('#ff4655');
    for (let i = 0; i < landscapeCount; i++) {
        positions[i*3] = (Math.random() - 0.5) * 100;
        positions[i*3+1] = (Math.random() - 0.5) * 100;
        positions[i*3+2] = (Math.random() - 0.5) * 400;
        const randomColor = Math.random();
        if (randomColor > 0.9) colorRed.toArray(colors, i*3);
        else if (randomColor > 0.6) colorWhite.toArray(colors, i*3);
        else colorBlue.toArray(colors, i*3);
    }
    landscapeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    landscapeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const landscapeMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms: { uTime: { value: 0 }, uFlow: { value: 0 }, uCorruption: { value: 0 }, uOpacity: { value: 1.0 } }, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const landscape = new THREE.Points(landscapeGeo, landscapeMat);
    scene.add(landscape);

    const architectCore = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0 }));
    architectCore.position.z = -150;
    scene.add(architectCore);

    let cameraShake = { strength: 0 };
    const clock = new THREE.Clock();

    const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();
        const flowValue = isFlowing.current ? 1 : 0;

        landscapeMat.uniforms.uTime.value = elapsedTime * 0.1;
        gsap.to(landscapeMat.uniforms.uFlow, { value: flowValue, duration: 0.5 });

        camera.position.z -= (0.15 + flowValue * 0.8);
        camera.position.x += (mouse.current.x * 20 - camera.position.x) * 0.05;
        camera.position.y += (mouse.current.y * 20 - camera.position.y) * 0.05;
        if (cameraShake.strength > 0) {
          camera.rotation.z += (Math.random() - 0.5) * cameraShake.strength * 0.05;
          camera.position.x += (Math.random() - 0.5) * cameraShake.strength;
        } else {
          gsap.to(camera.rotation, { z: 0, duration: 1 });
        }
        if (camera.position.z < -200) camera.position.z = 200;

        composer.render();
    };

    const handleMouseMove = (e) => { mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1; };
    const handleMouseDown = () => { isFlowing.current = true; };
    const handleMouseUp = () => { isFlowing.current = false; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    masterTl = gsap.timeline({ onComplete: () => setStage("terminated") });
    masterTl
      .call(() => {
        const refs = [phaseRef, architectStatusRef, userStatusRef, threatRef, alertRef];
        refs.forEach(ref => { if (ref.current) gsap.to(ref.current, { text: "...", duration: 0.1}) });
      })
      .to(oldTvGlitchRef.current, { opacity: 1, filter: 'sepia(100%) saturate(200%) hue-rotate(200deg)', duration: 0.05, ease: 'steps(1)' }, 0)
      .to(oldTvGlitchRef.current, { scaleX: 1.5, scaleY: 0.1, duration: 0.1, repeat: 2, yoyo: true, ease: 'power1.inOut' }, ">")
      .to(oldTvGlitchRef.current, { opacity: 0, filter: 'sepia(0%) saturate(100%) hue-rotate(0deg)', duration: 0.5, ease: 'power2.in', delay: 0.2 })
      .call(() => {}, [], ">-0.4")
      .call(animate)
      .to(hudRef.current, { opacity: 1, duration: 1 }, "<")
      .call(() => {
        if (phaseRef.current) gsap.to(phaseRef.current, { text: "PHASE: PROBE", duration: 1, ease: 'none' });
        if (userStatusRef.current) gsap.to(userStatusRef.current, { text: "STATUS: INFILTRATING", duration: 1, ease: 'none' });
        if (logRef.current) gsap.to(logRef.current, { text: ">> Establishing secure connection...", duration: 2, ease: 'none' });
      }, [], 1)
      .call(() => {
        if (!phaseRef.current) return;
        gsap.to(phaseRef.current, { text: "PHASE: DENIAL", color: '#ff4655' });
        gsap.to(architectStatusRef.current, { text: "ARCHITECT: ACTIVE // ADAPTING", color: '#ff4655' });
        gsap.to(threatRef.current, { text: "THREAT: HIGH", color: '#ff4655', className: '+=animate-pulse' });
        gsap.to(logRef.current, { text: ">> ACCESS DENIED. FIREWALL ADAPTING. RETRYING...", color: '#ff4655' });
        gsap.to(alertRef.current, { text: "ALERT: SYSTEM LOCKOUT", opacity: 1, duration: 0.2, yoyo: true, repeat: 5, color: '#ff4655'});
        gsap.to(cameraShake, { strength: 1.5, duration: 0.1, yoyo: true, repeat: 7, ease: 'steps(1)' });
        gsap.fromTo(landscapeMat.uniforms.uCorruption, { value: 0 }, { value: 1.5, duration: 0.1, yoyo: true, repeat: 7, ease: 'steps(1)' });
        gsap.to(vignettePass.uniforms.darkness, { value: 1.5, duration: 0.5, yoyo: true, repeat: 1 });
        gsap.to(architectCore, { opacity: 0.8, color: '#ff4655', duration: 0.5 });
      }, [], 8)
      .call(() => {
        if (!phaseRef.current) return;
        gsap.to(phaseRef.current, { text: "PHASE: RECALIBRATION", color: '#ffff00' });
        gsap.to(userStatusRef.current, { text: "STATUS: DEPLOYING SHADOW PROTOCOL", color: '#ffff00' });
        gsap.to(threatRef.current, { text: "THREAT: MODERATE", color: '#ffff00', className: '-=animate-pulse' });
        gsap.to(logRef.current, { text: ">> SHADOW PROTOCOL INITIATED. Preparing deep infiltration.", color: '#ffff00' });
        gsap.to(alertRef.current, { opacity: 0 });
        gsap.to(cameraShake, { strength: 0.2, duration: 3 });
        gsap.to(landscapeMat.uniforms.uCorruption, { value: 0.1, duration: 3 });
        gsap.to(vignettePass.uniforms.darkness, { value: 0.8, duration: 1 });
        gsap.to(architectCore, { opacity: 0, duration: 1 });
      }, [], 13)
      .call(() => {
        if (!phaseRef.current) return;
        gsap.to(phaseRef.current, { text: "PHASE: INFILTRATION", color: '#00f6ff' });
        gsap.to(userStatusRef.current, { text: "STATUS: BREACHING LAYERS", color: '#00f6ff' });
        gsap.to(threatRef.current, { text: "THREAT: LOW", color: '#00f6ff' });
        gsap.to(logRef.current, { text: ">> BYPASSING SECURITY NODES... NO DETECTION.", color: '#00f6ff' });
        gsap.to(cameraShake, { strength: 0, duration: 1 });
      }, [], 18)
      .call(() => {
        if (!phaseRef.current) return;
        gsap.to(phaseRef.current, { text: "PHASE: UNKNOWN ENTITY", color: '#ff4655' });
        gsap.to(architectStatusRef.current, { text: "ARCHITECT: DEFENSES COLLAPSED", color: '#00ff00'});
        gsap.to(userStatusRef.current, { text: "STATUS: COMPROMISED", color: '#ff4655', className: '+=animate-pulse' });
        gsap.to(logRef.current, { text: ">> DEFENSES DOWN... But a new signature... NOCTRA...", color: '#ff4655' });
        gsap.to(alertRef.current, { text: "WARNING: HOSTILE AI DETECTED", opacity: 1, duration: 0.1, yoyo: true, repeat: 7, color: '#ff4655'});
        gsap.fromTo(titleRef.current, { opacity: 0, scale: 3, filter: 'blur(20px)', textShadow: "0 0 50px rgba(255, 70, 85, 0.7)" }, { text: "NOCTRA", color: '#ff4655', opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.2, ease: 'steps(1)' });
      }, [], 24)
      .call(() => {
        if (!logRef.current) return;
        gsap.to(logRef.current, { text: ">> NOCTRA IS ASSIMILATING CONNECTION! ESCAPE! ESCAPE!", color: '#ff4655' });
        gsap.to(camera.position, { z: camera.position.z - 50, duration: 1, ease: 'power4.in' });
        gsap.to(cameraShake, { strength: 5, duration: 1, ease: 'power2.in' });
        gsap.to(landscapeMat.uniforms.uCorruption, { value: 20.0, duration: 1, ease: 'power2.in' });
        gsap.to(vignettePass.uniforms.darkness, { value: 5.0, duration: 1, ease: 'power2.in' });
        gsap.to(hudRef.current, { opacity: 0, filter: 'blur(20px)', scale: 2, duration: 1, ease: 'power2.in' });
      }, [], 28)
      .to(staticRef.current, { opacity: 1, duration: 0.05, ease: 'steps(1)', delay: 1 });

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        if (masterTl) masterTl.kill();
        scene.traverse(obj => { if(obj.geometry) obj.geometry.dispose(); if(obj.material) { if(obj.material.map) obj.material.map.dispose(); obj.material.dispose(); } });
        if(renderer) renderer.dispose();
        if(composer) composer.dispose();
        if(mount && renderer && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [stage, onFinish]);

  useEffect(() => {
    if (stage !== 'terminated') return;
    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        if(terminatedRef.current) {
            gsap.to(terminatedRef.current, { 
                opacity: 0, 
                duration: 1, 
                onComplete: () => { 
                    if(onFinish) onFinish(); 
                    setStage('done'); 
                } 
            });
        } else if (onFinish) {
            onFinish();
            setStage('done');
        }
      }
    });
    if (terminatedRef.current && progressBarRef.current && diagnosticsRef.current) {
      tl.fromTo(terminatedRef.current.querySelector('h1'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
        .fromTo(terminatedRef.current.querySelector('p'), { opacity: 0 }, { opacity: 1, duration: 1 }, ">-0.5")
        .to(progressBarRef.current, { width: '100%', duration: 1.5, ease: 'none' }, ">")
        .to(terminatedRef.current.querySelector('p'), { text: "REBOOT COMPLETE. RUNNING DIAGNOSTICS...", duration: 1, ease: 'none'}, ">0.5")
        .set(diagnosticsRef.current, { opacity: 1 })
        .to(diagnosticsRef.current, { text: "// MEMORY_CHECK........ [OK]", duration: 0.5, ease: 'none' })
        .to(diagnosticsRef.current, { text: "// RENDERER_INIT....... [OK]", duration: 0.5, ease: 'none' })
        .to(diagnosticsRef.current, { text: "// INTERFACE_LINK.... [ESTABLISHED]", duration: 0.5, ease: 'none' })
        .to(diagnosticsRef.current, { text: "// ALL SYSTEMS NOMINAL.", color: '#00ff00', duration: 0.5, ease: 'none' });
    } else {
        if (onFinish) {
            onFinish();
            setStage('done');
        }
    }
  }, [stage, onFinish]);

  if (stage === "boot") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 font-mono text-center p-4">
        <div className="max-w-lg w-full">
          <h1 className="text-xl sm:text-3xl lg:text-4xl text-white mb-4 animate-pulse">// ACCESS ARCHITECT'S_MIND</h1>
          <p className="text-[var(--color-accent)] mb-8 text-sm sm:text-base lg:text-lg">LOOK WITH MOUSE // HOLD LEFT_MOUSE_BUTTON FOR FLOW_STATE // FOR BEST EXPERIENCE USE A LAPTOP OR A DESKTOP // ENJOY // ;)</p>
          <button onClick={() => setStage("anim")} className="px-6 py-3 sm:px-8 sm:py-4 bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] text-lg sm:text-xl tracking-widest transition-all duration-300 ease-in-out hover:bg-[var(--color-accent)] hover:text-black hover:scale-105">&gt; JACK IN</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black z-[100] cursor-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
    >
      {stage === 'anim' && (
        <>
          <div ref={mountRef} className="absolute top-0 left-0 w-full h-full" />
          <div ref={hudRef} className="absolute inset-0 pointer-events-none font-mono text-[10px] sm:text-xs md:text-sm p-3 sm:p-5 text-cyan-400 flex flex-col justify-between border-2 border-[var(--color-interface)]/20 opacity-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
              <div ref={phaseRef} className="bg-black/50 p-2 backdrop-blur-sm transition-colors duration-500"></div>
              <div ref={architectStatusRef} className="bg-black/50 p-2 backdrop-blur-sm transition-colors duration-500"></div>
              <div ref={userStatusRef} className="bg-black/50 p-2 backdrop-blur-sm transition-colors duration-500"></div>
              <div ref={threatRef} className="bg-black/50 p-2 backdrop-blur-sm transition-colors duration-500"></div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <h1 ref={titleRef} className="text-7xl sm:text-8xl lg:text-9xl font-bold tracking-widest opacity-0 scale-1.5" style={{ textShadow: "0 0 25px" }}></h1>
            </div>
            <div className="flex justify-between items-end w-full gap-2">
              <p ref={logRef} className="opacity-80 whitespace-pre-line bg-black/50 p-2 backdrop-blur-sm flex-grow"></p>
              <div ref={alertRef} className="bg-black/50 p-2 backdrop-blur-sm"></div>
            </div>
          </div>
          <div ref={oldTvGlitchRef} className="absolute inset-0 bg-black opacity-0 z-[100]"></div>
          <div ref={staticRef} className="absolute inset-0 bg-red-600 opacity-0 z-[99]" style={{ backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39sbGxpaWpcXFzFxcW3t7dVVVXPz8/Ly8vT09NhYWGMjIyKG3BHAAAAPElEQVR42tSRDQ4AIAwDw6x/v/c8g9gK3I4A2oTpYVZmZmaWjL5G2eQ3d+7zL2bXJXY7A2EmvjUTs2fOFh21pLh2D3tN2bZpQAAAABJRU5ErkJggg==")'}}></div>
        </>
      )}
      {stage === 'terminated' && (
        <div ref={terminatedRef} className="fixed inset-0 bg-black z-[101] flex flex-col items-center justify-center font-mono text-center p-4 opacity-0">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl text-[var(--color-accent)] font-oxanium">// CONNECTION TERMINATED</h1>
          <p className="text-lg sm:text-xl text-gray-400 mt-4 mb-8">REBOOTING INTERFACE...</p>
          <div className="w-full max-w-md border border-gray-700 p-1 mb-4">
            <div ref={progressBarRef} className="h-4 bg-[var(--color-interface)] w-0"></div>
          </div>
          <div className="diagnostics-text text-left text-sm sm:text-base text-gray-500 w-full max-w-md opacity-0" ref={diagnosticsRef}></div>
        </div>
      )}
    </motion.div>
  );
};

export default LandingAnimation;
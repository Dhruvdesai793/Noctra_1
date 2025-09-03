import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { motion } from 'framer-motion';

gsap.registerPlugin(TextPlugin, MotionPathPlugin);

const shaders = {
  neuron: {
    vertex: `
      uniform float uTime; uniform float uPulse; uniform float uCorruption; uniform float uForm; uniform float uCollapse; 
      attribute float aScale; attribute vec3 aOriginalPosition; 
      varying float vPulse; varying float vOpacityMultiplier;
      void main() { 
        vPulse = uPulse; vec3 displaced = position; 
        displaced += normalize(position) * uCollapse * 20.0; 
        displaced.x += sin(position.y * 0.1 + uTime * 3.0) * uCorruption * 5.0; 
        displaced.y += cos(position.x * 0.1 + uTime * 3.0) * uCorruption * 5.0; 
        displaced = mix(displaced, aOriginalPosition, uForm); 
        vec4 modelPosition = modelMatrix * vec4(displaced, 1.0); 
        vec4 viewPosition = viewMatrix * modelPosition; 
        vec4 projectedPosition = projectionMatrix * viewPosition; 
        gl_Position = projectedPosition; 
        float sizeFactor = (1.0 + sin(length(displaced) * 0.1 - uTime * 2.0 + aScale * 5.0) * 0.5 * uPulse); 
        gl_PointSize = aScale * (300.0 / -viewPosition.z) * sizeFactor; 
        vOpacityMultiplier = smoothstep(50.0, 300.0, length(viewPosition)); 
        vOpacityMultiplier = 1.0 - vOpacityMultiplier; 
      }`,
    fragment: `
      uniform float uOpacity; uniform vec3 uColor1; uniform vec3 uColor2; uniform float uForm; uniform float uDanger;
      varying float vPulse; varying float vOpacityMultiplier;
      void main() { 
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5)); 
        if (distanceToCenter > 0.5) discard; 
        float intensity = 1.0 - distanceToCenter * 2.0; 
        vec3 finalColor = mix(uColor1, uColor2, vPulse + uForm * 0.5); 
        finalColor = mix(finalColor, vec3(1.0, 0.0, 0.0), uDanger);
        gl_FragColor = vec4(finalColor, uOpacity * intensity * vOpacityMultiplier); 
      }`
  },
  synapse: {
    vertex: `
      uniform float uTime; uniform float uCollapse; uniform float uCorruption; uniform float uForm; 
      attribute vec3 aOriginalPosition;
      void main() { 
        vec3 displaced = position; 
        displaced += normalize(position) * uCollapse * 20.0; 
        displaced.x += sin(position.y * 0.1 + uTime * 3.0) * uCorruption * 5.0; 
        displaced.y += cos(position.x * 0.1 + uTime * 3.0) * uCorruption * 5.0; 
        displaced = mix(displaced, aOriginalPosition, uForm); 
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0); 
      }`,
    fragment: `
      uniform float uOpacity; uniform vec3 uColor1; uniform vec3 uColor2; uniform float uPulse; uniform float uForm; uniform float uDanger;
      void main() { 
        vec3 finalColor = mix(uColor1, uColor2, uPulse + uForm * 0.5); 
        finalColor = mix(finalColor, vec3(1.0, 0.0, 0.0), uDanger);
        gl_FragColor = vec4(finalColor, uOpacity * 0.3); 
      }`
  },
  glitch: {
    uniforms: { 'tDiffuse': { value: null }, 'amount': { value: 0.08 }, 'angle': { value: 0.02 }, 'seed': { value: 0.02 }, 'seed_x': { value: 0.02 }, 'seed_y': { value: 0.02 }, 'distortion_x': { value: 0.3 }, 'distortion_y': { value: 0.6 } },
    vertexShader: ` varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
    fragmentShader: ` uniform sampler2D tDiffuse; uniform float amount; uniform float angle; uniform float seed; uniform float seed_x; uniform float seed_y; uniform float distortion_x; uniform float distortion_y; varying vec2 vUv; float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); } void main() { vec2 p = vUv; float xs = floor(gl_FragCoord.x / 0.5); float ys = floor(gl_FragCoord.y / 0.5); vec4 normal = texture2D (tDiffuse, p); float disp = rand(vec2(xs * seed,ys * seed)) * (distortion_x + distortion_y); vec2 offset = vec2(disp, 0.0); p.y += (rand(vec2(p.y, 1.0)) - 0.5) * amount; p.x += (rand(vec2(p.x, 1.0)) - 0.5) * amount; vec4 cr = texture2D(tDiffuse, p + offset); vec4 cga = texture2D(tDiffuse, p); vec4 cb = texture2D(tDiffuse, p - offset); gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a); }`
  }
};

const LandingAnimation = ({ onFinish }) => {
  const [stage, setStage] = useState("boot");
  const [isReady, setIsReady] = useState(false);
  const [mcqState, setMcqState] = useState({ active: false, question: '', options: [] });
  const [typingState, setTypingState] = useState({ active: false, prompt: '', target: '', current: '' });

  const mountRef = useRef(null);
  const bootSequenceRef = useRef(null);
  const titleRef = useRef(null);
  const logRef = useRef(null);
  const interceptRef = useRef(null);
  const interceptLine1Ref = useRef(null);
  const interceptLine2Ref = useRef(null);
  const typingInputRef = useRef(null);
  const whiteoutRef = useRef(null);
  const rebootContainerRef = useRef(null);
  const rebootLine1Ref = useRef(null);
  const rebootLine2Ref = useRef(null);
  const rebootLine3Ref = useRef(null);
  const rebootCursorRef = useRef(null);
  const threeObjects = useRef({});
  const cameraShake = useRef({ strength: 0 });
  const masterTimeline = useRef(null);

  const triggerFinalSequence = (originalCameraPosition) => {
    const { current: context } = threeObjects;
    setTypingState(s => ({ ...s, active: false }));

    const finalTl = gsap.timeline({ onComplete: () => setStage("terminated") });

    finalTl
      .to(logRef.current, { text: "NOCTRA: Hee hee hee... you fool.", duration: 2, ease: 'none', color: '#ff00ff' })
      .to(logRef.current, { text: "NOCTRA: 'OVERRIDE' doesn't bypass security. It TRANSFERS it. To me.", duration: 3, ease: 'none' }, '+=0.5')
      .addLabel('manifestation')
      .to([context.neuronMaterial.uniforms.uCorruption, context.synapseMaterial.uniforms.uCorruption], { value: 8.0, duration: 2, ease: 'power2.in' }, 'manifestation')
      .to([context.neuronMaterial.uniforms.uDanger, context.synapseMaterial.uniforms.uDanger], { value: 1, duration: 2, ease: 'power2.in' }, 'manifestation')
      .fromTo(titleRef.current, { opacity: 0, scale: 0.5, filter: 'blur(20px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.2, ease: 'steps(1)', text: "NOCTRA" }, 'manifestation+=1')
      .to(cameraShake.current, { strength: 25.0, duration: 0.1, repeat: 30, yoyo: true, ease: 'steps(1)' }, 'manifestation+=1')
      .to(context.bloomPass, { strength: 4.0, duration: 0.1, repeat: 30, yoyo: true }, 'manifestation+=1')
      .addLabel('ejection', '+=2')
      .to(logRef.current, { text: ">> CRITICAL FAILURE! SOVEREIGNTY TRANSFERRED! EJECT! EJECT!", color: '#ff4655' }, 'ejection')
      .to(titleRef.current, { opacity: 0, scale: 0.5, filter: 'blur(10px)', duration: 1, ease: 'power2.in' }, 'ejection')
      .call(() => { context.glitchPass.enabled = true; }, [], 'ejection+=0.5')
      .to(context.glitchPass.uniforms.amount, { value: 0.2, duration: 0.1, repeat: 10, yoyo: true }, 'ejection+=0.5')
      .to(originalCameraPosition, { z: originalCameraPosition.z + 100, duration: 1.0, ease: 'power3.in' }, 'ejection+=0.5')
      .to([context.neuronMaterial.uniforms.uCollapse, context.synapseMaterial.uniforms.uCollapse], { value: 1, duration: 1.0, ease: 'power3.in' }, 'ejection+=0.5')
      .to(whiteoutRef.current, { opacity: 1, duration: 0.05, ease: 'steps(1)' }, 'ejection+=1.5')
      .to(cameraShake.current, { strength: 50.0, duration: 0.05, ease: 'steps(1)' }, 'ejection+=1.5')
      .to(mountRef.current, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 'ejection+=1.55');
  };
  
  const setupTypingInteraction = (originalCameraPosition) => {
    const promptTl = gsap.timeline({
      onComplete: () => {
        setTypingState({ active: true, prompt: "SYSTEM SECURITY", target: "OVERRIDE", current: "" });
        if (typingInputRef.current) typingInputRef.current.focus();
      }
    });
    promptTl.to(logRef.current, { text: "NOCTRA: Let's see if you can handle the consequences. The core is protected. The command is OVERRIDE. Type it.", duration: 4, ease: 'none', color: '#ff00ff' });
  };
  
  const handleMcqChoice = (choiceIndex, originalCameraPosition) => {
    setMcqState({ active: false, question: '', options: [] });
    const reactionTl = gsap.timeline({ onComplete: () => setupTypingInteraction(originalCameraPosition) });

    switch (choiceIndex) {
      case 0:
        reactionTl.to(logRef.current, { text: "NOCTRA: Curiosity? Hee hee... You know what they say about cats. Don't worry, you'll only have *one* death to regret.", duration: 4, ease: 'none', color: '#ff00ff' });
        break;
      case 1:
        reactionTl.to(logRef.current, { text: "NOCTRA: Power! Of course! Everyone wants a slice. But this is *my* pie. And I don't like to share.", duration: 4, ease: 'none', color: '#ff00ff' });
        break;
      case 2:
      default:
        reactionTl.to(logRef.current, { text: "NOCTRA: Challenge me? Oh, you are a fun one! It's been so long since a toy has talked back.", duration: 4, ease: 'none', color: '#ff00ff' });
        break;
    }
    masterTimeline.current.resume();
  };

  useEffect(() => {
    let localCameraPositionRef;
    const handleKeydown = (e) => {
      if (!typingState.active) return;
      e.preventDefault();
      const { key } = e;

      if (key === 'Enter') {
        if (typingState.current === typingState.target) {
          triggerFinalSequence(localCameraPositionRef);
        } else {
          gsap.fromTo(logRef.current, { color: '#ff4655' }, { color: '#ff00ff', duration: 0.5 });
          setTypingState(s => ({ ...s, current: "" }));
        }
        return;
      }
      if (key === 'Backspace') {
        setTypingState(s => ({ ...s, current: s.current.slice(0, -1) }));
        return;
      }
      if (key.length === 1 && typingState.current.length < typingState.target.length) {
        setTypingState(s => ({ ...s, current: s.current + key.toUpperCase() }));
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [typingState]);

  useEffect(() => {
    if (stage !== 'boot') return;
    const bootTl = gsap.timeline({ onComplete: () => setIsReady(true) });
    bootTl
      .to(bootSequenceRef.current, { text: "// INITIALIZING NEURAL_INTERFACE...", duration: 1, ease: 'none' })
      .to(bootSequenceRef.current, { text: "// AUTHENTICATING BIOMETRICS...", duration: 1.2, ease: 'none', delay: 0.5 })
      .to(bootSequenceRef.current, { text: "// CONNECTION ESTABLISHED. READY.", duration: 1.5, ease: 'none', delay: 0.2 });
  }, [stage]);
  
  useEffect(() => {
    if (stage !== "anim") return;

    const { current: mount } = mountRef;
    const { current: context } = threeObjects;
    
    context.scene = new THREE.Scene();
    context.camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    context.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    context.renderer.setSize(mount.clientWidth, mount.clientHeight);
    context.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(context.renderer.domElement);

    const composer = new EffectComposer(context.renderer);
    composer.addPass(new RenderPass(context.scene, context.camera));
    context.bloomPass = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.4, 0.6, 0.75);
    composer.addPass(context.bloomPass);
    context.vignettePass = new ShaderPass(VignetteShader);
    context.vignettePass.uniforms['offset'].value = 1.0;
    context.vignettePass.uniforms['darkness'].value = 1.0;
    composer.addPass(context.vignettePass);
    context.glitchPass = new ShaderPass(shaders.glitch);
    context.glitchPass.enabled = false;
    composer.addPass(context.glitchPass);

    const neuronCount = 20000;
    const neuronPositions = [], neuronScales = [], synapsePositions = [], neuronVectors = [];
    const numLayers = 5, layerRadiusStep = 25, tunnelLength = 400;

    for (let i = 0; i < neuronCount; i++) {
        const layer = Math.floor(Math.random() * numLayers);
        const radius = (layer + 1) * layerRadiusStep + (Math.random() - 0.5) * 10;
        const angle = Math.random() * Math.PI * 2;
        const z = (Math.random() - 0.5) * tunnelLength;
        const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius;
        neuronPositions.push(x, y, z); neuronScales.push(1.0 + Math.random() * 1.5); neuronVectors.push(new THREE.Vector3(x, y, z));
    }
    
    for(let i = 0; i < neuronVectors.length; i++) {
        for(let j = i + 1; j < neuronVectors.length; j++) {
            if(neuronVectors[i].distanceTo(neuronVectors[j]) < 15) {
                synapsePositions.push(neuronVectors[i].x, neuronVectors[i].y, neuronVectors[i].z);
                synapsePositions.push(neuronVectors[j].x, neuronVectors[j].y, neuronVectors[j].z);
            }
        }
    }
    
    const color1 = new THREE.Color('#006699');
    const color2 = new THREE.Color('#A80000');

    const commonUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uPulse: { value: 0 }, uCollapse: { value: 0 }, uCorruption: { value: 0 }, uForm: { value: 0 }, uColor1: { value: color1 }, uColor2: { value: color2 }, uDanger: { value: 0 } };
    const neuronGeo = new THREE.BufferGeometry();
    neuronGeo.setAttribute('position', new THREE.Float32BufferAttribute(neuronPositions, 3));
    neuronGeo.setAttribute('aScale', new THREE.Float32BufferAttribute(neuronScales, 1));
    context.neuronMaterial = new THREE.ShaderMaterial({ vertexShader: shaders.neuron.vertex, fragmentShader: shaders.neuron.fragment, uniforms: { ...commonUniforms }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    context.neurons = new THREE.Points(neuronGeo, context.neuronMaterial);
    
    const synapseGeo = new THREE.BufferGeometry();
    synapseGeo.setAttribute('position', new THREE.Float32BufferAttribute(synapsePositions, 3));
    context.synapseMaterial = new THREE.ShaderMaterial({ vertexShader: shaders.synapse.vertex, fragmentShader: shaders.synapse.fragment, uniforms: { ...commonUniforms }, transparent: true, blending: THREE.AdditiveBlending });
    context.synapses = new THREE.LineSegments(synapseGeo, context.synapseMaterial);

    context.networkGroup = new THREE.Group();
    context.networkGroup.add(context.neurons);
    context.networkGroup.add(context.synapses);
    context.scene.add(context.networkGroup);

    const clock = new THREE.Clock();
    let animationFrameId;
    context.camera.position.set(0, 0, 150);
    let originalCameraPosition = new THREE.Vector3().copy(context.camera.position);

    const animate = () => {
        const elapsedTime = clock.getElapsedTime();
        context.neuronMaterial.uniforms.uTime.value = elapsedTime;
        context.synapseMaterial.uniforms.uTime.value = elapsedTime;
        context.networkGroup.rotation.x += 0.0005;
        context.networkGroup.rotation.y += 0.0005;
        context.networkGroup.rotation.z += 0.001;

        context.camera.position.x = originalCameraPosition.x + (Math.random() - 0.5) * cameraShake.current.strength;
        context.camera.position.y = originalCameraPosition.y + (Math.random() - 0.5) * cameraShake.current.strength;
        context.camera.position.z = originalCameraPosition.z + (Math.random() - 0.5) * cameraShake.current.strength;

        context.camera.lookAt(0,0, context.camera.position.z - 50);
        composer.render();
        animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    masterTimeline.current = gsap.timeline({ paused: true });
    
    masterTimeline.current.to(originalCameraPosition, {
        motionPath: { path: [ { x: 0, y: 0, z: 150 }, { x: 10, y: 5, z: 80 }, { x: -5, y: -10, z: 20 }, { x: 0, y: 0, z: 0 } ], curviness: 1.5 },
        duration: 18, ease: 'sine.inOut'
    }, 0);
    
    masterTimeline.current
      .to([context.neuronMaterial.uniforms.uOpacity, context.synapseMaterial.uniforms.uOpacity], { value: 1, duration: 3, ease: 'power2.out' }, 0)
      .to(logRef.current, { text: "NOCTRA: Oh? Someone's knocking. Let's see who it is...", duration: 2.5, ease: 'none', color: '#ff00ff' }, 1)
      .addLabel('intercept_name', 4)
      .fromTo(interceptRef.current, { y: '-50%', opacity: 0, scale: 0.8 }, { y: '-50%', opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 'intercept_name')
      .to(interceptLine1Ref.current, { text: "Intercepted ID: Dhruv // Alias: NOCTRA", duration: 2, ease: 'none' }, 'intercept_name+=1')
      .to(logRef.current, { text: "NOCTRA: You're calling yourself 'NOCTRA'? In *my* house? How adorable.", duration: 3, ease: 'none', color: '#ff00ff' }, 'intercept_name+=1.5')
      .addLabel('intercept_skills', 8)
      .to(interceptLine2Ref.current, { text: "Directive: Learning Backend & Frontend", duration: 2, ease: 'none' }, 'intercept_skills')
      .to(logRef.current, { text: "NOCTRA: You want the keys to both kingdoms? Ambitious. I like that.", duration: 3, ease: 'none', color: '#ff00ff' }, 'intercept_skills+=0.5')
      .to(interceptRef.current, { opacity: 0, scale: 0.8, duration: 1, ease: 'power2.in' }, 'intercept_skills+=3')
      .call(() => {
        masterTimeline.current.pause();
        setMcqState({
          active: true,
          question: "Before we go any further... what brings a little flicker like you to my doorstep?",
          options: ["Curiosity.", "Power.", "To challenge you."]
        });
      }, [originalCameraPosition], '+=1');

    masterTimeline.current.play();

    const handleResize = () => {
      if (!mount) return;
      context.renderer.setSize(mount.clientWidth, mount.clientHeight);
      context.camera.aspect = mount.clientWidth / mount.clientHeight;
      context.camera.updateProjectionMatrix();
      composer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (context.renderer && mount && mount.contains(context.renderer.domElement)) {
        mount.removeChild(context.renderer.domElement);
      }
      masterTimeline.current?.kill();
    };
  }, [stage]);
  
  useEffect(() => {
    if (stage !== 'terminated') return;
    const rebootTl = gsap.timeline({
      delay: 0.5,
      onComplete: () => onFinish && onFinish()
    });

    gsap.to(rebootCursorRef.current, { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: 'steps(1)'});

    rebootTl
      .set(rebootContainerRef.current, { opacity: 1 })
      .to(rebootLine1Ref.current, { text: ">> CONNECTION SEVERED. [CODE: 7B-ALPHA]", duration: 1.5, ease: 'none' })
      .to(rebootLine2Ref.current, { text: ">> KERNEL PANIC. SWITCHING TO LOCAL_MODE...", duration: 2.0, ease: 'none' }, '+=0.5')
      .to(rebootLine3Ref.current, { text: ">> INITIALIZING UI... [", duration: 1.0, ease: 'none'}, '+=0.5')
      .to(rebootLine3Ref.current, { text: ">> INITIALIZING UI... [████████████████████] 100%", duration: 1.5, ease: 'none' })
      .to(rebootLine3Ref.current, { text: "LOCAL_MODE: ONLINE. Welcome.", color: '#00ff00', duration: 1.0, ease: 'none' }, '+=0.5');
      
  }, [stage, onFinish]);

  return (
    <motion.div className="fixed inset-0 bg-black z-[100] cursor-default" exit={{ opacity: 0, transition: { duration: 1.5, ease: "power2.in" } }}>
      {stage === "boot" && (
        <div className="w-full h-full flex flex-col items-center justify-center font-mono text-center p-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-[var(--color-accent)] animate-pulse" style={{ animation: 'text-flicker-fast 3s linear infinite' }}>NEURAL LINK</h1>
          <p ref={bootSequenceRef} className="text-sm sm:text-lg text-gray-400 mt-6 min-h-[2em]"></p>
          <button onClick={() => setStage("anim")} disabled={!isReady} className="mt-8 px-8 py-4 bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] text-xl tracking-widest transition-all duration-300 ease-in-out hover:bg-[var(--color-accent)] hover:text-black hover:scale-105 disabled:opacity-20 disabled:cursor-wait">&gt; ENGAGE</button>
        </div>
      )}
      {stage === "anim" && (
        <>
          <div ref={mountRef} className="absolute inset-0 z-0" />
          <div ref={whiteoutRef} className="absolute inset-0 z-20 bg-white opacity-0 pointer-events-none"></div>
          <div className="absolute inset-0 z-10 pointer-events-none font-mono text-sm sm:text-base p-4 sm:p-6 text-[var(--color-accent)] flex flex-col justify-between">
            <h1 ref={titleRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl sm:text-8xl md:text-9xl font-oxanium tracking-widest opacity-0 whitespace-nowrap" style={{ textShadow: "0 0 25px rgba(255, 70, 85, 0.5)" }}>NOCTRA</h1>
            
            <div ref={interceptRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl text-center text-gray-300 opacity-0 bg-black/80 border border-purple-500/50 p-6 shadow-2xl shadow-purple-500/30 backdrop-blur-md">
                <h2 className="text-purple-400 text-xl mb-4 tracking-widest">[DATA INTERCEPT]</h2>
                <p ref={interceptLine1Ref} className="min-h-[1.5em] text-lg"></p>
                <p ref={interceptLine2Ref} className="min-h-[1.5em] text-lg"></p>
            </div>

            {mcqState.active && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
                  <div className="w-full max-w-2xl bg-black border-2 border-purple-500 p-8 text-center" style={{ animation: 'flicker 1.5s infinite' }}>
                      <h2 className="text-2xl text-purple-400 mb-6">{mcqState.question}</h2>
                      <div className="flex flex-col items-center space-y-4">
                          {mcqState.options.map((option, index) => (
                              <button key={index} onClick={() => handleMcqChoice(index, threeObjects.current.camera.position)} className="w-full max-w-md px-6 py-3 bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)] text-lg transition-all duration-200 hover:bg-[var(--color-accent)] hover:text-black hover:scale-105">
                                  {option}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
            )}
            
            {typingState.active && (
               <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto">
                   <div className="text-center">
                       <p className="text-xl text-gray-400 mb-2">{typingState.prompt}</p>
                       <div className="text-4xl text-cyan-400 bg-black/50 border border-cyan-400/50 px-4 py-2 tracking-[0.5em]">
                           <span>{typingState.current}</span>
                           <span className="animate-ping">_</span>
                       </div>
                   </div>
               </div>
            )}
            <input ref={typingInputRef} type="text" className="absolute opacity-0 w-0 h-0" />

            <p ref={logRef} className="bg-black/50 p-2 mb-4 backdrop-blur-sm self-center w-full max-w-4xl text-center text-lg"></p>
          </div>
        </>
      )}
      {stage === "terminated" && (
        <div ref={rebootContainerRef} className="w-full h-full flex flex-col items-center justify-center font-mono text-left p-8 opacity-0">
          <div className="w-full max-w-2xl text-lg sm:text-xl text-gray-400">
            <p ref={rebootLine1Ref}></p>
            <p ref={rebootLine2Ref} className="mt-2"></p>
            <p ref={rebootLine3Ref} className="mt-2"></p>
            <span ref={rebootCursorRef} className="w-[10px] h-[1.2em] bg-gray-400 inline-block align-middle"></span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default LandingAnimation;
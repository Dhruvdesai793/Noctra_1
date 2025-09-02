import React, { useEffect } from 'react';
import { gsap } from 'gsap';

const MAX_DOTS = 25;
const FADE_OUT_TIME = 0.7;

const CursorTrail = () => {
  useEffect(() => {
    const dots = [];
    let dotPoolIndex = 0;

    for (let i = 0; i < MAX_DOTS; i++) {
      const dot = document.createElement('div');
      dot.className = 'cursor-trail-dot';
      document.body.appendChild(dot);
      dots.push(dot);
    }

    const moveHandler = (e) => {
      const currentDot = dots[dotPoolIndex];
      dotPoolIndex = (dotPoolIndex + 1) % MAX_DOTS;

      gsap.set(currentDot, {
        x: e.clientX,
        y: e.clientY,
        opacity: 1,
        scale: 1,
      });

      gsap.to(currentDot, {
        opacity: 0,
        scale: 0,
        duration: FADE_OUT_TIME,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', moveHandler);

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      dots.forEach(dot => dot.remove());
    };
  }, []);

  return null;
};

export default CursorTrail;
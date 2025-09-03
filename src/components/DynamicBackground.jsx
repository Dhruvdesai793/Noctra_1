import React, { useEffect, useRef } from 'react';

const DynamicBackground = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: undefined, y: undefined, radius: 250 });
  const pulses = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;
    
    // Perlin Noise generator for the flow field
    const noise = (() => {
      const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
      const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
      const p = new Uint8Array(512);
      for (let i = 0; i < 256; i++) p[i] = p[i + 256] = Math.floor(Math.random() * 256);
      const grad3 = [
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
      ];
      const dot = (g, x, y) => g[0] * x + g[1] * y;
      return {
        noise2D: function(xin, yin) {
          let n0, n1, n2;
          const s = (xin + yin) * F2;
          const i = Math.floor(xin + s);
          const j = Math.floor(yin + s);
          const t = (i + j) * G2;
          const X0 = i - t;
          const Y0 = j - t;
          const x0 = xin - X0;
          const y0 = yin - Y0;
          let i1, j1;
          if (x0 > y0) { i1 = 1; j1 = 0; }
          else { i1 = 0; j1 = 1; }
          const x1 = x0 - i1 + G2;
          const y1 = y0 - j1 + G2;
          const x2 = x0 - 1.0 + 2.0 * G2;
          const y2 = y0 - 1.0 + 2.0 * G2;
          const ii = i & 255;
          const jj = j & 255;
          const gi0 = p[ii + p[jj]] % 12;
          const gi1 = p[ii + i1 + p[jj + j1]] % 12;
          const gi2 = p[ii + 1 + p[jj + 1]] % 12;
          let t0 = 0.5 - x0 * x0 - y0 * y0;
          if (t0 < 0) n0 = 0.0;
          else { t0 *= t0; n0 = t0 * t0 * dot(grad3[gi0], x0, y0); }
          let t1 = 0.5 - x1 * x1 - y1 * y1;
          if (t1 < 0) n1 = 0.0;
          else { t1 *= t1; n1 = t1 * t1 * dot(grad3[gi1], x1, y1); }
          let t2 = 0.5 - x2 * x2 - y2 * y2;
          if (t2 < 0) n2 = 0.0;
          else { t2 *= t2; n2 = t2 * t2 * dot(grad3[gi2], x2, y2); }
          return 70.0 * (n0 + n1 + n2);
        }
      };
    })();

    const settings = {
      particleCount: 150,
      connectionDistance: 120,
      baseColor: '255, 70, 85', // Accent color changed to red
      glyphColor: '255, 255, 255',
      mouseRepelForce: 0.5,
      friction: 0.98,
      flowFieldScale: 0.002,
      flowFieldStrength: 0.2
    };

    let particles = [];
    let hiddenGlyphs = [];
    const glyphChars = ['⬡', '⬢', '⬧', '⬟', '⌬', '⍎', '⍄', '⏣'];

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = `rgba(${settings.baseColor}, 0.8)`;
      }

      update() {
        const angle = noise.noise2D(this.x * settings.flowFieldScale, this.y * settings.flowFieldScale + time) * Math.PI * 2;
        this.vx += Math.cos(angle) * settings.flowFieldStrength;
        this.vy += Math.sin(angle) * settings.flowFieldStrength;

        if (mouse.current.x !== undefined) {
          const dx = this.x - mouse.current.x;
          const dy = this.y - mouse.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.current.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.current.radius - distance) / mouse.current.radius;
            this.vx += forceDirectionX * force * settings.mouseRepelForce;
            this.vy += forceDirectionY * force * settings.mouseRepelForce;
          }
        }
        
        this.vx *= settings.friction;
        this.vy *= settings.friction;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const init = () => {
        particles = [];
        for (let i = 0; i < settings.particleCount; i++) {
          particles.push(new Particle());
        }
        hiddenGlyphs = [];
        for (let i=0; i < 25; i++) {
            hiddenGlyphs.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                char: glyphChars[Math.floor(Math.random() * glyphChars.length)]
            });
        }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const handleMouseOut = () => {
      mouse.current.x = undefined;
      mouse.current.y = undefined;
    }
    const handleMouseDown = (e) => {
        pulses.current.push({
            x: e.clientX,
            y: e.clientY,
            radius: 0,
            maxRadius: 200,
            opacity: 1,
            speed: 3
        });
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('mousedown', handleMouseDown);

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.001;
      const heartbeat = (Math.sin(time * 0.5) + 1) / 2;

      pulses.current.forEach((pulse, index) => {
          pulse.radius += pulse.speed;
          pulse.opacity = 1 - (pulse.radius / pulse.maxRadius);
          if (pulse.opacity <= 0) {
              pulses.current.splice(index, 1);
              return;
          }
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${settings.baseColor}, ${pulse.opacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
      });
      
      const currentMouseRadius = mouse.current.radius + heartbeat * 25;

      if (mouse.current.x !== undefined) {
        hiddenGlyphs.forEach(glyph => {
            const dx = glyph.x - mouse.current.x;
            const dy = glyph.y - mouse.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < currentMouseRadius) {
                const opacity = 1 - (distance / currentMouseRadius);
                ctx.font = '24px monospace';
                ctx.fillStyle = `rgba(${settings.glyphColor}, ${opacity * 0.5})`;
                ctx.fillText(glyph.char, glyph.x, glyph.y);
            }
        });
        
        const gradient = ctx.createRadialGradient(mouse.current.x, mouse.current.y, 0, mouse.current.x, mouse.current.y, currentMouseRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.1 + heartbeat * 0.05})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.current.x, mouse.current.y, currentMouseRadius, 0, Math.PI * 2);
        ctx.clip();

        for (let i = 0; i < particles.length; i++) {
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < settings.connectionDistance) {
                    const opacity = 1 - (distance / settings.connectionDistance);
                    ctx.strokeStyle = `rgba(${settings.baseColor}, ${opacity * 0.3})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        particles.forEach(p => p.draw());
        ctx.restore();
      }

      particles.forEach(p => p.update());

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10 bg-[#0a0a0f]" />;
};

export default DynamicBackground;
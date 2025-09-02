import React, { useEffect, useRef } from 'react';

const DynamicBackground = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let particles = [];
    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
      });
    }

    const drawGrid = (offset, color, lineWidth, size) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      for (let x = -offset; x < canvas.width + offset; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, -offset);
        ctx.lineTo(x, canvas.height + offset);
        ctx.stroke();
      }
      for (let y = -offset; y < canvas.height + offset; y += size) {
        ctx.beginPath();
        ctx.moveTo(-offset, y);
        ctx.lineTo(canvas.width + offset, y);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const parallaxX1 = (mouse.current.x / canvas.width - 0.5) * 40;
      const parallaxY1 = (mouse.current.y / canvas.height - 0.5) * 40;
      const parallaxX2 = (mouse.current.x / canvas.width - 0.5) * 20;
      const parallaxY2 = (mouse.current.y / canvas.height - 0.5) * 20;

      drawGrid(40, 'rgba(255, 70, 85, 0.05)', 0.5, 50 + parallaxX1);
      drawGrid(20, 'rgba(255, 70, 85, 0.07)', 0.5, 50 - parallaxX2);

      ctx.fillStyle = 'rgba(255, 70, 85, 0.5)';
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 -z-10" />;
};

export default DynamicBackground;
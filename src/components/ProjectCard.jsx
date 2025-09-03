import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const GithubIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> );
const ExternalLinkIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> );

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show: { 
    opacity: 1, y: 0, scale: 1, 
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
  },
};

const ProjectCard = ({ title, description, live, repo, tags }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 200, damping: 30 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [-100, 100], [15, -15]);
  const rotateY = useTransform(springX, [-100, 100], [-15, 15]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set((mouseX / rect.width - 0.5) * 200);
    y.set((mouseY / rect.height - 0.5) * 200);

    e.currentTarget.style.setProperty('--mouse-x', `${mouseX}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${mouseY}px`);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className="project-card relative bg-[#111111]/80 backdrop-blur-sm p-6 group transition-all duration-300 border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/80"
      style={{ 
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
        perspective: 1000
      }}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-glare"></div>
      <div className="card-grid"></div>

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <div className="absolute -inset-px bg-[var(--color-accent)] rounded-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" style={{ filter: 'blur(20px)' }} />
        
        <div className="relative z-10" style={{ transformStyle: "preserve-3d" }}>
          
          <div className="flex-grow" style={{ transform: 'translateZ(10px)' }}>
            <motion.h3 
              className="text-2xl font-oxanium text-white group-hover:text-[var(--color-accent)] transition-colors duration-300"
              style={{ transform: 'translateZ(50px)' }}
            >
              {title}
            </motion.h3>

            <motion.p 
              className="mt-3 text-[var(--color-text-darker)] font-sans text-base"
              style={{ transform: 'translateZ(30px)' }}
            >
              {description}
            </motion.p>
            
            <motion.div 
              className="mt-4 flex flex-wrap gap-2"
              style={{ transform: 'translateZ(40px)' }}
            >
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono px-3 py-1"
                  style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)' }}
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-end space-x-4"
            style={{ transform: 'translateZ(20px)' }}
          >
            {repo && ( <a href={repo} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--color-accent)] transition-colors" aria-label="GitHub Repository"><GithubIcon /></a> )}
            {live && ( <a href={live} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--color-accent)] transition-colors" aria-label="Live Demo"><ExternalLinkIcon /></a> )}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
export default ProjectCard;
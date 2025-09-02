import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const GithubIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg> );
const ExternalLinkIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg> );

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const ProjectCard = ({ title, description, live, repo, tags }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width * 200 - 100);
    y.set((e.clientY - rect.top) / rect.height * 200 - 100);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      className="relative bg-[#111111]/80 backdrop-blur-sm p-6 group transition-all duration-300 border border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/80"
      style={{ 
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
        perspective: 1000
      }}
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="transform-gpu"
      >
        <div className="absolute -inset-px bg-[var(--color-accent)] rounded-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300" style={{ filter: 'blur(15px)' }} />
        <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
          <div className="flex-grow">
            <h3 className="text-2xl font-oxanium text-white group-hover:text-[var(--color-accent)] transition-colors duration-300">{title}</h3>
            <p className="mt-2 text-[var(--color-text-darker)] font-sans text-base">{description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-mono px-3 py-1"
                      style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-end space-x-4">
            {repo && ( <a href={repo} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--color-accent)] transition-colors" aria-label="GitHub Repository"><GithubIcon /></a> )}
            {live && ( <a href={live} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--color-accent)] transition-colors" aria-label="Live Demo"><ExternalLinkIcon /></a> )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
export default ProjectCard;
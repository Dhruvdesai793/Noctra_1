import React from 'react';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--color-black)]/80 border-b border-[var(--color-accent)]/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="/" className="group text-4xl font-oxanium text-[var(--color-accent)] transition-all duration-300 hover:text-white">
            <span className="group-hover:text-[var(--color-accent)]">N</span>
            <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">OCTRA</span>
          </a>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-bold tracking-widest font-mono">
            <a href="#projects" className="text-gray-300 hover:text-[var(--color-accent)] transition-colors duration-300 relative group">
              <span>// PROJECTS</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-accent)] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#contact" className="text-gray-300 hover:text-[var(--color-accent)] transition-colors duration-300 relative group">
              <span>// CONTACT</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--color-accent)] transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};
export default Header;
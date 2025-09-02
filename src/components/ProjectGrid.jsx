import React from 'react';
import ProjectCard from './ProjectCard';
import { motion } from 'framer-motion';

const projects = [
  {
    title: "X500",
    description: "A celebratory site for 500 X followers, showcasing dynamic animations and design.",
    live: "https://dhruvdesai793.github.io/x500/",
    repo: "https://github.com/Dhruvdesai793/x500/",
    tags: ["Animation", "CSS", "Celebration"]
  },
  {
    title: "Build Redis Clone",
    description: "A Redis prototype in TypeScript to explore socket programming and core structures.",
    live: null,
    repo: "https://github.com/Dhruvdesai793/Build-Redis",
    tags: ["TypeScript", "Sockets", "Backend"]
  },
  {
    title: "Pokendium",
    description: "A tribute to the Pokémon games, built as a stylish and functional Pokédex.",
    live: "https://dhruvdesai793.github.io/Pokendium/",
    repo: "https://github.com/Dhruvdesai793/Pokendium/",
    tags: ["API", "React", "Frontend"]
  },
  {
    title: "Sonic Mania JS",
    description: "A small game project made with Kaboom.js (formerly Kaplay) to learn basic game development.",
    live: "https://dhruvdesai793.github.io/Sonic-maniaJs/",
    repo: "https://github.com/Dhruvdesai793/Sonic-maniaJs/",
    tags: ["GameDev", "JavaScript", "Kaboom.js"]
  },
  {
    title: "CogniQuiz",
    description: "A frontend quiz app focused on state management principles without a backend.",
    live: "https://dhruvdesai793.github.io/CogniQuiz/",
    repo: "https://github.com/Dhruvdesai793/CogniQuiz/",
    tags: ["React", "State Management", "UI"]
  },
  {
    title: "Hex Viewer (C++)",
    description: "A mind-bending C++ tool for learning about hexadecimal representation.",
    live: null,
    repo: "https://github.com/Dhruvdesai793/Hex-Viewr-cpp/",
    tags: ["C++", "Low-level"]
  },  
];

const gridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const ProjectGrid = () => {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      variants={gridVariants}
      initial="hidden"
      animate="show"
    >
      {projects.map((project, index) => (
        <ProjectCard key={index} {...project} />
      ))}
    </motion.div>
  );
};

export default ProjectGrid;
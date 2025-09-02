import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandingAnimation from './components/LandingAnimation';
import Header from './components/Header';
import ProjectGrid from './components/ProjectGrid';
import Socials from './components/Socials';
import CursorTrail from './components/CursorTrail';
import TextMask from './components/TextMask';
import Contact from './components/Contact';
import DynamicBackground from './components/DynamicBackground';

const MainSiteContent = ({ isIntroFinished }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
        delayChildren: 0.5
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10"
    >
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.section
          variants={itemVariants}
          id="about"
          className="min-h-screen flex items-center mb-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-3 text-center md:text-left">
              <TextMask isVisible={isIntroFinished}>
                <p className="text-2xl text-[var(--color-accent)] font-mono tracking-widest">// STATUS: ONLINE</p>
              </TextMask>
              <TextMask isVisible={isIntroFinished}>
                <h1
                  className="mt-2 text-6xl sm:text-7xl md:text-9xl font-oxanium tracking-wider text-[var(--color-text)] [text-shadow:0_0_15px_var(--color-accent)]"
                >
                  NOCTRA
                </h1>
              </TextMask>
            </div>
            <div className="md:col-span-2 text-xl sm:text-2xl font-light font-sans text-[var(--color-text-darker)] border-l-2 border-[var(--color-accent)] pl-6">
              <TextMask isVisible={isIntroFinished}>
                A student diving into Backend and AI ML, I know FRONTEND a little bit to make things look better. Cs'29 undergrad.
                Grinding is the Key.
              </TextMask>
              <Socials />
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} id="projects">
          <div className="relative mb-16">
            <h2 className="text-5xl sm:text-7xl font-oxanium text-center text-white">// DATA_ARCHIVES</h2>
            <p className="text-center text-xl text-[var(--color-text-darker)] mt-2">SELECTED_WORKS</p>
          </div>
          <ProjectGrid />
        </motion.section>

        <motion.section variants={itemVariants} id="contact" className="mt-40 sm:mt-56">
           <Contact />
        </motion.section>
      </main>

      <motion.footer
        variants={itemVariants}
        className="relative z-10 text-center py-8 text-[var(--color-text-darker)] font-mono text-xs sm:text-sm border-t border-[var(--color-accent)]/10 mt-24 sm:mt-32"
      >
        <Socials />
        <p className="mt-8">&copy; 2025 Noctravellian // SESSION_TERMINATED</p>
      </motion.footer>
    </motion.div>
  );
};

export default function App() {
  const [isIntroFinished, setIntroFinished] = React.useState(false);
  const [showLanding, setShowLanding] = React.useState(true);

  const handleAnimationFinish = () => {
    setIntroFinished(true);
    setShowLanding(false);
  };

  return (
    <>
      <CursorTrail />
      <DynamicBackground />
      <div className="fixed inset-0 z-20 pointer-events-none border-4 border-[var(--color-accent)]/20" />
      <div className="tv-vignette-overlay" />

      <AnimatePresence mode="wait">
        {showLanding ? (
          <LandingAnimation key="landing" onFinish={handleAnimationFinish} />
        ) : (
          <MainSiteContent key="main" isIntroFinished={isIntroFinished} />
        )}
      </AnimatePresence>
    </>
  );
}
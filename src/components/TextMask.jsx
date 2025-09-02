import React from 'react';
import { motion } from 'framer-motion';

const TextMask = ({ children, className, isVisible }) => {
  const variants = {
    hidden: { y: '110%' },
    visible: { y: '0%', transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };

  const animationProps = isVisible !== undefined 
    ? { animate: isVisible ? 'visible' : 'hidden' }
    : { whileInView: 'visible', viewport: { once: true, margin: "-50px" } };

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        variants={variants}
        initial="hidden"
        {...animationProps}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default TextMask;


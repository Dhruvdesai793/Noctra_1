import React from 'react';
import TextMask from './TextMask';

const Contact = () => {
  return (
    <div className="text-center">
      <TextMask>
        <h2 className="text-4xl sm:text-6xl font-oxanium text-white">// INITIATE COMMS</h2>
      </TextMask>
      <TextMask>
        <p className="mt-4 text-lg text-[var(--color-text-darker)] max-w-2xl mx-auto">
          My digital door is always open. Whether you have a question, a proposal, or just want to talk about the future of technology, I'm available for contact.
        </p>
      </TextMask>
      <div className="mt-8">
        <a 
          href="mailto:your-email@example.com" 
          className="inline-block px-8 py-4 bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] text-xl tracking-widest transition-all duration-300 ease-in-out hover:bg-[var(--color-accent)] hover:text-black hover:scale-105 hover:[box-shadow:0_0_25px_var(--color-accent)]"
        >
          &gt; OPEN SECURE CHANNEL
        </a>
      </div>
    </div>
  );
};

export default Contact;
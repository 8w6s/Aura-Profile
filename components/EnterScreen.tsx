'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnterScreenProps {
  onEnter: () => void;
  backgroundUrl?: string;
  blurAmount?: number;
  title?: string;
}

export default function EnterScreen({
  onEnter,
  backgroundUrl,
  blurAmount = 0,
  title = "click to enter..."
}: EnterScreenProps) {
  const [show, setShow] = useState(true);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    if (typedText.length < title.length) {
      const timeout = setTimeout(() => {
        setTypedText(title.slice(0, typedText.length + 1));
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [typedText, title]);

  useEffect(() => {
    setTypedText('');
  }, [title]);

  const handleEnter = () => {
    setShow(false);
    onEnter();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black cursor-pointer select-none overflow-hidden"
          onClick={handleEnter}
        >
          {backgroundUrl && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-50 scale-110"
              style={{
                backgroundImage: `url('${backgroundUrl}')`,
                filter: `blur(${blurAmount}px)`
              }}
            />
          )}
          <div className="absolute inset-0 z-10 bg-black/40" />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-20 text-white text-xl md:text-2xl font-mono tracking-widest text-glow mix-blend-difference"
          >
            {typedText}
            <span className="animate-pulse">_</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

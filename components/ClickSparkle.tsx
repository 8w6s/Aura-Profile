'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
}

const ClickSparkle = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newSparkles = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i + Math.random(),
        x: e.clientX,
        y: e.clientY,
        color: ['#FFD700', '#FF69B4', '#00FFFF', '#FFFFFF'][Math.floor(Math.random() * 4)]
      }));

      setSparkles(prev => [...prev, ...newSparkles]);

      setTimeout(() => {
        setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
      }, 1000);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <AnimatePresence>
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          initial={{ x: sparkle.x, y: sparkle.y, scale: 0, opacity: 1 }}
          animate={{
            x: sparkle.x + (Math.random() - 0.5) * 100,
            y: sparkle.y + (Math.random() - 0.5) * 100,
            scale: 0,
            opacity: 0
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'fixed',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: sparkle.color,
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: `0 0 10px ${sparkle.color}`
          }}
        />
      ))}
    </AnimatePresence>
  );
};

export default ClickSparkle;

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProfile } from '@/app/context/ProfileContext';

export default function CustomCursor() {
  const { profile } = useProfile();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (profile.cursor?.enabled) {
      document.body.style.cursor = 'none';
    } else {
      document.body.style.cursor = 'auto';
    }
    
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [profile.cursor?.enabled]);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON' || 
          (e.target as HTMLElement).tagName === 'A' ||
          (e.target as HTMLElement).closest('button') ||
          (e.target as HTMLElement).closest('a')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!profile.cursor?.enabled) return null;

  if (profile.cursor.customUrl) {
      return (
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9999]"
            animate={{
                x: mousePosition.x,
                y: mousePosition.y,
            }}
            transition={{ type: "tween", ease: "linear", duration: 0 }}
          >
              <img src={profile.cursor.customUrl} alt="cursor" className="w-8 h-8 object-contain drop-shadow-lg" />
          </motion.div>
      );
  }

  return (
    <>
        <motion.div
        className="hidden md:block fixed top-0 left-0 w-4 h-4 rounded-full bg-white mix-blend-difference pointer-events-none z-[9999]"
        animate={{
            x: mousePosition.x - 8,
            y: mousePosition.y - 8,
            scale: isHovering ? 2 : 1,
        }}
        transition={{
            x: { duration: 0 },
            y: { duration: 0 },
            scale: { type: 'spring', stiffness: 500, damping: 30 }
        }}
        />
        {profile.cursor.effect && (
            <motion.div
            className="hidden md:block fixed top-0 left-0 w-8 h-8 rounded-full border border-white mix-blend-difference pointer-events-none z-[9998]"
            animate={{
                x: mousePosition.x - 16,
                y: mousePosition.y - 16,
                scale: isHovering ? 1.5 : 1,
                opacity: isHovering ? 0.5 : 0.2
            }}
            transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
            }}
            />
        )}
    </>
  );
}

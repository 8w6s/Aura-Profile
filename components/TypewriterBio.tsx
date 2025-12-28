'use client';

import React, { useState, useEffect } from 'react';
import { TypewriterBioConfig } from '@/app/context/ProfileContext';

interface TypewriterBioProps {
  config: TypewriterBioConfig;
  className?: string;
}

const TypewriterBio: React.FC<TypewriterBioProps> = ({ config, className }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    if (!config.enabled || !config.lines || config.lines.length === 0) {
        setDisplayText('');
        return;
    }

    const currentLine = config.lines[currentLineIndex];
    
    const handleTyping = () => {
      const fullText = currentLine.text;
      
      if (isDeleting) {
        setDisplayText(prev => fullText.substring(0, prev.length - 1));
        setTypingSpeed(currentLine.deleteSpeed || 50);
      } else {
        setDisplayText(prev => fullText.substring(0, prev.length + 1));
        setTypingSpeed(currentLine.typeSpeed || 100);
      }

      if (!isDeleting && displayText === fullText) {
        if (!config.loop && currentLineIndex === config.lines.length - 1) {
          return;
        }
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setCurrentLineIndex((prev) => (prev + 1) % config.lines.length);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentLineIndex, config, typingSpeed]);

  if (!config.enabled || !config.lines || config.lines.length === 0) return null;

  return (
    <div className={className}>
      <span>{displayText}</span>
      <span className="animate-pulse">|</span>
    </div>
  );
};

export default TypewriterBio;

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

  const activeLines = (config.lines || []).filter((line) => typeof line?.text === 'string');
  const dependencyKey = `${config.enabled}-${config.loop}-${activeLines.length}`;
  const [prevDependencyKey, setPrevDependencyKey] = useState(dependencyKey);

  if (dependencyKey !== prevDependencyKey) {
    setPrevDependencyKey(dependencyKey);
    setCurrentLineIndex(0);
    setDisplayText('');
    setIsDeleting(false);
  } else if (currentLineIndex >= activeLines.length && activeLines.length > 0) {
    setCurrentLineIndex(0);
  }

  useEffect(() => {
    if (!config.enabled || activeLines.length === 0) {
      return;
    }

    const currentLine = activeLines[currentLineIndex];
    if (!currentLine) return;

    const fullText = currentLine.text || '';
    const typeSpeed = Math.max(16, Number(currentLine.typeSpeed) || 100);
    const deleteSpeed = Math.max(16, Number(currentLine.deleteSpeed) || 50);

    if (!isDeleting) {
      if (displayText.length < fullText.length) {
        const timer = setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        }, typeSpeed);
        return () => clearTimeout(timer);
      }

      if (!config.loop && currentLineIndex === activeLines.length - 1) {
        return;
      }

      const timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1200);
      return () => clearTimeout(timer);
    }

    if (displayText.length > 0) {
      const timer = setTimeout(() => {
        setDisplayText(fullText.slice(0, displayText.length - 1));
      }, deleteSpeed);
      return () => clearTimeout(timer);
    }

    const nextTimer = setTimeout(() => {
      setIsDeleting(false);
      setCurrentLineIndex((prev) => (prev + 1) % activeLines.length);
    }, 0);

    return () => clearTimeout(nextTimer);
  }, [activeLines, config.enabled, config.loop, currentLineIndex, displayText, isDeleting]);

  if (!config.enabled || activeLines.length === 0) return null;

  return (
    <div className={className}>
      <span>{displayText}</span>
      <span className="animate-pulse">|</span>
    </div>
  );
};

export default TypewriterBio;

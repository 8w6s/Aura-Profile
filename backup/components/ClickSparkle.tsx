'use client';

import { useEffect } from 'react';
import { usePerformanceMode } from '@/hooks/usePerformanceMode';

type SparkleAnimationParams = {
  translateX: number;
  translateY: number;
  scale: [number, number];
  opacity: [number, number];
  duration: number;
  easing: string;
  complete: () => void;
};

type SparkleAnimator = (targets: HTMLElement, params: SparkleAnimationParams) => unknown;

const sparklePalette = ['#FFD700', '#FF69B4', '#00FFFF', '#FFFFFF'];

const ClickSparkle = () => {
  const { isMinimal, isBalanced } = usePerformanceMode();

  useEffect(() => {
    if (isMinimal) {
      return;
    }

    let animateSparkle: SparkleAnimator | null = null;
    let destroyed = false;

    const setupAnime = async () => {
      const animeImport = await import('animejs');
      animateSparkle = animeImport.animate as unknown as SparkleAnimator;
    };

    setupAnime();

    const handleClick = (e: MouseEvent) => {
      if (!animateSparkle || destroyed) {
        return;
      }

      const sparkleCount = isBalanced ? 4 : 7;

      for (let index = 0; index < sparkleCount; index += 1) {
        const sparkle = document.createElement('span');
        const color = sparklePalette[Math.floor(Math.random() * sparklePalette.length)];

        sparkle.style.position = 'fixed';
        sparkle.style.left = `${e.clientX}px`;
        sparkle.style.top = `${e.clientY}px`;
        sparkle.style.width = '6px';
        sparkle.style.height = '6px';
        sparkle.style.borderRadius = '9999px';
        sparkle.style.pointerEvents = 'none';
        sparkle.style.backgroundColor = color;
        sparkle.style.boxShadow = `0 0 8px ${color}`;
        sparkle.style.zIndex = '9999';
        document.body.appendChild(sparkle);

        animateSparkle(sparkle, {
          translateX: (Math.random() - 0.5) * 70,
          translateY: (Math.random() - 0.5) * 70,
          scale: [1, 0],
          opacity: [1, 0],
          duration: isBalanced ? 420 : 620,
          easing: 'easeOutQuad',
          complete: () => {
            sparkle.remove();
          },
        });
      }
    };

    window.addEventListener('click', handleClick);
    return () => {
      destroyed = true;
      window.removeEventListener('click', handleClick);
    };
  }, [isBalanced, isMinimal]);

  return null;
};

export default ClickSparkle;

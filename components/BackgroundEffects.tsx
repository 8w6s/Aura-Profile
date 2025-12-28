'use client';

import React, { useEffect, useRef } from 'react';
import { useProfile } from '@/app/context/ProfileContext';

export default function BackgroundEffects() {
  const { profile } = useProfile();
  const effect = profile.theme?.backgroundEffect || 'noise';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect !== 'rain' && effect !== 'snow') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number; y: number; speed: number; length?: number; size?: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = effect === 'rain' ? 100 : 50;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: Math.random() * (effect === 'rain' ? 15 : 2) + (effect === 'rain' ? 10 : 1),
          length: Math.random() * 20 + 10,
          size: Math.random() * 3 + 2,
        });
      }
    };

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;

      particles.forEach((p) => {
        if (effect === 'rain') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + (p.length || 10));
          ctx.stroke();
          p.y += p.speed;
          if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed;
          p.x += Math.sin(p.y * 0.01) * 0.5;
          if (p.y > canvas.height) {
            p.y = -5;
            p.x = Math.random() * canvas.width;
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [effect]);

  return (
    <>
      {effect === 'noise' && <div className="noise-bg" />}
      <div className="fixed inset-0 pointer-events-none z-[100] crt" />
      {(effect === 'rain' || effect === 'snow') && (
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      )}
    </>
  );
}

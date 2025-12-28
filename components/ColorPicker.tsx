'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);

  const close = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popover.current && !popover.current.contains(event.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full">
      {label && <label className="text-xs text-gray-500 mb-1 block">{label}</label>}
      <div className="flex gap-2 items-center w-full">
        <button
          className="w-10 h-10 rounded-lg border border-white/10 shadow-sm cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group shrink-0"
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
            <Palette size={16} className="text-white drop-shadow-md" />
          </div>
        </button>
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-10 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 transition-colors uppercase"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popover}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute z-50 top-full left-0 mt-2 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl"
          >
            <style jsx global>{`
              .react-colorful {
                width: 200px;
                height: 200px;
              }
              .react-colorful__saturation {
                border-radius: 8px 8px 0 0;
              }
              .react-colorful__hue {
                border-radius: 0 0 8px 8px;
                height: 20px;
                margin-top: 12px;
              }
              .react-colorful__pointer {
                width: 16px;
                height: 16px;
              }
            `}</style>
            <HexColorPicker color={color} onChange={onChange} />

            <div className="mt-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono">#</span>
                <input
                  value={color.replace('#', '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                      onChange(`#${val}`);
                    }
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-6 pr-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  placeholder="HEX"
                  maxLength={6}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

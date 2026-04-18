'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle size={20} className="text-green-400" />,
  error: <AlertCircle size={20} className="text-red-400" />,
  info: <Info size={20} className="text-blue-400" />,
};

const bgColors = {
  success: 'bg-green-500/10 border-green-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  info: 'bg-blue-500/10 border-blue-500/20',
};

export default function Toast({ id, message, type, duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (duration === 0 || duration === Infinity) return;
    
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onDismiss, duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg min-w-[300px] ${bgColors[type]} bg-[#111]/90`}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-white flex-1">{message}</p>
      <button 
        onClick={() => onDismiss(id)}
        className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

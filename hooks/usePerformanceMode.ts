'use client';

import { useEffect, useMemo, useState } from 'react';

export type PerformanceMode = 'full' | 'balanced' | 'minimal';

const detectPerformanceMode = (): PerformanceMode => {
  if (typeof window === 'undefined') {
    return 'balanced';
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const runtimeNavigator = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };

  const saveData = runtimeNavigator.connection?.saveData === true;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 4;
  const deviceMemory = runtimeNavigator.deviceMemory ?? 4;

  if (reducedMotion || saveData || hardwareConcurrency <= 4 || deviceMemory <= 4) {
    return 'minimal';
  }

  if (hardwareConcurrency <= 6 || deviceMemory <= 8) {
    return 'balanced';
  }

  return 'full';
};

export const usePerformanceMode = () => {
  const [mode, setMode] = useState<PerformanceMode>('balanced');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateMode = () => {
      setMode(detectPerformanceMode());
    };

    updateMode();
    mediaQuery.addEventListener('change', updateMode);

    return () => {
      mediaQuery.removeEventListener('change', updateMode);
    };
  }, []);

  return useMemo(
    () => ({
      mode,
      isMinimal: mode === 'minimal',
      isBalanced: mode === 'balanced',
      isFull: mode === 'full',
    }),
    [mode]
  );
};



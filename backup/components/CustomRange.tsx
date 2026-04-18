import React from 'react';

interface CustomRangeProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

const CustomRange: React.FC<CustomRangeProps> = ({ value, min, max, step = 1, onChange, className = '' }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative w-full h-6 flex items-center group ${className}`}>
      <div className="absolute w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-150 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
      />

      <div 
        className="absolute w-4 h-4 bg-white rounded-full shadow-lg shadow-indigo-500/50 pointer-events-none transition-all duration-150 ease-out border-2 border-indigo-500 group-hover:scale-125"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
};

export default CustomRange;

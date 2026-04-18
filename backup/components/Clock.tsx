'use client';

import React, { useState, useEffect } from 'react';

interface ClockProps {
  timezone: string;
  format: string;
}

const Clock: React.FC<ClockProps> = ({ timezone, format }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
          timeZone: timezone || 'UTC',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        };

        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';

        let formatted = format;
        formatted = formatted.replace('HH', getPart('hour'));
        formatted = formatted.replace('hh', getPart('hour'));
        formatted = formatted.replace('mm', getPart('minute'));
        formatted = formatted.replace('ss', getPart('second'));

        setTime(formatted);
      } catch (e) {
        setTime('--:--');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone, format]);

  return <span>{time}</span>;
};

export default Clock;

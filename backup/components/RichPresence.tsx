import React, { useEffect, useState } from 'react';
import { LanyardData } from '@/hooks/useLanyard';
import { motion } from 'framer-motion';

interface RichPresenceProps {
  activities: LanyardData['activities'];
  spotify: LanyardData['spotify'];
  listening_to_spotify: boolean;
}

export default function RichPresence({ activities, spotify, listening_to_spotify }: RichPresenceProps) {
  const [elapsed, setElapsed] = useState<string>('');

  const activity = activities?.find(a => a.type !== 4);

  useEffect(() => {
    if (!activity?.timestamps) return;

    const updateTime = () => {
      const start = activity.timestamps?.start;
      const end = activity.timestamps?.end;
      const now = Date.now();

      if (end) {
        const remaining = end - now;
        if (remaining > 0) {
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setElapsed(`${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} left`);
        } else {
            setElapsed('00:00 left');
        }
      } else if (start) {
        const diff = now - start;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsed(`${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} elapsed`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activity]);

  if (listening_to_spotify && spotify) {
    return (
      <div className="mt-6 w-full bg-[#18181b] rounded-xl p-4 border border-white/5 flex gap-4 items-center shadow-lg max-w-sm">
        <div className="relative shrink-0">
            <img 
                src={spotify.album_art_url} 
                alt={spotify.album} 
                className="w-20 h-20 rounded-lg shadow-md"
            />
            <div className="absolute -top-2 -right-2 bg-[#1db954] p-1.5 rounded-full shadow-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.32-1.38 9.841-.719 13.44 1.56.42.3.6.84.3 1.26zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.4-1.02 15.6 1.44.6.36.84 1.02.479 1.62-.36.601-1.02.84-1.62.48z"/>
                </svg>
            </div>
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[#1db954] text-xs font-bold uppercase tracking-wider mb-1">Listening to Spotify</p>
            <h3 className="text-white font-bold text-sm truncate" title={spotify.song}>{spotify.song}</h3>
            <p className="text-gray-400 text-xs truncate" title={spotify.artist}>by {spotify.artist}</p>
            <p className="text-gray-500 text-xs truncate mt-0.5" title={spotify.album}>on {spotify.album}</p>
        </div>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="mt-6 w-full bg-[#18181b] rounded-xl p-4 border border-white/5 flex gap-4 items-start shadow-lg max-w-sm">
      <div className="relative shrink-0">
        {activity.assets?.large_image ? (
          <img 
            src={`https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}.png`} 
            alt={activity.name} 
            className="w-20 h-20 rounded-xl shadow-md object-cover"
          />
        ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center">
                <span className="text-2xl">🎮</span>
            </div>
        )}
        {activity.assets?.small_image && (
          <img 
            src={`https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}.png`} 
            alt="Small Asset" 
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-2 border-[#18181b] bg-[#18181b]"
          />
        )}
      </div>
      
      <div className="min-w-0 flex-1 py-1">
        <h3 className="text-white font-bold text-sm leading-tight truncate">{activity.name}</h3>
        {activity.details && <p className="text-gray-300 text-xs mt-1 truncate" title={activity.details}>{activity.details}</p>}
        {activity.state && <p className="text-gray-400 text-xs mt-0.5 truncate" title={activity.state}>{activity.state}</p>}
        {elapsed && <p className="text-gray-500 text-xs mt-1 font-mono">{elapsed}</p>}
      </div>
    </div>
  );
}

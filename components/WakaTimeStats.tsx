'use client';

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/app/context/ProfileContext';
import { Clock, Code } from 'lucide-react';

const WakaTimeStats = () => {
  const { profile } = useProfile();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profile.integrations?.wakatime?.enabled || !profile.integrations.wakatime.username) {
        setLoading(false);
        return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/wakatime?username=${profile.integrations?.wakatime?.username}`);
        if (res.ok) {
            const data = await res.json();
            setStats(data.data);
        } else {
            setError(true);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile.integrations?.wakatime]);

  if (!profile.integrations?.wakatime?.enabled || !profile.integrations.wakatime.username) return null;
  if (loading) return <div className="animate-pulse h-20 bg-white/5 rounded-xl"></div>;
  if (error || !stats) return null; // Hide if error to avoid clutter

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--primary)] font-semibold border-b border-white/10 pb-2">
            <Clock size={18} />
            <h2>Coding Activity (Last 7 Days)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Languages */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                <h3 className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Code size={12} /> Languages
                </h3>
                <div className="space-y-2">
                    {stats.languages?.slice(0, 5).map((lang: any) => (
                        <div key={lang.name} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-white">{lang.name}</span>
                                <span className="text-gray-400">{lang.text}</span>
                            </div>
                            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" 
                                    style={{ width: `${lang.percent}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* General Stats */}
            <div className="grid grid-rows-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-center items-center text-center">
                    <span className="text-3xl font-bold text-white">{stats.human_readable_total}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Total Time</span>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-center items-center text-center">
                    <span className="text-xl font-bold text-indigo-300">{stats.daily_average_text}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Daily Average</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default WakaTimeStats;

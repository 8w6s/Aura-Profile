'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2, VolumeX, ListMusic, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile, MusicTrack } from '@/app/context/ProfileContext';
import CustomRange from './CustomRange';

export default function MusicPlayer({ waitUserInteraction = false }: { waitUserInteraction?: boolean }) {
  const { profile } = useProfile();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(profile.musicConfig?.volume || 0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playlist = profile.playlist || [];
  const currentTrack = playlist[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (profile.musicConfig?.autoplay && !isPlaying && !waitUserInteraction) {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.warn("Autoplay blocked or failed:", e);
        });
      }
    }
  }, [profile.musicConfig?.autoplay, waitUserInteraction]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      nextTrack();
    }
  };

  const nextTrack = () => {
    let nextIndex;
    if (playlist.length === 0) return;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length;
    }

    if (playlist.length === 1) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (!audioRef.current) return;

    if (audioRef.current.currentTime > 10) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => setIsPlaying(true));
      return;
    }

    if (playlist.length === 1) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setProgress(value);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!playlist.length) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        autoPlay={isPlaying}
      />

      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isExpanded ? 'w-80 md:w-96' : 'w-16 h-16 rounded-full hover:scale-105'}`}
      >
        <div className={`bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden ${isExpanded ? 'rounded-2xl p-4' : 'rounded-full h-full w-full flex items-center justify-center cursor-pointer'}`}>

          {!isExpanded && (
            <div onClick={() => setIsExpanded(true)} className="relative w-full h-full flex items-center justify-center group cursor-pointer">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-700"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="text-[var(--primary)] transition-all duration-100 ease-linear"
                  strokeDasharray={`${(progress / (duration || 1)) * 100}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>

              <div className="relative z-10 w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-inner">
                {currentTrack?.coverUrl ? (
                  <img src={currentTrack.coverUrl} className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <MusicTrackIcon isPlaying={isPlaying} />
                  </div>
                )}
              </div>
            </div>
          )}

          {isExpanded && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg bg-white/10 overflow-hidden relative ${isPlaying ? 'animate-pulse' : ''}`}>
                    {currentTrack?.coverUrl ? (
                      <img src={currentTrack.coverUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--primary)]">
                        <Volume2 size={20} />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden w-40">
                    <h3 className="font-bold text-white text-sm truncate">{currentTrack?.title || 'Unknown Title'}</h3>
                    <p className="text-xs text-gray-400 truncate">{currentTrack?.artist || 'Unknown Artist'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowPlaylist(!showPlaylist)} className={`p-1.5 rounded-lg transition-colors ${showPlaylist ? 'bg-[var(--primary)]/20 text-[var(--primary)]' : 'text-gray-400 hover:text-white'}`}>
                    <ListMusic size={16} />
                  </button>
                  <button onClick={() => setIsExpanded(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
                    <Minimize2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <CustomRange
                  value={progress}
                  min={0}
                  max={duration || 100}
                  onChange={handleSeek}
                  className="h-3"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2 rounded-lg transition-colors ${isShuffle ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                  <Shuffle size={16} />
                </button>

                <div className="flex items-center gap-4">
                  <button onClick={prevTrack} className="text-gray-300 hover:text-white transition-colors">
                    <SkipBack size={20} />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/20"
                  >
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button onClick={nextTrack} className="text-gray-300 hover:text-white transition-colors">
                    <SkipForward size={20} />
                  </button>
                </div>

                <button onClick={() => setIsRepeat(!isRepeat)} className={`p-2 rounded-lg transition-colors ${isRepeat ? 'text-indigo-400' : 'text-gray-500 hover:text-white'}`}>
                  <Repeat size={16} />
                </button>
              </div>

              <div className="flex items-center gap-3 px-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <CustomRange
                  value={isMuted ? 0 : volume * 100}
                  min={0}
                  max={100}
                  onChange={(val) => {
                    setVolume(val / 100);
                    if (val > 0) setIsMuted(false);
                  }}
                  className="h-1.5"
                />
              </div>

              <AnimatePresence>
                {showPlaylist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/10 pt-2"
                  >
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                      {playlist.map((track, idx) => (
                        <div
                          key={track.id}
                          onClick={() => {
                            setCurrentTrackIndex(idx);
                            setIsPlaying(true);
                          }}
                          className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${currentTrackIndex === idx ? 'bg-white/10' : ''}`}
                        >
                          <div className="text-xs font-mono text-gray-500 w-4">{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${currentTrackIndex === idx ? 'text-indigo-400' : 'text-gray-300'}`}>{track.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{track.artist}</p>
                          </div>
                          {currentTrackIndex === idx && isPlaying && (
                            <div className="flex gap-0.5 h-3 items-end">
                              <div className="w-0.5 bg-indigo-500 animate-music-bar-1 h-full"></div>
                              <div className="w-0.5 bg-indigo-500 animate-music-bar-2 h-2"></div>
                              <div className="w-0.5 bg-indigo-500 animate-music-bar-3 h-full"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

const MusicTrackIcon = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex gap-1 items-end h-4">
    <div className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-[bounce_1s_infinite]' : 'h-1'}`} />
    <div className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-[bounce_1.2s_infinite]' : 'h-2'}`} />
    <div className={`w-1 bg-white rounded-full ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : 'h-1.5'}`} />
  </div>
);

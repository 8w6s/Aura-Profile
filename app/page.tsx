'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Info,
  Heart,
  MessageCircle,
  Bookmark,
  MapPin,
  Mail,
  Link as LinkIcon,
  Settings,
  ExternalLink,
  Grid,
  User,
  Eye,
  Code
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import * as FaIcons from 'react-icons/fa';
import * as SiIcons from 'react-icons/si';

const AllIcons = { ...LucideIcons, ...FaIcons, ...SiIcons };
import MusicPlayer from '@/components/MusicPlayer';
import ClickSparkle from '@/components/ClickSparkle';
import EnterScreen from '@/components/EnterScreen';
import BackgroundEffects from '@/components/BackgroundEffects';
import CustomCursor from '@/components/CustomCursor';
import TypewriterBio from '@/components/TypewriterBio';
import Clock from '@/components/Clock';
import { useProfile } from '@/app/context/ProfileContext';
import { useToast } from '@/app/context/ToastContext';
import { useLanyard } from '@/hooks/useLanyard';
import RichPresence from '@/components/RichPresence';
import WakaTimeStats from '@/components/WakaTimeStats';
import PostDownloadButton from '@/components/PostDownloadButton';

export default function Home() {
  const { profile, updateProfile, refreshProfile } = useProfile();
  const { showToast } = useToast();
  const { data: lanyardData } = useLanyard(profile.discordId);
  const [activeTab, setActiveTab] = useState<'home' | 'posts'>('home');
  const [entered, setEntered] = useState(false);
  const [typedRole, setTypedRole] = useState('');
  const [typedName, setTypedName] = useState('');
  const [hoyoverseData, setHoyoverseData] = useState<Record<string, any>>({});
  const [steamData, setSteamData] = useState<any>(null);
  const [leetcodeData, setLeetCodeData] = useState<any>(null);

  useEffect(() => {
    if (!profile.integrations?.hoyoverse?.enabled) return;

    profile.integrations.hoyoverse.accounts?.forEach(async (account) => {
      if ((account.game === 'genshin' || account.game === 'hsr') && account.uid) {
        try {
          const res = await fetch(`/api/hoyoverse?game=${account.game}&uid=${account.uid}`);
          if (res.ok) {
            const data = await res.json();
            setHoyoverseData(prev => ({ ...prev, [account.id]: data }));
          }
        } catch (e) {
          console.error("Failed to fetch Hoyoverse data", e);
        }
      }
    });
  }, [profile.integrations?.hoyoverse]);

  useEffect(() => {
    if (profile.integrations?.steam?.enabled && profile.integrations.steam.steamId && profile.integrations.steam.apiKey) {
      fetch(`/api/steam?steamId=${profile.integrations.steam.steamId}&apiKey=${profile.integrations.steam.apiKey}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setSteamData(data);
        })
        .catch(console.error);
    }
  }, [profile.integrations?.steam]);

  useEffect(() => {
    if (profile.integrations?.leetcode?.enabled && profile.integrations.leetcode.username) {
      fetch(`/api/leetcode?username=${profile.integrations.leetcode.username}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setLeetCodeData(data);
        })
        .catch(console.error);
    }
  }, [profile.integrations?.leetcode]);

  const postCount = profile.posts?.length || 0;
  const totalLikes = profile.posts?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
  const totalComments = profile.posts?.reduce((sum, post) => sum + (post.comments?.length || 0), 0) || 0;

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });

      const data = await res.json();

      if (res.ok) {
        const newPosts = [...profile.posts];
        const postIndex = newPosts.findIndex(p => p.id === postId);
        if (postIndex !== -1) {
          newPosts[postIndex] = { ...newPosts[postIndex], likes: data.likes };
          updateProfile({ posts: newPosts });
        }

        if (data.liked) {
          showToast('Post liked!', 'success');
        } else {
          showToast('Post unliked', 'info');
        }
      } else {
        showToast('Action failed', 'error');
      }

    } catch (error) {
      console.error(error);
      showToast('Network error', 'error');
    }
  };

  const handleShare = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  const maskName = (name: string) => {
    if (name.length <= 4) return name[0] + '***';
    return name.slice(0, 2) + '*****' + name.slice(-2);
  };
  useEffect(() => {
    if (!entered) return;
    let i = 0;
    const text = profile.role;
    setTypedRole('');

    const interval = setInterval(() => {
      setTypedRole(text.slice(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [entered, profile.role]);

  useEffect(() => {
    if (!entered || profile.textEffects?.name !== 'typewriter') return;
    let i = 0;
    const text = profile.name;
    setTypedName('');

    const interval = setInterval(() => {
      setTypedName(text.slice(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [entered, profile.name, profile.textEffects?.name]);

  useEffect(() => {
    const incrementView = async () => {
      try {
        await fetch('/api/views', { method: 'POST' });
      } catch (error) {
        console.error('Failed to increment view count', error);
      }
    };
    if (entered) {
      incrementView();
    }
  }, [entered]);

  useEffect(() => {
    if (profile.metadata?.title) {
      if (profile.metadata.enableTypewriter) {
        let i = 0;
        const originalTitle = profile.metadata.title;
        const interval = setInterval(() => {
          document.title = originalTitle.substring(0, i + 1);
          i++;
          if (i > originalTitle.length) {
            i = 0;
          }
        }, 300);
        return () => clearInterval(interval);
      } else {
        document.title = profile.metadata.title;
      }
    }

    if (profile.metadata?.iconUrl) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      (link as HTMLLinkElement).type = 'image/x-icon';
      (link as HTMLLinkElement).rel = 'shortcut icon';
      (link as HTMLLinkElement).href = profile.metadata.iconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [profile.metadata?.iconUrl, profile.metadata?.title, profile.metadata?.enableTypewriter]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const socialIcons: Record<string, React.ElementType> = {
    github: Github,
    linkedin: Linkedin,
    twitter: Twitter,
    instagram: Instagram,
    facebook: Facebook,
    email: Mail,
    website: LinkIcon,
  };

  const getSocialIcon = (platform: string) => {
    if (socialIcons[platform]) return socialIcons[platform];
    if ((AllIcons as any)[platform]) return (AllIcons as any)[platform];
    const key = Object.keys(AllIcons).find(k => k.toLowerCase() === platform.toLowerCase());
    if (key) return (AllIcons as any)[key];
    return LinkIcon;
  };

  const socialColors: Record<string, string> = {
    github: "hover:bg-gray-800",
    linkedin: "hover:bg-blue-700",
    twitter: "hover:bg-sky-500",
    instagram: "hover:bg-pink-600",
    facebook: "hover:bg-blue-600",
  };

  const themeStyles = {
    '--primary': profile.theme?.primaryColor || '#4f46e5',
    '--accent': profile.theme?.accentColor || '#ec4899',
    '--text': profile.theme?.textColor || '#ffffff',
    '--background': profile.theme?.backgroundColor || '#000000',
    '--card-bg': profile.theme?.cardColor ? `${profile.theme.cardColor}${Math.round((profile.theme.cardOpacity || 0.4) * 255).toString(16).padStart(2, '0')}` : 'rgba(0,0,0,0.4)',
    '--card-blur': `${profile.theme?.cardBlur || 20}px`,
    '--component-bg': profile.theme?.componentColor || 'rgba(255,255,255,0.05)',
    '--bg-blur': `${profile.theme?.backgroundBlur || 0}px`,
    '--card-radius': `${profile.theme?.cardBorderRadius || 40}px`,
    '--component-radius': `${profile.theme?.componentBorderRadius || 12}px`,
    '--btn-radius': `${profile.theme?.buttonBorderRadius || 12}px`,
    '--btn-color': profile.theme?.buttonColor || '#4f46e5',
    '--font-custom': profile.theme?.fontFamily ? `"${profile.theme.fontFamily}", sans-serif` : 'inherit',
  } as React.CSSProperties;

  return (
    <main
      className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden select-none"
      style={{ ...themeStyles, fontFamily: 'var(--font-custom)' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style jsx global>{`
        body {
          cursor: none !important;
        }
        * {
          cursor: none !important;
        }
        a, button, input, textarea, select {
          cursor: none !important;
        }
        [role="button"], [type="button"], [type="submit"], [type="reset"] {
          cursor: none !important;
        }
        .text-shadow-glow {
          text-shadow: 0 0 10px var(--primary), 0 0 20px var(--accent);
        }
        .parallax-bg {
           transform-style: preserve-3d;
           will-change: transform;
        }
      `}</style>
      {profile.theme?.fontFamily && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${profile.theme.fontFamily.replace(/ /g, '+')}&display=swap`}
        />
      )}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: `url('${profile.theme?.backgroundImageUrl || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop"}')`,
        }}
      />
      <div className="absolute inset-0 z-0 bg-black/60" style={{
        backgroundColor: profile.theme?.backgroundColor ? `${profile.theme.backgroundColor}99` : undefined,
        backdropFilter: 'blur(var(--bg-blur))',
        WebkitBackdropFilter: 'blur(var(--bg-blur))'
      }} />

      <BackgroundEffects />
      <CustomCursor />
      <ClickSparkle />
      <MusicPlayer waitUserInteraction={!entered && profile.features?.enableEnterScreen !== false} />

      <AnimatePresence>
        {!entered && profile.features?.enableEnterScreen !== false && (
          <EnterScreen
            onEnter={() => setEntered(true)}
            backgroundUrl={profile.enterScreen?.backgroundUrl || profile.theme?.backgroundImageUrl || profile.bannerUrl}
            blurAmount={profile.theme?.enterScreenBlur}
            title={profile.enterScreen?.title || "click to enter..."}
          />
        )}
      </AnimatePresence>

      {(entered || profile.features?.enableEnterScreen === false) && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto ring-1 ring-white/5 no-scrollbar"
          style={{
            backgroundColor: 'var(--card-bg)',
            backdropFilter: 'blur(var(--card-blur))',
            WebkitBackdropFilter: 'blur(var(--card-blur))',
            borderRadius: 'var(--card-radius)',
          }}
        >
          <div className="grid grid-rows-[200px_auto] md:grid-rows-[250px_auto]">
            <div className="relative h-full w-full bg-cover bg-center" style={{ backgroundImage: `url('${profile.bannerUrl}')` }}>
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
            </div>

            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-[180px_auto] gap-8">
              <div className="relative -mt-24 md:-mt-32 mb-4 group z-10 flex flex-col items-center md:items-start text-center md:text-left">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="relative inline-block"
                >
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#171717] shadow-2xl bg-gray-800 relative z-10 overflow-hidden">
                    <img
                      src={lanyardData?.discord_user.avatar ? `https://cdn.discordapp.com/avatars/${lanyardData.discord_user.id}/${lanyardData.discord_user.avatar}.png?size=256` : profile.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute bottom-0 right-0 md:bottom-1 md:right-1 z-20 bg-[#171717] rounded-full p-1 shadow-sm">
                    {(() => {
                      const status = lanyardData?.discord_status || 'offline';
                      const isMobile = lanyardData?.active_on_discord_mobile;

                      if (isMobile) {
                        return (
                          <div className="w-5 h-5 md:w-7 md:h-7 text-[#23a559] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z" />
                            </svg>
                          </div>
                        );
                      }

                      switch (status) {
                        case 'online':
                          return (
                            <div className="w-5 h-5 md:w-7 md:h-7 text-[#23a559]">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            </div>
                          );
                        case 'idle':
                          return (
                            <div className="w-5 h-5 md:w-7 md:h-7 text-[#f0b232]">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M16.023 2.65c-.41-.05-.83-.08-1.25-.08-5.52 0-10 4.48-10 10s4.48 10 10 10c4.18 0 7.76-2.57 9.29-6.24-.26.04-.52.07-.79.07-4.14 0-7.5-3.36-7.5-7.5 0-2.31 1.05-4.38 2.7-5.75-.48-.28-.98-.44-1.45-.5z" />
                              </svg>
                            </div>
                          );
                        case 'dnd':
                          return (
                            <div className="w-5 h-5 md:w-7 md:h-7 text-[#f23f43]">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <circle cx="12" cy="12" r="10" />
                                <rect x="5" y="10" width="14" height="4" rx="2" fill="#171717" />
                              </svg>
                            </div>
                          );
                        default:
                          return (
                            <div className="w-5 h-5 md:w-7 md:h-7 text-[#80848e]">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" fillRule="evenodd" />
                              </svg>
                            </div>
                          );
                      }
                    })()}
                  </div>
                </motion.div>

                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      {profile.textEffects?.name === 'typewriter' ? (
                        <h1 className="text-3xl font-bold text-white tracking-tight text-shadow-glow">
                          {typedName}<span className="animate-pulse">_</span>
                        </h1>
                      ) : (
                        <h1
                          className={`text-3xl font-bold text-white tracking-tight text-shadow-glow ${profile.textEffects?.name && profile.textEffects.name !== 'none' ? `effect-${profile.textEffects.name}` : ''}`}
                          data-text={profile.name}
                        >
                          {profile.name}
                        </h1>
                      )}
                      {lanyardData?.primary_guild && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2B2D31] border border-[#1E1F22]">
                          {lanyardData.primary_guild.badge && (
                            <img
                              src={`https://cdn.discordapp.com/guild-badges/${lanyardData.primary_guild.identity_guild_id}/${lanyardData.primary_guild.badge}.png`}
                              alt="Guild Badge"
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span className="text-gray-300 text-xs font-medium">
                            {lanyardData.primary_guild.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
                    <span className="px-2 py-0.5 rounded-full border border-white/10 text-[10px] text-gray-400 font-mono" style={{ backgroundColor: 'var(--component-bg)' }}>
                      UID: 1337
                    </span>
                    {profile.features?.showViews !== false && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                        <Eye size={12} />
                        <span>{profile.stats?.views?.toLocaleString() || 0}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-indigo-300 font-mono text-sm h-6">
                    &gt; {typedRole}<span className="animate-pulse">_</span>
                  </p>
                  {profile.location && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 text-sm mt-1">
                      <MapPin size={14} />
                      <span>{profile.location}</span>
                      {profile.timezone && (
                        <span className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
                          <Clock timezone={profile.timezone} format={profile.timeFormat || 'HH:mm'} />
                        </span>
                      )}
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 text-sm mt-1">
                      <Mail size={14} />
                      <a href={`mailto:${profile.email}`} className="hover:text-white transition-colors">{profile.email}</a>
                    </div>
                  )}

                  {lanyardData && (
                    <RichPresence
                      activities={lanyardData.activities}
                      spotify={lanyardData.spotify}
                      listening_to_spotify={lanyardData.listening_to_spotify}
                    />
                  )}
                </div>

              </div>

              <div className="flex flex-col gap-8">
                {profile.directLinks.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-3">
                    {profile.directLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 border border-white/5 hover:border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/10"
                        style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{link.icon}</span>
                          <span className="text-white font-medium text-lg">{link.title}</span>
                        </div>
                        <ExternalLink className="text-gray-500 group-hover:text-white transition-colors" size={20} />
                      </a>
                    ))}
                  </motion.div>
                )}

                <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 p-6 border border-white/5 backdrop-blur-md" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                  <div className="flex flex-col items-center justify-center text-center border-r border-white/10">
                    <span className="text-2xl font-bold text-white">{postCount.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">Posts</span>
                  </div>
                  {profile.features?.showLikes !== false && (
                    <div className="flex flex-col items-center justify-center text-center border-r border-white/10">
                      <span className="text-2xl font-bold text-white">{totalLikes.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm">Likes</span>
                    </div>
                  )}
                  {profile.features?.showComments !== false && (
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold text-white">{totalComments.toLocaleString()}</span>
                      <span className="text-gray-400 text-sm">Comments</span>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                    <Info size={18} />
                    <h2>About Me</h2>
                  </div>
                  {profile.typewriterBio?.enabled ? (
                    <TypewriterBio config={profile.typewriterBio} className="text-gray-300 leading-relaxed whitespace-pre-wrap font-mono wrap-break-word" />
                  ) : (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {profile.bio}
                    </p>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <WakaTimeStats />
                </motion.div>

                {profile.projects && profile.projects.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                      <Grid size={18} />
                      <h2>Projects</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.projects.map((project) => (
                        <a
                          key={project.id}
                          href={project.link || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block border border-white/5 hover:border-white/20 overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-lg"
                          style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}
                        >
                          {project.imageUrl && (
                            <div className="h-32 w-full overflow-hidden">
                              <img
                                src={project.imageUrl}
                                alt={project.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </div>
                          )}
                          <div className="p-4 space-y-2">
                            <h3 className="font-bold text-white group-hover:text-(--primary) transition-colors">{project.title}</h3>
                            <p className="text-sm text-gray-400 line-clamp-2">{project.description}</p>
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {project.tags.map((tag, idx) => (
                                  <span key={idx} className="text-[10px] px-2 py-1 bg-white/10 rounded-full text-gray-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div variants={itemVariants} className="p-6 border border-white/5 space-y-4" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                    <h3 className="text-white font-medium mb-4">Engagement</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 bg-(--accent)/20 rounded-lg text-(--accent)">
                            <Heart size={18} />
                          </div>
                          <span>Likes</span>
                        </div>
                        <span className="font-bold text-white">{totalLikes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-gray-300">
                          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                            <MessageCircle size={18} />
                          </div>
                          <span>Comments</span>
                        </div>
                        <span className="font-bold text-white">{totalComments.toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="p-6 border border-white/5" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                    <h3 className="text-white font-medium mb-4">Connect</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {profile.socials.map((social, index) => {
                        const Icon = getSocialIcon(social.platform);
                        if (!social.enabled) return null;

                        return (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center aspect-square bg-white/10 text-white transition-all duration-300 ${socialColors[social.platform]} hover:scale-110`}
                            style={{ borderRadius: 'var(--btn-radius)' }}
                          >
                            <Icon size={24} />
                          </a>
                        );
                      })}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                      {profile.email && (
                        <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors">
                          <Mail size={16} />
                          <span>{profile.email}</span>
                        </a>
                      )}
                    </div>
                  </motion.div>
                </div>

                {profile.posts && profile.posts.length > 0 && (
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                      <Grid size={18} />
                      <h2>Recent Posts</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {profile.posts
                        .filter(post => !post.hidden)
                        .map((post) => (
                        <Link href={`/post/${post.id}`} key={post.id} className="block overflow-hidden border border-white/10 transition-transform duration-300 hover:scale-[1.01] hover:border-white/20" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                          {post.imageUrl && (
                            <div className="h-64 w-full overflow-hidden">
                              <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                            </div>
                          )}
                          <div className="p-6 space-y-4">
                            <div>
                              <h3 className="text-xl font-bold text-white mb-2 hover:text-(--primary) transition-colors">{post.title}</h3>
                              <div className="text-gray-300 line-clamp-3 prose prose-invert max-w-none text-sm">
                                <ReactMarkdown>{post.content}</ReactMarkdown>
                              </div>

                              {post.attachments && post.attachments.length > 0 && (
                                <div className="mt-4" onClick={(e) => e.preventDefault()}>
                                  <PostAttachments attachments={post.attachments} files={profile.files} />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div className="flex items-center gap-4">
                                {profile.features?.showLikes !== false && (
                                  <button
                                    onClick={(e) => profile.features?.allowLikes !== false && handleLike(post.id, e)}
                                    className={`flex items-center gap-2 transition-colors ${profile.features?.allowLikes === false ? 'cursor-default text-gray-500' : 'text-gray-400 hover:text-(--accent)'}`}
                                  >
                                    <Heart size={20} className={post.likes > 0 ? "fill-(--accent) text-(--accent)" : ""} />
                                    <span>{post.likes || 0}</span>
                                  </button>
                                )}
                                {profile.features?.showComments !== false && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <MessageCircle size={20} />
                                    <span>{post.comments?.length || 0}</span>
                                  </div>
                                )}
                                {profile.features?.showViews !== false && (
                                  <div className="flex items-center gap-2 text-gray-400 cursor-default">
                                    <Eye size={20} />
                                    <span>{post.views || 0}</span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => handleShare(post.id, e)}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                              >
                                <ExternalLink size={18} />
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}

                {profile.github?.enabled && (
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                      <Github size={18} />
                      <h2>GitHub Activity</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 border border-white/10 flex flex-col items-center justify-center text-center space-y-4" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                          <Github size={32} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">@{profile.github.username}</h3>
                          <a
                            href={`https://github.com/${profile.github.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 justify-center mt-1"
                          >
                            View Profile <ExternalLink size={12} />
                          </a>
                        </div>
                        {profile.github.showContributions && (
                          <img
                            src={`https://ghchart.rshah.org/${profile.theme.primaryColor.replace('#', '')}/${profile.github.username}`}
                            alt="GitHub Contributions"
                            className="w-full rounded-lg opacity-80 hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                      {profile.github.pinnedRepo && (
                        <a
                          href={`https://github.com/${profile.github.pinnedRepo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-6 border border-white/10 hover:border-white/30 transition-all group flex flex-col h-full"
                          style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-gray-400 group-hover:text-white">
                              <Bookmark size={20} />
                              <span className="text-xs font-mono uppercase tracking-widest">Pinned Repo</span>
                            </div>
                            <ExternalLink size={16} className="text-gray-500 group-hover:text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-(--primary) transition-colors">
                            {profile.github.pinnedRepo.split('/')[1]}
                          </h3>
                          <div className="mt-auto pt-4 flex gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">View Repository</span>
                          </div>
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}

                {profile.integrations?.hoyoverse?.enabled && (
                  <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                      <Grid size={18} />
                      <h2>Game Activities</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {profile.integrations.hoyoverse.accounts?.map((account, index) => {
                        const data = hoyoverseData[account.id];
                        return (
                          <Link
                            href={`/game/${account.game}/${account.uid}`}
                            key={index}
                            className="p-4 border border-white/10 flex flex-col gap-3 block hover:bg-white/5 transition-colors group"
                            style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden relative">
                                  {data?.avatarUrl ? (
                                    <img src={data.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                  ) : (
                                    <>
                                      {account.game === 'genshin' && <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Genshin_Impact_logo.svg/1200px-Genshin_Impact_logo.svg.png" className="w-8 h-8 object-contain" alt="Genshin" />}
                                      {account.game === 'hsr' && <img src="https://upload.wikimedia.org/wikipedia/en/thumb/9/91/Honkai_Star_Rail_icon.png/220px-Honkai_Star_Rail_icon.png" className="w-8 h-8 object-contain" alt="HSR" />}
                                      {account.game === 'hi3' && <span className="text-xs font-bold">HI3</span>}
                                      {account.game === 'zzz' && <span className="text-xs font-bold">ZZZ</span>}
                                    </>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-white text-sm group-hover:text-(--primary) transition-colors">
                                    {data?.nickname || (account.game === 'genshin' ? 'Genshin Impact' :
                                      account.game === 'hsr' ? 'Honkai: Star Rail' :
                                        account.game === 'hi3' ? 'Honkai Impact 3rd' : 'Zenless Zone Zero')}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <span>UID: {account.uid}</span>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(account.uid);
                                        showToast('UID copied!', 'success');
                                      }}
                                      className="hover:text-white z-10 relative"
                                    >
                                      (Copy)
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {data && (
                                <div className="text-right">
                                  <span className="text-xs text-gray-400 block">Level</span>
                                  <span className="text-lg font-bold text-(--primary)">{data.level}</span>
                                </div>
                              )}
                            </div>
                            {data?.signature && (
                              <div className="text-xs text-gray-400 italic bg-black/20 p-2 rounded">
                                "{data.signature}"
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {profile.integrations?.steam?.enabled && steamData && (
                  <motion.div variants={itemVariants} className="p-6 border border-white/5 space-y-4" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                    <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" className="w-5 h-5" alt="Steam" />
                      <h2>Steam Status</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full p-0.5 ${steamData.personastate === 1 ? 'bg-green-500' : steamData.personastate === 0 ? 'bg-gray-500' : 'bg-blue-500'}`}>
                        <img src={steamData.avatarfull} className="w-full h-full rounded-full" alt="Steam Avatar" />
                      </div>
                      <div>
                        <a href={steamData.profileurl} target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-(--primary) text-lg">
                          {steamData.personaname}
                        </a>
                        <div className="text-sm">
                          {steamData.gameextrainfo ? (
                            <span className="text-green-400">Playing: {steamData.gameextrainfo}</span>
                          ) : (
                            <span className={steamData.personastate === 1 ? 'text-green-500' : steamData.personastate === 0 ? 'text-gray-500' : 'text-blue-400'}>
                              {steamData.personastate === 1 ? 'Online' : steamData.personastate === 0 ? 'Offline' : 'In-Game / Busy'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {steamData.recentGames && steamData.recentGames.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {steamData.recentGames.map((game: any) => (
                          <div key={game.appid} className="text-center group relative">
                            <img
                              src={`http://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`}
                              className="w-10 h-10 mx-auto rounded"
                              alt={game.name}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block truncate">{game.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {profile.integrations?.leetcode?.enabled && leetcodeData && (
                  <motion.div variants={itemVariants} className="p-6 border border-white/5 space-y-4" style={{ backgroundColor: 'var(--component-bg)', borderRadius: 'var(--component-radius)' }}>
                    <div className="flex items-center gap-2 text-(--primary) font-semibold border-b border-white/10 pb-2">
                      <Code size={18} />
                      <h2>LeetCode Stats</h2>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="text-xs text-gray-400">Total Solved</span>
                        <div className="text-2xl font-bold text-white">{leetcodeData.totalSolved}</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-xs text-gray-400">Ranking</span>
                        <div className="text-xl font-bold text-white">#{leetcodeData.ranking}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <div className="flex-1 bg-white/5 rounded p-2 text-center border border-green-500/30">
                        <div className="text-green-400 font-bold">{leetcodeData.easySolved}</div>
                        <div className="text-gray-500">Easy</div>
                      </div>
                      <div className="flex-1 bg-white/5 rounded p-2 text-center border border-yellow-500/30">
                        <div className="text-yellow-400 font-bold">{leetcodeData.mediumSolved}</div>
                        <div className="text-gray-500">Med</div>
                      </div>
                      <div className="flex-1 bg-white/5 rounded p-2 text-center border border-red-500/30">
                        <div className="text-red-400 font-bold">{leetcodeData.hardSolved}</div>
                        <div className="text-gray-500">Hard</div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  );
}
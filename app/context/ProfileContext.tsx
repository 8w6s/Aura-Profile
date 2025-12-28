'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SocialPlatform = string;

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  replies?: Comment[];
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
  icon?: string;
}

export interface DirectLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  coverUrl?: string;
}

export interface MusicConfig {
  autoplay: boolean;
  volume: number;
  loop: boolean;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
  likes: number;
  views: number;
  likedIps?: string[];
  comments: Comment[];
  attachments?: string[];
  hidden?: boolean;
}

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  enterScreenBlur: number;
  backgroundImageUrl?: string;
  mobileBackgroundImageUrl?: string;
  cardBlur?: number;
  cardOpacity?: number;
  cardColor?: string;
  componentColor?: string;
  backgroundEffect?: 'none' | 'noise' | 'rain' | 'snow';
  backgroundBlur?: number;
  cardBorderRadius?: number;
  componentBorderRadius?: number;
  buttonBorderRadius?: number;
  buttonColor?: string;
  fontFamily?: string;
}

export interface FeatureConfig {
  showLikes: boolean;
  showComments: boolean;
  showViews: boolean;
  allowComments: boolean;
  allowLikes: boolean;
  enableEnterScreen: boolean;
  showUid?: boolean;
}

export interface EnterScreenConfig {
  title: string;
  show: boolean;
  backgroundUrl: string;
  buttonText?: string;
}

export interface TypewriterBioLine {
  id: string;
  text: string;
  typeSpeed: number;
  deleteSpeed: number;
}

export interface TypewriterBioConfig {
  enabled: boolean;
  loop: boolean;
  lines: TypewriterBioLine[];
}

export interface CursorConfig {
  enabled: boolean;
  customUrl?: string;
  effect?: boolean;
}

export interface TextEffects {
  name: 'none' | 'glow' | 'glitch' | 'typewriter' | 'rainbow' | 'gradient';
  role: 'none' | 'glow' | 'glitch' | 'typewriter' | 'rainbow' | 'gradient';
  bio: 'none' | 'glow' | 'glitch' | 'typewriter' | 'rainbow' | 'gradient';
}

export interface Skill {
  id: string;
  name: string;
  percentage: number;
  type?: 'frontend' | 'backend' | 'devops' | 'mobile' | 'language' | 'tool' | 'other';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  link?: string;
  links?: { id: string; title: string; url: string; icon?: string }[];
  tags?: string[];
  hidden?: boolean;
}

export interface SiteMetadata {
  title: string;
  description: string;
  iconUrl: string;
  ogImageUrl: string;
  enableTypewriter: boolean;
}

export interface GithubConfig {
  username: string;
  showContributions: boolean;
  pinnedRepo?: string;
  enabled: boolean;
}

export interface IntegrationsConfig {
  github?: GithubConfig;
  spotify?: { enabled: boolean; url?: string };
  osu?: { enabled: boolean; username?: string };
  hoyoverse?: {
    enabled: boolean;
    accounts?: { id: string; game: 'genshin' | 'hsr' | 'hi3' | 'zzz'; uid: string }[];
  };
  steam?: { enabled: boolean; steamId?: string; apiKey?: string };
  wakatime?: { enabled: boolean; username?: string };
  leetcode?: { enabled: boolean; username?: string };
  catbox?: { enabled: boolean; userHash?: string };
}

export interface FileData {
  id: string;
  name: string;
  url: string;
  downloadCount: number;
  source?: 'catbox' | 'local';
}

export interface ProfileData {
  name: string;
  adminName?: string;
  role: string;
  location: string;
  skills?: Skill[];
  timezone?: string;
  timeFormat?: string;
  email: string;
  discordId?: string;
  uid?: string;
  avatarUrl: string;
  bannerUrl: string;
  bio: string;
  stats: {
    posts: number;
    likes: number;
    comments: number;
    views: number;
    viewedIps: string[];
  };
  engagement: {
    comments: string;
    saved: string;
  };
  socials: SocialLink[];
  directLinks: DirectLink[];
  files?: FileData[];
  playlist: MusicTrack[];
  musicConfig: MusicConfig;
  posts: Post[];
  theme: ThemeConfig;
  features: FeatureConfig;
  enterScreen: EnterScreenConfig;
  typewriterBio?: TypewriterBioConfig;
  cursor?: CursorConfig;
  textEffects: TextEffects;
  projects: Project[];
  metadata: SiteMetadata;
  github: GithubConfig;
  integrations?: IntegrationsConfig;
}

import profileData from '@/data/profile.json';

const defaultProfile: ProfileData = profileData as unknown as ProfileData;

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  resetProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile({ ...defaultProfile, ...data });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const interval = setInterval(() => {
      fetchProfile();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (data: Partial<ProfileData>) => {
    const newProfile = { ...profile, ...data };
    setProfile(newProfile);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save changes to the server.');
    }
  };

  const resetProfile = async () => {
    setProfile(defaultProfile);
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(defaultProfile),
      });
    } catch (error) {
      console.error('Error resetting profile:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, resetProfile, refreshProfile, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

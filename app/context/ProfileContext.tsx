'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

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
  category?: string;
  tags?: string[];
  excerpt?: string;
  readingTime?: number;
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
  cardBorderWidth?: number;
  cardBorderColor?: string;
  componentColor?: string;
  backgroundEffect?: 'none' | 'noise' | 'rain' | 'snow';
  bannerOverlayOpacity?: number;
  backgroundBlur?: number;
  cardBorderRadius?: number;
  cardWidthPreset?: 'compact' | 'default' | 'wide';
  componentBorderRadius?: number;
  buttonBorderRadius?: number;
  buttonColor?: string;
  avatarRingColor?: string;
  avatarRingWidth?: number;
  avatarGlow?: boolean;
  uidStyle?: 'pill' | 'bracket' | 'minimal';
  socialButtonStyle?: 'glass' | 'solid' | 'outline';
  socialIconSize?: number;
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
  showCardBorder?: boolean;
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
  category?: string;
  excerpt?: string;
  hidden?: boolean;
}

export type LayoutSectionId = 'hero' | 'links' | 'overview' | 'projects' | 'posts' | 'integrations';

export type SectionWidthPreset = 'compact' | 'default' | 'wide' | 'full';

export interface LayoutConfig {
  sectionOrder?: LayoutSectionId[];
  hiddenSections?: LayoutSectionId[];
  sectionWidths?: Partial<Record<LayoutSectionId, SectionWidthPreset>>;
  postLayout?: 'grid' | 'list';
  projectLayout?: 'grid' | 'list';
}

export interface BlogConfig {
  defaultLayout?: 'grid' | 'list';
  showCategories?: boolean;
  showTags?: boolean;
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
  osu?: { enabled: boolean; username?: string };wakatime?: { enabled: boolean; username?: string };
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
  skills?: (Skill | string)[];
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
  layout?: LayoutConfig;
  blog?: BlogConfig;
  customCss?: string;
  enterScreen: EnterScreenConfig;
  typewriterBio?: TypewriterBioConfig;
  cursor?: CursorConfig;
  textEffects: TextEffects;
  projects: Project[];
  metadata: SiteMetadata;
  github: GithubConfig;
  integrations?: IntegrationsConfig;
}

export interface ProfileRevisionMeta {
  id: string;
  createdAt: string;
  type: 'publish' | 'rollback';
}

export interface ProfileWorkflowMeta {
  revisions: ProfileRevisionMeta[];
  updatedAt: string | null;
  publishedAt: string | null;
}

import profileData from '@/data/profile.json';

const defaultProfile: ProfileData = profileData as unknown as ProfileData;

interface ProfileContextType {
  profile: ProfileData;
  workflow: ProfileWorkflowMeta;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  saveDraft: (data: Partial<ProfileData>) => Promise<void>;
  publishDraft: () => Promise<void>;
  rollbackToRevision: (revisionId: string) => Promise<void>;
  resetProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [workflow, setWorkflow] = useState<ProfileWorkflowMeta>({
    revisions: [],
    updatedAt: null,
    publishedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const applyWorkflowResponse = (nextProfile: ProfileData, nextWorkflow?: ProfileWorkflowMeta) => {
    setProfile(nextProfile);
    if (nextWorkflow) {
      setWorkflow(nextWorkflow);
    }
  };

  const performProfileAction = async (
    action: 'saveDraft' | 'publish' | 'rollback',
    payload?: Partial<ProfileData> | { revisionId: string }
  ) => {
    const body =
      action === 'saveDraft'
        ? { action, profile: payload }
        : action === 'rollback'
          ? { action, revisionId: (payload as { revisionId: string }).revisionId }
          : { action };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || 'Profile action failed');
    }

    applyWorkflowResponse(result.profile as ProfileData, result.workflow as ProfileWorkflowMeta);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const endpoint = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
        ? '/api/profile?mode=admin'
        : '/api/profile';
      const response = await fetch(endpoint);

      if (response.ok) {
        const data = await response.json();
        const profileData = data.profile ? data.profile : data;
        const workflowData = data.workflow ? data.workflow : undefined;

        setProfile({ ...defaultProfile, ...(profileData as ProfileData) });
        if (workflowData) {
          setWorkflow(workflowData as ProfileWorkflowMeta);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const interval = setInterval(() => {
      fetchProfile();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchProfile]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (data: Partial<ProfileData>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  const saveDraft = async (data: Partial<ProfileData>) => {
    const nextDraft = { ...profile, ...data };
    setProfile(nextDraft);

    try {
      await performProfileAction('saveDraft', nextDraft);
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const publishDraft = async () => {
    try {
      await performProfileAction('publish');
    } catch (error) {
      console.error('Error publishing draft:', error);
      throw error;
    }
  };

  const rollbackToRevision = async (revisionId: string) => {
    try {
      await performProfileAction('rollback', { revisionId });
    } catch (error) {
      console.error('Error rolling back revision:', error);
      throw error;
    }
  };

  const resetProfile = async () => {
    try {
      await saveDraft(defaultProfile);
    } catch (error) {
      console.error('Error resetting profile:', error);
      throw error;
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        workflow,
        updateProfile,
        saveDraft,
        publishDraft,
        rollbackToRevision,
        resetProfile,
        refreshProfile,
        isLoading,
      }}
    >
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

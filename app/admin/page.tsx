'use client';

import React, { useState, useEffect } from 'react';
import ColorPicker from '@/components/ColorPicker';
import IconPicker from '@/components/IconPicker';
import CustomRange from '@/components/CustomRange';
import CustomSelect from '@/components/CustomSelect';
import FileUploader from '@/components/FileUploader';
import { useProfile } from '@/app/context/ProfileContext';
import { useToast } from '@/app/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { ArrowLeft, Plus, Trash2, Save, RotateCcw, Loader2, Music, GripVertical, PlayCircle, ChevronUp, ChevronDown, Layout, Share2, MessageSquare, Image as ImageIcon, Type, Eye, Settings, Info, ExternalLink, Reply, Github, Globe, Puzzle, Search, Filter, Calendar, ThumbsUp, MessageCircle, Clock, File, Download } from 'lucide-react';
import Link from 'next/link';
import { SocialPlatform } from '@/app/context/ProfileContext';
import { motion, AnimatePresence } from 'framer-motion';

import TypewriterBio from '@/components/TypewriterBio';

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon size={24} />;
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return <PlayCircle size={24} />;
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music size={24} />;
    if (['zip', 'rar', '7z'].includes(ext || '')) return <File size={24} />; // Using generic File for archive as FileArchive is not imported yet, will update import
    return <File size={24} />;
};

const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;

    try {
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? <span key={i} className="bg-indigo-500/30 text-indigo-200 font-bold px-0.5 rounded">{part}</span> : part
                )}
            </>
        );
    } catch (e) {
        return <>{text}</>;
    }
};

export default function AdminPage() {
    const { profile, updateProfile, resetProfile, isLoading } = useProfile();
    const { showToast } = useToast();
    const [formData, setFormData] = useState(profile);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [activeTab, setActiveTab] = useState<'general' | 'socials' | 'posts' | 'projects' | 'library' | 'theme' | 'music' | 'metadata' | 'integrations' | 'settings'>('general');
    const [previewPostId, setPreviewPostId] = useState<string | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'catbox' | 'local'>('catbox');

    const [postSearch, setPostSearch] = useState('');
    const [postFilter, setPostFilter] = useState<'all' | 'recent' | 'oldest' | 'top-liked' | 'has-comments'>('all');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const tabs = [
        { id: 'general', label: 'General Info', icon: Layout },
        { id: 'socials', label: 'Socials & Links', icon: Share2 },
        { id: 'posts', label: 'Posts & Blog', icon: MessageSquare },
        { id: 'projects', label: 'Projects', icon: ImageIcon },
        { id: 'library', label: 'Library', icon: File },
        { id: 'music', label: 'Music Player', icon: Music },
        { id: 'theme', label: 'Theme & Style', icon: Type },
        { id: 'metadata', label: 'Site Metadata', icon: Globe },
        { id: 'integrations', label: 'Integrations', icon: Puzzle },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    useEffect(() => {
        if (profile && !formData) {
            setFormData(profile);
        }
    }, [profile, formData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof typeof prev] as object,
                    [child]: type === 'number' ? Number(value) : value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFeatureToggle = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [feature]: !prev.features?.[feature as keyof typeof prev.features]
            }
        }));
    };

    const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
        <label className="flex items-center justify-between p-4 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:border-indigo-500/50 transition-all group">
            <span className="text-gray-300 group-hover:text-white transition-colors font-medium">{label}</span>
            <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
        </label>
    );

    const handleSocialChange = (index: number, field: string, value: string | boolean) => {
        const newSocials = [...formData.socials];
        newSocials[index] = { ...newSocials[index], [field]: value };
        setFormData(prev => ({ ...prev, socials: newSocials }));
    };

    const addSocial = () => {
        setFormData(prev => ({
            ...prev,
            socials: [...prev.socials, { platform: 'website', url: '', enabled: true }]
        }));
    };

    const removeSocial = (index: number) => {
        const newSocials = formData.socials.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, socials: newSocials }));
    };

    const addPost = () => {
        setFormData(prev => ({
            ...prev,
            posts: [...(prev.posts || []), {
                id: Date.now().toString(),
                title: 'New Post',
                content: 'Post content...',
                imageUrl: '',
                date: new Date().toISOString().split('T')[0],
                likes: 0,
                views: 0,
                comments: []
            }]
        }));
    };

    const removePost = (index: number) => {
        setFormData(prev => {
            const newPosts = [...(prev.posts || [])];
            newPosts.splice(index, 1);
            return { ...prev, posts: newPosts };
        });
    };

    const handlePostChange = (index: number, field: string, value: string | number) => {
        setFormData(prev => {
            const newPosts = [...(prev.posts || [])];
            newPosts[index] = { ...newPosts[index], [field]: value };
            return { ...prev, posts: newPosts };
        });
    };

    const addFile = () => {
        setFormData(prev => ({
            ...prev,
            files: [...(prev.files || []), {
                id: Date.now().toString(),
                name: 'New File',
                url: '',
                downloadCount: 0
            }]
        }));
    };

    const removeFile = (index: number) => {
        setFormData(prev => {
            const newFiles = [...(prev.files || [])];
            newFiles.splice(index, 1);
            return { ...prev, files: newFiles };
        });
    };

    const handleFileChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newFiles = [...(prev.files || [])];
            newFiles[index] = { ...newFiles[index], [field]: value };
            return { ...prev, files: newFiles };
        });
    };

    const addHoyoverseAccount = () => {
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                hoyoverse: {
                    ...prev.integrations?.hoyoverse,
                    enabled: true,
                    accounts: [...(prev.integrations?.hoyoverse?.accounts || []), { id: Date.now().toString(), game: 'genshin', uid: '' }]
                }
            }
        }));
    };

    const removeHoyoverseAccount = (index: number) => {
        setFormData(prev => {
            const newAccounts = [...(prev.integrations?.hoyoverse?.accounts || [])];
            newAccounts.splice(index, 1);
            return {
                ...prev,
                integrations: {
                    ...prev.integrations,
                    hoyoverse: {
                        enabled: prev.integrations?.hoyoverse?.enabled ?? false,
                        ...prev.integrations?.hoyoverse,
                        accounts: newAccounts
                    }
                }
            };
        });
    };

    const handleHoyoverseAccountChange = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newAccounts = [...(prev.integrations?.hoyoverse?.accounts || [])];
            newAccounts[index] = { ...newAccounts[index], [field]: value };
            return {
                ...prev,
                integrations: {
                    ...prev.integrations,
                    hoyoverse: {
                        ...prev.integrations?.hoyoverse,
                        accounts: newAccounts
                    }
                }
            };
        });
    };

    const addProject = () => {
        setFormData(prev => ({
            ...prev,
            projects: [...(prev.projects || []), {
                id: Date.now().toString(),
                title: 'New Project',
                description: 'Project description...',
                imageUrl: '',
                link: '',
                tags: []
            }]
        }));
    };

    const removeProject = (index: number) => {
        const newProjects = [...(formData.projects || [])];
        newProjects.splice(index, 1);
        setFormData(prev => ({ ...prev, projects: newProjects }));
    };

    const handleProjectChange = (index: number, field: string, value: string) => {
        const newProjects = [...(formData.projects || [])];
        if (field === 'tags') {
            newProjects[index] = { ...newProjects[index], tags: value.split(',').map(t => t.trim()) };
        } else {
            newProjects[index] = { ...newProjects[index], [field]: value };
        }
        setFormData(prev => ({ ...prev, projects: newProjects }));
    };

    const handleDirectLinkChange = (index: number, field: string, value: string) => {
        const newLinks = [...formData.directLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData(prev => ({ ...prev, directLinks: newLinks }));
    };

    const addDirectLink = () => {
        setFormData(prev => ({
            ...prev,
            directLinks: [...prev.directLinks, { id: Date.now().toString(), title: 'New Link', url: '#', icon: '🔗' }]
        }));
    };

    const removeDirectLink = (index: number) => {
        const newLinks = formData.directLinks.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, directLinks: newLinks }));
    };

    const handleAdminReply = (postIndex: number, commentId: string, content: string) => {
        if (!content.trim()) return;

        const newPosts = [...formData.posts];
        const commentIndex = newPosts[postIndex].comments.findIndex(c => c.id === commentId);

        if (commentIndex !== -1) {
            const reply = {
                id: `reply-${Date.now()}`,
                author: '8w6s',
                content: content.trim(),
                date: new Date().toISOString()
            };

            const parentComment = newPosts[postIndex].comments[commentIndex];
            parentComment.replies = [...(parentComment.replies || []), reply];

            setFormData(prev => ({ ...prev, posts: newPosts }));
        }
    };

    const handleThemeChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            theme: {
                ...prev.theme,
                [field]: value
            }
        }));
    };

    const handleMetadataChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [field]: value
            }
        }));
    };

    const handleGithubChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            github: {
                ...prev.github,
                [field]: value
            }
        }));
    };

    const handleIntegrationChange = (platform: 'spotify' | 'osu' | 'hoyoverse' | 'steam', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                [platform]: {
                    ...prev.integrations?.[platform],
                    [field]: value
                }
            }
        }));
    };

    const handleWakaTimeChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                wakatime: {
                    ...prev.integrations?.wakatime,
                    [field]: value
                }
            }
        }));
    };

    const handleLeetCodeChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                leetcode: {
                    ...prev.integrations?.leetcode,
                    [field]: value
                }
            }
        }));
    };

    const handleSkillsChange = (index: number, field: string, value: any) => {
        const newSkills = [...(formData.skills || [])];
        // Auto-migrate string to object if needed
        if (typeof newSkills[index] === 'string') {
             newSkills[index] = { 
                 id: Date.now().toString(), 
                 name: newSkills[index] as unknown as string, 
                 percentage: 80, 
                 type: 'other' 
             } as any;
        }
        newSkills[index] = { ...newSkills[index], [field]: value };
        setFormData(prev => ({ ...prev, skills: newSkills }));
    };

    const addSkill = () => {
        setFormData(prev => ({
            ...prev,
            skills: [...(prev.skills || []), { id: Date.now().toString(), name: 'New Skill', percentage: 50, type: 'other' }] as any
        }));
    };

    const removeSkill = (index: number) => {
        const newSkills = [...(formData.skills || [])];
        newSkills.splice(index, 1);
        setFormData(prev => ({ ...prev, skills: newSkills }));
    };

    const handlePlaylistChange = (index: number, field: string, value: string) => {
        const newPlaylist = [...(formData.playlist || [])];
        newPlaylist[index] = { ...newPlaylist[index], [field]: value };
        setFormData(prev => ({ ...prev, playlist: newPlaylist }));
    };

    const addTrack = () => {
        setFormData(prev => ({
            ...prev,
            playlist: [...(prev.playlist || []), {
                id: Date.now().toString(),
                title: 'New Track',
                artist: 'Artist',
                url: '',
                coverUrl: ''
            }]
        }));
    };

    const removeTrack = (index: number) => {
        const newPlaylist = [...(formData.playlist || [])];
        newPlaylist.splice(index, 1);
        setFormData(prev => ({ ...prev, playlist: newPlaylist }));
    };

    const moveTrack = (index: number, direction: 'up' | 'down') => {
        const newPlaylist = [...(formData.playlist || [])];
        if (direction === 'up' && index > 0) {
            [newPlaylist[index], newPlaylist[index - 1]] = [newPlaylist[index - 1], newPlaylist[index]];
        } else if (direction === 'down' && index < newPlaylist.length - 1) {
            [newPlaylist[index], newPlaylist[index + 1]] = [newPlaylist[index + 1], newPlaylist[index]];
        }
        setFormData(prev => ({ ...prev, playlist: newPlaylist }));
    };

    const handleMusicConfigChange = (field: string, value: boolean | number) => {
        setFormData(prev => ({
            ...prev,
            musicConfig: {
                ...prev.musicConfig,
                [field]: value
            }
        }));
    };

    const handleTypewriterBioChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            typewriterBio: {
                enabled: prev.typewriterBio?.enabled ?? false,
                ...prev.typewriterBio,
                [field]: value
            }
        }));
    };

    const handleTypewriterLineChange = (index: number, field: string, value: any) => {
        const newLines = [...(formData.typewriterBio?.lines || [])];
        newLines[index] = { ...newLines[index], [field]: value };
        handleTypewriterBioChange('lines', newLines);
    };

    const addTypewriterLine = () => {
        const newLines = [...(formData.typewriterBio?.lines || []), { id: Date.now().toString(), text: 'New Line', typeSpeed: 100, deleteSpeed: 50 }];
        handleTypewriterBioChange('lines', newLines);
    };

    const removeTypewriterLine = (index: number) => {
        const newLines = [...(formData.typewriterBio?.lines || [])];
        newLines.splice(index, 1);
        handleTypewriterBioChange('lines', newLines);
    };

    const handleCursorChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            cursor: {
                enabled: prev.cursor?.enabled ?? false,
                ...prev.cursor,
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaveStatus('saving');
        try {
            await updateProfile(formData);
            setSaveStatus('saved');
            showToast('Profile updated successfully!', 'success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            setSaveStatus('error');
            showToast('Failed to save profile.', 'error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handleReset = async () => {
        await resetProfile();
        setShowResetModal(false);
        showToast('Profile reset to defaults.', 'info');
    };

    if (isLoading || !formData) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;

    return (
        <div className="min-h-screen bg-black text-white flex">
            <aside className="w-64 border-r border-white/10 bg-black/50 fixed h-full z-20 hidden md:flex md:flex-col">
                <div className="p-6 shrink-0">
                    <h1 className="text-2xl font-bold bg-linear-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Aura Profile</h1>
                </div>
                <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-4">
                    {tabs.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all shrink-0 ${activeTab === item.id ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="w-full px-6 py-6 border-t border-white/5 bg-black/50 backdrop-blur-sm shrink-0">
                    <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={20} />
                        <span>Back to Profile</span>
                    </Link>
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {saveStatus === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="w-full mt-3 flex items-center justify-center gap-2 px-6 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <RotateCcw size={18} />
                        <span>Reset Defaults</span>
                    </button>
                    
                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-gray-500 font-mono">
                            {process.env.NEXT_PUBLIC_APP_NAME} v{process.env.NEXT_PUBLIC_APP_VERSION}
                        </p>
                        <p className="text-[10px] text-gray-600 font-mono mt-1">
                            Built by {process.env.NEXT_PUBLIC_BUILD_USER}
                        </p>
                    </div>
                </div>
            </aside>

            <main className="flex-1 md:ml-64 p-6 md:p-12 overflow-y-auto h-screen custom-scrollbar">
                <div className="md:hidden flex flex-col gap-4 mb-8">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">Admin</h1>
                        <div className="flex gap-2">
                            <Link href="/" className="p-2 bg-white/10 rounded-lg"><ArrowLeft size={20} /></Link>
                            <button onClick={handleSave} className="p-2 bg-indigo-600 rounded-lg"><Save size={20} /></button>
                        </div>
                    </div>

                    <div className="relative z-50">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                        >
                            <span className="flex items-center gap-2">
                                {(() => {
                                    const active = tabs.find(t => t.id === activeTab);
                                    if (!active) return null;
                                    const Icon = active.icon;
                                    return <><Icon size={18} /> {active.label}</>;
                                })()}
                            </span>
                            <ChevronDown size={20} className={`transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMobileMenuOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                                {tabs.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
                                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${activeTab === item.id ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-white/5 text-gray-400'}`}
                                    >
                                        <item.icon size={18} />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-8 pb-20">

                    {activeTab === 'general' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">General Information</h2>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Display Name</label>
                                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 h-10.5 focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Admin User Name (for Replies)</label>
                                        <input name="adminName" value={formData.adminName || ''} onChange={handleChange} placeholder="e.g. Admin" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 h-10.5 focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Role / Title</label>
                                        <input name="role" value={formData.role} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Location</label>
                                        <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Contact Email</label>
                                        <input name="email" value={formData.email || ''} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Discord ID (for Lanyard)</label>
                                        <input name="discordId" value={formData.discordId || ''} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" placeholder="e.g. 1392815904420532246" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Custom UID</label>
                                        <input name="uid" value={formData.uid || ''} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" placeholder="e.g. 1337" />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 items-start">
                                    <Info className="shrink-0 text-indigo-400" size={20} />
                                    <div className="space-y-2">
                                        <p className="text-sm text-indigo-200 font-medium">Important: Join Lanyard Server</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            To display your Discord status (Online, Idle, Playing...), you must be a member of the Lanyard Discord server. The bot cannot track your status otherwise.
                                        </p>
                                        <a
                                            href="https://discord.gg/lanyard"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            <ExternalLink size={12} />
                                            Join Lanyard Server
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-sm text-gray-400">Bio</label>
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" />
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-sm text-gray-400">Skills (Comma separated)</label>
                                    <textarea
                                        value={formData.skills?.join(', ') || ''}
                                        onChange={(e) => handleSkillsChange(e.target.value)}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                        placeholder="React, Node.js, Docker..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Admin Timezone</label>
                                        <input
                                            name="timezone"
                                            value={formData.timezone || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. Asia/Tokyo, GMT+9"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Time Format</label>
                                        <CustomSelect
                                            value={formData.timeFormat || 'HH:mm'}
                                            onChange={(val) => handleChange({ target: { name: 'timeFormat', value: val } } as any)}
                                            options={[
                                                { value: "HH", label: "HH (Hour only)" },
                                                { value: "HH:mm", label: "HH:mm" },
                                                { value: "mm:ss", label: "mm:ss" },
                                                { value: "HH:mm:ss", label: "HH:mm:ss" }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-indigo-400">Typewriter Bio Effect</h3>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-white">Enable Typewriter Bio</h4>
                                        <p className="text-xs text-gray-400">Overrides standard bio with animated typewriter effect</p>
                                    </div>
                                    <Switch
                                        checked={formData.typewriterBio?.enabled || false}
                                        onChange={() => handleTypewriterBioChange('enabled', !formData.typewriterBio?.enabled)}
                                        label=""
                                    />
                                </div>

                                {formData.typewriterBio?.enabled && (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                                            <label className="text-xs text-gray-500 mb-2 block">Live Preview</label>
                                            <TypewriterBio config={formData.typewriterBio} className="text-indigo-300 font-mono text-sm min-h-6 whitespace-pre-wrap wrap-break-word" />
                                        </div>

                                        <div className="space-y-4">
                                            {formData.typewriterBio?.lines?.map((line, index) => (
                                                <div key={line.id} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs text-gray-500">Line #{index + 1}</span>
                                                        <button onClick={() => removeTypewriterLine(index)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                                                    </div>
                                                    <input
                                                        value={line.text}
                                                        onChange={(e) => handleTypewriterLineChange(index, 'text', e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"
                                                        placeholder="Text line..."
                                                    />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-500">Type Speed (ms)</label>
                                                            <CustomRange
                                                                value={line.typeSpeed}
                                                                min={10}
                                                                max={500}
                                                                onChange={(val) => handleTypewriterLineChange(index, 'typeSpeed', val)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs text-gray-500">Delete Speed (ms)</label>
                                                            <CustomRange
                                                                value={line.deleteSpeed}
                                                                min={10}
                                                                max={500}
                                                                onChange={(val) => handleTypewriterLineChange(index, 'deleteSpeed', val)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={addTypewriterLine} className="w-full py-2 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white flex items-center justify-center gap-2 text-sm">
                                                <Plus size={16} /> Add Line
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <span className="text-sm text-gray-400">Loop Animation</span>
                                            <Switch
                                                checked={formData.typewriterBio?.loop || false}
                                                onChange={() => handleTypewriterBioChange('loop', !formData.typewriterBio?.loop)}
                                                label=""
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-semibold text-indigo-400">Profile Images</h3>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Avatar URL</label>
                                    <input name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" />
                                    <img src={formData.avatarUrl} className="w-20 h-20 rounded-full object-cover border-2 border-white/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Banner URL</label>
                                    <input name="bannerUrl" value={formData.bannerUrl} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none" />
                                    <img src={formData.bannerUrl} className="w-full h-20 rounded-lg object-cover border border-white/10" />
                                </div>
                            </div>

                            <h3 className="text-xl font-semibold text-indigo-400 mt-6">Statistics (Read Only)</h3>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Posts Count</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-400">
                                        {formData.posts?.length || 0}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Total Likes</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-400">
                                        {formData.posts?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Total Comments</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-400">
                                        {formData.posts?.reduce((sum, post) => sum + (post.comments?.length || 0), 0) || 0}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Total Views (Real-time)</label>
                                    <div className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-400">
                                        {formData.stats?.views || 0}
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-indigo-400 mt-6">Statistics (Read Only)</h3>
                        </section>
                    )}

                    {activeTab === 'socials' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Social Connections</h2>

                            <div className="space-y-4">
                                {formData.socials.map((social, index) => (
                                    <div key={index} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs text-gray-500">Icon / Platform</label>
                                                <IconPicker
                                                    value={social.platform}
                                                    onChange={(val) => handleSocialChange(index, 'platform', val.toLowerCase())}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs text-gray-500">URL</label>
                                                <input
                                                    placeholder="URL"
                                                    value={social.url}
                                                    onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
                                                    className="bg-black/40 border border-white/10 rounded-lg p-2.5 h-[42px]"
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeSocial(index)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg mt-6"><Trash2 size={20}/></button>
                                    </div>
                                ))}
                                <button onClick={addSocial} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 flex items-center justify-center gap-2">
                                    <Plus size={20} /> Add Social Link
                                </button>
                            </div>

                            <h3 className="text-xl font-semibold text-indigo-400 mt-8">Direct Links (Buttons)</h3>
                            <div className="space-y-4">
                                {formData.directLinks.map((link, index) => (
                                    <div key={link.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1fr_200px] gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs text-gray-500">Title</label>
                                                <input value={link.title} onChange={(e) => handleDirectLinkChange(index, 'title', e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 h-[42px]" placeholder="Title"/>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs text-gray-500">URL</label>
                                                <input value={link.url} onChange={(e) => handleDirectLinkChange(index, 'url', e.target.value)} className="bg-black/40 border border-white/10 rounded-lg p-2.5 h-[42px]" placeholder="URL"/>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs text-gray-500">Icon</label>
                                                <IconPicker
                                                    value={link.icon || 'Link'}
                                                    onChange={(val) => handleDirectLinkChange(index, 'icon', val)}
                                                />
                                            </div>
                                        </div>
                                        <button onClick={() => removeDirectLink(index)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg mt-6"><Trash2 size={20}/></button>
                                    </div>
                                ))}
                                <button onClick={addDirectLink} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 flex items-center justify-center gap-2">
                                    <Plus size={20} /> Add Direct Link
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'posts' && (
                        <section className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <h2 className="text-2xl font-bold text-white">Posts Management</h2>
                                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                    <div className="relative group">
                                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-indigo-500' : 'text-gray-500'}`} size={16} />
                                        <input
                                            value={postSearch}
                                            onChange={(e) => setPostSearch(e.target.value)}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setIsSearchFocused(false)}
                                            placeholder="Search (Regex supported)..."
                                            className={`w-full md:w-64 bg-black/40 border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none transition-all ${isSearchFocused ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/10'}`}
                                        />
                                        <AnimatePresence>
                                            {postSearch && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute right-0 top-full mt-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow-lg z-10"
                                                >
                                                    Searching...
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <select
                                            value={postFilter}
                                            onChange={(e) => setPostFilter(e.target.value as any)}
                                            className="appearance-none bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer hover:bg-white/5 transition-colors"
                                        >
                                            <option value="all">All Posts</option>
                                            <option value="recent">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="top-liked">Most Liked</option>
                                            <option value="has-comments">Has Comments</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {(() => {
                                    const filtered = formData.posts?.filter(post => {
                                        if (!postSearch) return true;
                                        try {
                                            const regex = new RegExp(postSearch, 'i');
                                            return regex.test(post.title) || regex.test(post.content) || post.comments.some(c => regex.test(c.content));
                                        } catch (e) {
                                            return post.title.toLowerCase().includes(postSearch.toLowerCase());
                                        }
                                    }).sort((a, b) => {
                                        if (postFilter === 'recent') return new Date(b.date).getTime() - new Date(a.date).getTime();
                                        if (postFilter === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
                                        if (postFilter === 'top-liked') return (b.likes || 0) - (a.likes || 0);
                                        if (postFilter === 'has-comments') return (b.comments?.length || 0) - (a.comments?.length || 0);
                                        return 0;
                                    }) || [];

                                    if (filtered.length === 0) {
                                        return <div className="text-center py-12 text-gray-500">No posts found matching your criteria.</div>;
                                    }

                                    return filtered.map((post) => {
                                        const originalIndex = formData.posts.findIndex(p => p.id === post.id);
                                        return (
                                            <div key={post.id} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 transition-all hover:border-indigo-500/30">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1"><Calendar size={14}/> {post.date}</span>
                                                        <span className="flex items-center gap-1"><ThumbsUp size={14}/> {post.likes}</span>
                                                        <span className="flex items-center gap-1"><MessageCircle size={14}/> {post.comments?.length || 0}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handlePostChange(originalIndex, 'hidden', !post.hidden)} 
                                                            className={`p-2 rounded-lg transition-colors ${post.hidden ? 'text-gray-500 bg-white/5' : 'text-indigo-400 hover:bg-indigo-500/10'}`}
                                                            title={post.hidden ? "Post is Hidden" : "Post is Visible"}
                                                        >
                                                            {post.hidden ? <EyeOff size={20} /> : <Eye size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewPostId(post.id)}
                                                            className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                            title="Preview Post"
                                                        >
                                                            <Eye size={20} />
                                                        </button>
                                                        <button onClick={() => removePost(originalIndex)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={20}/></button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Title</label>
                                                    <div className="relative">
                                                        <input
                                                            value={post.title}
                                                            onChange={(e) => handlePostChange(originalIndex, 'title', e.target.value)}
                                                            placeholder="Post Title"
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-lg font-bold focus:border-indigo-500 outline-none"
                                                        />
                                                        {postSearch && <div className="absolute top-3 left-3 pointer-events-none opacity-50"><HighlightText text={post.title} highlight={postSearch} /></div>}
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Content</label>
                                                    <textarea
                                                        value={post.content}
                                                        onChange={(e) => handlePostChange(originalIndex, 'content', e.target.value)}
                                                        placeholder="Write your post content here..."
                                                        rows={6}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-sm focus:border-indigo-500 outline-none"
                                                    />
                                                </div>

                                                <input
                                                    value={post.imageUrl}
                                                    onChange={(e) => handlePostChange(originalIndex, 'imageUrl', e.target.value)}
                                                    placeholder="Image URL (optional)"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none"
                                                />

                                                <div className="space-y-2">
                                                    <label className="text-xs text-gray-500">Attachments (Download Buttons)</label>
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {post.attachments?.map((fileId) => {
                                                            const file = formData.files?.find(f => f.id === fileId);
                                                            return (
                                                                <div key={fileId} className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                                                                    <span>{file?.name || 'Unknown File'}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newAttachments = post.attachments?.filter(id => id !== fileId) || [];
                                                                            handlePostChange(originalIndex, 'attachments', newAttachments as any);
                                                                        }}
                                                                        className="hover:text-white"
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <CustomSelect
                                                        options={
                                                            formData.files && formData.files.length > 0 
                                                            ? formData.files.map(file => ({ 
                                                                value: file.id, 
                                                                label: `${file.name} (${file.source === 'local' ? 'Local' : 'Catbox'})`
                                                            }))
                                                            : [{ value: '', label: 'Nothing in your Library' }]
                                                        }
                                                        value=""
                                                        onChange={(value) => {
                                                            if (!value) return;
                                                            const newAttachments = [...(post.attachments || []), value];
                                                            const uniqueAttachments = Array.from(new Set(newAttachments));
                                                            handlePostChange(originalIndex, 'attachments', uniqueAttachments as any);
                                                        }}
                                                        placeholder={formData.files && formData.files.length > 0 ? "+ Attach File from Library..." : "Nothing in your Library"}
                                                    />
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-white/10">
                                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Comments ({post.comments?.length || 0})</h4>
                                                    <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                                        {post.comments?.map((c) => (
                                                            <div key={c.id} className="bg-black/30 p-3 rounded-lg text-sm space-y-2 border border-white/5">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <span className="text-indigo-400 font-bold text-xs block mb-0.5">{c.author}</span>
                                                                        <div className="text-gray-300">
                                                                            <HighlightText text={c.content} highlight={postSearch} />
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-gray-600 text-[10px] whitespace-nowrap ml-2">{new Date(c.date).toLocaleDateString()}</span>
                                                                </div>

                                                                <div className="flex gap-2 mt-2">
                                                                    <input
                                                                        id={`reply-input-${c.id}`}
                                                                        placeholder="Reply as 8w6s..."
                                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none transition-colors"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleAdminReply(originalIndex, c.id, e.currentTarget.value);
                                                                                e.currentTarget.value = '';
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const input = document.getElementById(`reply-input-${c.id}`) as HTMLInputElement;
                                                                            handleAdminReply(originalIndex, c.id, input.value);
                                                                            input.value = '';
                                                                        }}
                                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded-lg transition-colors flex items-center justify-center"
                                                                    >
                                                                        <Reply size={14} />
                                                                    </button>
                                                                </div>

                                                                {c.replies && c.replies.length > 0 && (
                                                                    <div className="ml-4 pl-3 border-l-2 border-white/10 space-y-2 mt-2">
                                                                        {c.replies.map((reply: any) => (
                                                                            <div key={reply.id} className="text-xs flex justify-between bg-white/5 p-2 rounded">
                                                                                <div>
                                                                                    <span className="text-indigo-300 font-bold block mb-0.5">{reply.author}</span>
                                                                                    <span className="text-gray-400">{reply.content}</span>
                                                                                </div>
                                                                                <span className="text-gray-700 text-[10px]">{new Date(reply.date).toLocaleDateString()}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {(!post.comments || post.comments.length === 0) && <p className="text-xs text-gray-600 italic">No comments yet.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}

                                <button onClick={addPost} className="w-full py-4 border-2 border-dashed border-indigo-500/30 rounded-xl text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50 flex items-center justify-center gap-2 font-bold transition-all">
                                    <Plus size={24} /> Create New Post
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'projects' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Projects</h2>
                            <div className="space-y-6">
                                {formData.projects?.map((project, index) => (
                                    <div key={project.id} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-semibold text-gray-300">Project #{index + 1}</h3>
                                            <button onClick={() => removeProject(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={20}/></button>
                                        </div>
                                        <input value={project.title} onChange={(e) => handleProjectChange(index, 'title', e.target.value)} placeholder="Project Title" className="w-full bg-black/40 border border-white/10 rounded-lg p-3"/>
                                        <textarea value={project.description} onChange={(e) => handleProjectChange(index, 'description', e.target.value)} placeholder="Description" rows={3} className="w-full bg-black/40 border border-white/10 rounded-lg p-3"/>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input value={project.link} onChange={(e) => handleProjectChange(index, 'link', e.target.value)} placeholder="Project URL" className="bg-black/40 border border-white/10 rounded-lg p-3"/>
                                            <input value={project.imageUrl} onChange={(e) => handleProjectChange(index, 'imageUrl', e.target.value)} placeholder="Image URL" className="bg-black/40 border border-white/10 rounded-lg p-3"/>
                                        </div>
                                        <input value={project.tags?.join(', ')} onChange={(e) => handleProjectChange(index, 'tags', e.target.value)} placeholder="Tags (comma separated)" className="w-full bg-black/40 border border-white/10 rounded-lg p-3"/>
                                    </div>
                                ))}
                                <button onClick={addProject} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 flex items-center justify-center gap-2">
                                    <Plus size={20} /> Add Project
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'library' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Library & Files</h2>
                            
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-indigo-400">Upload Configuration</h3>
                                        <p className="text-sm text-gray-400">Choose where your files are stored.</p>
                                    </div>
                                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                        <button 
                                            onClick={() => setUploadMode('catbox')}
                                            className={`px-4 py-2 rounded-md text-sm transition-all ${uploadMode === 'catbox' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Catbox.moe
                                        </button>
                                        <button 
                                            onClick={() => setUploadMode('local')}
                                            className={`px-4 py-2 rounded-md text-sm transition-all ${uploadMode === 'local' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Local (Assets)
                                        </button>
                                    </div>
                                </div>

                                {uploadMode === 'catbox' && (
                                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3 items-start">
                                        <Info className="shrink-0 text-indigo-400" size={20} />
                                        <div className="space-y-1">
                                            <p className="text-sm text-indigo-200 font-medium">Catbox.moe Requirements</p>
                                            <p className="text-xs text-gray-400">
                                                To manage files (delete/track), you must provide your <strong>User Hash</strong> in the Integrations tab. 
                                                Without it, uploads are anonymous and cannot be deleted later via this panel.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {uploadMode === 'local' && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3 items-start">
                                        <Info className="shrink-0 text-emerald-400" size={20} />
                                        <div className="space-y-1">
                                            <p className="text-sm text-emerald-200 font-medium">Local Storage</p>
                                            <p className="text-xs text-gray-400">
                                                Files will be uploaded to the <code>/public/assets</code> folder. 
                                                Suitable for permanent site assets.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400">Upload New File</h3>
                                <FileUploader 
                                    userHash={formData.integrations?.catbox?.userHash} 
                                    onUploadComplete={(url, filename, source) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            files: [...(prev.files || []), {
                                                id: Date.now().toString(),
                                                name: filename,
                                                url: url,
                                                downloadCount: 0,
                                                source: source
                                            }]
                                        }));
                                    }}
                                    uploadMode={uploadMode}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-white">Your Library ({formData.files?.length || 0})</h3>
                                {formData.files?.map((file, index) => (
                                    <div key={file.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex gap-4 items-center">
                                        <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                                            {getFileIcon(file.name)}
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500">Filename</label>
                                                <input 
                                                    value={file.name} 
                                                    onChange={(e) => handleFileChange(index, 'name', e.target.value)} 
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded ${file.source === 'local' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                        {file.source === 'local' ? 'Local Asset' : 'Catbox.moe'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-500">URL</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        value={file.url} 
                                                        onChange={(e) => handleFileChange(index, 'url', e.target.value)} 
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"
                                                    />
                                                    <a 
                                                        href={file.url} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                        title="Open Link"
                                                    >
                                                        <ExternalLink size={18} />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                        <span className="text-xs text-gray-500">{file.downloadCount} downloads</span>
                                        <div className="flex gap-2">
                                            <a 
                                                href={file.url}
                                                download={file.name}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                title="Download File"
                                            >
                                                <Download size={20} />
                                            </a>
                                            <button onClick={() => removeFile(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete File">
                                                <Trash2 size={20}/>
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                
                                {(!formData.files || formData.files.length === 0) && (
                                    <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl">
                                        Nothing in your Library yet.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}



                    {activeTab === 'music' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Music Player Configuration</h2>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400">Player Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Switch
                                        checked={formData.musicConfig?.autoplay || false}
                                        onChange={() => handleMusicConfigChange('autoplay', !formData.musicConfig?.autoplay)}
                                        label="Autoplay Music"
                                    />
                                    <Switch
                                        checked={formData.musicConfig?.loop || false}
                                        onChange={() => handleMusicConfigChange('loop', !formData.musicConfig?.loop)}
                                        label="Loop Playlist"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Default Volume ({Math.round((formData.musicConfig?.volume || 0.5) * 100)}%)</label>
                                    <CustomRange
                                        value={(formData.musicConfig?.volume || 0.5) * 100}
                                        min={0}
                                        max={100}
                                        onChange={(val) => handleMusicConfigChange('volume', val / 100)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-semibold text-indigo-400">Playlist Tracks</h3>
                                </div>

                                {formData.playlist?.map((track, index) => (
                                    <div key={track.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex gap-4 items-center">
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => moveTrack(index, 'up')} disabled={index === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-30"><ChevronUp size={16}/></button>
                                            <button onClick={() => moveTrack(index, 'down')} disabled={index === (formData.playlist?.length || 0) - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-30"><ChevronDown size={16}/></button>
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <input value={track.title} onChange={(e) => handlePlaylistChange(index, 'title', e.target.value)} placeholder="Song Title" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"/>
                                                <input value={track.artist} onChange={(e) => handlePlaylistChange(index, 'artist', e.target.value)} placeholder="Artist" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"/>
                                            </div>
                                            <div className="space-y-2">
                                                <input value={track.url} onChange={(e) => handlePlaylistChange(index, 'url', e.target.value)} placeholder="Audio URL (mp3)" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"/>
                                                <input value={track.coverUrl || ''} onChange={(e) => handlePlaylistChange(index, 'coverUrl', e.target.value)} placeholder="Cover Image URL" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm"/>
                                            </div>
                                        </div>
                                        <button onClick={() => removeTrack(index)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={20}/></button>
                                    </div>
                                ))}

                                <button onClick={addTrack} className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 flex items-center justify-center gap-2">
                                    <Plus size={20} /> Add Track
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'metadata' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Site Metadata & Integrations</h2>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400">SEO & Browser Info</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Website Title</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <input
                                                value={formData.metadata?.title || ''}
                                                onChange={(e) => handleMetadataChange('title', e.target.value)}
                                                className="md:col-span-2 bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                            />
                                            <Switch
                                                checked={formData.metadata?.enableTypewriter || false}
                                                onChange={() => handleMetadataChange('enableTypewriter', !formData.metadata?.enableTypewriter)}
                                                label="Typewriter Effect"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Description (Meta Desc)</label>
                                        <textarea
                                            value={formData.metadata?.description || ''}
                                            onChange={(e) => handleMetadataChange('description', e.target.value)}
                                            rows={3}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Favicon URL (.ico, .png, .jpg supported)</label>
                                            <input
                                                value={formData.metadata?.iconUrl || ''}
                                                onChange={(e) => handleMetadataChange('iconUrl', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                                placeholder="/favicon.ico or https://..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">OG Image URL (Thumbnail)</label>
                                            <input
                                                value={formData.metadata?.ogImageUrl || ''}
                                                onChange={(e) => handleMetadataChange('ogImageUrl', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400">Live Previews</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <h4 className="text-sm text-gray-400 font-medium border-b border-white/10 pb-2">Google Search Result</h4>
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 font-sans max-w-full overflow-hidden">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                                    {formData.metadata?.iconUrl ? <img src={formData.metadata.iconUrl} className="w-5 h-5 object-contain" /> : <Globe size={16} className="text-gray-500" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-[#202124] leading-tight">8w6s Profile</span>
                                                    <span className="text-xs text-[#5f6368] leading-tight">https://8w6s.profile</span>
                                                </div>
                                            </div>
                                            <h3 className="text-xl text-[#1a0dab] hover:underline cursor-pointer truncate font-normal">
                                                {formData.metadata?.title || 'Profile Title'}
                                            </h3>
                                            <p className="text-sm text-[#4d5156] line-clamp-2 mt-1">
                                                {formData.metadata?.description || 'This is your profile description that will appear in search results.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm text-gray-400 font-medium border-b border-white/10 pb-2">Social Share / Discord Embed</h4>
                                        <div className="bg-[#2f3136] rounded border-l-4 border-[#202225] p-3 max-w-[432px] font-sans">
                                            <div className="text-xs text-[#b9bbbe] mb-1">8w6s Profile</div>
                                            <div className="text-[#00b0f4] font-semibold hover:underline cursor-pointer mb-1">
                                                {formData.metadata?.title || 'Profile Title'}
                                            </div>
                                            <div className="text-sm text-[#dcddde] mb-2">
                                                {formData.metadata?.description || 'This is your profile description.'}
                                            </div>
                                            {formData.metadata?.ogImageUrl && (
                                                <div className="rounded overflow-hidden mt-2">
                                                    <img src={formData.metadata.ogImageUrl} className="max-w-full h-auto object-cover max-h-[250px] rounded" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'integrations' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Platform Integrations</h2>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                                <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2"><File size={20}/> Catbox.moe Integration</h3>
                                <div className="flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-white">Enable Catbox Uploads</h4>
                                        <p className="text-xs text-gray-400">Allows uploading files directly to Catbox.moe</p>
                                    </div>
                                    <Switch
                                        checked={formData.integrations?.catbox?.enabled || false}
                                        onChange={() => handleIntegrationChange('catbox', 'enabled', !formData.integrations?.catbox?.enabled)}
                                        label=""
                                    />
                                </div>
                                {formData.integrations?.catbox?.enabled && (
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">User Hash (Required for album management)</label>
                                        <input
                                            value={formData.integrations?.catbox?.userHash || ''}
                                            onChange={(e) => handleIntegrationChange('catbox', 'userHash', e.target.value)}
                                            placeholder="Enter your Catbox User Hash"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                        />
                                        <p className="text-xs text-gray-500">You can find your User Hash on the <a href="https://catbox.moe/user/manage.php" target="_blank" className="text-indigo-400 hover:underline">Catbox Manage Page</a>.</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400 flex items-center gap-2"><Github size={20}/> GitHub Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.github?.enabled || false}
                                        onChange={() => handleGithubChange('enabled', !formData.github?.enabled)}
                                        label="Enable GitHub Section"
                                    />

                                    {formData.github?.enabled && (
                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm text-gray-400">GitHub Username</label>
                                                    <input
                                                        value={formData.github?.username || ''}
                                                        onChange={(e) => handleGithubChange('username', e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-gray-400">Pinned Repository (user/repo)</label>
                                                    <input
                                                        value={formData.github?.pinnedRepo || ''}
                                                        onChange={(e) => handleGithubChange('pinnedRepo', e.target.value)}
                                                        placeholder="e.g. 8w6s/profile"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <Switch
                                                checked={formData.github?.showContributions || false}
                                                onChange={() => handleGithubChange('showContributions', !formData.github?.showContributions)}
                                                label="Show Contribution Graph"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-green-400 flex items-center gap-2"><Music size={20}/> Spotify Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.integrations?.spotify?.enabled || false}
                                        onChange={() => handleIntegrationChange('spotify', 'enabled', !formData.integrations?.spotify?.enabled)}
                                        label="Enable Spotify Presence"
                                    />
                                    {formData.integrations?.spotify?.enabled && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Spotify Profile URL (Optional)</label>
                                            <input
                                                value={formData.integrations?.spotify?.url || ''}
                                                onChange={(e) => handleIntegrationChange('spotify', 'url', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-pink-400 flex items-center gap-2">Osu! Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.integrations?.osu?.enabled || false}
                                        onChange={() => handleIntegrationChange('osu', 'enabled', !formData.integrations?.osu?.enabled)}
                                        label="Enable Osu! Stats"
                                    />
                                    {formData.integrations?.osu?.enabled && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Osu! Username</label>
                                            <input
                                                value={formData.integrations?.osu?.username || ''}
                                                onChange={(e) => handleIntegrationChange('osu', 'username', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-blue-400 flex items-center gap-2">Hoyoverse Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.integrations?.hoyoverse?.enabled || false}
                                        onChange={() => handleIntegrationChange('hoyoverse', 'enabled', !formData.integrations?.hoyoverse?.enabled)}
                                        label="Enable Hoyoverse Game Stats"
                                    />
                                    {formData.integrations?.hoyoverse?.enabled && (
                                        <div className="space-y-4">
                                            {formData.integrations?.hoyoverse?.accounts?.map((account, index) => (
                                                <div key={account.id} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs text-gray-500">Account #{index + 1}</span>
                                                        <button onClick={() => removeHoyoverseAccount(index)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm text-gray-400">Game</label>
                                                            <CustomSelect
                                                                value={account.game || 'genshin'}
                                                                onChange={(val) => handleHoyoverseAccountChange(index, 'game', val)}
                                                                options={[
                                                                    { value: "genshin", label: "Genshin Impact" },
                                                                    { value: "hsr", label: "Honkai: Star Rail" },
                                                                    { value: "hi3", label: "Honkai Impact 3rd" },
                                                                    { value: "zzz", label: "Zenless Zone Zero" }
                                                                ]}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm text-gray-400">UID</label>
                                                            <input
                                                                value={account.uid || ''}
                                                                onChange={(e) => handleHoyoverseAccountChange(index, 'uid', e.target.value)}
                                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 h-11.5"
                                                                placeholder="Enter your UID"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={addHoyoverseAccount} className="w-full py-2 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white flex items-center justify-center gap-2 text-sm">
                                                <Plus size={16} /> Add Hoyoverse Account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-blue-300 flex items-center gap-2">Steam Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.integrations?.steam?.enabled || false}
                                        onChange={() => handleIntegrationChange('steam', 'enabled', !formData.integrations?.steam?.enabled)}
                                        label="Enable Steam Profile"
                                    />
                                    {formData.integrations?.steam?.enabled && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Steam ID / Custom URL</label>
                                            <input
                                                value={formData.integrations?.steam?.steamId || ''}
                                                onChange={(e) => handleIntegrationChange('steam', 'steamId', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                                placeholder="e.g. 76561198000000000"
                                            />
                                            <label className="text-sm text-gray-400 mt-2 block">Steam Web API Key</label>
                                            <input
                                                value={formData.integrations?.steam?.apiKey || ''}
                                                onChange={(e) => handleIntegrationChange('steam', 'apiKey', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                                placeholder="Get at: https://steamcommunity.com/dev/apikey"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-yellow-500 flex items-center gap-2">LeetCode Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.integrations?.leetcode?.enabled || false}
                                        onChange={() => handleLeetCodeChange('enabled', !formData.integrations?.leetcode?.enabled)}
                                        label="Enable LeetCode Stats"
                                    />
                                    {formData.integrations?.leetcode?.enabled && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">LeetCode Username</label>
                                            <input
                                                value={formData.integrations?.leetcode?.username || ''}
                                                onChange={(e) => handleLeetCodeChange('username', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                                placeholder="username"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-orange-400 flex items-center gap-2"><Clock size={20}/> WakaTime Integration</h3>
                                <div className="space-y-4">
                                    <Switch
                                        checked={formData.integrations?.wakatime?.enabled || false}
                                        onChange={() => handleWakaTimeChange('enabled', !formData.integrations?.wakatime?.enabled)}
                                        label="Enable WakaTime Stats"
                                    />
                                    {formData.integrations?.wakatime?.enabled && (
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">WakaTime Username (Must be public)</label>
                                            <input
                                                value={formData.integrations?.wakatime?.username || ''}
                                                onChange={(e) => handleWakaTimeChange('username', e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                                placeholder="e.g. 8w6s"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Make sure "Display coding activity publicly" is enabled in your WakaTime profile settings.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'theme' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Theme & Appearance</h2>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-300 border-b border-white/10 pb-2">Color Palette</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Primary Color</label>
                                            <ColorPicker color={formData.theme?.primaryColor || '#4f46e5'} onChange={(color) => handleThemeChange('primaryColor', color)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Accent Color</label>
                                            <ColorPicker color={formData.theme?.accentColor || '#ec4899'} onChange={(color) => handleThemeChange('accentColor', color)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Text Color</label>
                                            <ColorPicker color={formData.theme?.textColor || '#ffffff'} onChange={(color) => handleThemeChange('textColor', color)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Background Color</label>
                                            <ColorPicker color={formData.theme?.backgroundColor || '#000000'} onChange={(color) => handleThemeChange('backgroundColor', color)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Card Color</label>
                                            <ColorPicker color={formData.theme?.cardColor || '#000000'} onChange={(color) => handleThemeChange('cardColor', color)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Component Color</label>
                                            <ColorPicker color={formData.theme?.componentColor || 'rgba(255, 255, 255, 0.05)'} onChange={(color) => handleThemeChange('componentColor', color)} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">Button Color</label>
                                            <ColorPicker color={formData.theme?.buttonColor || '#4f46e5'} onChange={(color) => handleThemeChange('buttonColor', color)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Background Effect</label>
                                            <CustomSelect
                                                value={formData.theme?.backgroundEffect || 'noise'}
                                                onChange={(val) => handleThemeChange('backgroundEffect', val)}
                                                options={[
                                                    { value: "none", label: "None" },
                                                    { value: "noise", label: "Static Noise" },
                                                    { value: "rain", label: "Rain" },
                                                    { value: "snow", label: "Snow" }
                                                ]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Desktop Background Image URL</label>
                                            <input value={formData.theme?.backgroundImageUrl || ''} onChange={(e) => handleThemeChange('backgroundImageUrl', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Mobile Background Image URL (Optional)</label>
                                            <input value={formData.theme?.mobileBackgroundImageUrl || ''} onChange={(e) => handleThemeChange('mobileBackgroundImageUrl', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg p-3" placeholder="Overrides desktop bg on mobile if set" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm text-gray-400">Enter Screen Background (Optional Override)</label>
                                            <input
                                                name="enterScreen.backgroundUrl"
                                                value={formData.enterScreen?.backgroundUrl || ''}
                                                onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3"
                                                placeholder="Defaults to main background if not set"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Background Blur ({formData.theme?.backgroundBlur || 0}px)</label>
                                        </div>
                                        <CustomRange
                                            value={formData.theme?.backgroundBlur || 0}
                                            min={0}
                                            max={50}
                                            onChange={(val) => handleThemeChange('backgroundBlur', val)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Card Blur ({formData.theme?.cardBlur || 20}px)</label>
                                        </div>
                                        <CustomRange
                                            value={formData.theme?.cardBlur || 20}
                                            min={0}
                                            max={50}
                                            onChange={(val) => handleThemeChange('cardBlur', val)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Card Opacity ({Math.round((formData.theme?.cardOpacity || 0.4) * 100)}%)</label>
                                        </div>
                                        <CustomRange
                                            value={(formData.theme?.cardOpacity || 0.4) * 100}
                                            min={0}
                                            max={100}
                                            onChange={(val) => handleThemeChange('cardOpacity', val / 100)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Enter Screen Background Blur ({formData.theme?.enterScreenBlur || 16}px)</label>
                                        </div>
                                        <CustomRange
                                            value={formData.theme?.enterScreenBlur || 16}
                                            min={0}
                                            max={50}
                                            onChange={(val) => handleThemeChange('enterScreenBlur', val)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Card Border Radius ({formData.theme?.cardBorderRadius || 16}px)</label>
                                        </div>
                                        <CustomRange
                                            value={formData.theme?.cardBorderRadius || 16}
                                            min={0}
                                            max={50}
                                            onChange={(val) => handleThemeChange('cardBorderRadius', val)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Component Border Radius ({formData.theme?.componentBorderRadius || 8}px)</label>
                                        </div>
                                        <CustomRange
                                            value={formData.theme?.componentBorderRadius || 8}
                                            min={0}
                                            max={50}
                                            onChange={(val) => handleThemeChange('componentBorderRadius', val)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-sm text-gray-400">Button Border Radius ({formData.theme?.buttonBorderRadius || 8}px)</label>
                                        </div>
                                        <CustomRange
                                            value={formData.theme?.buttonBorderRadius || 8}
                                            min={0}
                                            max={50}
                                            onChange={(val) => handleThemeChange('buttonBorderRadius', val)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    <h3 className="text-xl font-semibold text-indigo-400">Cursor Settings</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Enable Custom Cursor</span>
                                            <Switch
                                                checked={formData.cursor?.enabled || false}
                                                onChange={() => handleCursorChange('enabled', !formData.cursor?.enabled)}
                                                label=""
                                            />
                                        </div>
                                        {formData.cursor?.enabled && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-gray-400">Custom Cursor URL (Image)</label>
                                                    <input
                                                        value={formData.cursor?.customUrl || ''}
                                                        onChange={(e) => handleCursorChange('customUrl', e.target.value)}
                                                        placeholder="Leave empty for default dot cursor"
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-400">Enable Cursor Trail Effect</span>
                                                    <Switch
                                                        checked={formData.cursor?.effect || false}
                                                        onChange={() => handleCursorChange('effect', !formData.cursor?.effect)}
                                                        label=""
                                                    />
                                                </div>

                                                <div className="mt-4 p-8 bg-black/40 border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group">
                                                    <p className="text-gray-400 text-sm">Hover here to test your cursor!</p>
                                                    <div className="absolute inset-0 z-10">
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-6 border-t border-white/10">
                                    <h3 className="text-xl font-semibold text-indigo-400">Typography & Effects</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Name Effect</label>
                                            <CustomSelect
                                                value={formData.textEffects?.name || 'none'}
                                                onChange={(val) => setFormData(prev => ({ ...prev, textEffects: { ...prev.textEffects, name: val as any } }))}
                                                options={[
                                                    { value: "none", label: "None" },
                                                    { value: "glow", label: "Glow" },
                                                    { value: "glitch", label: "Glitch" },
                                                    { value: "rainbow", label: "Rainbow" },
                                                    { value: "gradient", label: "Gradient" },
                                                    { value: "typewriter", label: "Typewriter" }
                                                ]}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Custom Font (Google Fonts Name)</label>
                                            <input
                                                value={formData.theme?.fontFamily || ''}
                                                onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                                                placeholder="e.g. Press Start 2P, Roboto Mono"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                    {activeTab === 'settings' && (
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">Settings & Features</h2>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400">Feature Toggles</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Switch
                                        checked={formData.features?.showLikes !== false}
                                        onChange={() => handleFeatureToggle('showLikes')}
                                        label="Show Like Counts"
                                    />
                                    <Switch
                                        checked={formData.features?.showUid !== false}
                                        onChange={() => handleFeatureToggle('showUid')}
                                        label="Show UID"
                                    />
                                    <Switch
                                        checked={formData.features?.showComments !== false}
                                        onChange={() => handleFeatureToggle('showComments')}
                                        label="Show Comment Counts"
                                    />
                                    <Switch
                                        checked={formData.features?.showViews !== false}
                                        onChange={() => handleFeatureToggle('showViews')}
                                        label="Show View Counts"
                                    />
                                    <Switch
                                        checked={formData.features?.allowComments !== false}
                                        onChange={() => handleFeatureToggle('allowComments')}
                                        label="Allow New Comments"
                                    />
                                    <Switch
                                        checked={formData.features?.allowLikes !== false}
                                        onChange={() => handleFeatureToggle('allowLikes')}
                                        label="Allow New Likes"
                                    />
                                    <Switch
                                        checked={formData.features?.enableEnterScreen !== false}
                                        onChange={() => handleFeatureToggle('enableEnterScreen')}
                                        label="Enable Enter Screen"
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-6">
                                <h3 className="text-xl font-semibold text-indigo-400">Enter Screen Configuration</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Click Text</label>
                                        <input
                                            name="enterScreen.title"
                                            value={formData.enterScreen?.title || 'click to enter...'}
                                            onChange={handleChange}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                </div>

                {previewPostId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewPostId(null)}>
                        <div className="bg-[#111] w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 p-8" onClick={e => e.stopPropagation()}>
                            {(() => {
                                const post = formData.posts?.find(p => p.id === previewPostId);
                                if (!post) return null;
                                return (
                                    <article className="space-y-4">
                                        <h2 className="text-3xl font-bold text-white">{post.title}</h2>
                                        {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-lg" />}
                                        <p className="text-gray-300 whitespace-pre-wrap">{post.content}</p>
                                        <div className="pt-4 border-t border-white/10 flex gap-4 text-sm text-gray-500">
                                            <span>{post.date}</span>
                                            <span>{post.likes} Likes</span>
                                        </div>
                                    </article>
                                );
                            })()}
                            <button onClick={() => setPreviewPostId(null)} className="mt-8 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">Close Preview</button>
                        </div>
                    </div>
                )}

                <ConfirmModal
                    isOpen={showResetModal}
                    title="Reset Profile?"
                    message="Are you sure you want to reset all profile data to default settings? This action cannot be undone."
                    onConfirm={handleReset}
                    onCancel={() => setShowResetModal(false)}
                    confirmText="Yes, Reset Everything"
                    isDestructive={true}
                />

            </main>
        </div>
    );
}

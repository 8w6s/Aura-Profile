'use client';

import React, { useEffect, useState, use } from 'react';
import { useProfile } from '@/app/context/ProfileContext';
import { useToast } from '@/app/context/ToastContext';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Calendar, Eye, Share2, Reply, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { profile, updateProfile, refreshProfile, isLoading } = useProfile();
  const { showToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToAuthor, setReplyingToAuthor] = useState<string>('');
  
  useEffect(() => {
    const incrementView = async () => {
        try {
            await fetch('/api/views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: resolvedParams.id }) 
            });
        } catch (e) {
            console.error(e);
        }
    };
    incrementView();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (profile && profile.posts) {
      const foundPost = profile.posts.find(p => p.id === resolvedParams.id);
      setPost(foundPost);
    }
  }, [profile, resolvedParams.id]);

  const maskName = (name: string) => {
    if (name.length <= 4) return name[0] + '***';
    return name.slice(0, 2) + '*****' + name.slice(-2);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
  };

  const handleComment = async () => {
    if (!commentContent.trim() || !post) return;
    
    const newComment = {
        id: Date.now().toString(),
        author: commentName.trim() || 'Anonymous',
        content: commentContent.trim(),
        date: new Date().toISOString(),
        replies: []
    };

    const postIndex = profile.posts.findIndex(p => p.id === post.id);
    if (postIndex === -1) return;

    const newPosts = [...profile.posts];
    const currentPost = { ...newPosts[postIndex] };

    if (replyingTo) {
        const commentIndex = currentPost.comments.findIndex((c: any) => c.id === replyingTo);
        if (commentIndex !== -1) {
            const updatedComments = [...currentPost.comments];
            updatedComments[commentIndex] = {
                ...updatedComments[commentIndex],
                replies: [...(updatedComments[commentIndex].replies || []), newComment]
            };
            currentPost.comments = updatedComments;
        }
    } else {
        currentPost.comments = [...(currentPost.comments || []), newComment];
    }

    newPosts[postIndex] = currentPost;
    
    updateProfile({ posts: newPosts });
    
    setCommentContent('');
    setCommentName('');
    setReplyingTo(null);
    setReplyingToAuthor('');
    showToast('Comment posted!', 'success');
  };

  const handleLike = async () => {
    if (!post) return;
    
    const postIndex = profile.posts.findIndex(p => p.id === post.id);
    if (postIndex === -1) return;

    const newPosts = [...profile.posts];
    newPosts[postIndex] = { ...newPosts[postIndex], likes: (newPosts[postIndex].likes || 0) + 1 };
    
    updateProfile({ posts: newPosts });

    try {
        const res = await fetch('/api/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: post.id })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            if (data.error === 'Already liked') {
                showToast('You have already liked this post!', 'info');
            } else {
                showToast('Like failed', 'error');
            }
            refreshProfile();
            return;
        }
        showToast('Post liked!', 'success');
    } catch (error) {
        console.error(error);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div></div>;
  
  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Link href="/" className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            Return Home
        </Link>
      </div>
    );
  }

  return (
    <div 
        className="min-h-screen bg-black text-white relative overflow-hidden select-none"
        onContextMenu={(e) => e.preventDefault()}
    >
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20" 
             style={{ 
                 backgroundImage: `url(${post.imageUrl || profile.theme.backgroundImageUrl})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 filter: `blur(${profile.theme.enterScreenBlur}px)`
             }} 
        />
        <div className="fixed inset-0 bg-black/60 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors bg-black/40 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 backdrop-blur-md">
                <ArrowLeft size={18} />
                <span>Back to Profile</span>
            </Link>

            <motion.article 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111]/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
            >
                {post.imageUrl && (
                    <div className="w-full h-64 md:h-96 relative">
                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-linear-to-t from-[#111] to-transparent" />
                    </div>
                )}

                <div className="p-6 md:p-10 space-y-6">
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{post.title}</h1>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(post.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><Eye size={14} /> {post.views || 0} views</span>
                            <span className="flex items-center gap-1.5"><Heart size={14} /> {post.likes || 0} likes</span>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    </div>

                    <div className="flex gap-4 pt-8 border-t border-white/10">
                        <button 
                            onClick={handleLike}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all border border-white/10 group"
                        >
                            <Heart size={20} className={`transition-transform group-hover:scale-110 ${post.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                            <span className="font-medium">Like</span>
                        </button>
                        <button 
                            onClick={handleShare}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-xl transition-all border border-white/10 group"
                        >
                            <Share2 size={20} className="transition-transform group-hover:scale-110" />
                            <span className="font-medium">Share</span>
                        </button>
                    </div>
                </div>
            </motion.article>

            <div className="mt-8 bg-[#111]/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-10">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                    <MessageCircle className="text-indigo-400" />
                    Comments ({post.comments?.length || 0})
                </h3>

                {profile.features.allowComments && (
                    <div className="mb-10 bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                            {replyingTo ? `Replying to ${replyingToAuthor}` : 'Leave a comment'}
                        </h4>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <input 
                                        value={commentName}
                                        onChange={(e) => setCommentName(e.target.value)}
                                        placeholder="Your Name (optional)"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors"
                                    />
                                    <textarea 
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="What's on your mind?"
                                        rows={3}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none transition-colors resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                {replyingTo && (
                                    <button 
                                        onClick={() => {
                                            setReplyingTo(null);
                                            setReplyingToAuthor('');
                                        }}
                                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel Reply
                                    </button>
                                )}
                                <button 
                                    onClick={handleComment}
                                    disabled={!commentContent.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    <Send size={16} />
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {post.comments?.map((comment: any) => (
                        <div key={comment.id} className="group">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-indigo-300 font-bold border border-white/5">
                                    {comment.author[0].toUpperCase()}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="font-bold text-white mr-2">{maskName(comment.author)}</span>
                                            <span className="text-xs text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setReplyingTo(comment.id);
                                                setReplyingToAuthor(maskName(comment.author));
                                                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                            }}
                                            className="text-gray-500 hover:text-indigo-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex items-center gap-1 text-xs"
                                        >
                                            <Reply size={12} /> Reply
                                        </button>
                                    </div>
                                    <p className="text-gray-300 leading-relaxed">{comment.content}</p>
                                    
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="pt-2 pl-4 border-l-2 border-white/10 space-y-4 mt-2">
                                            {comment.replies.map((reply: any) => (
                                                <div key={reply.id} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-indigo-300 text-sm">{reply.author === '8w6s' ? <span className="flex items-center gap-1 text-pink-400">8w6s <span className="bg-pink-500/20 text-pink-400 text-[10px] px-1 rounded">OWNER</span></span> : maskName(reply.author)}</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(reply.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm">{reply.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

'use client';
import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { Post } from '@/app/context/ProfileContext';
export type MarkdownHeading = { id: string; text: string; level: 1 | 2 | 3 | 4 | 5 | 6 };
const MAX_CUSTOM_CSS_LENGTH = 12_000;
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
const stripMarkdownSyntax = (value: string) =>
  value.replace(/`{1,3}([^`]+)`{1,3}/g, '$1').replace(/!\[([^]]*)\]\([^)]+\)/g, '$1').replace(/\[([^]]+)\]\([^)]+\)/g, '$1').replace(/[>#*_~`-]/g, ' ').replace(/\s+/g, ' ').trim();
const getVideoEmbed = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      const id = host.includes('youtu.be') ? parsed.pathname.split('/').filter(Boolean)[0] : parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
};
const isTweetUrl = (url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('twitter.com') || host.includes('x.com');
  } catch {
    return false;
  }
};
const highlightCode = (code: string) => {
  const escaped = escapeHtml(code);
  return escaped
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-amber-300">$1</span>')
    .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-emerald-300 italic">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|class|new|extends|async|await|try|catch|throw|import|from|export|default|typeof|instanceof|of|in|null|undefined|true|false|def|elif|lambda|yield|raise|with|True|False|None|and|or|not)\b/g, '<span class="text-cyan-300 font-semibold">$1</span>');
};
export const estimateReadingTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
};
export const extractMarkdownHeadings = (content: string): MarkdownHeading[] => {
  const seen = new Map<string, number>();
  return content.split('\n').flatMap((line) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) {
      return [];
    }
    const level = match[1].length as MarkdownHeading['level'];
    const text = stripMarkdownSyntax(match[2]);
    const baseId = slugify(text);
    const count = (seen.get(baseId) ?? 0) + 1;
    seen.set(baseId, count);
    return [{ id: count > 1 ? `${baseId}-${count}` : baseId, text, level }];
  });
};
export const getRelatedPosts = (posts: Post[], currentPost: Post, limit = 3) => {
  const currentTags = new Set((currentPost.tags ?? []).map((tag) => tag.toLowerCase()));
  const currentCategory = currentPost.category?.toLowerCase();
  return posts
    .filter((post) => post.id !== currentPost.id && !post.hidden)
    .map((post) => {
      const sharedTags = (post.tags ?? []).filter((tag) => currentTags.has(tag.toLowerCase())).length;
      const sameCategory = currentCategory && post.category?.toLowerCase() === currentCategory ? 4 : 0;
      const titleOverlap = currentPost.title.toLowerCase().split(/\s+/).filter(Boolean).reduce((score, token) => score + (post.title.toLowerCase().includes(token) ? 1 : 0), 0);
      return { post, score: sharedTags * 3 + sameCategory + titleOverlap };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ post }) => post);
};
export const sanitizeCustomCss = (css?: string) => {
  if (!css) return '';
  return css.slice(0, MAX_CUSTOM_CSS_LENGTH).replace(/<\/style/gi, '<\\/style').replace(/@import\s+url\([^)]*\);?/gi, '').replace(/@import\s+[^;]+;?/gi, '').replace(/expression\s*\(/gi, '').replace(/javascript\s*:/gi, '').trim();
};
export function CustomCssInjection({ css }: { css?: string }) {
  const sanitizedCss = sanitizeCustomCss(css);
  if (!sanitizedCss) return null;
  return <style>{sanitizedCss}</style>;
}
export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const components: Components = {
    h1: ({ children, ...props }) => <h1 {...props} className="mt-8 mb-4 text-3xl font-bold tracking-tight text-white first:mt-0">{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props} className="mt-8 mb-4 text-2xl font-semibold text-white">{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props} className="mt-6 mb-3 text-xl font-semibold text-white">{children}</h3>,
    p: ({ children, ...props }) => <p {...props} className="mb-4 leading-7 text-gray-300">{children}</p>,
    a: ({ children, href = '', ...props }) => {
      const url = String(href || '');
      const embedUrl = getVideoEmbed(url);
      if (embedUrl) {
        return (
          <div className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <iframe
              src={embedUrl}
              title="Embedded video"
              className="aspect-video w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      if (isTweetUrl(url)) {
        return (
          <blockquote className="my-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100">
            <p className="mb-2 text-cyan-200">Embedded Tweet</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200">{url}</a>
          </blockquote>
        );
      }

      return <a {...props} href={url} className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200">{children}</a>;
    },
    ul: ({ children, ...props }) => <ul {...props} className="mb-4 list-disc space-y-2 pl-6 text-gray-300">{children}</ul>,
    ol: ({ children, ...props }) => <ol {...props} className="mb-4 list-decimal space-y-2 pl-6 text-gray-300">{children}</ol>,
    li: ({ children, ...props }) => <li {...props} className="leading-7">{children}</li>,
    blockquote: ({ children, ...props }) => <blockquote {...props} className="mb-4 border-l-4 border-cyan-400/60 pl-4 italic text-gray-400">{children}</blockquote>,
    hr: ({ ...props }) => <hr {...props} className="my-6 border-white/10" />,
    code: ({ className, children, ...props }) => {
      const language = /language-(\w+)/.exec(className || '')?.[1] || 'text';
      const code = String(children).replace(/\n$/, '');
      const isInlineCode = !className && !code.includes('\n');
      if (isInlineCode) {
        return <code {...props} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-200">{children}</code>;
      }
      return (
        <div className="my-5 overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-gray-400">
            <span>{language.toUpperCase()}</span>
            <span className="font-mono">{code.split('\n').length} lines</span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-gray-100">
            <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
          </pre>
        </div>
      );
    },
  };
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
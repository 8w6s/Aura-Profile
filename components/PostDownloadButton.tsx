'use client';
import React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { useToast } from '@/app/context/ToastContext';

interface PostDownloadButtonProps {
  fileId: string;
  label: string;
  url?: string; // Optional URL if it's a direct link
}

const PostDownloadButton: React.FC<PostDownloadButtonProps> = ({ fileId, label, url }) => {
  const { showToast } = useToast();

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (url) {
        // Direct link (e.g. Catbox)
        window.open(url, '_blank');
        showToast('Opening download link...', 'success');
        return;
    }

    // Legacy/Internal download logic
    try {
        const downloadUrl = `/api/download?fileId=${fileId}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = label;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Download started...', 'success');
    } catch (error) {
        showToast('Failed to start download', 'error');
    }
  };

  return (
    <button 
      onClick={handleDownload}
      className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg transition-all text-xs font-medium text-gray-300 hover:text-white backdrop-blur-sm"
    >
      <Download size={14} className="group-hover:text-indigo-400 transition-colors" />
      <span className="truncate max-w-[150px]">{label}</span>
      <ExternalLink size={10} className="opacity-0 group-hover:opacity-50 transition-opacity ml-auto" />
    </button>
  );
};

export default PostDownloadButton;

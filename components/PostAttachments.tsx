'use client';

import React, { useState } from 'react';
import { Download, Layers } from 'lucide-react';
import PostDownloadButton from './PostDownloadButton';
import DownloadPopup from './DownloadPopup';
import { FileData } from '@/app/context/ProfileContext';

interface PostAttachmentsProps {
  attachments: string[];
  files?: FileData[];
}

const PostAttachments: React.FC<PostAttachmentsProps> = ({ attachments, files }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (!attachments || attachments.length === 0 || !files) return null;

  const attachedFiles = attachments
    .map(id => files.find(f => f.id === id))
    .filter((f): f is FileData => !!f);

  if (attachedFiles.length === 0) return null;

  if (attachedFiles.length === 1) {
    const file = attachedFiles[0];
    return <PostDownloadButton fileId={file.id} label={file.name} url={file.url} />;
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsPopupOpen(true);
        }}
        className="group flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-lg transition-all text-xs font-medium text-gray-300 hover:text-white backdrop-blur-sm"
      >
        <Layers size={14} className="group-hover:text-indigo-400 transition-colors" />
        <span>Download Files ({attachedFiles.length})</span>
      </button>

      <DownloadPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        files={attachedFiles}
      />
    </>
  );
};

export default PostAttachments;

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, File, Music, PlayCircle, Image as ImageIcon } from 'lucide-react';
import { FileData } from '@/app/context/ProfileContext';

interface DownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileData[];
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon size={20} />;
  if (['mp4', 'webm', 'mov'].includes(ext || '')) return <PlayCircle size={20} />;
  if (['mp3', 'wav', 'ogg'].includes(ext || '')) return <Music size={20} />;
  return <File size={20} />;
};

const DownloadPopup: React.FC<DownloadPopupProps> = ({ isOpen, onClose, files }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Download size={20} className="text-indigo-400" />
                Select File to Download
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  download={file.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
                  onClick={(e) => {
                     // If it's a direct download link, we might not need to prevent default.
                     // But if it's handled by an API, we might. 
                     // Usually target="_blank" is enough for external.
                     // If local, `download` attribute works.
                  }}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:text-indigo-300">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {file.downloadCount} downloads
                        {file.source && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${file.source === 'local' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                {file.source === 'local' ? 'Local' : 'Cloud'}
                            </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <Download size={18} className="text-gray-500 group-hover:text-white transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DownloadPopup;

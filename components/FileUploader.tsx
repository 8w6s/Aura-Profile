'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Check, Loader2, File } from 'lucide-react';
import { useToast } from '@/app/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  userHash?: string;
  onUploadComplete: (url: string, filename: string, source: 'catbox' | 'local') => void;
  uploadMode?: 'catbox' | 'local';
}

const FileUploader: React.FC<FileUploaderProps> = ({ userHash, onUploadComplete, uploadMode = 'catbox' }) => {
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (uploadMode === 'catbox' && !userHash) {
      showToast('Please configure Catbox User Hash in settings first.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    // Simulate progress since fetch doesn't provide it easily
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append('fileToUpload', file);

      let url = '';

      if (uploadMode === 'catbox') {
        formData.append('reqtype', 'fileupload');
        if (userHash) formData.append('userhash', userHash);
        
        const response = await fetch('/api/upload/catbox', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Catbox Upload failed');
        url = await response.text();

      } else {
        // Local Upload
        const response = await fetch('/api/upload/local', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Local Upload failed');
        url = await response.text();
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      showToast('File uploaded successfully!', 'success');
      onUploadComplete(url, file.name, uploadMode);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      showToast('Upload failed. Check console.', 'error');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <motion.div
        ref={dropZoneRef}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        animate={{
          borderColor: isDragging ? '#6366f1' : isUploading ? '#eab308' : 'rgba(255, 255, 255, 0.1)',
          backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group min-h-[200px]`}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <div className="z-10 flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full bg-white/5 transition-transform duration-300 ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}>
             {isUploading ? <Loader2 size={32} className="animate-spin text-indigo-400" /> : <Upload size={32} className="text-indigo-400" />}
          </div>
          <div className="text-center">
            <p className="text-gray-300 font-medium">
              {isUploading 
                ? `Uploading to ${uploadMode === 'catbox' ? 'Catbox' : 'Local Assets'}...` 
                : isDragging 
                  ? 'Drop it here!' 
                  : 'Drop file here or click to upload'
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">Supported: Images, Videos, Audio, etc.</p>
          </div>
        </div>

        {isUploading && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                <motion.div 
                    className="h-full bg-indigo-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                />
            </div>
        )}
      </motion.div>
    </div>
  );
};

export default FileUploader;

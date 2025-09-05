
import React, { useState, useCallback } from 'react';

interface VideoUploaderProps {
  onVideoUpload: (file: File) => void;
  disabled: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onVideoUpload(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onVideoUpload(e.dataTransfer.files[0]);
    }
  }, [onVideoUpload]);

  return (
    <div className="max-w-3xl mx-auto">
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ${isDragging ? 'border-indigo-400 bg-gray-800/50' : 'border-gray-600 hover:border-indigo-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <input
                type="file"
                id="video-upload"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="video/*"
                onChange={handleFileChange}
                disabled={disabled}
            />
            <label htmlFor="video-upload" className="flex flex-col items-center justify-center space-y-4">
                 <svg className="w-16 h-16 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" />
                </svg>
                <p className="text-xl font-semibold text-gray-300">Arraste e solte um vídeo aqui</p>
                <p className="text-gray-500">ou</p>
                <span className="px-6 py-2 bg-indigo-600 text-white rounded-md font-bold">
                    Selecione um arquivo
                </span>
            </label>
        </div>
    </div>
  );
};

export default VideoUploader;

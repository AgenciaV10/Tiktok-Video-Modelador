import React, { useState, useCallback, useRef } from 'react';
import type { TikTokData } from '../types';
import { getTikTokData } from '../services/tiktokService';

interface VideoUploaderProps {
  onVideoUpload: (file: File) => void;
  disabled: boolean;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
      active
        ? 'bg-slate-800/60 border-b-2 border-purple-500 text-white'
        : 'text-slate-400 hover:bg-slate-700/30'
    }`}
  >
    {children}
  </button>
);


const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload, disabled }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'tiktok'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TikTok States
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isFetchingTikTok, setIsFetchingTikTok] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [tikTokData, setTikTokData] = useState<TikTokData | null>(null);
  const [tikTokError, setTikTokError] = useState<string | null>(null);


  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(file);
    } else {
      alert("Por favor, selecione um arquivo de vídeo válido.");
    }
  }, [onVideoUpload]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

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
    if (!disabled) {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) handleFile(files[0]);
    }
  }, [disabled, handleFile]);

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFile(files[0]);
  };
  
  const handleTikTokFetch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tiktokUrl) return;
      
      setIsFetchingTikTok(true);
      setTikTokError(null);
      setTikTokData(null);

      try {
          const data = await getTikTokData(tiktokUrl);
          setTikTokData(data);
      } catch (err) {
          setTikTokError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
          setIsFetchingTikTok(false);
      }
  };

  const handleDownload = async (url: string, filename: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha no download do arquivo.');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro no download:', error);
      alert('Não foi possível baixar o arquivo.');
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <div className="bg-gray-900/50 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex border-b border-slate-800 px-4">
          <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>Fazer Upload</TabButton>
          <TabButton active={activeTab === 'tiktok'} onClick={() => setActiveTab('tiktok')}>Colar Link do TikTok</TabButton>
        </div>
      
        <div className="p-6">
          {activeTab === 'upload' && (
             <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging ? 'border-purple-500 bg-purple-900/20 scale-105' : 'border-slate-700 hover:border-purple-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    className="hidden"
                    disabled={disabled}
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-3-3m0 0l3-3m-3 3h12" />
                    </svg>
                    <p className="text-lg font-semibold text-slate-300">Arraste e solte seu vídeo aqui</p>
                    <p className="text-slate-500">ou</p>
                    <button
                        type="button"
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-bold transition-colors shadow-lg shadow-purple-600/20"
                        disabled={disabled}
                    >
                    Selecione o arquivo
                    </button>
                    <p className="text-xs text-slate-600 mt-2">Suporta MP4, MOV, etc.</p>
                </div>
            </div>
          )}

          {activeTab === 'tiktok' && (
             <div className="space-y-6">
                <form onSubmit={handleTikTokFetch} className="flex items-center space-x-3">
                    <input 
                        type="url"
                        value={tiktokUrl}
                        onChange={(e) => setTiktokUrl(e.target.value)}
                        placeholder="https://www.tiktok.com/@user/video/..."
                        className="flex-grow bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        required
                        disabled={isFetchingTikTok || isDownloading}
                    />
                    <button 
                        type="submit" 
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-bold transition-colors shadow-lg shadow-purple-600/20 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                        disabled={isFetchingTikTok || isDownloading}
                    >
                        {isFetchingTikTok ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Buscar Vídeo'}
                    </button>
                </form>

                {tikTokError && <p className="text-red-400 text-center">{tikTokError}</p>}
                
                {tikTokData && (
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-fade-in">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <img src={tikTokData.cover} alt="Capa do vídeo" className="w-full sm:w-32 h-auto object-cover rounded-md shadow-lg" />
                            <div className="flex-grow space-y-3">
                                <p className="font-bold text-lg text-white">{tikTokData.title || 'Vídeo do TikTok'}</p>
                                <p className="text-sm text-slate-400">por @{tikTokData.author.nickname}</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button 
                                        onClick={() => handleDownload(tikTokData.play, `${tikTokData.id}.mp4`)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold text-sm transition-colors shadow-md disabled:bg-slate-600 flex items-center gap-2"
                                        disabled={isDownloading}
                                    >
                                      {isDownloading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Baixando...</span>
                                        </>
                                      ) : 'Baixar Vídeo (.mp4)'}
                                    </button>
                                     <button onClick={() => handleDownload(tikTokData.music, `${tikTokData.id}.mp3`)} className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:text-slate-500" disabled={isDownloading}>Baixar Áudio</button>
                                     <button onClick={() => handleDownload(tikTokData.cover, `${tikTokData.id}.jpg`)} className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:text-slate-500" disabled={isDownloading}>Baixar Capa</button>
                                </div>
                            </div>
                        </div>
                         <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-yellow-300 text-sm">
                            <strong>Próximo passo:</strong> Após o download, volte para a aba "Fazer Upload" e arraste o vídeo baixado para iniciar a análise.
                        </div>
                    </div>
                )}
             </div>
          )}
        </div>
    </div>
  );
};

export default VideoUploader;

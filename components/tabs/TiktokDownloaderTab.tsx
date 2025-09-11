import React, { useState } from 'react';
import type { TikTokData } from '../../types';
import { getTikTokData } from '../../services/tiktokService';

interface TiktokDownloaderTabProps {
  onVideoDownloaded: (file: File) => void;
}

const TiktokDownloaderTab: React.FC<TiktokDownloaderTabProps> = ({ onVideoDownloaded }) => {
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isFetchingTikTok, setIsFetchingTikTok] = useState(false);
  const [isDownloading, setIsDownloading] = useState(''); // Stores which file is downloading
  const [tikTokData, setTikTokData] = useState<TikTokData | null>(null);
  const [tikTokError, setTikTokError] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleTikTokFetch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tiktokUrl) return;
      
      setIsFetchingTikTok(true);
      setTikTokError(null);
      setTikTokData(null);
      setVideoLoaded(false); // Reset on new search

      try {
          const data = await getTikTokData(tiktokUrl);
          setTikTokData(data);
      } catch (err) {
          setTikTokError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
          setIsFetchingTikTok(false);
      }
  };

  const handleDownload = async (url: string, filename: string, type: 'video' | 'audio' | 'image') => {
    setIsDownloading(filename);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha no download do arquivo.');
      const blob = await response.blob();
      
      if (type === 'video') {
        const file = new File([blob], filename, { type: blob.type });
        onVideoDownloaded(file);
        setVideoLoaded(true);
        // Do not download the file, just load it into the app state
      } else {
        // For audio and image, proceed with the download
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error('Erro no download:', error);
      alert('Não foi possível baixar o arquivo.');
    } finally {
      setIsDownloading('');
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6 max-w-4xl mx-auto animate-fade-in">
       <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-200">Baixar Vídeo do TikTok</h2>
          <p className="text-slate-400">Cole um link de vídeo do TikTok abaixo para carregá-lo no aplicativo e usá-lo nas outras abas.</p>
          <form onSubmit={handleTikTokFetch} className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <input 
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@user/video/..."
                  className="flex-grow w-full bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  required
                  disabled={isFetchingTikTok || !!isDownloading}
              />
              <button 
                  type="submit" 
                  className="w-full sm:w-auto px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-bold transition-colors shadow-lg shadow-purple-600/20 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isFetchingTikTok || !!isDownloading}
              >
                  {isFetchingTikTok ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Buscar Vídeo'}
              </button>
          </form>

          {tikTokError && <p className="text-red-400 text-center">{tikTokError}</p>}
          
          {tikTokData && (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 animate-fade-in">
                  {videoLoaded ? (
                      <div className="text-center p-4 bg-green-900/30 border border-green-700/50 rounded-md">
                          <p className="font-bold text-lg text-green-300">✅ Vídeo Carregado!</p>
                          <p className="text-green-400 mt-2">O vídeo foi carregado no aplicativo. Prossiga para as próximas abas para começar a edição e análise.</p>
                      </div>
                  ) : (
                      <div className="flex flex-col sm:flex-row gap-4">
                          <img src={tikTokData.cover} alt="Capa do vídeo" className="w-full sm:w-32 h-auto object-cover rounded-md shadow-lg" />
                          <div className="flex-grow space-y-3">
                              <p className="font-bold text-lg text-white">{tikTokData.title || 'Vídeo do TikTok'}</p>
                              <p className="text-sm text-slate-400">por @{tikTokData.author.nickname}</p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                  <button 
                                      onClick={() => handleDownload(tikTokData.play, `${tikTokData.id}.mp4`, 'video')}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-bold text-sm transition-colors shadow-md disabled:bg-slate-600 flex items-center gap-2"
                                      disabled={!!isDownloading}
                                  >
                                    {isDownloading === `${tikTokData.id}.mp4` ? (
                                      <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Carregando...</span>
                                      </>
                                    ) : 'Usar este Vídeo'}
                                  </button>
                                   <button onClick={() => handleDownload(tikTokData.music, `${tikTokData.id}.mp3`, 'audio')} className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed" disabled={!!isDownloading}>Baixar Áudio</button>
                                   <button onClick={() => handleDownload(tikTokData.cover, `${tikTokData.id}.jpg`, 'image')} className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:text-slate-500 disabled:cursor-not-allowed" disabled={!!isDownloading}>Baixar Capa</button>
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          )}
       </div>
    </div>
  );
};

export default TiktokDownloaderTab;
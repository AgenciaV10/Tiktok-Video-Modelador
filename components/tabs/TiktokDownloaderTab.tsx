import React, { useState, useEffect } from 'react';
import type { TikTokData, HistoryItem } from '../../types';
import { getTikTokData } from '../../services/tiktokService';
import * as storageService from '../../services/storageService';
import TrashIcon from '../icons/TrashIcon';

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
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

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
          const newHistory = storageService.saveVideoToHistory(data);
          setHistory(newHistory);
      } catch (err) {
          setTikTokError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      } finally {
          setIsFetchingTikTok(false);
      }
  };

  const handleDownload = async (url: string, filename: string, type: 'video' | 'audio' | 'image') => {
    setIsDownloading(filename);
    setTikTokError(null);
    try {
      // Use a CORS proxy to fetch the media data. Direct fetching is blocked by CORS policy on the media server.
      // Switched to a new proxy due to fetch errors.
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`A resposta da rede não foi bem-sucedida (status: ${response.status})`);
      }
      const blob = await response.blob();
      
      if (type === 'video') {
        const file = new File([blob], filename, { type: blob.type });
        onVideoDownloaded(file);
        setVideoLoaded(true);
      } else {
        // For audio and image, proceed with the user-facing download
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
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      const userFriendlyMessage = `Não foi possível carregar o arquivo. O serviço de download pode estar offline ou bloqueando o acesso. Detalhes: ${errorMessage}`;
      setTikTokError(userFriendlyMessage);
      alert(userFriendlyMessage);
    } finally {
      setIsDownloading('');
    }
  };
  
  const handleLoadFromHistory = (data: TikTokData) => {
    setTikTokData(data);
    setTikTokError(null);
    setVideoLoaded(false);
    setTiktokUrl(`https://www.tiktok.com/@${data.author.nickname}/video/${data.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFromHistory = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    const newHistory = storageService.removeVideoFromHistory(videoId);
    setHistory(newHistory);
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
                          <p className="font-bold text-lg text-green-300">✅ Vídeo Carregado e Análise Iniciada!</p>
                          <p className="text-green-400 mt-2">A análise do vídeo começou em segundo plano. Você pode ir para a aba "Personagem" para editar um frame enquanto aguarda. O resultado estará pronto na aba "Analisar Vídeo".</p>
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

       {history.length > 0 && (
          <div className="mt-12 pt-6 border-t border-slate-700">
            <h3 className="text-2xl font-bold text-slate-200 mb-4">Histórico de Vídeos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {history.map((item) => (
                <div 
                  key={item.data.id} 
                  onClick={() => handleLoadFromHistory(item.data)}
                  className="group bg-slate-800 rounded-lg border border-slate-700/80 overflow-hidden cursor-pointer transition-all duration-300 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/30 hover:-translate-y-1"
                  title={`Carregar vídeo de @${item.data.author.nickname}`}
                >
                  <div className="relative aspect-[9/16] w-full bg-black">
                    <img src={item.data.cover} alt={item.data.title || 'Capa do vídeo'} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
                        <p className="font-bold text-white text-xs line-clamp-2" title={item.data.title || 'Vídeo do TikTok'}>
                            {item.data.title || 'Vídeo do TikTok'}
                        </p>
                    </div>
                    <button 
                        onClick={(e) => handleDeleteFromHistory(e, item.data.id)} 
                        className="absolute top-1.5 right-1.5 z-10 p-1.5 bg-black/50 rounded-full text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-200 backdrop-blur-sm"
                        aria-label="Excluir do histórico"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-slate-400 truncate">@{item.data.author.nickname}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(item.addedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default TiktokDownloaderTab;

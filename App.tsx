import React, { useState } from 'react';
import TiktokDownloaderTab from './components/tabs/TiktokDownloaderTab';
import CharacterEditorTab from './components/tabs/CharacterEditorTab';
import VideoAnalysisTab from './components/tabs/VideoAnalysisTab';

type Tab = 'tiktok' | 'character' | 'analysis';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-t-lg ${
      active
        ? 'bg-slate-800 text-white border-b-2 border-purple-500'
        : 'text-slate-400 hover:text-white bg-transparent'
    }`}
  >
    {children}
  </button>
);


const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('tiktok');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tiktok':
        return <TiktokDownloaderTab onVideoDownloaded={setVideoFile} />;
      case 'character':
        return <CharacterEditorTab videoFile={videoFile} setVideoFile={setVideoFile} />;
      case 'analysis':
        return <VideoAnalysisTab videoFile={videoFile} setVideoFile={setVideoFile} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 pb-2">
            <span className="block">Modele Qualquer Vídeo</span>
            <span className="block">do TikTok Shop</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400 tracking-wide max-w-2xl mx-auto">
            Gere prompts para Veo3, edite personagens em frames e muito mais.
          </p>
        </header>
        
        <nav className="flex justify-center border-b border-slate-800 mb-8">
          <TabButton active={activeTab === 'tiktok'} onClick={() => setActiveTab('tiktok')}>
            1. Colar Link do TikTok
          </TabButton>
          <TabButton active={activeTab === 'character'} onClick={() => setActiveTab('character')}>
            2. Personagem
          </TabButton>
          <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
            3. Analisar Vídeo
          </TabButton>
        </nav>

        <main className="max-w-7xl mx-auto">
          {renderTabContent()}
        </main>
        
        <footer className="text-center mt-20 text-gray-500 text-sm">
            <p>Desenvolvido por SuperApps ❤️</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

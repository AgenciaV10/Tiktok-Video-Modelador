
import React, { useState, useCallback } from 'react';
import VideoUploader from './components/VideoUploader';
import AnalysisResults from './components/AnalysisResults';
import Loader from './components/Loader';
import { generateVeoPrompts } from './services/geminiService';
import type { Take, MachineReadableOutput } from './types';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MachineReadableOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoUpload = useCallback(async (file: File) => {
    setVideoFile(file);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const results = await generateVeoPrompts(file);
      setAnalysisResult(results);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao analisar o vídeo. Por favor, verifique o console para mais detalhes e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setVideoFile(null);
    setAnalysisResult(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Video-to-Veo3 Mapper
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Gere prompts para Veo3 a partir de seus vídeos em takes de 7 segundos.
          </p>
        </header>

        <main>
          {!analysisResult && !isLoading && (
            <VideoUploader onVideoUpload={handleVideoUpload} disabled={isLoading} />
          )}

          {isLoading && (
            <Loader message="Analisando vídeo e gerando prompts... Isso pode levar alguns minutos." />
          )}

          {error && (
            <div className="text-center p-6 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 font-semibold">Erro</p>
              <p className="mt-2 text-red-400">{error}</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-bold transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {analysisResult && (
            <div>
              <AnalysisResults result={analysisResult} />
              <div className="text-center mt-8">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition-colors shadow-lg"
                >
                  Analisar Outro Vídeo
                </button>
              </div>
            </div>
          )}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Desenvolvido com React, Tailwind CSS e Gemini API.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

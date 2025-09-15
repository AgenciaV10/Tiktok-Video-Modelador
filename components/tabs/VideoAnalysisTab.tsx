import React, { useState, useRef } from 'react';
import AnalysisResults from '../AnalysisResults';
import Loader from '../Loader';
import type { MachineReadableOutput } from '../../types';

interface VideoAnalysisTabProps {
    videoFile: File | null;
    setVideoFile: (file: File | null) => void;
    analysisResult: MachineReadableOutput | null;
    isAnalyzing: boolean;
    analysisError: string | null;
    startAnalysis: (file: File) => void;
    onReset: () => void;
}

const VideoAnalysisTab: React.FC<VideoAnalysisTabProps> = ({ 
    videoFile, 
    setVideoFile,
    analysisResult,
    isAnalyzing,
    analysisError,
    startAnalysis,
    onReset
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileSelected = (file: File | null | undefined) => {
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            startAnalysis(file);
        } else {
            alert("Por favor, selecione um arquivo de vídeo válido.");
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); if (!isAnalyzing) setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!isAnalyzing) {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) handleFileSelected(files[0]);
        }
    };

    const handleClick = () => { if (!isAnalyzing) fileInputRef.current?.click(); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) handleFileSelected(files[0]);
    };

    if (isAnalyzing) return <Loader message="Analisando vídeo e gerando prompts... Isso pode levar alguns minutos." />;
    if (analysisError) return (
        <div className="text-center p-6 bg-red-900/30 border border-red-700/50 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-300 font-semibold text-lg">Erro na Análise</p>
            <p className="mt-2 text-red-400">{analysisError}</p>
            <button
                onClick={onReset}
                className="mt-6 px-5 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-bold transition-colors shadow-lg shadow-red-600/20"
            >
                Tentar Novamente
            </button>
        </div>
    );
    if (analysisResult) return (
        <div className="animate-fade-in">
            <AnalysisResults result={analysisResult} />
            <div className="text-center mt-12">
                <button
                    onClick={onReset}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-bold transition-all duration-300 shadow-lg shadow-indigo-500/30 transform hover:scale-105"
                >
                    Analisar Outro Vídeo
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {videoFile ? (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">Vídeo Carregado</h2>
                    <p className="text-slate-400 mb-6">Pronto para análise: <span className="font-semibold text-purple-400">{videoFile.name}</span></p>
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => startAnalysis(videoFile)}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-lg text-white font-bold transition-all duration-300 shadow-lg shadow-green-500/30 transform hover:scale-105"
                        >
                            Iniciar Análise
                        </button>
                        <button 
                            onClick={() => setVideoFile(null)}
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-md text-white font-bold transition-colors"
                        >
                            Trocar Vídeo
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging ? 'border-purple-500 bg-purple-900/20 scale-105' : 'border-slate-700 hover:border-purple-600'} ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop} onClick={handleClick}
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" disabled={isAnalyzing} />
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15l-3-3m0 0l3-3m-3 3h12" /></svg>
                        <p className="text-lg font-semibold text-slate-300">Arraste e solte seu vídeo aqui</p>
                        <p className="text-slate-500">ou</p>
                        <button type="button" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-bold transition-colors shadow-lg shadow-purple-600/20" disabled={isAnalyzing}>
                            Selecione o arquivo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoAnalysisTab;
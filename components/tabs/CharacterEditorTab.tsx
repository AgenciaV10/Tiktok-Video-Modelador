
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { editImage } from '../../services/imageEditingService';
import { extractFramesFromVideo } from '../../services/videoService';
import Loader from '../Loader';
import * as Prompts from '../../prompts';

interface CharacterEditorTabProps {
    videoFile: File | null;
    setVideoFile: (file: File | null) => void;
}

interface FrameData {
    dataUrl: string;
    timestamp: number;
}

const EditSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
        <h4 className="font-semibold text-purple-300 mb-3">{title}</h4>
        <div className="space-y-3">{children}</div>
    </div>
);

const FileInput: React.FC<{ id: string; onChange: (file: File | null) => void; file: File | null; }> = ({ id, onChange, file }) => (
    <input
        type="file"
        id={id}
        accept="image/*"
        onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
        className="w-full text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer"
    />
);

const CharacterEditorTab: React.FC<CharacterEditorTabProps> = ({ videoFile }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [originalFrame, setOriginalFrame] = useState<File | null>(null);
    const [originalFrameUrl, setOriginalFrameUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [lastEditedImageFile, setLastEditedImageFile] = useState<File | null>(null);

    // States for reference images and inputs
    const [characterRef, setCharacterRef] = useState<File | null>(null);
    const [blusaRef, setBlusaRef] = useState<File | null>(null);
    const [calcaRef, setCalcaRef] = useState<File | null>(null);
    const [hairStyle, setHairStyle] = useState<'amarrado' | 'solto'>('amarrado');
    const [chatPrompt, setChatPrompt] = useState('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // New states for the filmstrip frame selector
    const [thumbnails, setThumbnails] = useState<FrameData[]>([]);
    const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    const videoSrc = videoFile ? URL.createObjectURL(videoFile) : null;

    useEffect(() => {
        // Cleanup object URL on component unmount
        return () => { if (videoSrc) URL.revokeObjectURL(videoSrc); };
    }, [videoSrc]);

    useEffect(() => {
        // Automatically extract frames when a new video file is provided
        if (videoFile) {
            setIsExtracting(true);
            setThumbnails([]);
            setSelectedFrame(null);
            setOriginalFrame(null);
            setOriginalFrameUrl(null);
            setError(null);

            extractFramesFromVideo(videoFile, 24)
                .then(frames => {
                    setThumbnails(frames);
                    if (frames.length > 0) {
                        setSelectedFrame(frames[0]);
                    }
                })
                .catch(err => {
                    console.error("Failed to extract frames:", err);
                    setError("Não foi possível extrair os frames do vídeo.");
                })
                .finally(() => {
                    setIsExtracting(false);
                });
        }
    }, [videoFile]);

    const handleConfirmFrame = useCallback(() => {
        if (videoRef.current && selectedFrame) {
            const video = videoRef.current;
            
            // This function is called once the video has seeked to the correct time
            const onSeeked = () => {
                const targetWidth = 576;
                const targetHeight = 1024;

                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    const videoWidth = video.videoWidth;
                    const videoHeight = video.videoHeight;
                    const videoAspectRatio = videoWidth / videoHeight;
                    const targetAspectRatio = targetWidth / targetHeight;

                    let sWidth = videoWidth;
                    let sHeight = videoHeight;
                    let sx = 0;
                    let sy = 0;
                    
                    if (videoAspectRatio > targetAspectRatio) {
                        sWidth = videoHeight * targetAspectRatio;
                        sx = (videoWidth - sWidth) / 2;
                    } else {
                        sHeight = videoWidth / targetAspectRatio;
                        sy = (videoHeight - sHeight) / 2;
                    }

                    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

                    const dataUrl = canvas.toDataURL('image/png');
                    setOriginalFrameUrl(dataUrl);

                    canvas.toBlob(blob => {
                        if (blob) {
                            const file = new File([blob], "frame.png", { type: "image/png" });
                            setOriginalFrame(file);
                            // Reset edits when a new frame is confirmed
                            setEditedImageUrl(null);
                            setLastEditedImageFile(null);
                            setError(null);
                        }
                    }, 'image/png');
                }
                video.removeEventListener('seeked', onSeeked); // Cleanup listener
            };
            
            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = selectedFrame.timestamp;
        }
    }, [selectedFrame]);
    
    const handleEdit = async (action: 'character' | 'blusa' | 'calca' | 'hair' | 'chat') => {
        const baseImage = lastEditedImageFile || originalFrame;
        if (!baseImage) {
            setError("Primeiro, capture um frame do vídeo.");
            return;
        }

        let prompt = Prompts.SYSTEM_PERSONAGEM_GENERAL;
        let referenceImage: File | null = null;

        switch (action) {
            case 'character':
                if (!characterRef) { setError("Por favor, selecione uma imagem de referência para o personagem."); return; }
                prompt += Prompts.ACTION_SWAP_CHARACTER;
                referenceImage = characterRef;
                break;
            case 'blusa':
                 if (!blusaRef) { setError("Por favor, selecione uma imagem de referência para a blusa."); return; }
                prompt += Prompts.ACTION_SWAP_BLUSA;
                referenceImage = blusaRef;
                break;
            case 'calca':
                 if (!calcaRef) { setError("Por favor, selecione uma imagem de referência para a calça."); return; }
                prompt += Prompts.ACTION_SWAP_CALCA;
                referenceImage = calcaRef;
                break;
            case 'hair':
                prompt += Prompts.ACTION_EDIT_HAIR(hairStyle);
                break;
            case 'chat':
                if (!chatPrompt) { setError("Por favor, escreva um comando no chat."); return; }
                prompt += Prompts.ACTION_CHAT_REEDIT(chatPrompt);
                break;
        }

        setIsLoading(true);
        setError(null);

        try {
            const resultDataUrl = await editImage({ baseImage, prompt, referenceImage });
            setEditedImageUrl(resultDataUrl);
            const response = await fetch(resultDataUrl);
            const blob = await response.blob();
            const newFile = new File([blob], `edited-frame-${Date.now()}.png`, { type: 'image/png' });
            setLastEditedImageFile(newFile);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? `Falha na edição: ${err.message}` : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!videoFile) {
        return (
            <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-200">Nenhum Vídeo Carregado</h2>
                <p className="mt-4 text-slate-400">Por favor, vá para a aba "1. Colar Link do TikTok" para baixar um vídeo primeiro.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">1. Selecionar Frame</h2>
                
                {/* This video element is hidden. It's used as a high-quality source for canvas rendering. */}
                <video ref={videoRef} src={videoSrc ?? undefined} className="hidden" crossOrigin="anonymous"></video>
                
                {isExtracting && <Loader message="Extraindo frames do vídeo..." />}
                
                {!isExtracting && thumbnails.length > 0 && (
                    <div className="w-full max-w-4xl mx-auto">
                        {/* Main Preview */}
                        <div className="mb-4 bg-black rounded-lg shadow-md flex justify-center items-center aspect-[9/16] max-w-sm mx-auto border border-slate-700">
                           {selectedFrame ? (
                                <img src={selectedFrame.dataUrl} alt="Frame selecionado" className="max-h-full max-w-full object-contain rounded-lg" />
                           ) : (
                                <p className="text-slate-500">Selecione um frame abaixo</p>
                           )}
                        </div>

                        {/* Filmstrip */}
                        <div className="flex overflow-x-auto space-x-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 custom-scrollbar">
                            {thumbnails.map((frame, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedFrame(frame)}
                                    className={`flex-shrink-0 w-20 h-32 sm:w-24 sm:h-36 rounded-md overflow-hidden transition-all duration-200 focus:outline-none ring-offset-2 ring-offset-slate-900 ${selectedFrame?.timestamp === frame.timestamp ? 'ring-2 ring-purple-500 scale-105' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                                    aria-label={`Selecionar frame ${index + 1}`}
                                >
                                    <img src={frame.dataUrl} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                </button>
                            ))}
                        </div>
                        
                        <button onClick={handleConfirmFrame} disabled={!selectedFrame} className="mt-6 w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold transition-all duration-300 shadow-lg shadow-indigo-500/30 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            Confirmar Frame (576x1024)
                        </button>
                    </div>
                )}
            </div>

            {originalFrameUrl && (
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6 animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">2. Editar Personagem</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-1 space-y-4">
                            <EditSection title="Trocar Personagem">
                                <FileInput id="char-ref" file={characterRef} onChange={setCharacterRef} />
                                <button onClick={() => handleEdit('character')} disabled={isLoading || !characterRef} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Aplicar</button>
                            </EditSection>
                            <EditSection title="Editar Roupas">
                                <FileInput id="blusa-ref" file={blusaRef} onChange={setBlusaRef} />
                                <button onClick={() => handleEdit('blusa')} disabled={isLoading || !blusaRef} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Trocar Blusa</button>
                                <hr className="border-slate-700"/>
                                <FileInput id="calca-ref" file={calcaRef} onChange={setCalcaRef} />
                                <button onClick={() => handleEdit('calca')} disabled={isLoading || !calcaRef} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Trocar Calça</button>
                            </EditSection>
                            <EditSection title="Ajustar Cabelo">
                                <div className="flex gap-4">
                                    <label className="flex items-center"><input type="radio" name="hair" value="amarrado" checked={hairStyle === 'amarrado'} onChange={() => setHairStyle('amarrado')} className="mr-2 accent-purple-500" /> Amarrado</label>
                                    <label className="flex items-center"><input type="radio" name="hair" value="solto" checked={hairStyle === 'solto'} onChange={() => setHairStyle('solto')} className="mr-2 accent-purple-500" /> Solto</label>
                                </div>
                                <button onClick={() => handleEdit('hair')} disabled={isLoading} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Aplicar</button>
                            </EditSection>
                             <EditSection title="Reedição via Chat">
                                <textarea value={chatPrompt} onChange={e => setChatPrompt(e.target.value)} placeholder="Ex: Deixe a blusa mais brilhante." rows={2} className="w-full bg-slate-800 border-slate-600 rounded-md text-sm p-2" />
                                <button onClick={() => handleEdit('chat')} disabled={isLoading || !chatPrompt} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Aplicar</button>
                            </EditSection>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-slate-300 text-center">Frame Original</h3>
                                <img src={originalFrameUrl} alt="Frame original" className="w-full rounded-lg shadow-md bg-black aspect-[9/16] object-contain" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2 text-slate-300 text-center">Resultado da Edição</h3>
                                <div className="relative">
                                    {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg z-10"><Loader message="Editando..."/></div>}
                                    
                                    {editedImageUrl ? (
                                        <img src={editedImageUrl} alt="Resultado da edição" className="w-full rounded-lg shadow-md bg-black aspect-[9/16] object-contain" />
                                    ) : (
                                        <div className="w-full rounded-lg bg-black aspect-[9/16] flex items-center justify-center text-slate-500 text-sm p-4 border-2 border-dashed border-slate-700">O resultado aparecerá aqui.</div>
                                    )}

                                    {editedImageUrl && !isLoading && (
                                        <a
                                            href={editedImageUrl}
                                            download={`edited-frame.png`}
                                            className="absolute top-2 right-2 p-1.5 bg-slate-800/70 hover:bg-slate-700/70 rounded-full transition-colors text-slate-300 backdrop-blur-sm"
                                            title="Baixar imagem editada"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterEditorTab;

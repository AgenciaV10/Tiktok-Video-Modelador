import React, { useState, useRef, useCallback, useEffect } from 'react';
import { editImage } from '../../services/imageEditingService';
import { extractFramesFromVideo } from '../../services/videoService';
import * as storageService from '../../services/storageService';
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

const FileInput: React.FC<{ id: string; onChange: (file: File | null) => void; label: string; }> = ({ id, onChange, label }) => (
    <div>
        <label htmlFor={id} className="sr-only">{label}</label>
        <input
            type="file"
            id={id}
            accept="image/*"
            onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/20 file:text-purple-300 hover:file:bg-purple-600/40 cursor-pointer"
        />
    </div>
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
    const [continuationPrompt, setContinuationPrompt] = useState('');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // States for the filmstrip frame selector
    const [thumbnails, setThumbnails] = useState<FrameData[]>([]);
    const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    // State for the pinned character feature
    const [pinnedCharDataUrl, setPinnedCharDataUrl] = useState<string | null>(null);

    // States for continuation editing UI
    const [continuationBaseUrl, setContinuationBaseUrl] = useState<string | null>(null);
    const [continuationBaseFile, setContinuationBaseFile] = useState<File | null>(null);
    const [continuationResultUrl, setContinuationResultUrl] = useState<string | null>(null);
    const [loadingLocation, setLoadingLocation] = useState<'main' | 'continuation' | null>(null);
    const [continuationError, setContinuationError] = useState<string | null>(null);
    const [editHistory, setEditHistory] = useState<string[]>([]);
    const [continuationHistory, setContinuationHistory] = useState<string[]>([]);


    const videoSrc = videoFile ? URL.createObjectURL(videoFile) : null;

    useEffect(() => {
        const savedCharDataUrl = storageService.getPinnedCharacter();
        if (savedCharDataUrl) setPinnedCharDataUrl(savedCharDataUrl);
    }, []);

    useEffect(() => {
        return () => { if (videoSrc) URL.revokeObjectURL(videoSrc); };
    }, [videoSrc]);

    useEffect(() => {
        if (videoFile) {
            setIsExtracting(true);
            setThumbnails([]);
            setSelectedFrame(null);
            setOriginalFrame(null);
            setOriginalFrameUrl(null);
            setError(null);
            setContinuationError(null);
            setEditHistory([]);
            setContinuationHistory([]);
            setEditedImageUrl(null);
            setContinuationBaseUrl(null);

            extractFramesFromVideo(videoFile, 24)
                .then(frames => {
                    setThumbnails(frames);
                    if (frames.length > 0) setSelectedFrame(frames[0]);
                })
                .catch(err => {
                    console.error("Failed to extract frames:", err);
                    setError("Não foi possível extrair os frames do vídeo.");
                })
                .finally(() => setIsExtracting(false));
        }
    }, [videoFile]);
    
    // Effect to setup continuation when a main edit is completed
    useEffect(() => {
        if (editedImageUrl) {
            setContinuationBaseUrl(editedImageUrl);
            setContinuationBaseFile(lastEditedImageFile);
            setContinuationHistory([editedImageUrl]);
            setContinuationResultUrl(null);
            setContinuationError(null);
        }
    }, [editedImageUrl, lastEditedImageFile]);

    const handleConfirmFrame = useCallback(() => {
        if (videoRef.current && selectedFrame) {
            // ... (rest of the function is unchanged)
            const video = videoRef.current;
            
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
                            setLastEditedImageFile(file); // Set base for first edit
                            setEditedImageUrl(null);
                            setContinuationResultUrl(null);
                            setError(null);
                            setContinuationError(null);
                            setEditHistory([dataUrl]); // Start history with the original frame
                            setContinuationBaseUrl(null); // Clear continuation section
                            setContinuationHistory([]);
                        }
                    }, 'image/png');
                }
                video.removeEventListener('seeked', onSeeked);
            };
            
            video.addEventListener('seeked', onSeeked, { once: true });
            video.currentTime = selectedFrame.timestamp;
        }
    }, [selectedFrame]);

    const performEdit = async (prompt: string, referenceImage: File | null) => {
        const baseImage = lastEditedImageFile || originalFrame;
        if (!baseImage) {
            setError("Primeiro, capture um frame do vídeo.");
            return;
        }

        setLoadingLocation('main');
        setIsLoading(true);
        setError(null);
        setContinuationError(null);

        try {
            const resultDataUrl = await editImage({ baseImage, prompt, referenceImage });
            setEditedImageUrl(resultDataUrl);
            const response = await fetch(resultDataUrl);
            const blob = await response.blob();
            const newFile = new File([blob], `edited-frame-${Date.now()}.png`, { type: 'image/png' });
            setLastEditedImageFile(newFile);
            setContinuationResultUrl(null);
            setContinuationPrompt('');
            setEditHistory(prev => [...prev, resultDataUrl]);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? `Falha na edição: ${err.message}` : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingLocation(null);
        }
    };
    
    const handleEdit = async (action: 'character' | 'blusa' | 'calca' | 'hair' | 'chat') => {
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

        await performEdit(prompt, referenceImage);
    };

    const handleContinuationBaseUpload = async (file: File | null) => {
        if (!file) return;

        try {
            const dataUrl = await storageService.fileToDataUrl(file);
            setContinuationBaseUrl(dataUrl);
            setContinuationBaseFile(file);
            setContinuationHistory([dataUrl]); // Start a new history for this uploaded image
            setContinuationResultUrl(null);
            setContinuationError(null);
            setError(null);
        } catch (error) {
            setContinuationError("Não foi possível carregar o arquivo de imagem.");
        }
    };

    const handleContinuationEdit = async () => {
        if (!continuationBaseFile) {
            setContinuationError("É necessário ter uma imagem base para continuar.");
            return;
        }
        if (!continuationPrompt) {
            setContinuationError("Por favor, escreva um comando para a continuação.");
            return;
        }
    
        const prompt = Prompts.SYSTEM_PERSONAGEM_GENERAL + Prompts.ACTION_CONTINUATION_EDIT(continuationPrompt);
    
        setLoadingLocation('continuation');
        setIsLoading(true);
        setContinuationError(null);
        setError(null);
        setContinuationResultUrl(null);
    
        try {
            const resultDataUrl = await editImage({ baseImage: continuationBaseFile, prompt, referenceImage: null });
            setContinuationResultUrl(resultDataUrl);
        } catch (err) {
            console.error(err);
            setContinuationError(err instanceof Error ? `Falha na continuação: ${err.message}` : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingLocation(null);
        }
    };
    
    const handleAcceptContinuation = async () => {
        if (!continuationResultUrl) return;

        const response = await fetch(continuationResultUrl);
        const blob = await response.blob();
        const newFile = new File([blob], `continuation-frame-${Date.now()}.png`, { type: 'image/png' });

        setContinuationBaseUrl(continuationResultUrl);
        setContinuationBaseFile(newFile);
        
        setContinuationResultUrl(null);
        setContinuationPrompt('');
        setError(null);
        setContinuationError(null);
        setContinuationHistory(prev => [...prev, continuationResultUrl]);
    };

    const handleRevertToVersion = async (index: number) => {
        if (index === editHistory.length - 1 || isLoading) return;

        const newHistory = editHistory.slice(0, index + 1);
        const targetImageUrl = newHistory[newHistory.length - 1];
        
        setEditedImageUrl(index === 0 ? null : targetImageUrl);

        const revertedFile = await storageService.dataUrlToFile(targetImageUrl, `reverted-frame-${Date.now()}.png`);
        setLastEditedImageFile(revertedFile);
        
        setEditHistory(newHistory);
        setContinuationResultUrl(null);
        setError(null);
        setContinuationError(null);
    };

    const handleRevertContinuationVersion = async (index: number) => {
        if (index === continuationHistory.length - 1 || isLoading) return;

        const newHistory = continuationHistory.slice(0, index + 1);
        const targetImageUrl = newHistory[newHistory.length - 1];

        const revertedFile = await storageService.dataUrlToFile(targetImageUrl, `reverted-continuation-${Date.now()}.png`);
        setContinuationBaseUrl(targetImageUrl);
        setContinuationBaseFile(revertedFile);

        setContinuationHistory(newHistory);
        setContinuationResultUrl(null);
        setContinuationError(null);
    };


    // --- Pinned Character Handlers ---
    const handlePinCharacter = () => {
        if (!characterRef) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            storageService.savePinnedCharacter(dataUrl);
            setPinnedCharDataUrl(dataUrl);
            setCharacterRef(null); // Clear temporary selection
        };
        reader.readAsDataURL(characterRef);
    };

    const handleRemovePinnedCharacter = () => {
        storageService.removePinnedCharacter();
        setPinnedCharDataUrl(null);
    };

    const handleEditWithPinnedCharacter = async () => {
        if (!pinnedCharDataUrl) return;
        const characterFile = await storageService.dataUrlToFile(pinnedCharDataUrl, 'pinned-character.png');
        const prompt = Prompts.SYSTEM_PERSONAGEM_GENERAL + Prompts.ACTION_SWAP_CHARACTER;
        await performEdit(prompt, characterFile);
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
            {/* Section 1: Frame Selection */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6">
                <h2 className="text-2xl font-bold text-slate-200 mb-4">1. Selecionar Frame</h2>
                
                <video ref={videoRef} src={videoSrc ?? undefined} className="hidden" crossOrigin="anonymous"></video>
                
                {isExtracting && <Loader message="Extraindo frames do vídeo..." />}
                
                {!isExtracting && thumbnails.length > 0 && (
                    <div className="w-full max-w-4xl mx-auto">
                        <div className="mb-4 bg-black rounded-lg shadow-md flex justify-center items-center aspect-[9/16] max-w-sm mx-auto border border-slate-700">
                           {selectedFrame ? (
                                <img src={selectedFrame.dataUrl} alt="Frame selecionado" className="max-h-full max-w-full object-contain rounded-lg" />
                           ) : (
                                <p className="text-slate-500">Selecione um frame abaixo</p>
                           )}
                        </div>

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

            {/* Section 2: Main Editing */}
            {originalFrameUrl && (
                 <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6 animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">2. Editar Personagem</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        <div className="lg:col-span-1 space-y-4">
                           <EditSection title="Trocar Personagem">
                                {pinnedCharDataUrl ? (
                                    <div className="space-y-3 text-center">
                                        <img src={pinnedCharDataUrl} alt="Personagem fixo" className="w-24 h-24 object-cover rounded-full mx-auto shadow-lg border-2 border-purple-500" />
                                        <p className="text-sm font-semibold text-slate-300">Personagem Fixo</p>
                                        <button onClick={handleEditWithPinnedCharacter} disabled={isLoading} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">
                                            Aplicar Personagem Fixo
                                        </button>
                                        <button onClick={handleRemovePinnedCharacter} className="text-xs text-red-400 hover:underline">
                                            Remover / Trocar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <FileInput id="char-ref" label="Referência do personagem" onChange={setCharacterRef} />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit('character')} disabled={isLoading || !characterRef} className="flex-1 w-full py-2 text-sm bg-slate-600 hover:bg-slate-700 rounded-md disabled:opacity-50">
                                                Aplicar (Só 1 vez)
                                            </button>
                                            <button onClick={handlePinCharacter} disabled={isLoading || !characterRef} className="flex-1 w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">
                                                Fixar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </EditSection>
                            <EditSection title="Editar Roupas">
                                <FileInput id="blusa-ref" label="Referência da blusa" onChange={setBlusaRef} />
                                <button onClick={() => handleEdit('blusa')} disabled={isLoading || !blusaRef} className="w-full py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Trocar Blusa</button>
                                <hr className="border-slate-700"/>
                                <FileInput id="calca-ref" label="Referência da calça" onChange={setCalcaRef} />
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
                                <h3 className="font-semibold text-lg text-center mb-2 text-slate-300">Resultado da Edição</h3>
                                <div className="relative">
                                    {isLoading && loadingLocation === 'main' && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg z-10"><Loader message="Editando..."/></div>}
                                    
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

                            {editHistory.length > 1 && (
                                <div className="sm:col-span-2 mt-4">
                                    <h4 className="font-semibold text-slate-300 mb-3">Histórico de Edições</h4>
                                    <div className="flex overflow-x-auto space-x-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 custom-scrollbar">
                                        {editHistory.map((dataUrl, index) => (
                                            <button
                                                key={`${index}-${dataUrl.slice(-10)}`}
                                                onClick={() => handleRevertToVersion(index)}
                                                disabled={isLoading}
                                                className={`relative flex-shrink-0 w-20 h-32 sm:w-24 sm:h-36 rounded-md overflow-hidden transition-all duration-200 focus:outline-none ring-offset-2 ring-offset-slate-900 group disabled:cursor-not-allowed
                                                    ${index === editHistory.length - 1 ? 'ring-2 ring-purple-500' : 'hover:ring-2 hover:ring-indigo-400 opacity-70 hover:opacity-100'}
                                                `}
                                                aria-label={`Reverter para a versão ${index + 1}`}
                                                title={`Reverter para a versão ${index + 1}`}
                                            >
                                                <img src={dataUrl} alt={`Versão ${index + 1}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-white">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                                    </svg>
                                                </div>
                                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                    {index === 0 ? 'O' : index}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
            
            {/* Section 3: Continuation Editing */}
            {continuationBaseUrl && (
                 <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-xl p-6 animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">3. Edição Continuada</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-slate-300 text-center">Base para Edição</h3>
                            <img src={continuationBaseUrl} alt="Base para edição continuada" className="w-full rounded-lg shadow-md bg-black aspect-[9/16] object-contain" />
                            <div className="mt-2">
                                <FileInput id="continuation-upload" label="Carregar nova base" onChange={handleContinuationBaseUpload} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-slate-300 text-center">Resultado da Continuação</h3>
                            <div className="relative">
                                {isLoading && loadingLocation === 'continuation' && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-lg z-10"><Loader message="Gerando..."/></div>}
                                
                                {continuationResultUrl ? (
                                    <div className="relative rounded-lg overflow-hidden transition-all duration-300 ring-2 ring-green-500/80 shadow-lg shadow-green-500/20">
                                        <img src={continuationResultUrl} alt="Resultado da continuação" className="w-full bg-black aspect-[9/16] object-contain" />
                                        <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">NOVO</span>
                                    </div>
                                ) : (
                                    <div className="w-full rounded-lg bg-black aspect-[9/16] flex items-center justify-center text-slate-500 text-sm p-4 border-2 border-dashed border-slate-700">O resultado da continuação aparecerá aqui.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {continuationHistory.length > 1 && (
                        <div className="sm:col-span-2 mb-6">
                            <h4 className="font-semibold text-slate-300 mb-3">Histórico da Continuação</h4>
                            <div className="flex overflow-x-auto space-x-2 p-2 bg-slate-900/50 rounded-lg border border-slate-700 custom-scrollbar">
                                {continuationHistory.map((dataUrl, index) => (
                                    <button
                                        key={`${index}-${dataUrl.slice(-10)}`}
                                        onClick={() => handleRevertContinuationVersion(index)}
                                        disabled={isLoading}
                                        className={`relative flex-shrink-0 w-20 h-32 sm:w-24 sm:h-36 rounded-md overflow-hidden transition-all duration-200 focus:outline-none ring-offset-2 ring-offset-slate-900 group disabled:cursor-not-allowed
                                            ${index === continuationHistory.length - 1 ? 'ring-2 ring-purple-500' : 'hover:ring-2 hover:ring-indigo-400 opacity-70 hover:opacity-100'}
                                        `}
                                        aria-label={`Reverter continuação para a versão ${index + 1}`}
                                        title={`Reverter continuação para a versão ${index + 1}`}
                                    >
                                        <img src={dataUrl} alt={`Versão da continuação ${index + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8 text-white">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                            </svg>
                                        </div>
                                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                     {continuationError && <p className="text-red-400 text-sm mt-2 text-center mb-4">{continuationError}</p>}

                    <div className="space-y-4 max-w-3xl mx-auto">
                        <div>
                           <label htmlFor="continuation-prompt" className="block text-sm font-medium text-slate-400 mb-2">Comando para a continuação:</label>
                           <textarea
                                id="continuation-prompt"
                                value={continuationPrompt}
                                onChange={e => setContinuationPrompt(e.target.value)}
                                placeholder="Ex: Agora, faça o personagem sorrir e olhar para a câmera."
                                rows={3}
                                className="w-full bg-slate-800 border border-slate-600 rounded-md text-sm p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleContinuationEdit}
                                disabled={isLoading || !continuationPrompt}
                                className="w-full px-6 py-2.5 bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-colors"
                            >
                                Gerar Nova Versão
                            </button>
                            {continuationResultUrl && (
                                <button
                                    onClick={handleAcceptContinuation}
                                    disabled={isLoading}
                                    className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-white transition-colors animate-pulse-slow"
                                >
                                    Aceitar e Usar como Base
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharacterEditorTab;
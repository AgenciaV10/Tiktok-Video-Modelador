import React, { useState, useCallback, useMemo } from 'react';
import type { Take } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface TakeDisplayProps {
  take: Take;
  color: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toFixed(0).padStart(2, '0');
  return `${mins}:${secs}`;
};

const TakeDisplay: React.FC<TakeDisplayProps> = ({ take, color }) => {
  const [promptCopied, setPromptCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(take.veo3_prompt_en).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }, [take.veo3_prompt_en]);

  const handleCopyJson = useCallback(() => {
    const jsonString = JSON.stringify(take, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
        setJsonCopied(true);
        setTimeout(() => setJsonCopied(false), 2000);
    });
  }, [take]);

  // Analisa o prompt para separar a parte da fala da descrição.
  const [speechPart, descriptionPart] = useMemo(() => {
    const prompt = take.veo3_prompt_en;
    // Regex para capturar a linha de fala inicial.
    const speechRegex = /^(“Video language: Portuguese \(Brazilian\)”\s*".*?")/s;
    const match = prompt.match(speechRegex);

    if (match && match[1]) {
      const speech = match[1];
      // Pega o resto da string, removendo espaços/quebras de linha no início.
      const description = prompt.substring(speech.length).trim();
      return [speech, description];
    }

    // Nenhuma parte de fala encontrada, retorna o prompt inteiro como descrição.
    return [null, prompt];
  }, [take.veo3_prompt_en]);


  return (
    <div 
        className="border-l-4 rounded-r-lg bg-slate-800/30 backdrop-blur-sm border-t border-b border-r border-slate-700/50 shadow-lg overflow-hidden transition-shadow hover:shadow-xl hover:border-slate-600/50" 
        style={{ borderColor: color }}
    >
      <div className="p-4 sm:p-5">
        <h3 className="text-xl sm:text-2xl font-bold" style={{ color }}>
          TAKE {take.take_id} 
          <span className="text-slate-400 font-medium text-lg ml-3">
            ({formatTime(take.timecode.start_s)} – {formatTime(take.timecode.end_s)})
          </span>
        </h3>
        
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-slate-300">Prompt VEO (EN, com falas em pt-BR)</h4>
              <button
                onClick={handleCopyPrompt}
                className="p-1.5 bg-slate-700/60 hover:bg-slate-600/60 rounded-md transition-colors text-slate-400"
                aria-label="Copiar Prompt do Take"
              >
                {promptCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/80 shadow-inner">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-mono">
                    {speechPart && (
                      <>
                        <span className="text-cyan-300 font-semibold">{speechPart}</span>
                        {'\n\n'}
                      </>
                    )}
                    {descriptionPart}
                </pre>
            </div>
          </div>
          
          <details className="bg-slate-900/40 rounded-lg group border border-slate-700/50">
            <summary className="cursor-pointer p-3 font-semibold text-slate-400 hover:text-slate-200 list-none flex justify-between items-center transition-colors">
              <div className="flex items-center gap-4">
                <span>Resumo em JSON</span>
                <button
                    onClick={(e) => {
                        e.preventDefault(); // Impede que o <details> seja aberto/fechado
                        handleCopyJson();
                    }}
                    className="p-1.5 bg-slate-700/60 hover:bg-slate-600/60 rounded-md transition-colors text-slate-400"
                    aria-label="Copiar JSON do Take"
                >
                    {jsonCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                </button>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-open:rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="p-3 border-t border-slate-700">
                <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words overflow-x-auto max-h-60 font-mono">
                    {JSON.stringify(take, null, 2)}
                </pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default TakeDisplay;
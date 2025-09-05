import React, { useState, useCallback } from 'react';
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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(take.veo3_prompt_en).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [take.veo3_prompt_en]);

  return (
    <div 
        className="border-l-4 rounded-r-lg bg-gray-800/50 shadow-lg overflow-hidden" 
        style={{ borderColor: color }}
    >
      <div className="p-4 sm:p-5">
        <h3 className="text-xl sm:text-2xl font-bold" style={{ color }}>
          TAKE {take.take_id} — {formatTime(take.timecode.start_s)}–{formatTime(take.timecode.end_s)} ({take.timecode.duration_s.toFixed(1)}s)
        </h3>
        
        <div className="mt-4 space-y-4">
          <details className="bg-gray-900/40 rounded-lg">
            <summary className="cursor-pointer p-3 font-semibold text-gray-300 hover:bg-gray-700/50 rounded-t-lg">
              Resumo em JSON
            </summary>
            <div className="p-3 border-t border-gray-700">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(take, null, 2)}
                </pre>
            </div>
          </details>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-300">Prompt Veo3 (EN, com falas em pt-BR):</h4>
              <button
                onClick={handleCopy}
                className="p-1.5 bg-gray-700/60 hover:bg-gray-600/60 rounded-md transition-colors text-gray-400"
                aria-label="Copiar Prompt do Take"
              >
                {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {take.veo3_prompt_en}
                </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeDisplay;
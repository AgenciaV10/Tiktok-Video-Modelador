import React, { useState, useCallback } from 'react';
import type { Take } from '../types';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface MasterPromptProps {
  takes: Take[];
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toFixed(0).padStart(2, '0');
  return `${mins}:${secs}`;
};

const MasterPrompt: React.FC<MasterPromptProps> = ({ takes }) => {
  const [copied, setCopied] = useState(false);

  const combinedPrompt = takes.map(take => 
    `[TAKE ${take.take_id} ${formatTime(take.timecode.start_s)}–${formatTime(take.timecode.end_s)}]\n${take.veo3_prompt_en}`
  ).join('\n\n');

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(combinedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [combinedPrompt]);

  return (
    <div>
       <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 mb-6 pb-3 border-b-2 border-slate-800">
        Master Prompt (Combinado)
      </h2>
      <div className="relative bg-slate-900/70 p-4 rounded-lg border border-slate-700 shadow-inner">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-slate-300 z-10"
          aria-label="Copiar Master Prompt"
        >
          {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
        </button>
        <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words overflow-x-auto font-mono pr-12 max-h-[500px] overflow-y-auto">
          {combinedPrompt}
        </pre>
      </div>
    </div>
  );
};

export default MasterPrompt;
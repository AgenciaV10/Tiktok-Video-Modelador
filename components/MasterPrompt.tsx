
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
      <h2 className="text-3xl font-bold mb-4 text-gray-200 border-b-2 border-gray-700 pb-2">
        Master Prompt (Combinado)
      </h2>
      <div className="relative bg-gray-900 p-4 rounded-lg border border-gray-700">
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-gray-300"
          aria-label="Copiar Master Prompt"
        >
          {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
        </button>
        <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto font-mono">
          {combinedPrompt}
        </pre>
      </div>
    </div>
  );
};

export default MasterPrompt;

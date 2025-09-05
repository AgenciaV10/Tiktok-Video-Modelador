
import React from 'react';
import type { Take } from '../types';

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
            <h4 className="font-semibold text-gray-300 mb-2">Prompt Veo3 (EN, com falas em pt-BR):</h4>
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

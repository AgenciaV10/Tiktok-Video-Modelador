
import React from 'react';
import type { MachineReadableOutput } from '../types';
import TakeDisplay from './TakeDisplay';
import MasterPrompt from './MasterPrompt';
import { TAKE_COLORS } from '../constants';

interface AnalysisResultsProps {
  result: MachineReadableOutput;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-4 text-gray-200 border-b-2 border-gray-700 pb-2">
          Análise dos Takes
        </h2>
        <div className="space-y-6">
          {result.takes.map((take, index) => (
            <TakeDisplay 
              key={take.take_id} 
              take={take} 
              color={TAKE_COLORS[index % TAKE_COLORS.length]} 
            />
          ))}
        </div>
      </div>
      
      <MasterPrompt takes={result.takes} />

      <div>
        <h2 className="text-3xl font-bold mb-4 text-gray-200 border-b-2 border-gray-700 pb-2">
          JSON Completo
        </h2>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
           <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
             {JSON.stringify(result, null, 2)}
           </pre>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;

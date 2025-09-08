import React from 'react';
import type { MachineReadableOutput } from '../types';
import TakeDisplay from './TakeDisplay';
import MasterPrompt from './MasterPrompt';
import { TAKE_COLORS } from '../constants';

interface AnalysisResultsProps {
  result: MachineReadableOutput;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 mb-6 pb-3 border-b-2 border-slate-800">
    {children}
  </h2>
);


const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  return (
    <div className="space-y-16">
      <div>
        <SectionTitle>Análise dos Takes</SectionTitle>
        <div className="space-y-8">
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
        <SectionTitle>JSON Completo</SectionTitle>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 max-h-[400px] overflow-y-auto shadow-inner">
           <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words overflow-x-auto font-mono">
             {JSON.stringify(result, null, 2)}
           </pre>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
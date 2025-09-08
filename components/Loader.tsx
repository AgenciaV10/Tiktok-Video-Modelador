import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 bg-slate-800/50 rounded-lg backdrop-blur-sm border border-slate-700/50">
      <div className="w-12 h-12 border-4 border-t-indigo-400 border-r-indigo-400 border-b-indigo-400/30 border-l-indigo-400/30 border-slate-600 rounded-full animate-spin"></div>
      <p className="text-lg text-slate-300 text-center">{message}</p>
    </div>
  );
};

export default Loader;
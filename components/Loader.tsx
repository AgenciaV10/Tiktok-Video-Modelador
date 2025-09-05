
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-gray-800/50 rounded-lg">
      <div className="w-12 h-12 border-4 border-t-indigo-400 border-gray-600 rounded-full animate-spin"></div>
      <p className="text-lg text-gray-300 text-center">{message}</p>
    </div>
  );
};

export default Loader;

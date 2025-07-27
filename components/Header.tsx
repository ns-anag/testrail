import React from 'react';
import { BotIcon, CogIcon } from './icons';

interface HeaderProps {
  onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSettings }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
      <div className="flex items-center">
        <BotIcon className="w-8 h-8 text-cyan-400 mr-3" />
        <h1 className="text-xl font-bold text-gray-100 tracking-wider">
          TestRail Agent
        </h1>
      </div>
      <button 
        onClick={onToggleSettings} 
        className="text-gray-400 hover:text-white transition-colors"
        aria-label="Toggle settings"
      >
        <CogIcon className="w-6 h-6" />
      </button>
    </header>
  );
};

export default Header;
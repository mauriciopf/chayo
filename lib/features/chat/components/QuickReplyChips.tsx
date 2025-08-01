import React, { useState, useRef, useEffect } from 'react';
import { ChatContextType } from '../services/chatContextMessages';

type ChatMode = 'business' | 'client'

interface QuickReplyChipsProps {
  context: ChatContextType;
  onSelect: (context: ChatContextType) => void;
  chatMode?: ChatMode;
  onModeSwitch?: (mode: ChatMode) => void;
}

const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ 
  context, 
  onSelect, 
  chatMode = 'business', 
  onModeSwitch 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const modeItems = [
    { key: 'business', label: 'Business Mode', icon: '⚙️', description: 'Configure your business and chat settings' },
    { key: 'client', label: 'Client Mode', icon: '👥', description: 'Preview how clients will see the chat' },
  ];

  const handleModeSelect = (mode: ChatMode) => {
    if (onModeSwitch) {
      onModeSwitch(mode);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Mode Switcher Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
          chatMode === 'business' 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        <span className="text-lg">{chatMode === 'business' ? '⚙️' : '👥'}</span>
        <span className="hidden md:inline">
          {chatMode === 'business' ? 'Business Mode' : 'Client Mode'}
        </span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && onModeSwitch && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50 overflow-hidden">
          <div className="py-2">
            <div className="px-4 py-2 text-xs text-gray-400 font-medium uppercase tracking-wide border-b border-gray-700">
              Switch Chat Mode
            </div>
            {modeItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleModeSelect(item.key as ChatMode)}
                className={`w-full px-4 py-3 text-left transition-all duration-150 flex items-start gap-3 text-sm border-b border-gray-700 last:border-b-0 ${
                  chatMode === item.key
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-100 hover:text-white hover:bg-gray-700'
                }`}
              >
                <span className="text-lg opacity-80 mt-0.5">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.label}</span>
                    {chatMode === item.key && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Back to Business Setup Button (when in other contexts) - only show in business mode */}
      {chatMode === 'business' && context !== 'business_setup' && (
        <button
          onClick={() => onSelect('business_setup')}
          className="ml-2 px-3 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium transition-colors duration-200"
        >
          Continue business setup
        </button>
      )}
    </div>
  );
};

export default QuickReplyChips; 
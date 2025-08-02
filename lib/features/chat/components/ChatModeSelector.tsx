import React, { useState, useRef, useEffect } from 'react';
import { ChatContextType } from '../services/chatContextMessages';

type ChatMode = 'business' | 'client'

interface ChatModeSelectorProps {
  context: ChatContextType;
  onSelect: (context: ChatContextType) => void;
  chatMode?: ChatMode;
  onModeSwitch?: (mode: ChatMode) => void;
}

const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({ 
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
        className={`px-3 py-1.5 rounded-md text-white text-xs font-medium transition-colors duration-150 flex items-center gap-1.5 ${
          chatMode === 'business' 
            ? 'bg-gray-700 hover:bg-gray-600' 
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <span className="text-sm">{chatMode === 'business' ? '⚙️' : '👥'}</span>
        <span className="text-xs">
          {chatMode === 'business' ? 'Business' : 'Client'}
        </span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && onModeSwitch && (
        <div 
          className="absolute left-0 w-56 bg-gray-800 rounded-md shadow-lg border border-gray-600 overflow-hidden z-[999999]"
          style={{
            bottom: '100%',
            marginBottom: '6px'
          }}
        >
          {modeItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleModeSelect(item.key as ChatMode)}
              className={`w-full px-3 py-2 text-left transition-colors duration-100 flex items-start gap-2 text-sm ${
                chatMode === item.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:bg-gray-700'
              }`}
            >
              <span className="text-xs mt-0.5">{item.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-xs">{item.label}</div>
                <div className={`text-xs mt-0.5 ${chatMode === item.key ? 'text-white/80' : 'text-gray-400'}`}>
                  {item.description}
                </div>
              </div>
              {chatMode === item.key && (
                <div className="ml-auto mt-1 w-1 h-1 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Back to Business Setup Button (when in other contexts) - only show in business mode */}
      {chatMode === 'business' && context !== 'business_setup' && (
        <button
          onClick={() => onSelect('business_setup')}
          className="ml-3 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Continue business setup
        </button>
      )}
    </div>
  );
};

export default ChatModeSelector; 
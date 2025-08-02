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
        className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${
          chatMode === 'business' 
            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400' 
            : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400'
        } focus:outline-none`}
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
        <div 
          className="absolute left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-[999999]"
          style={{
            bottom: '100%',
            marginBottom: '8px'
          }}
        >
          {modeItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleModeSelect(item.key as ChatMode)}
              className={`w-full px-3 py-2.5 text-left transition-colors duration-150 flex items-center gap-2.5 text-sm border-b border-gray-100 last:border-b-0 ${
                chatMode === item.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {chatMode === item.key && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
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
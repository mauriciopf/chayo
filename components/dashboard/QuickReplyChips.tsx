import React, { useState, useRef, useEffect } from 'react';
import { ChatContextType } from './chatContextMessages';

interface QuickReplyChipsProps {
  context: ChatContextType;
  onSelect: (context: ChatContextType) => void;
}

const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ context, onSelect }) => {
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

  const menuItems = [
    { key: 'whatsapp_setup', label: 'Connect WhatsApp', icon: '💬' },
    { key: 'calendar_setup', label: 'Add Calendar Booking', icon: '📅' },
    { key: 'video_agent_setup', label: 'Launch Video Agent', icon: '🎥' },
  ];

  const handleMenuSelect = (contextKey: ChatContextType) => {
    onSelect(contextKey);
    setIsMenuOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Tools Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="hidden md:inline">Tools</span>
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-600 z-50 overflow-hidden">
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={item.key}
                onClick={() => handleMenuSelect(item.key as ChatContextType)}
                className="w-full px-4 py-3 text-left text-gray-100 hover:text-white hover:bg-gray-700 transition-all duration-150 flex items-center gap-3 text-sm border-b border-gray-700 last:border-b-0"
              >
                <span className="text-lg opacity-80">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Back to Business Setup Button (when in other contexts) */}
      {context !== 'business_setup' && (
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
import React from 'react';
import { ChatContextType } from './chatContextMessages';

interface QuickReplyChipsProps {
  context: ChatContextType;
  onSelect: (context: ChatContextType) => void;
}

const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ context, onSelect }) => {
  if (context === 'business_setup') {
    return (
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <button className="px-4 py-2 rounded-full bg-gray-200 hover:bg-green-200 whitespace-nowrap font-medium transition" onClick={() => onSelect('whatsapp_setup')}>Connect WhatsApp</button>
        <button className="px-4 py-2 rounded-full bg-gray-200 hover:bg-green-200 whitespace-nowrap font-medium transition" onClick={() => onSelect('calendar_setup')}>Add Calendar Booking</button>
        <button className="px-4 py-2 rounded-full bg-gray-200 hover:bg-green-200 whitespace-nowrap font-medium transition" onClick={() => onSelect('video_agent_setup')}>Launch Video Agent</button>
      </div>
    );
  }
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      <button className="px-4 py-2 rounded-full bg-blue-200 hover:bg-blue-300 whitespace-nowrap font-medium transition" onClick={() => onSelect('business_setup')}>Continue business setup</button>
    </div>
  );
};

export default QuickReplyChips; 
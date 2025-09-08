'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MessageCircle, Calendar, CreditCard, FileText, HelpCircle, Smartphone } from 'lucide-react';
import { ThemeConfig } from '@/lib/shared/types/configTypes';

interface MobilePreviewProps {
  config: ThemeConfig;
}

export function MobilePreview({ config }: MobilePreviewProps) {
  const t = useTranslations('mobile-branding.preview');

  const iconComponents = {
    'message-circle': MessageCircle,
    'calendar': Calendar,
    'credit-card': CreditCard,
    'file-text': FileText,
    'help-circle': HelpCircle,
    'smartphone': Smartphone,
  };

  const sampleTabs = [
    { name: 'Chat', icon: 'message-circle', active: true },
    { name: 'Book', icon: 'calendar', active: false },
    { name: 'Pay', icon: 'credit-card', active: false },
    { name: 'Forms', icon: 'file-text', active: false },
    { name: 'Help', icon: 'help-circle', active: false },
  ];

  const sampleMessages = [
    { type: 'received', text: t('sampleMessages.welcome'), time: '10:30 AM' },
    { type: 'sent', text: t('sampleMessages.userQuestion'), time: '10:31 AM' },
    { type: 'received', text: t('sampleMessages.response'), time: '10:32 AM' },
  ];

  return (
    <div className="rounded-xl border p-6" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('title')}
        </h3>
      </div>

      {/* Mobile Phone Frame */}
      <div className="mx-auto max-w-sm">
        <div className="relative bg-black rounded-[2.5rem] p-2">
          {/* Phone Screen */}
          <div 
            className="rounded-[2rem] overflow-hidden"
            style={{ backgroundColor: config.backgroundColor }}
          >
            {/* Status Bar */}
            <div className="h-6 bg-black flex items-center justify-between px-6 text-white text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 border border-white rounded-sm">
                  <div className="w-3 h-1 rounded-sm" style={{ backgroundColor: 'var(--text-primary)' }}></div>
                </div>
              </div>
            </div>

            {/* App Header */}
            <div 
              className="px-4 py-3 flex items-center justify-center border-b border-gray-200"
              style={{ backgroundColor: config.primaryColor }}
            >
              {config.logoUrl ? (
                <img 
                  src={config.logoUrl} 
                  alt="Logo" 
                  className="h-8 w-auto max-w-24 object-contain"
                />
              ) : (
                <div 
                  className="text-lg font-bold"
                  style={{ color: config.backgroundColor }}
                >
                  Chayo
                </div>
              )}
            </div>

            {/* Chat Content */}
            <div className="h-80 flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-hidden">
                {sampleMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                        message.type === 'sent'
                          ? 'rounded-br-md'
                          : 'rounded-bl-md'
                      }`}
                      style={{
                        backgroundColor: message.type === 'sent' 
                          ? config.primaryColor 
                          : '#F1F5F9',
                        color: message.type === 'sent' 
                          ? config.backgroundColor 
                          : config.textColor,
                      }}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="flex-1 px-3 py-2 rounded-full border text-sm"
                    style={{ 
                      borderColor: config.primaryColor + '40',
                      color: config.textColor + '80'
                    }}
                  >
                    {t('inputPlaceholder')}
                  </div>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <div 
                      className="w-0 h-0 border-l-[6px] border-r-0 border-b-[3px] border-t-[3px] border-l-current border-b-transparent border-t-transparent ml-0.5"
                      style={{ color: config.backgroundColor }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tab Bar */}
            <div 
              className="flex items-center justify-around py-2 border-t border-gray-200"
              style={{ backgroundColor: config.secondaryColor }}
            >
              {sampleTabs.map((tab, index) => {
                const IconComponent = iconComponents[tab.icon as keyof typeof iconComponents];
                return (
                  <motion.div
                    key={tab.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex flex-col items-center py-1"
                  >
                    <IconComponent 
                      className={`h-5 w-5 mb-1 ${
                        tab.active ? 'opacity-100' : 'opacity-60'
                      }`}
                      style={{ color: config.backgroundColor }}
                    />
                    <span 
                      className={`text-xs ${
                        tab.active ? 'opacity-100' : 'opacity-60'
                      }`}
                      style={{ color: config.backgroundColor }}
                    >
                      {tab.name}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Home Indicator */}
            <div className="h-5 flex items-center justify-center">
              <div className="w-32 h-1 bg-black rounded-full opacity-30"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t('description')}
        </p>
      </div>
    </div>
  );
}
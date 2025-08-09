'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import BusinessChatView from './BusinessChatView'
import ClientChatView from './ClientChatView'
import { Message, AuthState, Agent, Organization } from '../../../shared/types'

type ChatMode = 'business' | 'client'

interface ChatContainerProps {
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  chatLoading: boolean;
  chatError: string | null;
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  sendMessage: (messageContent: string) => Promise<void>;
  handleInputFocus: () => void;
  handleOTPFlow: () => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  chatScrollContainerRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadProgress: number | null;
  user: any;
  authState: AuthState;
  otpLoading: string;
  hasUserInteracted: boolean;
  setHasUserInteracted: (interacted: boolean) => void;
  isMobile: boolean;
  organizationId?: string;
  unlockQRCode?: () => void;
  onNavigateToQR?: () => void;
  refreshOnboardingProgress?: () => void;
  // Additional props for client mode
  agent?: Agent;
  organization?: Organization | null;
  locale?: string;
  // Mode switching prop
  chatMode?: ChatMode;
  onModeSwitch?: (mode: ChatMode) => void;
  currentPhase?: string | null;
}

export default function ChatContainer({
  messages,
  setMessages,
  chatLoading,
  chatError,
  input,
  setInput,
  handleSend,
  sendMessage,
  handleInputFocus,
  handleOTPFlow,
  messagesEndRef,
  inputRef,
  chatScrollContainerRef,
  fileInputRef,
  handleFileChange,
  uploading,
  uploadProgress,
  user,
  authState,
  otpLoading,
  hasUserInteracted,
  setHasUserInteracted,
  isMobile,
  organizationId,
  unlockQRCode,
  onNavigateToQR,
  refreshOnboardingProgress,
  agent,
  organization,
  locale = 'en',
  chatMode: propChatMode,
  onModeSwitch
  , currentPhase
}: ChatContainerProps) {
  // Chat mode state - default to business mode, but allow override via props
  const [internalChatMode, setInternalChatMode] = useState<ChatMode>('business')
  const chatMode = propChatMode || internalChatMode

  // Handler for mode switching
  const handleModeSwitch = (mode: ChatMode) => {
    if (onModeSwitch) {
      onModeSwitch(mode)
    } else {
      setInternalChatMode(mode)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col w-full md:rounded-2xl md:border md:border-gray-200 md:shadow-lg bg-white/80 flex-1"
      style={{
        height: isMobile ? 'calc(100dvh - 60px - 3rem)' : 'calc(100vh - 2rem - 3rem)', // Account for mobile header, desktop padding, and beta banner
        maxHeight: isMobile ? 'calc(100dvh - 60px - 3rem)' : 'calc(100vh - 2rem - 3rem)',
        position: 'relative',
        overflow: 'hidden' // Prevent any overflow issues
      }}
    >
      {chatMode === 'business' ? (
        <BusinessChatView
          messages={messages}
          setMessages={setMessages}
          chatLoading={chatLoading}
          chatError={chatError}
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          sendMessage={sendMessage}
          handleInputFocus={handleInputFocus}
          handleOTPFlow={handleOTPFlow}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
          chatScrollContainerRef={chatScrollContainerRef}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          uploading={uploading}
          uploadProgress={uploadProgress}
          user={user}
          authState={authState}
          otpLoading={otpLoading}
          hasUserInteracted={hasUserInteracted}
          setHasUserInteracted={setHasUserInteracted}
          isMobile={isMobile}
          organizationId={organizationId}
          unlockQRCode={unlockQRCode}
          onNavigateToQR={onNavigateToQR}
          refreshOnboardingProgress={refreshOnboardingProgress}
          onModeSwitch={handleModeSwitch}
          currentPhase={currentPhase}
        />
      ) : (
        // Client mode - requires agent and organization props
        agent && organization ? (
          <ClientChatView
            agent={agent}
            organization={organization}
            locale={locale}
            className="h-full"
            onModeSwitch={handleModeSwitch}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
            <div className="text-center max-w-md">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m0 0H7a2 2 0 01-2-2V10a2 2 0 012-2h2m8 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m8 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Mode Setup Required</h3>
              <p className="text-sm text-gray-600 mb-4">
                {!organization 
                  ? "To use client mode, please set up your business first. This creates your organization and AI agent that clients can interact with."
                  : "Your business is set up, but your AI agent is still being created. Please complete your business onboarding to activate client mode."
                }
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleModeSwitch('business')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {!organization ? "Start Business Setup" : "Continue Business Setup"}
                </button>
                {organization && (
                  <p className="text-xs text-gray-500 mt-2">
                    Once you complete the onboarding questions, your AI agent will be automatically created and ready for client interactions.
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </motion.div>
  )
}
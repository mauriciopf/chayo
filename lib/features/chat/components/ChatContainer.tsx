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
  // Additional props for client mode
  agent?: Agent;
  organization?: Organization | null;
  locale?: string;
  // Mode switching prop
  chatMode?: ChatMode;
  onModeSwitch?: (mode: ChatMode) => void;
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
  agent,
  organization,
  locale = 'en',
  chatMode: propChatMode,
  onModeSwitch
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
          onModeSwitch={handleModeSwitch}
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
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Client mode requires agent and organization data</p>
          </div>
        )
      )}
    </motion.div>
  )
}
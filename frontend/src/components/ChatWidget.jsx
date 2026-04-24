import React, { useState, useCallback } from 'react';
import ChatToggleButton from './ChatToggleButton';
import ChatWindow from './ChatWindow';
import { useChatSession } from '../hooks/useChatSession';
import '../styles/chatbot.css';

/**
 * ChatWidget — root orchestrator
 * Drop this anywhere in your React app.
 *
 * Usage:
 *   import ChatWidget from './components/ChatWidget';
 *   <ChatWidget />
 */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const {
    messages, quickReplies, isLoading,
    hasNotification, sendMessage, clearNotification,
  } = useChatSession();

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    clearNotification();
  }, [clearNotification]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleToggle = useCallback(() => {
    if (isOpen) handleClose(); else handleOpen();
  }, [isOpen, handleOpen, handleClose]);

  const handleSend = useCallback((text, isQuickReply = false) => {
    if (!text?.trim()) return;
    sendMessage(text, isQuickReply, isOpen);
    if (!isQuickReply) setInputValue('');
  }, [sendMessage, isOpen]);

  return (
    <div className="sz-root" aria-label="Customer support widget">
      {isOpen && (
        <ChatWindow
          messages={messages}
          quickReplies={quickReplies}
          isLoading={isLoading}
          onClose={handleClose}
          onSend={handleSend}
          inputValue={inputValue}
          onInputChange={setInputValue}
        />
      )}
      <ChatToggleButton
        isOpen={isOpen}
        hasNotification={hasNotification}
        onClick={handleToggle}
      />
    </div>
  );
}

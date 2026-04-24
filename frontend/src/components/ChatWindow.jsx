import React from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import QuickReplies from './QuickReplies';
import InputBar from './InputBar';
import { useAutoScroll } from '../hooks/useAutoScroll';

export default function ChatWindow({ messages, quickReplies, isLoading, onClose, onSend, inputValue, onInputChange }) {
  const scrollRef = useAutoScroll([messages.length, isLoading]);

  return (
    <div className="sz-window" role="dialog" aria-modal="true" aria-label="Simzzy Customer Support">
      <ChatHeader onClose={onClose} />

      {/* Messages area */}
      <div
        ref={scrollRef}
        id="sz-messages"
        className="sz-messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Quick replies */}
      <QuickReplies
        replies={quickReplies}
        onSelect={(reply) => onSend(reply, true)}
        disabled={isLoading}
      />

      {/* Input */}
      <InputBar
        value={inputValue}
        onChange={onInputChange}
        onSend={() => onSend(inputValue, false)}
        disabled={isLoading}
      />

      <footer className="sz-footer">
        Powered by <span>Simzzy</span> · eSIM Support
      </footer>
    </div>
  );
}

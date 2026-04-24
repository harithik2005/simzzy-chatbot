import React from 'react';
import { BotIcon } from './ChatHeader';

/**
 * Parses a subset of markdown for display:
 * - **bold**
 * - Numbered lists (1. 2. 3.)
 * - Bullet lists (- or •)
 * - Line breaks
 * - `inline code`
 */
function parseContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let numGroup = [];
  let key = 0;

  const renderInline = (str) => {
    // Split by **bold** and `code`
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i}>{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith('`') && p.endsWith('`')) {
        return <code key={i} className="sz-inline-code">{p.slice(1, -1)}</code>;
      }
      return p;
    });
  };

  const flushNumGroup = () => {
    if (!numGroup.length) return;
    numGroup.forEach(item => {
      elements.push(
        <div key={key++} className="sz-step-item">
          <span className="sz-step-num">{item.n}</span>
          <span>{renderInline(item.text)}</span>
        </div>
      );
    });
    numGroup = [];
  };

  lines.forEach((line, i) => {
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    const bulletMatch = line.match(/^[-•]\s+(.+)/);

    if (!line.trim()) {
      flushNumGroup();
      elements.push(<div key={key++} style={{ height: 5 }} />);
    } else if (numMatch) {
      numGroup.push({ n: numMatch[1], text: numMatch[2] });
    } else if (bulletMatch) {
      flushNumGroup();
      elements.push(
        <div key={key++} className="sz-bullet-item">
          <span className="sz-bullet-dot" aria-hidden="true">•</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </div>
      );
    } else {
      flushNumGroup();
      elements.push(<div key={key++}>{renderInline(line)}</div>);
    }
  });

  flushNumGroup();
  return elements;
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message }) {
  const { role, content, timestamp } = message;
  const isBot = role === 'assistant';

  return (
    <div className={`sz-msg-row ${isBot ? 'sz-msg-bot' : 'sz-msg-user'}`}>
      {isBot && (
        <div className="sz-bot-icon" aria-hidden="true">
          <BotIcon size={13} />
        </div>
      )}

      <div className="sz-bubble-wrapper">
        <div className={`sz-bubble ${isBot ? 'sz-bubble-bot' : 'sz-bubble-user'}`}>
          {parseContent(content)}
        </div>
        {timestamp && (
          <span className={`sz-msg-time ${isBot ? '' : 'sz-msg-time-user'}`}>
            {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

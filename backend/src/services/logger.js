/**
 * Conversation Logger
 * Logs all chat interactions for analytics and debugging.
 * In production, write to PostgreSQL and/or a structured log service.
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'conversations.jsonl');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log a conversation turn
 * @param {object} entry
 */
function logConversation(entry) {
  const record = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  // Append to JSONL file (one JSON object per line)
  fs.appendFile(LOG_FILE, JSON.stringify(record) + '\n', (err) => {
    if (err) console.error('[Logger] Failed to write log:', err.message);
  });

  // Also write to stdout for container log aggregation
  console.log('[CHAT_LOG]', JSON.stringify(record));
}

/**
 * Log an error event
 * @param {string} context
 * @param {Error} error
 */
function logError(context, error) {
  const record = {
    type: 'ERROR',
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    stack: error.stack
  };
  console.error('[ERROR_LOG]', JSON.stringify(record));
}

module.exports = { logConversation, logError };

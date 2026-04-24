/**
 * Session Manager
 * Tracks conversation state, flow progress, and message history in-memory.
 * For production, swap the in-memory store with Redis or PostgreSQL.
 */

const sessions = new Map();

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get or create a session
 * @param {string} sessionId
 * @returns {object} session
 */
function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, createSession(sessionId));
  }
  const session = sessions.get(sessionId);
  session.lastActivity = Date.now();
  return session;
}

/**
 * Create a fresh session
 */
function createSession(sessionId) {
  return {
    id: sessionId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messages: [], // [{ role: 'user'|'assistant', content: string, timestamp }]
    context: {
      currentFlow: null,      // e.g., 'NO_CONNECTION'
      flowStep: null,         // e.g., 'check_roaming'
      userSIMType: null,      // 'esim' | 'physical'
      detectedIntent: null,
      awaitingInput: false,
      resolvedIssues: [],
    }
  };
}

/**
 * Update session context (partial update)
 * @param {string} sessionId
 * @param {object} updates
 */
function updateContext(sessionId, updates) {
  const session = getSession(sessionId);
  Object.assign(session.context, updates);
  sessions.set(sessionId, session);
}

/**
 * Add a message to session history
 * @param {string} sessionId
 * @param {'user'|'assistant'} role
 * @param {string} content
 */
function addMessage(sessionId, role, content) {
  const session = getSession(sessionId);
  session.messages.push({ role, content, timestamp: Date.now() });
  // Keep last 20 messages for context window management
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
  sessions.set(sessionId, session);
}

/**
 * Get last N messages formatted for AI
 * @param {string} sessionId
 * @param {number} n
 * @returns {Array<{role: string, content: string}>}
 */
function getMessageHistory(sessionId, n = 10) {
  const session = getSession(sessionId);
  return session.messages.slice(-n).map(({ role, content }) => ({ role, content }));
}

/**
 * Reset flow state (e.g., when starting a new troubleshooting topic)
 * @param {string} sessionId
 */
function resetFlow(sessionId) {
  updateContext(sessionId, {
    currentFlow: null,
    flowStep: null,
    awaitingInput: false
  });
}

/**
 * Destroy a session
 * @param {string} sessionId
 */
function destroySession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * Cleanup expired sessions (run periodically)
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredSessions, 10 * 60 * 1000);

module.exports = {
  getSession,
  updateContext,
  addMessage,
  getMessageHistory,
  resetFlow,
  destroySession
};

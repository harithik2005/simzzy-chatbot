/**
 * Intent Detection Service
 * Uses keyword matching + optional AI classification to detect user intent.
 */

const intentsData = require('../intents/intents.json');

// Build keyword → intent map at startup
const intentKeywordMap = buildKeywordMap();

function buildKeywordMap() {
  const map = {};
  for (const intent of intentsData.intents) {
    for (const example of (intent.examples || [])) {
      const keywords = example.toLowerCase().split(/\s+/);
      for (const kw of keywords) {
        if (kw.length > 2) {
          if (!map[kw]) map[kw] = {};
          map[kw][intent.id] = (map[kw][intent.id] || 0) + 1;
        }
      }
    }
  }
  return map;
}

/**
 * Detect intent from user message using keyword scoring.
 * Falls back to 'UNKNOWN' if no clear match.
 * @param {string} message
 * @returns {{ intent: string, confidence: number, isHardOverride: boolean }}
 */
function detectIntent(message) {
  const lower = message.toLowerCase();

  // Hard override rules — checked first, before anything else
  const refundKeywords = ['refund', 'money back', 'cancel', 'wrong purchase', 'payment back', 'chargeback'];
  if (refundKeywords.some(kw => lower.includes(kw))) {
    return { intent: 'REFUND_REQUEST', confidence: 1.0, isHardOverride: true };
  }

  // Out-of-scope detection
  const outOfScopePatterns = [
    /tell me a joke/i, /weather/i, /who are you/i, /what is your name/i,
    /what is gpt/i, /what is claude/i, /chatgpt/i, /ai assistant/i
  ];
  if (outOfScopePatterns.some(p => p.test(message))) {
    return { intent: 'OUT_OF_SCOPE', confidence: 0.9, isHardOverride: false };
  }

  // Keyword scoring
  const words = lower.split(/\s+/);
  const scores = {};

  for (const word of words) {
    const stemmed = word.replace(/ing$|ed$|s$/, '');
    for (const kw of [word, stemmed]) {
      if (intentKeywordMap[kw]) {
        for (const [intentId, weight] of Object.entries(intentKeywordMap[kw])) {
          scores[intentId] = (scores[intentId] || 0) + weight;
        }
      }
    }
  }

  if (Object.keys(scores).length === 0) {
    return { intent: 'UNKNOWN', confidence: 0, isHardOverride: false };
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topIntent, topScore] = sorted[0];
  const maxPossibleScore = words.length * 3;
  const confidence = Math.min(topScore / maxPossibleScore, 1.0);

  return {
    intent: topIntent,
    confidence,
    isHardOverride: false
  };
}

/**
 * Get intent metadata by ID
 * @param {string} intentId
 * @returns {object|null}
 */
function getIntentById(intentId) {
  return intentsData.intents.find(i => i.id === intentId) || null;
}

/**
 * Get all intents (for admin/analytics)
 */
function getAllIntents() {
  return intentsData.intents;
}

module.exports = { detectIntent, getIntentById, getAllIntents };

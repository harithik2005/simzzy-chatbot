/**
 * Chat Route Handler
 * POST /api/chat
 *
 * Orchestrates: intent detection → flow engine → AI response generation → logging
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');

const { detectIntent } = require('../services/intentDetector');
const { getFlowForIntent, advanceFlow, startFlow, getFlowStep } = require('../services/flowEngine');
const { buildSystemPrompt } = require('../services/promptBuilder');
const {
  getSession,
  updateContext,
  addMessage,
  getMessageHistory,
  resetFlow
} = require('../services/sessionManager');
const { logConversation } = require('../services/logger');
const knowledgeBase = require('../knowledge/knowledgeBase.json');

const client = new Anthropic(); // Uses ANTHROPIC_API_KEY env var

// Hard override responses — not negotiable
const HARD_OVERRIDES = {
  REFUND_REQUEST: `For refund-related requests, please email us at support@simzzy.com. Our team will assist you further.`,
  OUT_OF_SCOPE: `I'm specialized in supporting the Simzzy eSIM platform only. I'm not able to help with that query — but I'm ready to assist with any eSIM-related questions!`,
  UNKNOWN: `I'm not sure I understood that. Could you please describe your issue in more detail? For example:\n- "My eSIM has no internet"\n- "I can't scan the QR code"\n- "I didn't receive my email"`
};

/**
 * POST /api/chat
 * Body: { message: string, sessionId?: string, quickReply?: boolean }
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId: clientSessionId, quickReply = false } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Session management
    const sessionId = clientSessionId || uuidv4();
    const session = getSession(sessionId);

    // Record user message
    addMessage(sessionId, 'user', message.trim());

    let responseText = '';
    let quickReplies = [];
    let resolvedIntent = null;

    // ── STEP 1: Check if we're inside a troubleshooting flow and user clicked a quick reply ──
    if (quickReply && session.context.currentFlow && session.context.flowStep) {
      const { nextStep, crossFlowId, isTerminal, faqRedirect } = advanceFlow(sessionId, message.trim());

      if (faqRedirect) {
        // Route to FAQ answer
        const faq = knowledgeBase.faqs.find(f => f.intent === faqRedirect);
        if (faq) {
          responseText = faq.answer;
          quickReplies = faq.quickReplies || [];
        }
      } else if (nextStep) {
        responseText = nextStep.message;
        quickReplies = nextStep.quickReplies || [];
        if (isTerminal) resetFlow(sessionId);
      } else {
        // No matching step — fall through to AI
        responseText = await generateAIResponse(sessionId, message, session.context);
      }

      resolvedIntent = session.context.currentFlow;
    }

    // ── STEP 2: Fresh message — run intent detection ──
    if (!responseText) {
      const { intent, confidence, isHardOverride } = detectIntent(message.trim());
      resolvedIntent = intent;
      updateContext(sessionId, { detectedIntent: intent });

      // Hard overrides — no AI needed
      if (isHardOverride || HARD_OVERRIDES[intent]) {
        responseText = HARD_OVERRIDES[intent] || HARD_OVERRIDES['UNKNOWN'];
        quickReplies = getDefaultQuickReplies(intent);
      }

      // Check if a structured flow should start
      else {
        const flowId = getFlowForIntent(intent);

        if (flowId && confidence > 0.2) {
          // Start a troubleshooting flow
          const firstStep = startFlow(sessionId, flowId);
          responseText = firstStep.message;
          quickReplies = firstStep.quickReplies || [];
        }

        // Check if intent maps to a known FAQ
        else if (knowledgeBase.faqs.find(f => f.intent === intent)) {
          const faq = knowledgeBase.faqs.find(f => f.intent === intent);
          responseText = faq.answer;
          quickReplies = faq.quickReplies || [];
        }

        // Fall back to AI response with guardrails
        else {
          responseText = await generateAIResponse(sessionId, message, session.context);
          quickReplies = [];
        }
      }
    }

    // Record assistant response
    addMessage(sessionId, 'assistant', responseText);

    // Log the conversation turn
    logConversation({
      sessionId,
      userMessage: message.trim(),
      intent: resolvedIntent,
      response: responseText,
      flow: session.context.currentFlow,
      flowStep: session.context.flowStep
    });

    return res.json({
      sessionId,
      response: responseText,
      quickReplies,
      intent: resolvedIntent,
      meta: {
        inFlow: !!session.context.currentFlow,
        flowId: session.context.currentFlow,
        flowStep: session.context.flowStep
      }
    });

  } catch (err) {
    console.error('[Chat Route Error]', err);
    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
      response: 'I encountered an issue processing your request. Please contact support@simzzy.com if this persists.'
    });
  }
});

/**
 * Generate AI response using Anthropic Claude with full guardrails
 */
async function generateAIResponse(sessionId, userMessage, sessionContext) {
  const history = getMessageHistory(sessionId, 8); // last 8 messages for context
  const systemPrompt = buildSystemPrompt(sessionContext);

  const messages = [
    ...history.slice(0, -1), // All but the last user message (it's already in the prompt)
    { role: 'user', content: userMessage }
  ];

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 600,
    system: systemPrompt,
    messages
  });

  return response.content[0]?.text || "I'm sorry, I couldn't generate a response. Please contact support@simzzy.com.";
}

/**
 * Default quick replies for specific intents
 */
function getDefaultQuickReplies(intent) {
  const defaults = {
    REFUND_REQUEST: ['Contact support', 'Different issue'],
    OUT_OF_SCOPE: ['eSIM not connecting', 'QR code issue', 'Contact support'],
    UNKNOWN: ['No internet connection', 'QR code problem', 'Plan / pricing question', 'Contact support']
  };
  return defaults[intent] || [];
}

module.exports = router;

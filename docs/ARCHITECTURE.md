# Simzzy eSIM Chatbot — Complete System Design & Implementation Guide

**Platform:** eSIM Vending Platform (Simzzy)  
**Provider:** TSim Tech  
**Version:** 1.0.0  
**Date:** 2026  

---

## 📁 Folder Structure

```
esim-chatbot/
├── backend/
│   ├── src/
│   │   ├── index.js                    ← Express server entry point
│   │   ├── routes/
│   │   │   └── chat.js                 ← POST /api/chat handler
│   │   ├── intents/
│   │   │   └── intents.json            ← All 39 chatbot intents
│   │   ├── knowledge/
│   │   │   └── knowledgeBase.json      ← FAQ + platform knowledge
│   │   ├── flows/
│   │   │   └── troubleshootingFlows.js ← Decision tree state machines
│   │   ├── services/
│   │   │   ├── intentDetector.js       ← Keyword-based intent classification
│   │   │   ├── flowEngine.js           ← Flow state management
│   │   │   ├── sessionManager.js       ← In-memory session + history
│   │   │   ├── promptBuilder.js        ← AI system prompt constructor
│   │   │   └── logger.js              ← Conversation logging
│   │   ├── middleware/
│   │   │   └── (rate limiting, auth — in index.js)
│   │   └── logs/
│   │       └── conversations.jsonl     ← Auto-generated conversation logs
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   └── src/
│       └── components/
│           ├── ChatWidget.jsx          ← React chat widget
│           └── ChatWidget.css          ← Widget styles
│
└── docs/
    └── ARCHITECTURE.md                 ← This document
```

---

## 🎯 Complete Intent List (39 Intents)

| # | Intent ID | Category | Description |
|---|-----------|----------|-------------|
| 1 | GREETING | General | User says hello |
| 2 | FAREWELL | General | User says goodbye |
| 3 | HUMAN_ESCALATION | Escalation | User requests a human agent |
| 4 | **REFUND_REQUEST** | **Billing** | **Hard override — email redirect** |
| 5 | PLAN_QUERY | Sales | Which plan to buy |
| 6 | DEVICE_COMPATIBILITY | Pre-purchase | Is my phone eSIM compatible? |
| 7 | PRICE_QUERY | Sales | How much does a plan cost? |
| 8 | HOW_TO_PURCHASE | Sales | How to buy an eSIM |
| 9 | PAYMENT_ISSUE | Billing | Payment failed/declined |
| 10 | QR_CODE_NOT_RECEIVED | Delivery | QR code not in email |
| 11 | QR_CODE_SCAN_ISSUE | Installation | Can't scan QR code |
| 12 | ESIM_INSTALL_ISSUE | Installation | eSIM won't install |
| 13 | ESIM_ACTIVATE_ISSUE | Installation | eSIM not activating |
| 14 | NO_CONNECTION | Connectivity | No internet with eSIM |
| 15 | SLOW_INTERNET | Connectivity | Slow data speeds |
| 16 | DATA_ROAMING_ISSUE | Connectivity | Roaming not working |
| 17 | APN_ISSUE | Connectivity | Wrong or missing APN |
| 18 | WRONG_OPERATOR | Connectivity | Connected to wrong carrier |
| 19 | PLAN_EXPIRED | Usage | Plan validity ended |
| 20 | DATA_EXHAUSTED | Usage | All data used up |
| 21 | CHECK_DATA_USAGE | Usage | How much data left? |
| 22 | DAILY_RESET_QUERY | Usage | When does daily data reset? |
| 23 | ESIM_DELETED | Installation | eSIM removed from phone |
| 24 | ESIM_DISABLED | Installation | eSIM switched off |
| 25 | ESIM_NOT_DOWNLOADED | Installation | eSIM in "Released" state |
| 26 | TRANSFER_TO_NEW_PHONE | Installation | Move eSIM to new device |
| 27 | DELIVERY_DELAY | Delivery | eSIM not delivered yet |
| 28 | LOST_QR_CODE | Delivery | Can't find QR code |
| 29 | EMAIL_NOT_RECEIVED | Delivery | Confirmation email missing |
| 30 | ESIM_COVERAGE_QUERY | Pre-purchase | Does eSIM work in country X? |
| 31 | REACTIVE_SIM | Connectivity | How to Reactive SIM |
| 32 | PHYSICAL_SIM_TOPUP | Billing | Top up physical SIM card |
| 33 | ORDER_STATUS | Delivery | Track order status |
| 34 | PURCHASE_HISTORY | Account | View past purchases |
| 35 | ACCOUNT_CREATION | Account | Sign up / login help |
| 36 | ICCID_QUERY | Technical | What/where is ICCID? |
| 37 | EID_QUERY | Technical | What/where is EID? |
| 38 | MULTIPLE_DEVICES | Technical | eSIM on multiple phones |
| 39 | CONTACT_SUPPORT | Escalation | Get support contact info |
| 40 | OUT_OF_SCOPE | Fallback | Non-platform questions |

---

## 🔄 Request Flow Architecture

```
User Message
     │
     ▼
[Rate Limiter] ──limit exceeded──► 429 Response
     │
     ▼
[Session Manager]
  - Get/create session
  - Load history + context
     │
     ▼
[Intent Detector]
  - Hard override check (REFUND → immediate response)
  - Keyword scoring
  - Returns: { intent, confidence, isHardOverride }
     │
     ├─ isHardOverride = true ──────────────► [Hard Override Response]
     │
     ├─ In active flow + quickReply = true ► [Flow Engine: advanceFlow()]
     │                                           │
     │                                           ├─ nextStep found ──► return step.message
     │                                           └─ no match ──────► AI fallback
     │
     ├─ flowId found for intent ────────────► [Flow Engine: startFlow()]
     │                                         return first step
     │
     ├─ FAQ match found ────────────────────► [Knowledge Base FAQ answer]
     │
     └─ No match / low confidence ──────────► [AI Response (Claude)]
                                               with system prompt guardrails
     │
     ▼
[Logger] — log turn to JSONL + stdout
     │
     ▼
JSON Response: { sessionId, response, quickReplies, intent, meta }
```

---

## 🌐 API Design

### POST `/api/chat`

**Request Body:**
```json
{
  "message": "My eSIM has no internet",
  "sessionId": "sess_abc123",     // optional on first message
  "quickReply": false             // true when user clicks a quick reply button
}
```

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "response": "Let's troubleshoot your internet connection step by step...",
  "quickReplies": ["Yes, it's installed", "No / Can't find it"],
  "intent": "NO_CONNECTION",
  "meta": {
    "inFlow": true,
    "flowId": "NO_CONNECTION",
    "flowStep": "start"
  }
}
```

**Error Response (400):**
```json
{ "error": "Message is required" }
```

**Error Response (429):**
```json
{ "error": "Too many requests. Please wait a moment before trying again." }
```

### GET `/health`
```json
{ "status": "ok", "service": "simzzy-esim-chatbot", "timestamp": "..." }
```

---

## 🧠 AI Prompt Guardrails

The system prompt enforces:

1. **Domain Restriction** — Only answer eSIM platform questions
2. **No Hallucination** — Only use provided knowledge base facts
3. **Refund Hard Override** — Route ALL refund queries to email, no exceptions
4. **Step-by-Step Style** — Never give vague one-liner responses
5. **Out-of-Scope Deflection** — Politely decline unrelated questions
6. **Escalation Awareness** — Know when to hand off to human support

---

## 🚀 Setup & Deployment

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in ANTHROPIC_API_KEY in .env
npm run dev          # development
npm start            # production
```

### Frontend Integration
```jsx
// Add to your main React app
import ChatWidget from './components/ChatWidget';

// In your layout component:
<ChatWidget />
```

Set `VITE_CHATBOT_API=https://your-backend-url.com/api` in your `.env.local`.

### Environment Variables
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `PORT` | Backend port (default 3001) |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `DATABASE_URL` | PostgreSQL for future persistence |

---

## 🗄️ Database Schema (PostgreSQL — for production persistence)

```sql
-- Replace in-memory sessions with DB persistence

CREATE TABLE chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key VARCHAR(100) UNIQUE NOT NULL,
  context     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  intent      VARCHAR(50),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_escalations (
  id          BIGSERIAL PRIMARY KEY,
  session_id  UUID REFERENCES chat_sessions(id),
  reason      TEXT,
  flow_id     VARCHAR(50),
  flow_step   VARCHAR(50),
  resolved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_key ON chat_sessions(session_key);
CREATE INDEX idx_messages_session ON chat_messages(session_id);
```

---

## 🔮 Future Improvements

1. **Order Tracking Integration** — Connect to TSim Tech API to pull live order status by ICCID
2. **Ticket System Integration** — Auto-create support tickets in the admin panel on escalation
3. **Multilingual Support** — Detect user language (Japanese, Chinese, Arabic, Hindi) and respond accordingly
4. **Vector Search (RAG)** — Use pgvector or Pinecone for semantic FAQ retrieval
5. **Analytics Dashboard** — Track top intents, escalation rates, resolution rates per admin panel
6. **Proactive Messaging** — Trigger chat if user stays on order page > 2 minutes
7. **WhatsApp Bot Integration** — Reuse the same flow engine with a WhatsApp Business API bridge
8. **Sentiment Detection** — Detect frustrated users and auto-escalate earlier
9. **A/B Testing** — Test different quick reply options and flow structures for resolution rate

---

## ⚠️ Key Business Rules Encoded

| Rule | Behavior |
|---|---|
| Refund queries | ALWAYS redirect to support@simzzy.com — no exceptions |
| Out-of-scope queries | Politely decline and redirect to eSIM topics |
| eSIM on different device | Cannot self-serve — always escalate to support |
| "Not Activated" status | May still have internet (usage delay) — don't panic user |
| Usage showing 0MB | May be a display delay (up to 1 hour) — not necessarily a problem |
| Daily reset times | Vary by provider — always reference package details |
| APN locked on iPhone | May be locked by Configuration Profile — escalate if grayed out |

/**
 * Flow Engine
 * Manages the state machine for structured troubleshooting flows.
 * Determines next step based on user selection and current state.
 */

const flows = require('../flows/troubleshootingFlows');
const { updateContext, getSession } = require('./sessionManager');

/**
 * Intents that trigger specific flows
 */
const INTENT_TO_FLOW = {
  QR_CODE_SCAN_ISSUE: 'QR_CODE_SCAN_ISSUE',
  ESIM_INSTALL_ISSUE: 'QR_CODE_SCAN_ISSUE', // reuse QR flow which covers install
  NO_CONNECTION: 'NO_CONNECTION',
  SLOW_INTERNET: 'SLOW_INTERNET',
  DATA_ROAMING_ISSUE: 'NO_CONNECTION',      // roaming is part of connection flow
  APN_ISSUE: 'NO_CONNECTION',               // APN is part of connection flow
  WRONG_OPERATOR: 'NO_CONNECTION',
  ESIM_DELETED: 'ESIM_DELETED',
  ESIM_DISABLED: 'NO_CONNECTION',
  ESIM_NOT_DOWNLOADED: 'QR_CODE_SCAN_ISSUE',
  REACTIVE_SIM: 'NO_CONNECTION',
};

/**
 * Check if intent should trigger a structured flow
 * @param {string} intent
 * @returns {string|null} flowId
 */
function getFlowForIntent(intent) {
  return INTENT_TO_FLOW[intent] || null;
}

/**
 * Get the current step object from a flow
 * @param {string} flowId
 * @param {string} stepId
 * @returns {object|null}
 */
function getFlowStep(flowId, stepId = 'start') {
  const flow = flows[flowId];
  if (!flow) return null;
  return flow.steps[stepId] || null;
}

/**
 * Advance flow based on user's quick reply selection
 * @param {string} sessionId
 * @param {string} userReply - The text of the quick reply button user pressed
 * @returns {{ nextStep: object|null, crossFlowId: string|null, isTerminal: boolean }}
 */
function advanceFlow(sessionId, userReply) {
  const session = getSession(sessionId);
  const { currentFlow, flowStep } = session.context;

  if (!currentFlow || !flowStep) {
    return { nextStep: null, crossFlowId: null, isTerminal: false };
  }

  const currentStep = getFlowStep(currentFlow, flowStep);
  if (!currentStep) {
    return { nextStep: null, crossFlowId: null, isTerminal: false };
  }

  const nextStepId = currentStep.nextSteps?.[userReply];
  if (!nextStepId) {
    return { nextStep: null, crossFlowId: null, isTerminal: false };
  }

  // Cross-flow navigation (e.g., "FLOW:NO_CONNECTION")
  if (nextStepId.startsWith('FLOW:')) {
    const crossFlowId = nextStepId.replace('FLOW:', '');
    const crossStep = getFlowStep(crossFlowId, 'start');
    updateContext(sessionId, { currentFlow: crossFlowId, flowStep: 'start' });
    return { nextStep: crossStep, crossFlowId, isTerminal: false };
  }

  // FAQ redirect (e.g., "FAQ:DAILY_RESET_QUERY")
  if (nextStepId.startsWith('FAQ:')) {
    return { nextStep: null, crossFlowId: null, isTerminal: false, faqRedirect: nextStepId.replace('FAQ:', '') };
  }

  const nextStep = getFlowStep(currentFlow, nextStepId);
  updateContext(sessionId, { flowStep: nextStepId });

  const isTerminal = !!nextStep?.terminalAction;
  if (isTerminal) {
    // Keep flow ID for reference but mark as complete
    updateContext(sessionId, { awaitingInput: false });
  }

  return { nextStep, crossFlowId: null, isTerminal };
}

/**
 * Start a new flow
 * @param {string} sessionId
 * @param {string} flowId
 * @returns {object} - First step of the flow
 */
function startFlow(sessionId, flowId) {
  updateContext(sessionId, {
    currentFlow: flowId,
    flowStep: 'start',
    awaitingInput: true
  });
  return getFlowStep(flowId, 'start');
}

module.exports = { getFlowForIntent, getFlowStep, advanceFlow, startFlow };

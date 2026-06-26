// services/classification/classification.ts
import { CASE_TYPES, SEVERITIES, DEPARTMENTS } from '../../core/enums.js';
import type { MatchResult } from '../transaction_matching/matcher.js';

export interface ClassificationResult {
  case_type: typeof CASE_TYPES[number];
  severity: typeof SEVERITIES[number];
  department: typeof DEPARTMENTS[number];
  confidence: number;
  reason_codes: string[];
  agent_summary: string;
  recommended_next_action: string;
  customer_reply: string;
  human_review_required: boolean;
  needs_llm_fallback: boolean; // ← flag for teammate to know when to use LLM
}

export function classifyByRules(
  complaint: string,
  matchResult: MatchResult
): ClassificationResult {
  const lower = complaint.toLowerCase();
  const reasonCodes: string[] = [];

  // ---- 1. Detect case_type ----
  let case_type: typeof CASE_TYPES[number] = 'other';
  let confidence = 0.3;
  const matchedKeywords: string[] = [];

  if (/(provide|share|give|need|verify|asked for|ask for|wants|dite|de|bolse|chailo|lagbe|cai|jana|chaiche).*(otp|pin|password|cvv|gopon|ওটিপি|পিন|পাসওয়ার্ড)/i.test(lower) || /phishing|scam|suspicious|প্রতারণা|স্ক্যাম/i.test(lower)) {
    case_type = 'phishing_or_social_engineering';
    matchedKeywords.push('phishing');
    confidence = 0.95;
  } else if (/otp|pin|password|cvv/i.test(lower)) {
    // Mentions credentials, but lacks explicit threat/request framing.
    case_type = 'phishing_or_social_engineering';
    matchedKeywords.push('potential_phishing');
    confidence = 0.60; // < 70% confidence will route to LLM
  } else if (/wrong (number|recipient)|sent to wrong|transfer to wrong/i.test(lower)) {
    case_type = 'wrong_transfer';
    matchedKeywords.push('wrong_transfer');
    confidence = 0.9;
  } else if (/payment failed|transaction failed|balance deducted|deducted but failed/i.test(lower)) {
    case_type = 'payment_failed';
    matchedKeywords.push('payment_failed');
    confidence = 0.9;
  } else if (/refund|change my mind|cancel transaction/i.test(lower)) {
    case_type = 'refund_request';
    matchedKeywords.push('refund');
    confidence = 0.8;
  } else if (/duplicate|charged twice|double payment/i.test(lower)) {
    case_type = 'duplicate_payment';
    matchedKeywords.push('duplicate');
    confidence = 0.8;
  } else if (/merchant settlement|payment not received|merchant payout/i.test(lower)) {
    case_type = 'merchant_settlement_delay';
    matchedKeywords.push('merchant_settlement');
    confidence = 0.8;
  } else if (/agent cash|agent deposit|cash in not reflected/i.test(lower)) {
    case_type = 'agent_cash_in_issue';
    matchedKeywords.push('agent_cash');
    confidence = 0.8;
  } else {
    // No strong pattern – LLM fallback will be needed
    reasonCodes.push('no_keyword_match');
    confidence = 0.3;
  }

  // ---- 2. Evidence‑based adjustments ----
  if (matchResult.evidence_verdict === 'inconsistent') {
    confidence = Math.max(0.3, confidence - 0.15);
    reasonCodes.push('evidence_inconsistent');
  } else if (matchResult.evidence_verdict === 'insufficient_data') {
    confidence = Math.max(0.3, confidence - 0.05);
    reasonCodes.push('evidence_insufficient');
  } else {
    reasonCodes.push('evidence_consistent');
  }

  // ---- 3. Assign severity based on case_type ----
  let severity: typeof SEVERITIES[number] = 'low';
  if (case_type === 'phishing_or_social_engineering') {
    severity = 'critical';
  } else if (['wrong_transfer', 'payment_failed'].includes(case_type)) {
    severity = 'high';
  } else if (['duplicate_payment', 'merchant_settlement_delay', 'agent_cash_in_issue'].includes(case_type)) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  // ---- 4. Assign department ----
  const departmentMap: Record<typeof CASE_TYPES[number], typeof DEPARTMENTS[number]> = {
    wrong_transfer: 'dispute_resolution',
    payment_failed: 'payments_ops',
    refund_request: 'dispute_resolution',
    duplicate_payment: 'payments_ops',
    merchant_settlement_delay: 'merchant_operations',
    agent_cash_in_issue: 'agent_operations',
    phishing_or_social_engineering: 'fraud_risk',
    other: 'customer_support',
  };
  const department = departmentMap[case_type] || 'customer_support';

  // ---- 5. Generate summary, action, reply ----
  const summaryMap: Record<string, string> = {
    wrong_transfer: 'Customer reports sending money to the wrong recipient and requests recovery.',
    payment_failed: 'Customer reports a failed transaction with a possible balance deduction.',
    refund_request: 'Customer requests a refund for a recent transaction.',
    duplicate_payment: 'Customer reports being charged twice for the same payment.',
    merchant_settlement_delay: 'Customer reports delayed settlement of merchant payment.',
    agent_cash_in_issue: 'Customer reports cash deposit not reflected in account.',
    phishing_or_social_engineering: 'Customer reports a suspicious communication attempting to obtain sensitive information.',
    other: 'Customer reports an issue with the app or service.',
  };

  const actionMap: Record<string, string> = {
    wrong_transfer: 'Verify the recipient details and initiate dispute process.',
    payment_failed: 'Check transaction status and confirm if balance was deducted.',
    refund_request: 'Review eligibility and process refund if applicable.',
    duplicate_payment: 'Verify duplicate transactions and reverse if confirmed.',
    merchant_settlement_delay: 'Check settlement status and escalate to merchant ops.',
    agent_cash_in_issue: 'Verify agent deposit and reconcile account.',
    phishing_or_social_engineering: 'Escalate to fraud team immediately.',
    other: 'Review customer concern and respond appropriately.',
  };

  const replyMap: Record<string, string> = {
    wrong_transfer: 'We have noted your concern regarding the transfer. Our team will review and assist you through official channels.',
    payment_failed: 'We understand your concern about the failed transaction. We will verify the status and get back to you.',
    refund_request: 'We have received your refund request and will process it as per policy.',
    duplicate_payment: 'We are investigating the duplicate payment and will reverse any extra charges if confirmed.',
    merchant_settlement_delay: 'We are checking the settlement status and will update you shortly.',
    agent_cash_in_issue: 'We are verifying your cash deposit with the agent and will reconcile your account.',
    phishing_or_social_engineering: 'We are escalating this to our fraud team. Please do not share any sensitive information.',
    other: 'We have received your concern and will address it promptly.',
  };

  const agent_summary = summaryMap[case_type] || summaryMap.other;
  const recommended_next_action = actionMap[case_type] || actionMap.other;
  const customer_reply = replyMap[case_type] || replyMap.other;

  // ---- 6. Human review and LLM fallback decision ----
  const human_review_required =
    severity === 'critical' ||
    matchResult.evidence_verdict === 'inconsistent' ||
    confidence < 0.6;

  // If confidence is low, set flag for LLM fallback
  const needs_llm_fallback = confidence < 0.8;

  // ---- 7. Add reason codes ----
  reasonCodes.push(`case_type:${case_type}`);
  if (matchedKeywords.length > 0) {
    reasonCodes.push(`matched:${matchedKeywords.join(',')}`);
  }

  return {
    case_type,
    severity,
    department,
    confidence,
    reason_codes: reasonCodes,
    agent_summary,
    recommended_next_action,
    customer_reply,
    human_review_required,
    needs_llm_fallback,
  };
}
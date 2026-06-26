import { TicketResponse } from '../../core/types';

export const getDeterministicFallback = (ticket_id: string): TicketResponse => ({
    ticket_id,
    relevant_transaction_id: null,
    evidence_verdict: 'insufficient_data',
    case_type: 'other',
    severity: 'medium',
    department: 'customer_support',
    agent_summary: 'System was unable to process the complaint fully due to an internal timeout or validation error. Manual review required.',
    recommended_next_action: 'Agent should manually review the user complaint and transaction history to determine the appropriate next steps.',
    customer_reply: 'Thank you for reaching out. Your request has been forwarded to our support team for a detailed manual review. We will get back to you shortly. Please do not share your PIN or OTP with anyone.',
    human_review_required: true,
    confidence: 0,
    reason_codes: ['system_fallback']
});

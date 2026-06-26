import { TicketResponse } from '../../core/types';
import { getDeterministicFallback } from './fallback';

const VALID_CASE_TYPES = new Set(['wrong_transfer', 'payment_failed', 'refund_request', 'duplicate_payment', 'merchant_settlement_delay', 'agent_cash_in_issue', 'phishing_or_social_engineering', 'other']);
const VALID_EVIDENCE_VERDICTS = new Set(['consistent', 'inconsistent', 'insufficient_data']);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_DEPARTMENTS = new Set(['customer_support', 'dispute_resolution', 'payments_ops', 'merchant_operations', 'agent_operations', 'fraud_risk']);

// Simple helper to normalize strings
const normalize = (str: any) => typeof str === 'string' ? str.trim().toLowerCase() : str;

export const repairAndValidateSchema = (rawJson: any, ticket_id: string): TicketResponse => {
    try {
        let parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

        // Try some cheap repairs
        const case_type = normalize(parsed.case_type);
        const evidence_verdict = normalize(parsed.evidence_verdict);
        const severity = normalize(parsed.severity);
        const department = normalize(parsed.department);

        // Basic checks for required fields
        if (!parsed.agent_summary || !parsed.recommended_next_action || !parsed.customer_reply) {
            throw new Error("Missing required text fields");
        }

        if (!VALID_CASE_TYPES.has(case_type)) throw new Error(`Invalid case_type: ${case_type}`);
        if (!VALID_EVIDENCE_VERDICTS.has(evidence_verdict)) throw new Error(`Invalid evidence_verdict: ${evidence_verdict}`);
        if (!VALID_SEVERITIES.has(severity)) throw new Error(`Invalid severity: ${severity}`);
        if (!VALID_DEPARTMENTS.has(department)) throw new Error(`Invalid department: ${department}`);

        return {
            ticket_id: parsed.ticket_id || ticket_id,
            relevant_transaction_id: parsed.relevant_transaction_id || null,
            evidence_verdict: evidence_verdict as any,
            case_type: case_type as any,
            severity: severity as any,
            department: department as any,
            agent_summary: parsed.agent_summary,
            recommended_next_action: parsed.recommended_next_action,
            customer_reply: parsed.customer_reply,
            human_review_required: Boolean(parsed.human_review_required),
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
            reason_codes: Array.isArray(parsed.reason_codes) ? parsed.reason_codes : []
        };
    } catch (e) {
        console.error("Schema validation/repair failed. Falling back.", e);
        return getDeterministicFallback(ticket_id);
    }
};

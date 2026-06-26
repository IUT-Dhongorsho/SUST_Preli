export interface Transaction {
    transaction_id: string;
    timestamp: string;
    type: 'transfer' | 'payment' | 'cash_in' | 'cash_out' | 'settlement' | 'refund';
    amount: number;
    counterparty: string;
    status: 'completed' | 'failed' | 'pending' | 'reversed';
}

export interface TicketPayload {
    ticket_id: string;
    complaint: string;
    language?: 'en' | 'bn' | 'mixed';
    channel?: 'in_app_chat' | 'call_center' | 'email' | 'merchant_portal' | 'field_agent';
    user_type?: 'customer' | 'merchant' | 'agent' | 'unknown';
    campaign_context?: string;
    transaction_history?: Transaction[];
    metadata?: Record<string, any>;
}

export interface TicketResponse {
    ticket_id: string;
    relevant_transaction_id: string | null;
    evidence_verdict: 'consistent' | 'inconsistent' | 'insufficient_data';
    case_type: 'wrong_transfer' | 'payment_failed' | 'refund_request' | 'duplicate_payment' | 'merchant_settlement_delay' | 'agent_cash_in_issue' | 'phishing_or_social_engineering' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    department: 'customer_support' | 'dispute_resolution' | 'payments_ops' | 'merchant_operations' | 'agent_operations' | 'fraud_risk';
    agent_summary: string;
    recommended_next_action: string;
    customer_reply: string;
    human_review_required: boolean;
    confidence?: number;
    reason_codes?: string[];
}

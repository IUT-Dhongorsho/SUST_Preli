// core/enums.ts

export const CASE_TYPES = [
    'wrong_transfer',
    'payment_failed',
    'refund_request',
    'duplicate_payment',
    'merchant_settlement_delay',
    'agent_cash_in_issue',
    'phishing_or_social_engineering',
    'other',
  ] as const;
  
  export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
  
  export const DEPARTMENTS = [
    'customer_support',
    'dispute_resolution',
    'payments_ops',
    'merchant_operations',
    'agent_operations',
    'fraud_risk',
  ] as const;
  
  export const CHANNELS = ['in_app_chat', 'call_center', 'email', 'merchant_portal', 'field_agent'] as const;
  export const USER_TYPES = ['customer', 'merchant', 'agent', 'unknown'] as const;
  export const LANGUAGES = ['en', 'bn', 'mixed'] as const;

  export const UNSAFE_PATTERNS = [
    /OTP/i,
    /PIN/i,
    /password/i,
    /secret/i,
    /card number/i,
    /credit card/i,
    /debit card/i,
  ];
  
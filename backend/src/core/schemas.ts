// core/schemas.ts
import { z } from 'zod';
import {
  CASE_TYPES,
  SEVERITIES,
  DEPARTMENTS,
  CHANNELS,
  USER_TYPES,
  LANGUAGES,
} from './enums.js';

export const TransactionSchema = z.object({
  transaction_id: z.string(),
  timestamp: z.string().datetime(),
  type: z.enum(['transfer', 'payment', 'cash_in', 'cash_out', 'settlement', 'refund']),
  amount: z.number(),
  counterparty: z.string(),
  status: z.enum(['completed', 'failed', 'pending', 'reversed']),
});

export const AnalyzeRequestSchema = z.object({
  ticket_id: z.string(),
  complaint: z.string().min(1, 'Complaint cannot be empty'),
  language: z.enum(LANGUAGES).optional(),
  channel: z.enum(CHANNELS).optional(),
  user_type: z.enum(USER_TYPES).optional(),
  campaign_context: z.string().optional(),
  transaction_history: z.array(TransactionSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(), // ✅ Fixed: key and value types
});

export const AnalyzeResponseSchema = z.object({
  ticket_id: z.string(),
  relevant_transaction_id: z.string().nullable(),
  evidence_verdict: z.enum(['consistent', 'inconsistent', 'insufficient_data']),
  case_type: z.enum(CASE_TYPES),
  severity: z.enum(SEVERITIES),
  department: z.enum(DEPARTMENTS),
  agent_summary: z.string(),
  recommended_next_action: z.string(),
  customer_reply: z.string(),
  human_review_required: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  reason_codes: z.array(z.string()).optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
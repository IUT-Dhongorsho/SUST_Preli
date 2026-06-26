// services/transaction_matching/matcher.test.ts
import { describe, it, expect } from 'vitest';
import { matchTransaction } from './matcher.js';
import type { Transaction } from '../../core/schemas.js';

describe('matchTransaction', () => {
  const history: Transaction[] = [
    {
      transaction_id: 'TXN-9101',
      timestamp: '2026-04-14T14:08:22Z',
      type: 'transfer',
      amount: 5000,
      counterparty: '+8801719876543',
      status: 'completed',
    },
    {
      transaction_id: 'TXN-9102',
      timestamp: '2026-04-14T14:10:10Z',
      type: 'payment',
      amount: 5000,
      counterparty: 'merchant_xyz',
      status: 'completed',
    },
  ];

  it('should return consistent with exact transaction ID', () => {
    const result = matchTransaction('I sent 5000 via TXN-9101', history);
    expect(result.relevant_transaction_id).toBe('TXN-9101');
    expect(result.evidence_verdict).toBe('consistent');
    expect(result.reason_codes).toContain('exact_txn_id_match');
  });

  it('should return inconsistent when mentioned ID not found', () => {
    const result = matchTransaction('Issue with TXN-9999', history);
    expect(result.relevant_transaction_id).toBeNull();
    expect(result.evidence_verdict).toBe('inconsistent');
    expect(result.reason_codes).toContain('txn_id_mentioned_but_not_found');
  });

  it('should match by amount + counterparty', () => {
    const result = matchTransaction('Sent 5000 to 01719876543', history);
    expect(result.relevant_transaction_id).toBe('TXN-9101');
    expect(result.evidence_verdict).toBe('consistent');
    expect(result.reason_codes).toContain('amount_counterparty_match');
  });

  it('should handle no match', () => {
    const result = matchTransaction('I need a refund', []);
    expect(result.relevant_transaction_id).toBeNull();
    expect(result.evidence_verdict).toBe('insufficient_data');
    expect(result.reason_codes).toContain('no_history');
  });
});
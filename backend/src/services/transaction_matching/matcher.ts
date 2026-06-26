// services/transaction_matching/matcher.ts
import type { Transaction } from '../../core/schemas.js'; // ✅ type-only import

export interface MatchResult {
  relevant_transaction_id: string | null;
  evidence_verdict: 'consistent' | 'inconsistent' | 'insufficient_data';
  reason_codes: string[];
}

export function matchTransaction(
  complaint: string,
  history: Transaction[] = []
): MatchResult {
  const lower = complaint.toLowerCase();
  const reasonCodes: string[] = [];

  if (!history || history.length === 0) {
    reasonCodes.push('no_history');
    return {
      relevant_transaction_id: null,
      evidence_verdict: 'insufficient_data',
      reason_codes: reasonCodes,
    };
  }

  // 2. Try exact transaction ID
  const idMatch = complaint.match(/TXN[-\s]?([A-Z0-9]+)/i);
  if (idMatch) {
    const found = history.find(tx => tx.transaction_id.includes(idMatch[1]));
    if (found) {
      reasonCodes.push('exact_txn_id_match');
      return {
        relevant_transaction_id: found.transaction_id,
        evidence_verdict: 'consistent',
        reason_codes: reasonCodes,
      };
    }
    reasonCodes.push('txn_id_mentioned_but_not_found');
    return {
      relevant_transaction_id: null,
      evidence_verdict: 'inconsistent',
      reason_codes: reasonCodes,
    };
  }

  // 3. Try amount + counterparty (phone)
  const amountMatch = complaint.match(/(\d+)\s*(?:taka|tk|bdt)/i);
  const phoneMatch = complaint.match(/to\s*(\+?88?01\d{9})/i);
  if (amountMatch && phoneMatch) {
    const amount = parseInt(amountMatch[1], 10);
    const counterparty = phoneMatch[1];
    const found = history.find(tx =>
      tx.amount === amount && tx.counterparty.includes(counterparty)
    );
    if (found) {
      reasonCodes.push('amount_counterparty_match');
      return {
        relevant_transaction_id: found.transaction_id,
        evidence_verdict: 'consistent',
        reason_codes: reasonCodes,
      };
    }
    reasonCodes.push('amount_counterparty_no_match');
    return {
      relevant_transaction_id: null,
      evidence_verdict: 'inconsistent',
      reason_codes: reasonCodes,
    };
  }

  // 4. Try amount + type hint
  if (amountMatch) {
    const amount = parseInt(amountMatch[1], 10);
    let typeHint: string | null = null;
    if (/transfer|send/i.test(complaint)) typeHint = 'transfer';
    else if (/payment|pay/i.test(complaint)) typeHint = 'payment';

    if (typeHint) {
      const found = history.find(tx => tx.amount === amount && tx.type === typeHint);
      if (found) {
        reasonCodes.push('amount_type_match');
        return {
          relevant_transaction_id: found.transaction_id,
          evidence_verdict: 'consistent',
          reason_codes: reasonCodes,
        };
      }
    }
  }

  // 5. Contextual: "wrong number"
  if (/wrong (number|recipient)|sent to wrong/i.test(complaint)) {
    const found = history.find(tx => tx.status === 'completed' && tx.type === 'transfer');
    if (found) {
      reasonCodes.push('contextual_wrong_transfer');
      return {
        relevant_transaction_id: found.transaction_id,
        evidence_verdict: 'consistent',
        reason_codes: reasonCodes,
      };
    }
  }

  // 6. Fallback
  reasonCodes.push('no_match_found');
  return {
    relevant_transaction_id: null,
    evidence_verdict: 'insufficient_data',
    reason_codes: reasonCodes,
  };
}
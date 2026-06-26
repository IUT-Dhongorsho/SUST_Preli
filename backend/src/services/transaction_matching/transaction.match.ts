import { Transaction } from '../../core/types';

export interface EvidenceSignals {
    has_potential_duplicates: boolean;
    duplicate_transaction_ids: string[];
    established_recipients: Record<string, number>; // counterparty -> count
    ambiguous_amounts: boolean;
}

export const analyzeTransactionHistory = (history?: Transaction[]): EvidenceSignals => {
    const signals: EvidenceSignals = {
        has_potential_duplicates: false,
        duplicate_transaction_ids: [],
        established_recipients: {},
        ambiguous_amounts: false
    };

    if (!history || history.length === 0) return signals;

    const amountMap = new Map<number, Transaction[]>();
    const counterpartyCount: Record<string, number> = {};

    for (const txn of history) {
        // Track for duplicates/ambiguity
        if (!amountMap.has(txn.amount)) {
            amountMap.set(txn.amount, []);
        }
        amountMap.get(txn.amount)!.push(txn);

        // Track established recipients (only care about completed transfers/payments)
        if (txn.status === 'completed') {
            counterpartyCount[txn.counterparty] = (counterpartyCount[txn.counterparty] || 0) + 1;
        }
    }

    // Process maps into signals
    for (const [counterparty, count] of Object.entries(counterpartyCount)) {
        if (count > 1) { // 2 or more completed transactions
            signals.established_recipients[counterparty] = count;
        }
    }

    for (const [amount, txns] of amountMap.entries()) {
        if (txns.length > 1) {
            // Potential ambiguity (multiple same amounts)
            signals.ambiguous_amounts = true;

            // Check for actual duplicates (same amount, same counterparty, close in time)
            // Time proximity: within 15 minutes of each other
            for (let i = 0; i < txns.length; i++) {
                for (let j = i + 1; j < txns.length; j++) {
                    if (txns[i].counterparty === txns[j].counterparty) {
                        const t1 = new Date(txns[i].timestamp).getTime();
                        const t2 = new Date(txns[j].timestamp).getTime();
                        const diffMins = Math.abs(t1 - t2) / (1000 * 60);
                        
                        if (diffMins <= 15) { // 15 minute window for duplicates
                            signals.has_potential_duplicates = true;
                            signals.duplicate_transaction_ids.push(txns[i].transaction_id, txns[j].transaction_id);
                        }
                    }
                }
            }
        }
    }

    // Deduplicate the ID array
    signals.duplicate_transaction_ids = [...new Set(signals.duplicate_transaction_ids)];

    return signals;
};

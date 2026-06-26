// controllers/analyzeController.ts
import type { Request, Response } from 'express';
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from '../core/schemas.js';
import { matchTransaction } from '../services/transaction_matching/matcher.ts';
import { z } from 'zod';

export const analyzeTicket = async (req: Request, res: Response) => {
  try {
    // 1. Validate request body
    const validated = AnalyzeRequestSchema.parse(req.body);

    const { ticket_id, complaint, transaction_history = [] } = validated;

    // 2. Run transaction matcher
    const matchResult = matchTransaction(complaint, transaction_history);

    // 3. Call classifier (will be implemented later)
    // For now, we'll build a dummy response
    const dummyClassification = {
      case_type: 'other' as const,
      severity: 'low' as const,
      department: 'customer_support' as const,
      agent_summary: 'Customer reported an issue.',
      recommended_next_action: 'Review details and respond.',
      customer_reply: 'We have received your concern and will address it.',
      human_review_required: false,
      confidence: 0.5,
      reason_codes: matchResult.reason_codes,
    };

    // 4. Build response
    const response = {
      ticket_id,
      relevant_transaction_id: matchResult.relevant_transaction_id,
      evidence_verdict: matchResult.evidence_verdict,
      ...dummyClassification,
    };

    // 5. Validate response against schema (optional but good)
    const validatedResponse = AnalyzeResponseSchema.parse(response);

    res.status(200).json(validatedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation error – return 400 with details
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors,
      });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
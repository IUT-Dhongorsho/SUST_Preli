// controllers/analyzeController.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from '../core/schemas.js';
import { matchTransaction } from '../services/transaction_matching/matcher.js';
import { classifyByRules } from '../services/classification/classification.js';
import { sanitizeReply } from '../services/safety_filter/safetyGate.service.js';

export const analyzeTicket = async (req: Request, res: Response) => {
  try {
    // 1. Validate request
    const validated = AnalyzeRequestSchema.parse(req.body);
    const { ticket_id, complaint, transaction_history = [] } = validated;

    // 2. Transaction matching
    const matchResult = matchTransaction(complaint, transaction_history);

    // 3. Rule‑based classification
    const classification = classifyByRules(complaint, matchResult);

    // 4. Safety filter on customer reply
    const safeCustomerReply = sanitizeReply(classification.customer_reply);
    const safeSummary = sanitizeReply(classification.agent_summary);

    // 5. Build final response
    const response = {
      ticket_id,
      relevant_transaction_id: matchResult.relevant_transaction_id,
      evidence_verdict: matchResult.evidence_verdict,
      case_type: classification.case_type,
      severity: classification.severity,
      department: classification.department,
      agent_summary: safeSummary,
      recommended_next_action: classification.recommended_next_action,
      customer_reply: safeCustomerReply,
      human_review_required: classification.human_review_required,
      confidence: classification.confidence,
      reason_codes: classification.reason_codes,
    };

    // 6. Validate response schema
    const validatedResponse = AnalyzeResponseSchema.parse(response);

    // 7. (Optional) If LLM fallback is needed, teammate can override here
    if (classification.needs_llm_fallback) {
      // Call LLM and replace classification fields (handled by teammate)
      // For now, we just keep the rule‑based result
    }

    res.status(200).json(validatedResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
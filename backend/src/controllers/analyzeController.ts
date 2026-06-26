// controllers/analyzeController.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from '../core/schemas.js';
import { matchTransaction } from '../services/transaction_matching/matcher.js';
import { classifyByRules } from '../services/classification/classification.js';
import { analyzeTicketWithLLM } from '../services/llm/groq.service.js';

export const analyzeTicket = async (req: Request, res: Response) => {
  try {
    // 1. Validate request
    const validated = AnalyzeRequestSchema.parse(req.body);
    const { complaint, transaction_history = [] } = validated;

    // 2. Rule-based Fast Path Check (Phishing & Vague)
    const matchResult = matchTransaction(complaint, transaction_history);
    const classification = classifyByRules(complaint, matchResult);

    // Explicitly define what qualifies as an "obvious/naive" fast-path case
    const isPhishing = classification.case_type === 'phishing_or_social_engineering' && classification.confidence >= 0.70;
    const isVague = complaint.trim().length < 15 && transaction_history.length === 0;

    let finalResponse;

    if (isPhishing || isVague) {
      // FAST PATH: Return the regex/rule-based templated response immediately to save LLM tokens/time
      finalResponse = {
        ticket_id: validated.ticket_id,
        relevant_transaction_id: null,
        evidence_verdict: 'insufficient_data',
        case_type: isPhishing ? 'phishing_or_social_engineering' : 'other',
        severity: classification.severity,
        department: classification.department,
        agent_summary: classification.agent_summary,
        recommended_next_action: classification.recommended_next_action,
        customer_reply: classification.customer_reply,
        human_review_required: true,
        confidence: classification.confidence,
        reason_codes: classification.reason_codes,
      };
      console.log(`⚡ Fast-path triggered for ${validated.ticket_id} (${isPhishing ? 'Phishing' : 'Vague'})`);
    } else {
      // MAIN PATH: Pass the majority of complex requests to the LLM
      console.log(`🧠 LLM path triggered for ${validated.ticket_id}`);
      finalResponse = await analyzeTicketWithLLM(validated);
    }

    // 3. Validate final response schema
    const validatedResponse = AnalyzeResponseSchema.parse(finalResponse);
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
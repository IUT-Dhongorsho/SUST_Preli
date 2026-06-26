import { TicketPayload, TicketResponse } from '../../core/types';
import { buildPrompt } from '../../core/prompt';
import { analyzeTransactionHistory } from '../transaction_matching/transaction.match';
import { repairAndValidateSchema } from './schemaRepair';
import { getDeterministicFallback } from './fallback';

// NOTE: You'll need an API key in process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 12000; // 12 seconds to leave room for retries or fallback

export const analyzeTicketWithLLM = async (payload: TicketPayload): Promise<TicketResponse> => {
    // 1. Evidence Pre-processing
    const signals = analyzeTransactionHistory(payload.transaction_history);
    
    // 2. Prompt Building
    const prompt = buildPrompt(payload, signals);

    // 3. LLM Call with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Fast and capable for this task
                messages: [
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.1 // Keep it deterministic
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error("LLM API returned an error:", response.status, await response.text());
            return getDeterministicFallback(payload.ticket_id);
        }

        const data = await response.json();
        const rawOutput = data.choices[0].message.content;

        // 4. Schema Validator / Repairer
        return repairAndValidateSchema(rawOutput, payload.ticket_id);

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`LLM Call timed out after ${TIMEOUT_MS}ms.`);
        } else {
            console.error("LLM Call failed:", error);
        }
        return getDeterministicFallback(payload.ticket_id);
    }
};

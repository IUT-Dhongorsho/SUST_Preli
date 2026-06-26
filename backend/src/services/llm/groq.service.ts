import { TicketPayload, TicketResponse } from '../../core/types';
import { buildPrompt } from '../../core/prompt';
import { analyzeTransactionHistory } from '../transaction_matching/transaction.match';
import { repairAndValidateSchema } from './schemaRepair';
import { getDeterministicFallback } from './fallback';
import { containsUnsafeContent } from '../safety_filter/safetyGate.service';

// NOTE: You'll need an API key in process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 12000; // 12 seconds to leave room for retries or fallback

export const analyzeTicketWithLLM = async (payload: TicketPayload): Promise<TicketResponse> => {
    // 1. Evidence Pre-processing
    const signals = analyzeTransactionHistory(payload.transaction_history);
    
    // 2. Prompt Building
    const initialPrompt = buildPrompt(payload, signals);

    let messages = [{ role: "user", content: initialPrompt }];
    let attempts = 0;
    const MAX_ATTEMPTS = 2; // Architecture mandates max 2 attempts

    // 3. LLM Call with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                console.error("LLM API returned an error:", response.status);
                clearTimeout(timeoutId);
                return getDeterministicFallback(payload.ticket_id);
            }

            const data = await response.json();
            const rawOutput = data.choices[0].message.content;

            // 4. Schema Validator / Repairer
            let parsedResponse = repairAndValidateSchema(rawOutput, payload.ticket_id);

            // 5. SAFETY GATE (Checking your teammate's Regex!)
            // We check both the reply and the recommended action
            const isUnsafe = containsUnsafeContent(parsedResponse.customer_reply) || 
                             containsUnsafeContent(parsedResponse.recommended_next_action);

            if (isUnsafe) {
                console.log(`⚠️ Safety violation detected on attempt ${attempts}. Regenerating...`);
                if (attempts < MAX_ATTEMPTS) {
                    // Feed the mistake back to the LLM and ask it to correct itself
                    messages.push({ role: "assistant", content: rawOutput });
                    messages.push({ 
                        role: "user", 
                        content: "CRITICAL SAFETY VIOLATION: Your previous response contained unsafe language (e.g., asking for credentials or confirming a refund without authority). Rewrite the response strictly adhering to the safety guidelines." 
                    });
                    continue; // Loop again
                } else {
                    // Deterministic field-level overwrite if LLM fails twice (as per ARCHITECTURE.md)
                    console.log("❌ Max safety attempts reached. Forcing deterministic overwrite.");
                    parsedResponse.customer_reply = "We have received your request. Our support team will review it carefully. Please do not share your PIN or OTP with anyone. Any eligible amount will be returned through official channels.";
                    if (!parsedResponse.reason_codes.includes("safety_fallback")) {
                        parsedResponse.reason_codes.push("safety_fallback");
                    }
                    clearTimeout(timeoutId);
                    return parsedResponse;
                }
            }

            // If safe, return immediately
            clearTimeout(timeoutId);
            return parsedResponse;
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`LLM Call timed out after ${TIMEOUT_MS}ms.`);
        } else {
            console.error("LLM Call failed:", error);
        }
        return getDeterministicFallback(payload.ticket_id);
    }
    
    clearTimeout(timeoutId);
    return getDeterministicFallback(payload.ticket_id);
};

import { analyzeTicketWithLLM } from './services/llm/groq.service';
import { TicketPayload } from './core/types';

// Make sure your GROQ_API_KEY is exported in your terminal!
// export GROQ_API_KEY="your-key-here"

async function runManualTest() {
    // 👇 EDIT THIS PAYLOAD TO TEST ANYTHING YOU WANT 👇
    const customInput: TicketPayload = {
        ticket_id: "TKT-MANUAL-001",
        complaint: "I sent 500 BDT to my friend but they said they didn't get it. My number is 01711223344",
        language: "en",
        channel: "in_app_chat",
        user_type: "customer",
        transaction_history: [
            {
                transaction_id: "TXN-9999",
                timestamp: new Date().toISOString(),
                type: "transfer",
                amount: 500,
                counterparty: "+8801999888777",
                status: "completed"
            }
        ]
    };

    console.log("🚀 Running manual test...\n");
    console.log("Input:", JSON.stringify(customInput, null, 2));

    const startTime = Date.now();
    const result = await analyzeTicketWithLLM(customInput);
    const endTime = Date.now();

    console.log(`\n✅ Result (${endTime - startTime}ms):`);
    console.log(JSON.stringify(result, null, 2));
}

runManualTest();

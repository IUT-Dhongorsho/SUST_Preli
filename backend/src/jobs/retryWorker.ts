import pool from '../config/db.js';
import { analyzeTicketWithLLM } from '../services/llm/groq.service.js';

export const runRetryWorker = async () => {
    console.log("🔄 Starting Retry Worker...");

    try {
        // Find tickets that failed due to system/safety fallbacks
        const result = await pool.query(`
            SELECT id, request 
            FROM ticket_logs 
            WHERE response->'reason_codes' @> '"system_fallback"' 
               OR response->'reason_codes' @> '"safety_fallback"'
        `);

        const failedTickets = result.rows;

        if (failedTickets.length === 0) {
            console.log("✅ No failed tickets to retry.");
            return;
        }

        console.log(`Found ${failedTickets.length} failed tickets. Retrying...`);

        for (const row of failedTickets) {
            console.log(`\nRetrying Ticket ID: ${row.request.ticket_id}`);
            
            const startTime = Date.now();
            
            // Re-run the LLM pipeline
            const newResponse = await analyzeTicketWithLLM(row.request);
            
            // Check if it succeeded this time
            const stillFailed = newResponse.reason_codes.includes("system_fallback") || 
                                newResponse.reason_codes.includes("safety_fallback");

            if (!stillFailed) {
                const latency_ms = Date.now() - startTime;
                
                // Update the database with the successful response
                await pool.query(
                    'UPDATE ticket_logs SET response = $1, latency_ms = $2 WHERE id = $3',
                    [newResponse, latency_ms, row.id]
                );
                
                console.log(`✅ Successfully recovered Ticket ID: ${row.request.ticket_id}`);
            } else {
                console.log(`❌ Ticket ID: ${row.request.ticket_id} failed again.`);
            }
        }

    } catch (error) {
        console.error("Error running Retry Worker:", error);
    } finally {
        // Disconnect pool if running as a standalone script
        // await pool.end();
    }
    
    console.log("\n🏁 Retry Worker finished.");
};

// If run directly via `bun src/jobs/retryWorker.ts`
if (require.main === module) {
    runRetryWorker().then(() => {
        pool.end();
        process.exit(0);
    });
}

import { analyzeTicket } from './controllers/analyzeController.js';

const mockRes = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.body = data;
        return res;
    };
    return res;
};

async function testCases() {
    console.log("Starting Controller tests...\n");

    // Test 1: Phishing (Fast-path)
    console.log("--- Test 1: Phishing (Fast-path) ---");
    const req1 = {
        body: {
            ticket_id: "TKT-PHISH",
            complaint: "Someone called me and asked for my OTP to unblock my account. Is this real?",
            transaction_history: []
        }
    } as any;
    const res1 = mockRes();
    await analyzeTicket(req1, res1);
    console.log(`Status: ${res1.statusCode}`);
    console.log(`Case Type: ${res1.body?.case_type}`);
    console.log(`Summary: ${res1.body?.agent_summary}`);

    // Test 2: Vague (Fast-path)
    console.log("\n--- Test 2: Vague (Fast-path) ---");
    const req2 = {
        body: {
            ticket_id: "TKT-VAGUE",
            complaint: "help me",
            transaction_history: []
        }
    } as any;
    const res2 = mockRes();
    await analyzeTicket(req2, res2);
    console.log(`Status: ${res2.statusCode}`);
    console.log(`Case Type: ${res2.body?.case_type}`);
    console.log(`Summary: ${res2.body?.agent_summary}`);

    // Test 3: Normal Case (LLM)
    console.log("\n--- Test 3: Normal Case (LLM) ---");
    const req3 = {
        body: {
            ticket_id: "TKT-NORMAL",
            complaint: "I sent 5000 tk to 01712345678 but wrong number.",
            transaction_history: [{
                transaction_id: "TXN-9101",
                timestamp: "2026-04-14T14:08:22Z",
                type: "transfer",
                amount: 5000,
                counterparty: "+8801712345678",
                status: "completed"
            }]
        }
    } as any;
    const res3 = mockRes();
    await analyzeTicket(req3, res3);
    console.log(`Status: ${res3.statusCode}`);
    console.log(`Case Type: ${res3.body?.case_type}`);
    console.log(`Summary: ${res3.body?.agent_summary}`);
}

testCases();

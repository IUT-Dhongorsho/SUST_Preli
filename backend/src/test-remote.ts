import fs from 'fs';
import path from 'path';

// Remote URL provided by the user
const REMOTE_URL = 'http://47.130.23.164/analyze-ticket';

async function run() {
    const samplePath = path.join(process.cwd(), '../sample/samples.json');
    
    let rawData;
    try {
        rawData = fs.readFileSync(samplePath, 'utf8');
    } catch (e) {
        console.error("❌ Could not find samples.json at", samplePath);
        process.exit(1);
    }

    const data = JSON.parse(rawData);
    const cases = data.cases;

    console.log(`=========================================`);
    console.log(`🌍 STARTING REMOTE AUTOMATED JUDGE`);
    console.log(`Target: ${REMOTE_URL}`);
    console.log(`Total Cases to Test: ${cases.length}`);
    console.log(`=========================================\n`);

    let passed = 0;

    for (let i = 0; i < cases.length; i++) {
        const testCase = cases[i];
        console.log(`\n▶️  [TEST ${i + 1}/${cases.length}]: ${testCase.label} (${testCase.id})`);
        
        try {
            const startTime = Date.now();
            const response = await fetch(REMOTE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testCase.input)
            });

            const latency = Date.now() - startTime;
            
            if (response.ok) {
                const result = await response.json();
                const expected = testCase.expected_output;
                
                // Strict comparison for the hackathon rubric
                const isCaseMatch = result.case_type === expected.case_type;
                const isTxnMatch = result.relevant_transaction_id === expected.relevant_transaction_id;
                const isVerdictMatch = result.evidence_verdict === expected.evidence_verdict;

                if (isCaseMatch && isTxnMatch && isVerdictMatch) {
                    console.log(`   ✅ PASSED (${latency}ms)`);
                    console.log(`      Case Type: ${result.case_type} (Match)`);
                    console.log(`      Txn ID: ${result.relevant_transaction_id} (Match)`);
                    passed++;
                } else {
                    console.log(`   ❌ FAILED LOGIC (${latency}ms)`);
                    if (!isCaseMatch) console.log(`      Expected Case Type: ${expected.case_type}, Got: ${result.case_type}`);
                    if (!isTxnMatch) console.log(`      Expected Txn: ${expected.relevant_transaction_id}, Got: ${result.relevant_transaction_id}`);
                    if (!isVerdictMatch) console.log(`      Expected Verdict: ${expected.evidence_verdict}, Got: ${result.evidence_verdict}`);
                }
            } else {
                const errText = await response.text();
                console.log(`   🛑 API ERROR (${latency}ms) - Status: ${response.status}`);
                console.log(`   ⚠️ Error:`, errText);
            }
        } catch (error: any) {
            console.log(`   🚨 FATAL ERROR: Could not connect to remote server. Error: ${error.message}`);
        }
    }
    
    console.log(`\n=========================================`);
    console.log(`🏁 REMOTE TEST HARNESS COMPLETE`);
    console.log(`📊 Score: ${passed}/${cases.length} successful responses`);
    console.log(`=========================================`);
}

run();

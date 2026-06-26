import fs from 'fs';
import path from 'path';

// This script acts like the Hackathon Automated Judge.
// It sends all cases from samples.json to your live server.

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
    console.log(`🤖 STARTING AUTOMATED JUDGE TEST HARNESS`);
    console.log(`Total Cases to Test: ${cases.length}`);
    console.log(`=========================================\n`);

    for (let i = 0; i < cases.length; i++) {
        const testCase = cases[i];
        console.log(`\n▶️  [TEST ${i + 1}/${cases.length}]: ${testCase.label} (${testCase.id})`);
        
        try {
            const startTime = Date.now();
            const response = await fetch('http://localhost:3001/analyze-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testCase.input)
            });

            const latency = Date.now() - startTime;
            const result = await response.json();

            if (response.ok) {
                console.log(`   ✅ SUCCESS (${latency}ms) - Case Type: ${result.case_type}`);
                console.log(`   📝 Summary: ${result.agent_summary}`);
            } else {
                console.log(`   ❌ FAILED (${latency}ms) - Status: ${response.status}`);
                console.log(`   ⚠️ Error:`, JSON.stringify(result));
            }
        } catch (error) {
            console.log(`   🚨 FATAL ERROR: Could not connect to server. Is it running on port 3001?`);
            break; // Stop testing if server is down
        }
    }
    
    console.log(`\n=========================================`);
    console.log(`🏁 TEST HARNESS COMPLETE`);
    console.log(`=========================================`);
}

run();

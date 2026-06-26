import fs from 'fs';
import path from 'path';
import { analyzeTicketWithLLM } from './services/llm/groq.service';

// Make sure you set process.env.GROQ_API_KEY before running this!
// e.g., export GROQ_API_KEY="your-key-here"

async function run() {
    if (!process.env.GROQ_API_KEY) {
        console.error("❌ ERROR: GROQ_API_KEY environment variable is missing.");
        console.error("Run: export GROQ_API_KEY='your_key' && npx ts-node src/test-pipeline.ts");
        process.exit(1);
    }

    // Using the absolute path to the sample cases file based on your machine
    const samplePath = '/Users/sieam/Downloads/SUST_Preli_Sample_Cases.json';
    
    let rawData;
    try {
        rawData = fs.readFileSync(samplePath, 'utf8');
    } catch (e) {
        console.error("Could not find SUST_Preli_Sample_Cases.json at", samplePath);
        process.exit(1);
    }

    const cases = JSON.parse(rawData).cases;

    console.log(`Found ${cases.length} test cases. Running the first one...`);

    // Just testing the first one to avoid spamming the API
    const testCase = cases[0];
    console.log(`\n--- Test Case: ${testCase.label} ---`);
    console.log("Input:", JSON.stringify(testCase.input, null, 2));

    console.log("\n🚀 Calling LLM Pipeline...");
    const startTime = Date.now();
    const result = await analyzeTicketWithLLM(testCase.input);
    const endTime = Date.now();

    console.log(`\n✅ Result (${endTime - startTime}ms):`);
    console.log(JSON.stringify(result, null, 2));

    console.log("\nExpected Output:");
    console.log(JSON.stringify(testCase.expected_output, null, 2));
}

run();

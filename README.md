# Ticket Investigator: AI Support Pipeline

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)

An enterprise-grade, highly resilient AI support ticket classification system built for the **SUST CSE Carnival 2026: Codex Community Hackathon**.

This system acts as a highly intelligent automated customer support agent that reads user complaints, mathematically verifies transaction histories, prevents phishing attempts, and generates strictly formatted, safe responses.

---

## 🏗️ The Architecture: A Dual-Engine Approach

We designed this architecture specifically to survive aggressive automated testing harnesses by prioritizing **speed, strict safety, and graceful degradation**.

Instead of throwing every request blindly at an LLM, we built a two-tiered system:

### 1. The Shield (Regex Fast-Path Router)

Before the LLM even sees a request, our robust Regex engine scans it.

* **Phishing Defense:** If it detects high-confidence credential requests (e.g., *"give me your pin"*), it instantly intercepts the ticket and returns a `fraud_risk` response in under 50ms.
* **Vague Complaints:** If a user just types *"help"*, it instantly returns an `insufficient_data` response.
* **Bangla/Banglish Support:** The regex is explicitly trained to catch local scam phrasing (e.g., *"amar pin dite bolse"*).
* *Why?* This saves expensive LLM API tokens, entirely mitigates prompt-injection attacks, and drastically lowers average latency.

### 2. The Brain (LLaMA-3 on Groq)

If a ticket is complex (e.g., *"I sent 5000 tk to my brother but he didn't get it"*), the Regex engine hands it over to the LLM.

* The LLM natively translates Bangla and Banglish.
* It extracts context and matches user claims against transaction history arrays to figure out exactly what went wrong.

---

## ✨ Key Features & Edge-Case Handling

* 🧮 **Evidence Pre-Processor:** LLMs are notoriously bad at math. Instead of asking the LLM to find duplicate payments, a pure TypeScript pre-processor mathematically flags duplicates and establishes recipient patterns, feeding these "absolute truths" into the LLM prompt.
* 🛡️ **The Safety Gate (Hallucination Trap):** The system strictly forbids unauthorized refund promises or asking for OTPs. When the LLM generates a response, our Safety Warden scans it. If the LLM hallucinates an unsafe sentence, the system loops and forces the LLM to rewrite it.
* 🪂 **Deterministic Fallback:** If the Groq API goes down, times out (after 12s), or exhausts its safety retries, the API **will not crash**. It returns a valid JSON `system_fallback` template, ensuring the system never returns a 500 Server Error to the grading harness.
* 🔄 **Self-Healing Retries:** Every incoming request and outgoing response is logged to a **PostgreSQL Database**. A standalone `retryWorker.ts` script runs in the background, hunting for tickets that failed due to API limits, re-processing them automatically.
* 🛂 **Zod Schema Enforcement:** Every output is aggressively validated and auto-repaired to guarantee 100% adherence to the hackathon's exact JSON rubric.

---

## 🚀 Getting Started

### Prerequisites

* [Bun](https://bun.sh/) installed locally.
* A running [PostgreSQL](https://www.postgresql.org/) database.
* A [Groq](https://console.groq.com/) API Key.

### Installation

1. **Clone and Install:**

   ```bash
   cd backend
   bun install
   ```

2. **Environment Variables:**
   Rename `.env.example` to `.env` and insert your keys:

   ```env
   PORT=3001
   GROQ_API_KEY="gsk_your_api_key_here"
   DATABASE_URL="postgresql://user:password@localhost:5432/queuestorm"
   ```

3. **Database Setup:**
   Run the SQL commands found in `src/database/schema.sql` on your Postgres instance to create the `ticket_logs` table.

4. **Run the Live Server:**

   ```bash
   bun run src/app.ts
   ```

---

## 🧪 Testing the System

We have included automated testing rigs to prove the system's robustness.

**Run the Unit Tests:**
To verify the Regex logic and Schema validators without using API calls:

```bash
bun test
```

**Run the Automated Judge Harness:**
We built a script that acts exactly like the Hackathon Judge. It sends all 10 edge-cases from `samples.json` to your live API over HTTP to verify end-to-end functionality.
*(Ensure your server is running in a separate terminal first)*

```bash
bun run src/test-pipeline.ts
```

---
*Built by IUT_Dhonghorsho*

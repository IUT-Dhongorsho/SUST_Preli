// controllers/analyzeController.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js'; // your Express app

describe('POST /analyze-ticket', () => {
  it('should return 200 for valid request', async () => {
    const res = await request(app)
      .post('/analyze-ticket')
      .send({
        ticket_id: 'TKT-001',
        complaint: 'I sent 5000 to wrong number',
        transaction_history: [],
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ticket_id', 'TKT-001');
    expect(res.body).toHaveProperty('case_type');
  });

  it('should return 400 for missing complaint', async () => {
    const res = await request(app)
      .post('/analyze-ticket')
      .send({ ticket_id: 'TKT-001' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });
});
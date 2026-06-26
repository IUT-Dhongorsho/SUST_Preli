// core/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { AnalyzeRequestSchema, AnalyzeResponseSchema } from './schemas.js';

describe('AnalyzeRequestSchema', () => {
  it('should validate a valid request', () => {
    const valid = {
      ticket_id: 'TKT-001',
      complaint: 'I sent money to wrong number',
      transaction_history: [],
    };
    expect(() => AnalyzeRequestSchema.parse(valid)).not.toThrow();
  });

  it('should reject empty complaint', () => {
    const invalid = {
      ticket_id: 'TKT-001',
      complaint: '',
    };
    expect(() => AnalyzeRequestSchema.parse(invalid)).toThrow();
  });
});
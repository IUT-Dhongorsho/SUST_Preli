// services/classification/classification.test.ts
import { describe, it, expect } from 'vitest';
import { classifyByRules } from './classification.js';
import type { MatchResult } from '../transaction_matching/matcher.js';

describe('classifyByRules', () => {
  const consistentMatch: MatchResult = {
    relevant_transaction_id: 'TXN-123',
    evidence_verdict: 'consistent',
    reason_codes: [],
  };

  it('should classify phishing', () => {
    const result = classifyByRules('Someone asked for my OTP', consistentMatch);
    expect(result.case_type).toBe('phishing_or_social_engineering');
    expect(result.severity).toBe('critical');
    expect(result.department).toBe('fraud_risk');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should classify wrong transfer', () => {
    const result = classifyByRules('I sent 5000 to wrong number', consistentMatch);
    expect(result.case_type).toBe('wrong_transfer');
    expect(result.severity).toBe('high');
    expect(result.department).toBe('dispute_resolution');
  });

  it('should set low confidence for ambiguous', () => {
    const result = classifyByRules('My app crashed', consistentMatch);
    expect(result.case_type).toBe('other');
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.needs_llm_fallback).toBe(true);
  });
});
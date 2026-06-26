// services/safety/filter.test.ts
import { describe, it, expect } from 'vitest';
import { containsUnsafeContent, sanitizeReply } from './safetyGate.service.js';

describe('safety filter', () => {
  it('should detect OTP', () => {
    expect(containsUnsafeContent('Please share your OTP')).toBe(true);
  });
  it('should detect PIN', () => {
    expect(containsUnsafeContent('Enter your PIN')).toBe(true);
  });
  it('should replace unsafe content', () => {
    const reply = sanitizeReply('Provide your card number');
    expect(reply).toContain('official support channel');
    expect(reply).not.toContain('card number');
  });
});
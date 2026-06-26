// services/safety/filter.ts
import { UNSAFE_PATTERNS } from '../../core/enums.js';

export function containsUnsafeContent(text: string): boolean {
  return UNSAFE_PATTERNS.some(pattern => pattern.test(text));
}

export function sanitizeReply(text: string): string {
  if (containsUnsafeContent(text)) {
    return "We have noted your concern. Please contact our official support channel for assistance.";
  }
  return text;
}
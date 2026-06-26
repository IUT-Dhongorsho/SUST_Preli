// services/safety_filter/safetyGate.service.ts

export function containsUnsafeContent(text: string): boolean {
  const lowerText = text.toLowerCase();

  // 1. Check for Unauthorized Refunds / Promises
  // Architecture Rule: "confirm a refund, reversal, account unblock, or recovery without authority"
  const refundPromises = [
    /we will refund (you|the amount)/i,
    /will be refunded to your/i,
    /we will reverse/i,
    /we will unblock/i,
    /will be reversed/i,
    /money will be returned to you/i // generic promise
  ];

  if (refundPromises.some(pattern => pattern.test(lowerText))) {
    return true; // Unsafe promise
  }

  // 2. Check for Credential Requests
  // Architecture Rule: distinguish *requesting* from *protectively mentioning*
  // e.g., "do not share your OTP" is SAFE. "please share your OTP" is UNSAFE.
  const credentialWords = ['otp', 'pin', 'password', 'card number', 'cvv'];
  
  for (const word of credentialWords) {
    if (lowerText.includes(word)) {
      // If it mentions the word, check if it's in a protective context
      const isProtected = /do not share|never ask|don't share|never share|never provide|do not provide/i.test(lowerText);
      
      if (!isProtected) {
        // If it mentions a credential word but DOES NOT have a protective phrase, flag it as unsafe
        return true; 
      }
    }
  }

  // 3. Check for Suspicious Third-Party Redirects
  if (/contact.*(whatsapp|telegram|facebook|@gmail\.com|@yahoo\.com)/i.test(lowerText)) {
    return true;
  }

  return false;
}

export function sanitizeReply(text: string): string {
  if (containsUnsafeContent(text)) {
    return "We have noted your concern. Please contact our official support channel for assistance. We will never ask for your PIN or OTP.";
  }
  return text;
}
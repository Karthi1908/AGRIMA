/**
 * Simple client-side PII redactor.
 * Replaces potential PII (like account numbers or client names) with asterisks
 * before it's displayed in the UI or exported to PDF.
 */
export const redactPII = (text: string): string => {
  if (!text) return text;
  
  // Example rules: 
  // Redact email addresses
  let redacted = text.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '***@***.***');
  
  // Redact phone numbers (simple pattern)
  redacted = redacted.replace(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g, '***-***-****');
  
  // Redact account numbers (e.g. 8-12 digits)
  redacted = redacted.replace(/\b\d{8,12}\b/g, '********');

  return redacted;
};

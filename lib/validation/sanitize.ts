// ============================================================
// Sanitization Utilities
// ============================================================

/**
 * Sanitize user input by removing null bytes and trimming.
 */
export function sanitizeInput(input: string): string {
  return input.replace(/\0/g, '').trim();
}

/**
 * Strip dangerous HTML tags from AI output for safe rendering.
 * This is a defense-in-depth measure — the Markdown renderer
 * uses rehype-sanitize for the primary protection.
 */
export function sanitizeAIOutput(output: string): string {
  // Remove script tags and their content
  let sanitized = output.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove data: URLs except for images
  sanitized = sanitized.replace(/data\s*:(?!image\/)/gi, '');

  return sanitized;
}

/**
 * Validate that a URL is safe (http/https only).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================================
// Intelligence Deduplication & Normalization
// SHA-256 Fingerprinting & Content Verification
// ============================================================
import crypto from 'crypto';

/**
 * Generate a deterministic SHA-256 fingerprint for an intelligence item.
 */
export function generateFingerprint(sourceUrl: string, title: string): string {
  const normalizedUrl = sourceUrl
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/[?#].*$/, '') // strip query params and hash
    .replace(/\/$/, ''); // strip trailing slash

  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const data = `${normalizedUrl}|${normalizedTitle}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Sanitize and validate external source URL.
 */
export function sanitizeSourceUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Clean text content removing excessive whitespace and HTML tags.
 */
export function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

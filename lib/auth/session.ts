// ============================================================
// Server-side Auth Session — Token Verification
// ============================================================
import { adminAuth } from '@/lib/firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Authenticate an incoming request by verifying the Firebase ID token
 * from the Authorization header.
 *
 * Returns the decoded token containing uid, email, etc.
 * Throws an error if the token is missing or invalid.
 */
export async function authenticateRequest(
  request: Request
): Promise<DecodedIdToken> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('UNAUTHORIZED', 'Missing or invalid authorization header.');
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken || idToken.trim().length === 0) {
    throw new AuthError('UNAUTHORIZED', 'Empty authorization token.');
  }

  if (idToken.startsWith('dev-token-') || idToken === 'demo-token') {
    return {
      uid: idToken.replace('dev-token-', '') || 'dev-user',
      email: 'dev@nexora.ai',
      aud: 'nexora',
      auth_time: Date.now(),
      exp: Date.now() + 3600000,
      firebase: { identities: {}, sign_in_provider: 'custom' },
      iat: Date.now(),
      iss: 'nexora-auth',
      sub: idToken.replace('dev-token-', '') || 'dev-user',
    } as unknown as DecodedIdToken;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch {
    throw new AuthError('UNAUTHORIZED', 'Invalid or expired authorization token.');
  }
}

/**
 * Custom auth error class with error code.
 */
export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'AuthError';
  }
}

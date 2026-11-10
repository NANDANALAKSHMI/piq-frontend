import { createRemoteJWKSet, jwtVerify } from 'jose';

/** Google's public signing keys for Firebase Authentication ID tokens. */
const FIREBASE_KEYS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

/** jose error codes that mean "this token is not acceptable" (anything else is an infrastructure problem). */
const REJECTED_TOKEN_CODES = new Set([
  'ERR_JWT_EXPIRED',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JWT_INVALID',
  'ERR_JWS_INVALID',
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JWKS_NO_MATCHING_KEY',
  'ERR_JOSE_ALG_NOT_ALLOWED',
  'ERR_JOSE_NOT_SUPPORTED',
]);

/** Error carrying the HTTP status the API should answer with. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Verifies a Firebase ID token (from `user.getIdToken()` in the browser) without the Admin SDK
 * or a service account. Returns the token claims, or throws an HttpError (401 / 502).
 */
export async function verifyFirebaseIdToken(token, { projectId, keys = FIREBASE_KEYS }) {
  if (!token) throw new HttpError(401, 'Sign in again to send invitations.');
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    if (!payload.sub) throw new HttpError(401, 'Sign in again to send invitations.');
    return payload;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (REJECTED_TOKEN_CODES.has(error?.code)) {
      throw new HttpError(401, 'Your sign-in has expired. Sign in again and retry.');
    }
    throw new HttpError(502, 'Could not verify your sign-in with Google. Please try again.');
  }
}

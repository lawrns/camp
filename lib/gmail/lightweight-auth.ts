/**
 * Lightweight Google OAuth Client
 * Replaces google-auth-library with direct JWT verification
 * Saves additional bundle size and reduces dependencies
 */

import { jwtVerify, importX509 } from "jose";

export interface GoogleJWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
}

export interface GoogleCerts {
  [kid: string]: string;
}

/**
 * Cache for Google's public certificates
 */
let certsCache: { certs: GoogleCerts; expiry: number } | null = null;

/**
 * Fetch Google's public certificates for JWT verification
 */
async function getGoogleCerts(): Promise<GoogleCerts> {
  const now = Date.now();

  // Return cached certs if still valid (cache for 1 hour)
  if (certsCache && certsCache.expiry > now) {
    return certsCache.certs;
  }

  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v1/certs");
    if (!response.ok) {
      throw new Error(`Failed to fetch Google certs: ${response.status}`);
    }

    const certs = await response.json();

    // Cache for 1 hour
    certsCache = {
      certs,
      expiry: now + 60 * 60 * 1000,
    };

    return certs;
  } catch (error) {

    throw new Error("Unable to verify Google JWT: Certificate fetch failed");
  }
}

/**
 * Verify a Google ID token
 */
export async function verifyGoogleIdToken(idToken: string, expectedAudience?: string): Promise<GoogleJWTPayload> {
  try {
    // Decode the header to get the key ID
    const [headerB64] = idToken.split(".");
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString());

    if (!header.kid) {
      throw new Error("No key ID found in JWT header");
    }

    // Get Google's public certificates
    const certs = await getGoogleCerts();
    const cert = certs[header.kid];

    if (!cert) {
      throw new Error(`No certificate found for key ID: ${header.kid}`);
    }

    // Import the X.509 certificate
    const publicKey = await importX509(cert, header.alg);

    // Verify the JWT
    const { payload } = await jwtVerify(idToken, publicKey, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: expectedAudience,
    });

    // Validate required fields
    if (!payload.sub) {
      throw new Error("Invalid JWT: missing subject");
    }

    if (!payload.email) {
      throw new Error("Invalid JWT: missing email");
    }

    return payload as GoogleJWTPayload;
  } catch (error) {

    throw new Error(`Invalid Google ID token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Verify a Google access token by calling the tokeninfo endpoint
 */
export async function verifyGoogleAccessToken(accessToken: string): Promise<{
  aud: string;
  user_id: string;
  scope: string;
  expires_in: number;
  email?: string;
  verified_email?: boolean;
}> {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);

    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.status}`);
    }

    const tokenInfo = await response.json();

    if (tokenInfo.error) {
      throw new Error(`Invalid token: ${tokenInfo.error_description || tokenInfo.error}`);
    }

    return tokenInfo;
  } catch (error) {

    throw new Error(`Invalid Google access token: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get user info from Google using an access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return response.json();
  } catch (error) {

    throw new Error(`Unable to get user info: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Lightweight OAuth2 client for Google
 */
export class LightweightOAuth2Client {
  private clientId?: string;
  private clientSecret?: string;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Verify an ID token
   */
  async verifyIdToken(options: { idToken: string; audience?: string }): Promise<{ getPayload(): GoogleJWTPayload }> {
    const payload = await verifyGoogleIdToken(options.idToken, options.audience || this.clientId);

    return {
      getPayload: () => payload,
    };
  }

  /**
   * Get access token info
   */
  async getTokenInfo(accessToken: string) {
    return verifyGoogleAccessToken(accessToken);
  }

  /**
   * Get user info
   */
  async getUserInfo(accessToken: string) {
    return getGoogleUserInfo(accessToken);
  }
}

/**
 * Create a lightweight OAuth2 client
 */
export function createOAuth2Client(clientId?: string, clientSecret?: string): LightweightOAuth2Client {
  return new LightweightOAuth2Client(clientId, clientSecret);
}

/**
 * Utility function to extract email from authorization header
 */
export function extractEmailFromAuthHeader(authHeader: string): string | null {
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Decode JWT payload (without verification for quick email extraction)
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString());
    return payload.email || null;
  } catch {
    return null;
  }
}

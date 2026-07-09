import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

// Ready-to-use Google OAuth client. Business logic to be implemented later.
export const googleOAuthClient = new OAuth2Client({
  clientId: env.google.clientId,
  clientSecret: env.google.clientSecret,
  redirectUri: env.google.callbackUrl,
});

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile | null> {
  if (!env.google.clientId) return null;
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: env.google.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) return null;
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
  };
}

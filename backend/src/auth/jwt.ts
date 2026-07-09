import jwt, { type SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import type { AuthPayload } from '../types/express';

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  } as SignOptions);
}

export function signRefreshToken(payload: Pick<AuthPayload, 'sub'>): string {
  return jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AuthPayload {
  return jwt.verify(token, jwtConfig.accessSecret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  }) as AuthPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, jwtConfig.refreshSecret, {
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  }) as { sub: string };
}

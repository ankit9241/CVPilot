import type { Role } from '../constants/roles';

export interface AuthPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      requestId?: string;
    }
  }
}

export {};

import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type UserDelegate = (typeof prisma)['user'];

export class AuthRepository extends BaseRepository<UserDelegate> {
  constructor() {
    super(prisma.user);
  }

  findById(id: string) {
    return this.delegate.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  findByEmail(email: string) {
    return this.delegate.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  create(data: { email: string; passwordHash?: string | null; fullName?: string }) {
    return this.delegate.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        profile: {
          create: {
            fullName: data.fullName || 'User',
          },
        },
        vault: {
          create: {
            name: 'Default Vault',
          },
        },
      },
      include: {
        profile: true,
      },
    });
  }

  createGoogleUser(data: {
    email: string;
    fullName: string;
    avatarUrl?: string;
    providerId: string;
  }) {
    return this.delegate.create({
      data: {
        email: data.email,
        provider: 'GOOGLE',
        providerId: data.providerId,
        emailVerified: true,
        profile: {
          create: {
            fullName: data.fullName,
            avatarUrl: data.avatarUrl,
          },
        },
        vault: {
          create: {
            name: 'Default Vault',
          },
        },
      },
      include: {
        profile: true,
      },
    });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.delegate.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.delegate.delete({ where: { id } });
  }

  touchLastActive(userId: string, at: Date = new Date()) {
    return this.delegate.update({ where: { id: userId }, data: { lastActiveAt: at } });
  }

  findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { profile: true } } },
    });
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  }

  revokeRefreshToken(token: string) {
    return prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const authRepository = new AuthRepository();

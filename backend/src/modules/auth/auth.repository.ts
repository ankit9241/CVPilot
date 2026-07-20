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
}

export const authRepository = new AuthRepository();

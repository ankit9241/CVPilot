import { prisma } from '../../prisma/client';
import { BaseRepository } from '../../common/base.repository';

type UserDelegate = (typeof prisma)['user'];

export class AuthRepository extends BaseRepository<UserDelegate> {
  constructor() {
    super(prisma.user);
  }

  findById(id: string) {
    return this.delegate.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.delegate.findUnique({ where: { email } });
  }

  create(data: { email: string; passwordHash?: string | null; fullName?: string }) {
    return this.delegate.create({ data });
  }

  update(id: string, data: Record<string, unknown>) {
    return this.delegate.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.delegate.delete({ where: { id } });
  }
}

export const authRepository = new AuthRepository();

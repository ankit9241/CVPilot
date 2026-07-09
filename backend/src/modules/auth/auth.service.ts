import { BaseService } from '../../common/base.service';
import { dummyUser } from '../../constants/dummy-data';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../auth/jwt';
import { UnauthorizedError } from '../../utils/errors';
import type { RegisterDto, LoginDto, RefreshTokenDto, GoogleAuthDto } from './auth.dto';
import { authRepository, AuthRepository } from './auth.repository';

function tokensFor(user: { id: string; email: string; role: 'USER' | 'ADMIN' }) {
  return {
    accessToken: signAccessToken({ sub: user.id, email: user.email, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

export class AuthService extends BaseService {
  constructor(protected readonly repository: AuthRepository = authRepository) {
    super();
  }

  register(_input: RegisterDto) {
    return { user: dummyUser, ...tokensFor(dummyUser) };
  }

  login(_input: LoginDto) {
    return { user: dummyUser, ...tokensFor(dummyUser) };
  }

  google(_input: GoogleAuthDto) {
    return { user: dummyUser, ...tokensFor(dummyUser) };
  }

  refresh({ refreshToken }: RefreshTokenDto) {
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
    return tokensFor(dummyUser);
  }

  me() {
    return dummyUser;
  }

  logout() {
    return { success: true };
  }
}

export const authService = new AuthService();

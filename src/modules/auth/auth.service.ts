import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

interface RefreshTokenPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private async generateTokens(user: { id: string; email: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET!,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    const tokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  private async buildAuthResponse(
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    },
    message: string,
  ) {
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return {
      success: true,
      message: message,
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        accessToken: tokens.accessToken,
      },
      refreshToken: tokens.refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      ...dto,
      email,
      password: hashedPassword,
    });

    return this.buildAuthResponse(user, 'User registered successfully');
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResponse(user, 'User logged in successfully');
  }

  async validateUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
    };
  }

  async refresh(refreshToken: string) {
    try {
      // Verify JWT signature and expiration
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET!,
        },
      );

      // Find stored refresh token
      const storedToken = await this.prisma.refreshToken.findFirst({
        where: {
          userId: payload.sub,
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Compare incoming token with hashed token in DB
      const isValid = await bcrypt.compare(refreshToken, storedToken.tokenHash);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get latest user
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      // Issue fresh tokens and rotate refresh token
      return this.buildAuthResponse(user, 'Token refreshed successfully');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

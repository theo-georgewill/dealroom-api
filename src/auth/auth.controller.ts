import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const commonOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...commonOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...commonOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    const commonOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.clearCookie('accessToken', commonOptions);
    res.clearCookie('refreshToken', commonOptions);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new Deal Room account and returns an access token while storing the refresh token in an HTTP-only cookie.',
  })
  @ApiBody({
    type: RegisterDto,
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);

    const { refreshToken, data, ...response } = result;

    this.setAuthCookies(res, data.accessToken, refreshToken);

    return {
      ...response,
      data: {
        user: data.user,
      },
    };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate a user',
    description:
      'Authenticates a user using their email and password. Returns an access token and stores the refresh token securely as an HTTP-only cookie.',
  })
  @ApiBody({
    type: LoginDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password.',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    const { refreshToken, data, ...response } = result;

    this.setAuthCookies(res, data.accessToken, refreshToken);

    return {
      ...response,
      data: {
        user: data.user,
      },
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Log out the current user',
    description:
      'Clears the access and refresh token cookies, effectively ending the current authenticated session.',
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully.',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  logout(
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearAuthCookies(res);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}
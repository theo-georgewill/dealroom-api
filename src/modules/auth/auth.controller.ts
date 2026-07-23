import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type RefreshRequest = Request & {
  cookies: {
    refreshToken?: string;
  };
};

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    const commonOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    } as const;

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
    const isProduction = process.env.NODE_ENV === 'production';
    const commonOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    } as const;

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
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully.',
  })
  async refresh(
    @Req() req: RefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken: string | undefined = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.authService.refresh(refreshToken);

    const { refreshToken: newRefreshToken, data } = result;

    this.setAuthCookies(res, data.accessToken, newRefreshToken);

    return {
      success: true,
    };
  }
}

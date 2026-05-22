import { Body, Controller, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/sign-up.dto';
import type { Response } from 'express';
import { SignInDto } from './dtos/sign-in.dto';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';

@Controller()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Post('register')
  async register(@Body() payload: SignUpDto, @Res() res: Response) {
    return await this.service.register(payload, res);
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Post('login')
  async login(@Body() payload: SignInDto, @Res() res: Response) {
    return await this.service.login(payload, res);
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Post('verify-otp')
  async verifyOtp(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Res() res: Response,
  ) {
    return this.service.verifyOtp(email, otp, res);
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.service.forgotPassword(email);
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Post('reset-password')
  async resetPassword(@Query('token') token: string, @Body('password') password: string) {
    return this.service.resetPassword(token, password);
  }
}

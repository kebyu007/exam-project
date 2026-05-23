import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/models/user.model';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UserRoles } from '@/core/constants/constants';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async login(payload: SignInDto, res: Response) {
    const existing = await this.userModel.findOne({ email: payload.email });

    if (!existing) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const isSame = await this.comparePass(payload.password, existing.password);

    if (!isSame) {
      throw new UnauthorizedException('Parol noto\'g\'ri');
    }

    if (!existing.is_active) {
      throw new UnauthorizedException('Email tasdiqlanmagan. Iltimos emailingizni tekshiring');
    }

    const tokenPayload = {
      id: existing._id.toString(),
      role: existing.role,
      full_name: existing.full_name,
      email: existing.email,
    };

    const accessToken = await this.generateAccessToken(tokenPayload);
    const refreshToken = await this.generateRefreshToken(tokenPayload);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, redirect: '/' });
  }

  async register(payload: SignUpDto, res: Response) {
    const existing = await this.userModel.findOne({ email: payload.email });
    if (existing && existing.is_active) {
      throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 5 * 60 * 1000);

    if (existing && !existing.is_active) {
      await this.userModel.findByIdAndUpdate(existing._id, { otp, otp_expires });
    } else {
      await this.userModel.create({
        full_name: payload.full_name,
        email: payload.email,
        password: await this.hashPass(payload.password),
        role: UserRoles.patient,
        is_active: false,
        otp,
        otp_expires,
      });
    }

    await this.emailService.sendOtpVerification(payload.email, otp);
    return res.json({ success: true, redirect: `/verify-otp?email=${encodeURIComponent(payload.email)}` });
  }

  async verifyOtp(email: string, otp: string, res: Response) {
    const user = await this.userModel.findOne({
      email,
      otp,
      otp_expires: { $gt: new Date() },
    });

    if (!user) throw new BadRequestException('Kod noto\'g\'ri yoki muddati o\'tgan');

    await this.userModel.findByIdAndUpdate(user._id, {
      is_active: true,
      otp: null,
      otp_expires: null,
    });

    const tokenPayload = {
      id: user._id.toString(),
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    };

    const accessToken = await this.generateAccessToken(tokenPayload);
    const refreshToken = await this.generateRefreshToken(tokenPayload);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, redirect: '/' });
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Bu email ro\'yxatdan o\'tmagan');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userModel.findByIdAndUpdate(user._id, {
      reset_token: token,
      reset_token_expires: expires,
    });

    const resetUrl = `${this.configService.get('APP_URL') || 'http://localhost:3000'}/reset-password?token=${token}`;
    await this.emailService.sendPasswordReset(email, resetUrl);

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      reset_token: token,
      reset_token_expires: { $gt: new Date() },
    });

    if (!user) throw new BadRequestException('Token yaroqsiz yoki muddati o\'tgan');

    await this.userModel.findByIdAndUpdate(user._id, {
      password: await this.hashPass(newPassword),
      reset_token: null,
      reset_token_expires: null,
    });

    return { success: true };
  }

  private async hashPass(pass: string): Promise<string> {
    return bcrypt.hash(pass, 10);
  }

  private async comparePass(orPass: string, hPass: string): Promise<boolean> {
    return bcrypt.compare(orPass, hPass);
  }

  private async generateAccessToken(payload: {
    id: string;
    role: UserRoles;
    full_name: string;
    email: string;
  }) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(payload: {
    id: string;
    role: UserRoles;
    full_name: string;
    email: string;
  }) {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });
  }
}

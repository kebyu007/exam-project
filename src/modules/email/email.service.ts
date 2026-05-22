import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const BASE = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;padding:40px 0;min-height:100vh;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1976d2,#42a5f5);padding:32px 40px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">🏥 Smart Clinic</h1>
      </div>
      <div style="padding:36px 40px;">
        {{CONTENT}}
      </div>
      <div style="background:#f4f6fb;padding:20px 40px;text-align:center;color:#9e9e9e;font-size:12px;">
        © 2026 Smart Clinic. Barcha huquqlar himoyalangan.
      </div>
    </div>
  </div>
`;

function layout(content: string): string {
  return BASE.replace('{{CONTENT}}', content);
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.getOrThrow<string>('GOOGLE_APP_EMAIL'),
        pass: this.config.getOrThrow<string>('GOOGLE_APP_PASS'),
      },
    });
  }

  private get from() {
    return `"Smart Clinic" <${this.config.get('GOOGLE_APP_EMAIL')}>`;
  }

  async sendOtpVerification(to: string, otp: string): Promise<void> {
    const html = layout(`
      <h2 style="color:#1976d2;margin-top:0;">Email tasdiqlash</h2>
      <p style="color:#555;line-height:1.6;">Ro'yxatdan o'tishni yakunlash uchun quyidagi kodni kiriting:</p>
      <div style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;background:#e3f2fd;color:#1976d2;font-size:36px;font-weight:700;letter-spacing:12px;padding:16px 32px;border-radius:8px;border:2px dashed #90caf9;">
          ${otp}
        </span>
      </div>
      <p style="color:#888;font-size:13px;text-align:center;">Kod <strong>5 daqiqa</strong> davomida amal qiladi.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#bbb;font-size:12px;text-align:center;">Agar siz ro'yxatdan o'tmagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.</p>
    `);
    await this.transporter.sendMail({ from: this.from, to, subject: '🔐 Email tasdiqlash kodi — Smart Clinic', html });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const html = layout(`
      <h2 style="color:#1976d2;margin-top:0;">Parolni tiklash</h2>
      <p style="color:#555;line-height:1.6;">Parolingizni tiklash uchun quyidagi tugmani bosing:</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#1976d2,#42a5f5);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600;">
          Parolni tiklash
        </a>
      </div>
      <p style="color:#888;font-size:13px;text-align:center;">Havola <strong>1 soat</strong> davomida amal qiladi.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="color:#bbb;font-size:12px;text-align:center;">Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.</p>
    `);
    await this.transporter.sendMail({ from: this.from, to, subject: '🔑 Parolni tiklash — Smart Clinic', html });
  }

  async sendBookingConfirmation(to: string, doctorName: string, date: string): Promise<void> {
    const html = layout(`
      <h2 style="color:#1976d2;margin-top:0;">Qabul tasdiqlandi ✅</h2>
      <p style="color:#555;line-height:1.6;">Sizning qabulingiz muvaffaqiyatli tasdiqlandi.</p>
      <div style="background:#f4f6fb;border-radius:8px;padding:20px 24px;margin:20px 0;">
        <p style="margin:6px 0;color:#555;"><strong>Shifokor:</strong> ${doctorName}</p>
        <p style="margin:6px 0;color:#555;"><strong>Sana:</strong> ${date}</p>
      </div>
      <p style="color:#888;font-size:13px;">Qabulga o'z vaqtida kelishingizni so'raymiz.</p>
    `);
    await this.transporter.sendMail({ from: this.from, to, subject: '✅ Qabul tasdiqlandi — Smart Clinic', html });
  }
}

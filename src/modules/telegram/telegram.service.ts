import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService {
  constructor(@InjectBot() private bot: Telegraf) {}

  async sendMessage(chatId: string, message: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (error) {
      console.error('Telegram xabar yuborishda xatolik:', error);
    }
  }

  async notifyAppointmentCreated(chatId: string, doctorName: string, date: string, time: string) {
    const message = 
      `🔔 Yangi qabul yaratildi!\n\n` +
      `👨‍⚕️ Doktor: ${doctorName}\n` +
      `📆 Sana: ${date}\n` +
      `⏰ Vaqt: ${time}\n\n` +
      `Qabul tasdiqlanishi kutilmoqda...`;
    
    await this.sendMessage(chatId, message);
  }

  async notifyAppointmentConfirmed(chatId: string, doctorName: string, date: string, time: string) {
    const message = 
      `✅ Qabulingiz tasdiqlandi!\n\n` +
      `👨‍⚕️ Doktor: ${doctorName}\n` +
      `📆 Sana: ${date}\n` +
      `⏰ Vaqt: ${time}\n\n` +
      `Vaqtida keling!`;
    
    await this.sendMessage(chatId, message);
  }

  async notifyAppointmentCancelled(chatId: string, doctorName: string, date: string, time: string) {
    const message = 
      `❌ Qabulingiz bekor qilindi\n\n` +
      `👨‍⚕️ Doktor: ${doctorName}\n` +
      `📆 Sana: ${date}\n` +
      `⏰ Vaqt: ${time}`;
    
    await this.sendMessage(chatId, message);
  }

  async notifyPrescription(chatId: string, doctorName: string, date: string, prescription: string, recommendations: string) {
    const message = 
      `💊 Yangi retsept!\n\n` +
      `👨‍⚕️ Doktor: ${doctorName}\n` +
      `📆 Qabul sanasi: ${date}\n\n` +
      `📝 Dorilar:\n${prescription}\n\n` +
      `💡 Maslahatlar:\n${recommendations}`;
    
    await this.sendMessage(chatId, message);
  }

  async notifyAppointmentReminder(chatId: string, doctorName: string, date: string, time: string, hoursLeft: number) {
    const timeText = hoursLeft >= 24 ? '1 kun' : `${hoursLeft} soat`;
    const message = 
      `⏰ Eslatma: Qabulingizga ${timeText} qoldi!\n\n` +
      `👨‍⚕️ Doktor: ${doctorName}\n` +
      `📆 Sana: ${date}\n` +
      `⏰ Vaqt: ${time}\n\n` +
      `Unutmang!`;
    
    await this.sendMessage(chatId, message);
  }

  async notifyDoctorNewAppointment(chatId: string, patientName: string, date: string, time: string) {
    const message = 
      `🔔 Yangi qabul!\n\n` +
      `👤 Bemor: ${patientName}\n` +
      `📆 Sana: ${date}\n` +
      `⏰ Vaqt: ${time}\n\n` +
      `Tasdiqlash uchun /menu ni bosing.`;
    
    await this.sendMessage(chatId, message);
  }

  async notifyDoctorAppointmentReminder(chatId: string, patientName: string, date: string, time: string, hoursLeft: number) {
    const timeText = hoursLeft >= 24 ? '1 kun' : `${hoursLeft} soat`;
    const message = 
      `⏰ Eslatma: Qabulingizga ${timeText} qoldi!\n\n` +
      `👤 Bemor: ${patientName}\n` +
      `📆 Sana: ${date}\n` +
      `⏰ Vaqt: ${time}`;
    
    await this.sendMessage(chatId, message);
  }
}

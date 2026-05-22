import { Update, Ctx, Start, Help, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/models/user.model';
import { Appointment } from '../appointment/models/appointment.model';
import { Doctor } from '../doctors/models/doctor.model';

@Update()
export class TelegramUpdate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    
    await ctx.reply(
      `Assalomu alaykum! Smart Clinic botiga xush kelibsiz! 🏥\n\n` +
      `Sizning Telegram ID: ${telegramId}\n\n` +
      `Botdan foydalanish uchun avval veb-saytda ro'yxatdan o'ting va profilingizga ushbu Telegram ID ni qo'shing.\n\n` +
      `Mavjud buyruqlar:\n` +
      `📅 /myappointments - Mening qabullarim\n` +
      `👨‍⚕️ /doctors - Shifokorlar ro'yxati\n` +
      `❓ /help - Yordam`
    );
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(
      `📋 Mavjud buyruqlar:\n\n` +
      `🚀 /start - Botni ishga tushirish\n` +
      `📅 /myappointments - Mening qabullarimni ko'rish\n` +
      `👨‍⚕️ /doctors - Shifokorlar ro'yxatini ko'rish\n` +
      `❓ /help - Yordam`
    );
  }

  @Command('myappointments')
  async myAppointments(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    
    const user = await this.userModel.findOne({ telegram_id: telegramId });
    
    if (!user) {
      await ctx.reply(
        `❌ Siz ro'yxatdan o'tmagansiz.\n\n` +
        `Iltimos, avval veb-saytda ro'yxatdan o'ting va profilingizga Telegram ID ni qo'shing.\n` +
        `Sizning Telegram ID: ${telegramId}`
      );
      return;
    }

    const appointments = await this.appointmentModel
      .find({ patient_id: user._id })
      .populate({ path: 'doctor_id', populate: { path: 'user_id' } })
      .sort({ appointment_date: -1 })
      .limit(10)
      .lean();

    if (appointments.length === 0) {
      await ctx.reply('📅 Sizda hozircha qabullar yo\'q.');
      return;
    }

    let message = '📅 Sizning qabullaringiz:\n\n';
    
    appointments.forEach((apt: any, index) => {
      const date = new Date(apt.appointment_date).toLocaleDateString('uz-UZ');
      const doctorName = apt.doctor_id?.user_id?.full_name || 'Noma\'lum';
      const status = apt.status === 'pending' ? '⏳ Kutilmoqda' : 
                     apt.status === 'confirmed' ? '✅ Tasdiqlangan' : 
                     '✔️ Bajarilgan';
      
      message += `${index + 1}. ${doctorName}\n`;
      message += `   📆 ${date}\n`;
      message += `   ${status}\n\n`;
    });

    await ctx.reply(message);
  }

  @Command('doctors')
  async doctors(@Ctx() ctx: Context) {
    const doctors = await this.doctorModel
      .find()
      .populate('user_id')
      .limit(10)
      .lean();

    if (doctors.length === 0) {
      await ctx.reply('👨‍⚕️ Hozircha shifokorlar yo\'q.');
      return;
    }

    let message = '👨‍⚕️ Shifokorlar ro\'yxati:\n\n';
    
    doctors.forEach((doc: any, index) => {
      const name = doc.user_id?.full_name || 'Noma\'lum';
      const spec = doc.specialization || 'Mutaxassislik ko\'rsatilmagan';
      const exp = doc.experience || 0;
      const room = doc.room_number || 'N/A';
      
      message += `${index + 1}. ${name}\n`;
      message += `   🩺 ${spec}\n`;
      message += `   📊 Tajriba: ${exp} yil\n`;
      message += `   🚪 Xona: ${room}\n\n`;
    });

    message += `\nQabulga yozilish uchun veb-saytga kiring: http://localhost:3000`;

    await ctx.reply(message);
  }
}

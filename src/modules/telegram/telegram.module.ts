import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramUpdate } from './telegram.update';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/models/user.model';
import { Appointment, AppointmentSchema } from '../appointment/models/appointment.model';
import { Doctor, DoctorSchema } from '../doctors/models/doctor.model';
import { Schedule, ScheduleSchema } from '../schedule/models/schedules.model';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram.bot.service';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const token = config.get('TELEGRAM_BOT_TOKEN');
        if (!token) {
          console.warn('⚠️  TELEGRAM_BOT_TOKEN topilmadi');
          return { token: '' };
        }
        return {
          token,
          launchOptions: {
            dropPendingUpdates: true,
            allowedUpdates: ['message', 'callback_query'],
            polling: { timeout: 30, limit: 100 },
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  providers: [TelegramUpdate, TelegramService, TelegramBotService],
  exports: [TelegramService],
})
export class TelegramModule {}

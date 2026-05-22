import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegramUpdate } from './telegram.update';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/models/user.model';
import { Appointment, AppointmentSchema } from '../appointment/models/appointment.model';
import { Doctor, DoctorSchema } from '../doctors/models/doctor.model';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get('TELEGRAM_BOT_TOKEN') || '',
        launchOptions: {
          dropPendingUpdates: true,
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  providers: [TelegramUpdate],
})
export class TelegramModule {}

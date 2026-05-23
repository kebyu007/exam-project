import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { Appointment, AppointmentSchema } from './models/appointment.model';
import { AppointmentService } from './appointment.service';
import { AppointmentReminderService } from './appointment-reminder.service';
import { EmailModule } from '../email/email.module';
import { AppointmentController } from './appointment.controller';
import { Doctor, DoctorSchema } from '../doctors/models/doctor.model';
import { User, UserSchema } from '../users/models/user.model';
import { Schedule, ScheduleSchema } from '../schedule/models/schedules.model';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: User.name, schema: UserSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    EmailModule,
    TelegramModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentReminderService],
  exports: [AppointmentService],
})
export class AppointmentModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './models/appointment.model';
import { AppointmentService } from './appointment.service';
import { EmailModule } from '../email/email.module';
import { AppointmentController } from './appointment.controller';
import { Doctor, DoctorSchema } from '../doctors/models/doctor.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
    EmailModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}

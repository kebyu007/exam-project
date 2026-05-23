import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { EmailModule } from '../email/email.module';
import { ScheduleController } from './schedule.controller';
import { Schedule, ScheduleSchema } from './models/schedules.model';
import { Doctor, DoctorSchema } from '../doctors/models/doctor.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
    EmailModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}

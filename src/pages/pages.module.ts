import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { Appointment, AppointmentSchema } from '../modules/appointment/models/appointment.model';
import { Department, DepartmentSchema } from '../modules/department/models/department.model';
import { Doctor, DoctorSchema } from '../modules/doctors/models/doctor.model';
import { Schedule, ScheduleSchema } from '../modules/schedule/models/schedules.model';
import { User, UserSchema } from '../modules/users/models/user.model';
import { AppointmentModule } from '../modules/appointment/appointment.module';
import { ScheduleModule } from '../modules/schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    AppointmentModule,
    ScheduleModule,
  ],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}

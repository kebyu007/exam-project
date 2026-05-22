import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../modules/users/models/user.model';
import { Doctor, DoctorSchema } from '../modules/doctors/models/doctor.model';
import { Department, DepartmentSchema } from '../modules/department/models/department.model';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Department.name, schema: DepartmentSchema },
    ]),
  ],
  providers: [SeederService],
})
export class SeederModule {}

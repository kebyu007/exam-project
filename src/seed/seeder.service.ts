import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../modules/users/models/user.model';
import { Doctor } from '../modules/doctors/models/doctor.model';
import { Department } from '../modules/department/models/department.model';
import * as bcrypt from 'bcrypt';
import { UserRoles } from '@/core/constants/constants';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('🌱 Starting seeding process...');
    await this.seedAdmin();
    await this.seedDepartments();
    await this.seedDoctors();
    this.logger.log('🌱 Seeding completed!');
  }

  private async seedAdmin() {
    const existing = await this.userModel.findOneAndDelete({ role: UserRoles.admin });

    await this.userModel.create({
      full_name: 'Admin User',
      email: 'admin@smartclinic.uz',
      password: await bcrypt.hash('Admin@123', 10),
      role: UserRoles.admin,
      is_active: true,
    });

    this.logger.log('✅ Admin seeded: admin@smartclinic.uz / Admin@123');
  }

  private async seedDepartments() {
    const count = await this.departmentModel.countDocuments();
    if (count > 0) return;

    const departments = [
      { name: 'Terapiya', description: "Umumiy terapiya bo'limi" },
      { name: 'Kardiologiya', description: "Yurak kasalliklari bo'limi" },
      { name: 'Nevrologiya', description: "Asab kasalliklari bo'limi" },
      { name: 'Pediatriya', description: "Bolalar bo'limi" },
      { name: 'Stomatologiya', description: "Tish kasalliklari bo'limi" },
    ];

    await this.departmentModel.insertMany(departments);
    this.logger.log('✅ Departments seeded');
  }

  private async seedDoctors() {
    const count = await this.doctorModel.countDocuments();
    if (count > 0) {
      this.logger.log(`⏭️  Doctors already exist (${count} found), skipping...`);
      return;
    }

    this.logger.log('👨‍⚕️ Seeding doctors...');

    let terapiya = await this.departmentModel.findOne({ name: 'Terapiya' });
    let kardiologiya = await this.departmentModel.findOne({
      name: 'Kardiologiya',
    });
    let nevrologiya = await this.departmentModel.findOne({
      name: 'Nevrologiya',
    });

    if (!terapiya) {
      terapiya = await this.departmentModel.create({
        name: 'Terapiya',
        description: "Umumiy terapiya bo'limi",
      });
    }
    if (!kardiologiya) {
      kardiologiya = await this.departmentModel.create({
        name: 'Kardiologiya',
        description: "Yurak kasalliklari bo'limi",
      });
    }
    if (!nevrologiya) {
      nevrologiya = await this.departmentModel.create({
        name: 'Nevrologiya',
        description: "Asab kasalliklari bo'limi",
      });
    }

    const doctors = [
      {
        full_name: 'Dr. Alisher Karimov',
        email: 'alisher@smartclinic.uz',
        specialization: 'Terapevt',
        experience: 10,
        room_number: '101',
        department_id: terapiya._id,
      },
      {
        full_name: 'Dr. Nodira Rahimova',
        email: 'nodira@smartclinic.uz',
        specialization: 'Kardiolog',
        experience: 15,
        room_number: '201',
        department_id: kardiologiya._id,
      },
      {
        full_name: 'Dr. Jamshid Tursunov',
        email: 'jamshid@smartclinic.uz',
        specialization: 'Nevrolog',
        experience: 8,
        room_number: '301',
        department_id: nevrologiya._id,
      },
    ];

    for (const doctor of doctors) {
      const existingUser = await this.userModel.findOne({
        email: doctor.email,
      });
      if (existingUser) continue;

      const user = await this.userModel.create({
        full_name: doctor.full_name,
        email: doctor.email,
        password: await bcrypt.hash('Doctor@123', 10),
        role: UserRoles.doctor,
        is_active: true,
      });

      await this.doctorModel.create({
        user_id: user._id,
        department_id: doctor.department_id,
        specialization: doctor.specialization,
        experience: doctor.experience,
        room_number: doctor.room_number,
      });
    }

    this.logger.log('✅ Doctors seeded (password: Doctor@123)');
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Doctor } from './models/doctor.model';
import { Model, Types } from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { User } from '../users/models/user.model';
import { UpdateDoctorDto } from './dtos/update-doctor.dto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'user-profile');

@Injectable()
export class DoctorsService implements OnModuleInit {
  constructor(
    @InjectModel(Doctor.name) private readonly model: Model<Doctor>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async onModuleInit() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  async getAll() {
    const doctors = await this.model.find().select('-password');

    return {
      success: true,
      data: doctors,
    };
  }

  async getOne(id: string) {
    const doctor = await this.model.findById(id).populate('user_id').select('-password');

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return {
      success: true,
      data: doctor,
    };
  }

  async create({ specialization, experience, room_number, user_id }) {
    const existing_user = await this.userModel.findById(user_id);
    const existing_doctor = await this.model.findOne({ user_id });

    if (!existing_user || existing_doctor) {
      throw new BadRequestException('User not found or Doctor exists');
    }

    await this.model.create({
      specialization,
      experience,
      room_number,
      user_id,
    });
  }

  async update(id: string, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Not valid ID');
    }

    const updatedDoctor = await this.model
      .findByIdAndUpdate(id, updateDoctorDto, { new: true })
      .exec();

    if (!updatedDoctor) {
      throw new NotFoundException('Doctor not found');
    }

    return updatedDoctor;
  }

  async delete(id: string) {
    const doctor = await this.model
      .findByIdAndDelete(id)
      .select('-password')
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return {
      success: true,
    };
  }
}

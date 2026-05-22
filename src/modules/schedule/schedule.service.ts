import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schedule } from './models/schedules.model';
import { UpdateScheduleDto } from './dtos/update-appointment-status.dto';
import { CreateScheduleDto } from './dtos/create-schedule-dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule.name) private readonly model: Model<Schedule>,
  ) {}

  async getAll() {
    return {
      success: true,
      data: await this.model.find().populate('doctor_id'),
    };
  }

  async getScheduleByDoctor(doctor_id: string) {
    return {
      success: true,
      data: await this.model.find({ doctor_id }).populate('doctor_id'),
    };
  }

  async create(
    id,
    {
      work_day,
      start_time,
      end_time,
      break_start,
      break_end,
    }: CreateScheduleDto,
  ) {
    const schedule = await this.model.create({
      doctor_id: id,
      work_day,
      start_time,
      end_time,
      break_start,
      break_end,
    });
    return { success: true, data: schedule };
  }

  async update(id: string, user_id: string, payload: UpdateScheduleDto) {
    const schedule = await this.model.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true },
    );

    if (!schedule) throw new NotFoundException('Schedule not found');
    return { success: true, data: schedule };
  }

  async deleteScheduleByDoctor(id: string, doctor_id: string) {
    return {
      success: true,
      data: await this.model.findByIdAndDelete(id),
    };
  }
}

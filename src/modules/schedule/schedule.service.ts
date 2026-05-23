import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Schedule, WeekDay } from './models/schedules.model';
import { UpdateScheduleDto } from './dtos/update-appointment-status.dto';
import { CreateScheduleDto } from './dtos/create-schedule-dto';
import { CreateBulkScheduleDto, ScheduleType } from './dtos/create-bulk-schedule.dto';

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

  async createBulk(doctor_id: string, dto: CreateBulkScheduleDto) {
    const schedules: any[] = [];

    if (dto.type === ScheduleType.SINGLE) {
      // Bir kun uchun jadval
      const date = new Date(dto.start_date!);
      schedules.push({
        doctor_id: new Types.ObjectId(doctor_id),
        date,
        start_time: dto.start_time,
        end_time: dto.end_time,
        break_start: dto.break_start || '13:00',
        break_end: dto.break_end || '14:00',
        slot_duration: dto.slot_duration || 30,
        is_available: dto.is_available ?? true,
        note: dto.note,
      });
    } else if (dto.type === ScheduleType.RANGE) {
      // Bir necha kun uchun jadval
      const startDate = new Date(dto.start_date!);
      const endDate = new Date(dto.end_date!);
      
      if (endDate < startDate) {
        throw new BadRequestException('Tugash sanasi boshlanish sanasidan katta bo\'lishi kerak');
      }

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        schedules.push({
          doctor_id: new Types.ObjectId(doctor_id),
          date: new Date(currentDate),
          start_time: dto.start_time,
          end_time: dto.end_time,
          break_start: dto.break_start || '13:00',
          break_end: dto.break_end || '14:00',
          slot_duration: dto.slot_duration || 30,
          is_available: dto.is_available ?? true,
          note: dto.note,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (dto.type === ScheduleType.WEEKLY) {
      // Haftalik takrorlanuvchi jadval
      for (const work_day of dto.work_days!) {
        schedules.push({
          doctor_id: new Types.ObjectId(doctor_id),
          work_day,
          start_time: dto.start_time,
          end_time: dto.end_time,
          break_start: dto.break_start || '13:00',
          break_end: dto.break_end || '14:00',
          slot_duration: dto.slot_duration || 30,
          is_available: dto.is_available ?? true,
          note: dto.note,
        });
      }
    }

    const created = await this.model.insertMany(schedules);
    return { success: true, data: created, count: created.length };
  }

  async update(id: string, doctor_id: string, payload: UpdateScheduleDto) {
    const schedule = await this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), ...(doctor_id && { doctor_id: new Types.ObjectId(doctor_id) }) },
      { $set: payload },
      { new: true },
    );

    if (!schedule) throw new NotFoundException('Schedule not found or access denied');
    return { success: true, data: schedule };
  }

  async deleteAllByDoctor(doctor_id: string) {
    return this.model.deleteMany({ doctor_id: new Types.ObjectId(doctor_id) });
  }

  async deleteScheduleByDoctor(id: string, doctor_id: string) {
    const schedule = await this.model.findOneAndDelete({
      _id: new Types.ObjectId(id),
      doctor_id: new Types.ObjectId(doctor_id),
    });
    if (!schedule) throw new NotFoundException('Schedule not found or access denied');
    return { success: true, data: schedule };
  }
}

import { Doctor } from '@/modules/doctors/models/doctor.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ScheduleDocument = Schedule & Document;

export enum WeekDay {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Schema({ collection: 'schedules', timestamps: true, versionKey: false })
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: Doctor.name, required: true })
  doctor_id: Types.ObjectId;

  @Prop({ type: String, enum: WeekDay, required: true })
  work_day: WeekDay;

  @Prop({ type: String, required: true })
  start_time: string;

  @Prop({ type: String, required: true })
  end_time: string;

  @Prop({ type: String, required: false })
  break_start: string;

  @Prop({ type: String, required: false })
  break_end: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

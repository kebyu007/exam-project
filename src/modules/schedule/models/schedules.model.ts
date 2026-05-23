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

  // Aniq sana (kunlik jadval uchun)
  @Prop({ type: Date, required: false })
  date?: Date;

  // Haftalik jadval uchun (agar date yo'q bo'lsa)
  @Prop({ type: String, enum: WeekDay, required: false })
  work_day?: WeekDay;

  @Prop({ type: String, required: true })
  start_time: string;

  @Prop({ type: String, required: true })
  end_time: string;

  // Tushlik vaqti
  @Prop({ type: String, required: false, default: '13:00' })
  break_start?: string;

  @Prop({ type: String, required: false, default: '14:00' })
  break_end?: string;

  // Slot davomiyligi (daqiqalarda)
  @Prop({ type: Number, required: false, default: 30 })
  slot_duration?: number;

  // Jadval faolmi
  @Prop({ type: Boolean, required: false, default: true })
  is_available?: boolean;

  // Izoh (dam olish sababi va h.k.)
  @Prop({ type: String, required: false })
  note?: string;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);

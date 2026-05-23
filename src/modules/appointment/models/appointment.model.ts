import { Doctor } from '@/modules/doctors/models/doctor.model';
import { User } from '@/modules/users/models/user.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  NO_SHOW = 'no_show',
}

@Schema({ collection: 'appointments', timestamps: true, versionKey: false, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  patient_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Doctor.name, required: true })
  doctor_id: Types.ObjectId;

  @Prop({ type: Date, required: true })
  appointment_date: Date;

  @Prop({ type: String, required: false })
  appointment_time: string;

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Prop({ type: String, required: false })
  prescription?: string;

  @Prop({ type: String, required: false })
  recommendations?: string;

  @Prop({ type: [Number], default: [] })
  reminder_sent?: number[];
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ doctor_id: 1, appointment_date: 1 });
AppointmentSchema.index({ patient_id: 1, appointment_date: -1 });

// time_slot — appointment_time ning aliasi (lean() bilan ham ishlashi uchun)
AppointmentSchema.virtual('time_slot').get(function () {
  return this.appointment_time;
});

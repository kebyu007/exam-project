import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { User } from '@/modules/users/models/user.model';
import { Department } from '@/modules/department/models/department.model';

@Schema({ collection: 'doctors', timestamps: true, versionKey: false })
export class Doctor {
  @Prop({ type: SchemaTypes.ObjectId, ref: User.name, required: true })
  user_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: Department.name, required: true })
  department_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.String, required: true })
  specialization: string;

  @Prop({ type: SchemaTypes.Number, min: 0, required: true })
  experience: number;

  @Prop({ type: SchemaTypes.String, required: true })
  room_number: string;

  @Prop({ type: SchemaTypes.String, default: '' })
  bio?: string;
}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);

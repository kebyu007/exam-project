import { UserRoles } from '@/core/constants/constants';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @Prop({ type: SchemaTypes.String, required: true })
  full_name: string;

  @Prop({ type: SchemaTypes.String, unique: true, required: true })
  email: string;

  @Prop({ type: SchemaTypes.String, required: true })
  password: string;

  @Prop({ type: SchemaTypes.String })
  profile?: string;

  @Prop({ type: SchemaTypes.String, enum: UserRoles, default: UserRoles.patient })
  role: UserRoles;

  @Prop({ type: SchemaTypes.Number })
  telegram_id?: number;

  @Prop({ type: SchemaTypes.String })
  telegram_chat_id?: string;

  @Prop({ type: SchemaTypes.Boolean, default: false })
  telegram_linked?: boolean;

  @Prop({ type: SchemaTypes.Boolean, default: true })
  is_active: boolean;

  @Prop({ type: SchemaTypes.String })
  reset_token?: string;

  @Prop({ type: SchemaTypes.Date })
  reset_token_expires?: Date;

  @Prop({ type: SchemaTypes.String })
  otp?: string;

  @Prop({ type: SchemaTypes.Date })
  otp_expires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

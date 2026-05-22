import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema({ collection: 'departments', timestamps: true, versionKey: false })
export class Department {
  @Prop({ type: SchemaTypes.String, unique: true, required: true })
  name: string;

  @Prop({ type: SchemaTypes.String })
  description?: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

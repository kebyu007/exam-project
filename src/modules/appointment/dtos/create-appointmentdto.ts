import { IsMongoId, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'Shifokor ID kiritilishi shart' })
  @IsMongoId({ message: 'Shifokor ID noto\'g\'ri' })
  doctor_id: string;

  @IsOptional()
  @IsMongoId({ message: 'Bemor ID noto\'g\'ri' })
  patient_id?: string;

  @IsOptional()
  @IsDateString()
  appointment_date?: string;
}

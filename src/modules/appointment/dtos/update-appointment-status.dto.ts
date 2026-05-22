import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../models/appointment.model';

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}

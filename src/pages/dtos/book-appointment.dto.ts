import { IsDateString, IsString, Matches } from 'class-validator';

export class BookAppointmentDto {
  @IsString()
  doctor_id: string;

  @IsDateString()
  appointment_date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'Vaqt HH:MM formatida bo\'lishi kerak' })
  appointment_time: string;
}

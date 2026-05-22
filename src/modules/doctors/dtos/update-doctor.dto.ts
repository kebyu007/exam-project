import { IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Mutaxassislik kamida 3 ta belgidan iborat bo\'lishi kerak' })
  specialization?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Tajriba 0 dan katta bo\'lishi kerak' })
  experience?: number;

  @IsOptional()
  @IsString()
  room_number?: string;
}

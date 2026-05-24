import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDoctorDto {
  @IsString()
  specialization: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  experience: number;

  @IsString()
  room_number: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class AddDoctorDto {
  @IsString()
  @MinLength(3)
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  department_id: string;

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

import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRoles } from '@/core/constants/constants';

export class ChangeRoleDto {
  @IsEnum(UserRoles)
  role: UserRoles;

  @IsOptional()
  @IsString()
  department_id?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experience?: number;

  @IsOptional()
  @IsString()
  room_number?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

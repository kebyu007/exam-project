import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Bo\'lim nomi kamida 2 ta belgidan iborat bo\'lishi kerak' })
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

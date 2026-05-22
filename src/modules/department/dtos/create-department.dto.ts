import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Bo\'lim nomi kiritilishi shart' })
  @MinLength(2, { message: 'Bo\'lim nomi kamida 2 ta belgidan iborat bo\'lishi kerak' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

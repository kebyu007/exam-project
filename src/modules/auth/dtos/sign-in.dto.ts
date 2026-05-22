import {
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';

export class SignInDto {
  @IsString()
  @IsEmail({}, { message: 'Email noto\'g\'ri formatda' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  password: string;
}

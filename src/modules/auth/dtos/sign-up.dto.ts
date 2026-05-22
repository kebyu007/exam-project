import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(3, { message: 'Ism kamida 3 ta belgidan iborat bo\'lishi kerak' })
  full_name: string;

  @IsString()
  @IsEmail({}, { message: 'Email noto\'g\'ri formatda' })
  email: string;

  @IsString()
  @IsStrongPassword({
    minLength: 6,
    minLowercase: 1,
    minSymbols: 1,
    minNumbers: 1,
    minUppercase: 1,
  }, { message: 'Parol kamida 6 ta belgidan iborat bo\'lishi va katta-kichik harf, raqam va maxsus belgi bo\'lishi kerak' })
  password: string;
}

import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @MinLength(3, { message: 'Mutaxassislik kamida 3 ta belgidan iborat bo\'lishi kerak' })
  specialization: string;

  @IsNumber()
  @Min(0, { message: 'Tajriba 0 dan katta bo\'lishi kerak' })
  experience: number;

  @IsString()
  @IsNotEmpty({ message: 'Xona raqami kiritilishi shart' })
  room_number: string;

  @IsNotEmpty()
  @IsMongoId({ message: 'Foydalanuvchi ID noto\'g\'ri' })
  user_id: string;
}

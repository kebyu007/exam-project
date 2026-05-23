import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { WeekDay } from '../models/schedules.model';

export enum ScheduleType {
  SINGLE = 'single',      // Bir kun uchun
  WEEKLY = 'weekly',      // Haftalik takrorlanuvchi
  RANGE = 'range',        // Bir necha kun uchun
}

export class CreateBulkScheduleDto {
  @IsNotEmpty({ message: 'Jadval turi kiritilishi shart' })
  @IsEnum(ScheduleType, { message: 'Jadval turi noto\'g\'ri' })
  type: ScheduleType;

  // SINGLE va RANGE uchun
  @ValidateIf(o => o.type === ScheduleType.SINGLE || o.type === ScheduleType.RANGE)
  @IsNotEmpty({ message: 'Boshlanish sanasi kiritilishi shart' })
  @IsDateString({}, { message: 'Boshlanish sanasi noto\'g\'ri formatda' })
  start_date?: string;

  // RANGE uchun
  @ValidateIf(o => o.type === ScheduleType.RANGE)
  @IsNotEmpty({ message: 'Tugash sanasi kiritilishi shart' })
  @IsDateString({}, { message: 'Tugash sanasi noto\'g\'ri formatda' })
  end_date?: string;

  // WEEKLY uchun
  @ValidateIf(o => o.type === ScheduleType.WEEKLY)
  @IsNotEmpty({ message: 'Ish kunlari kiritilishi shart' })
  @IsArray({ message: 'Ish kunlari array bo\'lishi kerak' })
  @IsEnum(WeekDay, { each: true, message: 'Ish kuni noto\'g\'ri' })
  work_days?: WeekDay[];

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Boshlanish vaqti HH:mm formatida bo\'lishi kerak',
  })
  start_time: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Tugash vaqti HH:mm formatida bo\'lishi kerak',
  })
  end_time: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Tushlik boshlanish vaqti HH:mm formatida bo\'lishi kerak',
  })
  break_start?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Tushlik tugash vaqti HH:mm formatida bo\'lishi kerak',
  })
  break_end?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Slot davomiyligi raqam bo\'lishi kerak' })
  @Min(15, { message: 'Slot davomiyligi kamida 15 daqiqa bo\'lishi kerak' })
  @Max(120, { message: 'Slot davomiyligi ko\'pi bilan 120 daqiqa bo\'lishi kerak' })
  slot_duration?: number;

  @IsOptional()
  @IsBoolean({ message: 'is_available boolean bo\'lishi kerak' })
  is_available?: boolean;

  @IsOptional()
  @IsString({ message: 'Izoh string bo\'lishi kerak' })
  note?: string;
}

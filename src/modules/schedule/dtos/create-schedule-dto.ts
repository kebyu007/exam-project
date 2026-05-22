import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { IsAfterTime } from '@/common/decorators/is-after-time.decorator';
import { WeekDay } from '../models/schedules.model';

export class CreateScheduleDto {
  @IsNotEmpty({ message: 'Shifokor ID kiritilishi shart' })
  @IsMongoId({ message: 'Shifokor ID noto\'g\'ri' })
  doctor_id: string;

  @IsNotEmpty({ message: 'Ish kuni kiritilishi shart' })
  @IsEnum(WeekDay, { message: 'Ish kuni noto\'g\'ri' })
  work_day: WeekDay;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Boshlanish vaqti HH:mm formatida bo\'lishi kerak',
  })
  start_time: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Tugash vaqti HH:mm formatida bo\'lishi kerak',
  })
  @IsAfterTime('start_time', { message: 'Tugash vaqti boshlanish vaqtidan katta bo\'lishi kerak' })
  end_time: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Dam olish boshlanish vaqti HH:mm formatida bo\'lishi kerak',
  })
  break_start?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Dam olish tugash vaqti HH:mm formatida bo\'lishi kerak',
  })
  break_end?: string;
}

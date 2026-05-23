import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches, ValidateIf, IsEnum, IsInt, Min, Max } from 'class-validator';
import { IsAfterTime } from '@/common/decorators/is-after-time.decorator';
import { IsWeekday } from '@/common/decorators/is-weekday.decorator';
import { IsFutureDate } from '@/common/decorators/is-future-date.decorator';
import { IsDateString } from 'class-validator';
import { CreateScheduleDto } from './create-schedule-dto';
import { WeekDay } from '../models/schedules.model';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  @ValidateIf((o) => o.work_day !== undefined)
  @IsEnum(WeekDay, { message: 'Ish kuni noto\'g\'ri' })
  @IsOptional()
  work_day?: WeekDay;

  @IsOptional()
  @ValidateIf((o) => o.start_time !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time?: string;

  @IsOptional()
  @ValidateIf((o) => o.end_time !== undefined)
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'end_time must be in HH:mm format',
  })
  @IsAfterTime('start_time')
  end_time?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  slot_duration?: number;
}

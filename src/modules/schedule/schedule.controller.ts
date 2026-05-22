import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Request } from 'express';
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dtos/create-schedule-dto';
import { UpdateScheduleDto } from './dtos/update-appointment-status.dto';
import { Types } from 'mongoose';

@Controller('api/bookings')
export class ScheduleController {
  constructor(private readonly service: ScheduleService) {}

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.admin, UserRoles.doctor])
  @Get()
  async getMySchedules(@Req() req: Request & { user: any }) {
    return this.service.getScheduleByDoctor(req.user.id);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('all')
  async getAll() {
    return this.service.getAll();
  }

  @Protected(true)
  @Roles([UserRoles.doctor, UserRoles.admin])
  @Post()
  async create(
    @Body() payload: CreateScheduleDto,
    @Req() req: Request & { user: any },
  ) {
    return await this.service.create(req.user.id, payload);
  }

  @Protected(true)
  @Roles([UserRoles.doctor, UserRoles.admin])
  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request & { user: any },
    @Body() payload: UpdateScheduleDto,
  ) {
    return await this.service.update(id, req.user.id, payload);
  }

  @Protected(true)
  @Roles([UserRoles.admin, UserRoles.doctor])
  @Delete('id')
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.service.deleteScheduleByDoctor(id, req.user.id);
  }
}

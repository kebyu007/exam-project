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
import { CreateBulkScheduleDto } from './dtos/create-bulk-schedule.dto';
import { UpdateScheduleDto } from './dtos/update-appointment-status.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor } from '../doctors/models/doctor.model';

@Controller('api/bookings')
export class ScheduleController {
  constructor(
    private readonly service: ScheduleService,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

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
  @Post('bulk')
  async createBulk(
    @Body() payload: CreateBulkScheduleDto,
    @Req() req: Request & { user: any },
  ) {
    return await this.service.createBulk(req.user.id, payload);
  }

  @Protected(true)
  @Roles([UserRoles.doctor, UserRoles.admin])
  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request & { user: any },
    @Body() payload: UpdateScheduleDto,
  ) {
    const doctor = await this.doctorModel.findOne({ user_id: req.user.id }).lean();
    const doctorId = doctor ? (doctor as any)._id.toString() : '';
    return await this.service.update(id, doctorId, payload);
  }

  @Protected(true)
  @Roles([UserRoles.admin, UserRoles.doctor])
  @Delete(':id')
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @Req() req: Request & { user: any },
  ) {
    const doctor = await this.doctorModel.findOne({ user_id: req.user.id }).lean();
    const doctorId = doctor ? (doctor as any)._id.toString() : '';
    return this.service.deleteScheduleByDoctor(id, doctorId);
  }
}

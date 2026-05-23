import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Render,
  Req,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import { CreateAppointmentDto } from './dtos/create-appointmentdto';
import { UpdateAppointmentStatusDto } from './dtos/update-appointment-status.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import type { Request } from 'express';

// ─── API controller (JSON) ──────────────────────────────────────────────────
// Prefix /api/Appointments dan foydalanadi, PagesController bilan konflikt yo'q

@Controller('api/appointment')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.admin, UserRoles.doctor])
  @Get()
  async getMyAppointments(@Req() req: Request & { user: any }) {
    if (req.user.role === UserRoles.doctor) {
      return this.service.getAppointmentByDoctor(req.user.id);
    }
    return this.service.getAppointmentByUser(req.user.id);
  }

  @Get('available-slots')
  async getAvailableSlots(@Req() req: Request) {
    const { doctor_id, date } = req.query;
    return this.service.getAvailableSlots(doctor_id as string, date as string);
  }

  @Get('booked-slots')
  async getBookedSlots(@Req() req: Request) {
    const { doctor_id, date } = req.query;
    return this.service.getBookedSlots(doctor_id as string, date as string);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('all')
  getAll() {
    return this.service.getAll();
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.admin])
  @Post()
  async create(
    @Body() dto: CreateAppointmentDto,
    @Req() req: Request & { user: any },
  ) {
    try {
      return await this.service.create(dto.doctor_id, req.user.id, dto.appointment_date);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }

  @Protected(true)
  @Roles([UserRoles.doctor, UserRoles.admin])
  @Patch(':id/prescription')
  addPrescription(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { prescription: string; recommendations?: string },
  ) {
    return this.service.addPrescription(id, body.prescription, body.recommendations);
  }
}

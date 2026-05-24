import { Body, Controller, Get, Post, Req, Res, Param } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import { PagesService } from './pages.service';
import { AppointmentService } from '../modules/appointment/appointment.service';
import { ScheduleService } from '../modules/schedule/schedule.service';

@Controller()
export class PatientDoctorController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly appointmentService: AppointmentService,
    private readonly scheduleService: ScheduleService,
  ) {}

  // ─── Patient ────────────────────────────────────────────────────────────────

  @Protected(true)
  @Roles([UserRoles.patient])
  @Get('patient/appointments')
  async patientAppointments(@Req() req: Request & { user: any }, @Res() res: Response) {
    const appointments = await this.pagesService.getPatientAppointments(req.user.id);
    return res.render('pages/patient/my-appointments', { title: 'Mening qabullarim', appointments, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.patient])
  @Post('patient/appointments/:id/cancel')
  async cancelAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentService.cancelAppointment(id);
    return res.redirect('/patient/appointments?toast=Qabul bekor qilindi');
  }

  @Protected(true)
  @Roles([UserRoles.patient])
  @Get('patient/book/:doctorId')
  async patientBooking(@Param('doctorId') doctorId: string, @Req() req: Request & { user: any }, @Res() res: Response) {
    const data = await this.pagesService.getDoctorBookingData(doctorId);
    if (!data) return res.redirect('/doctors');
    return res.render('pages/patient/book-appointment', { title: 'Qabulga yozilish', ...data, user: req.user });
  }

  // ─── Doctor ─────────────────────────────────────────────────────────────────

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Get('doctor/appointments')
  async doctorAppointments(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (!doctor) return res.redirect('/');
    const appointments = await this.pagesService.getDoctorAppointments((doctor as any)._id.toString());
    return res.render('pages/doctor/appointment-list', { title: 'Qabullar', appointments, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/appointments/:id/confirm')
  async confirmAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentService.confirmAppointment(id);
    return res.redirect('/doctor/appointments?toast=Qabul tasdiqlandi');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/appointments/:id/cancel')
  async doctorCancelAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentService.cancelAppointment(id);
    return res.redirect('/doctor/appointments?toast=Qabul bekor qilindi');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/appointments/:id/prescription')
  async updatePrescription(
    @Param('id') id: string,
    @Body() body: { prescription: string; recommendations: string },
    @Res() res: Response,
  ) {
    await this.appointmentService.addPrescription(id, body.prescription, body.recommendations);
    return res.redirect('/doctor/appointments?toast=Retsept saqlandi');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Get('doctor/schedule')
  async doctorSchedule(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (!doctor) return res.redirect('/');
    const schedules = await this.pagesService.getDoctorSchedules((doctor as any)._id.toString());
    const today = new Date().toISOString().split('T')[0];
    return res.render('pages/doctor/schedule-management', { title: 'Jadval', schedules, today, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule')
  async doctorScheduleCreate(@Req() req: Request & { user: any }, @Body() body: any, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (!doctor) return res.redirect('/');
    await this.scheduleService.createBulk((doctor as any)._id.toString(), {
      type: body.type || 'weekly',
      start_date: body.start_date,
      end_date: body.end_date,
      work_days: Array.isArray(body.work_days) ? body.work_days : [body.work_days].filter(Boolean),
      start_time: body.start_time,
      end_time: body.end_time,
      break_start: body.break_start || '13:00',
      break_end: body.break_end || '14:00',
      slot_duration: parseInt(body.slot_duration) || 30,
      is_available: true,
      note: body.note || undefined,
    });
    return res.redirect('/doctor/schedule?toast=Jadval yaratildi');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/delete-all')
  async doctorScheduleDeleteAll(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (doctor) await this.scheduleService.deleteAllByDoctor((doctor as any)._id.toString());
    return res.redirect('/doctor/schedule?toast=Barcha jadvallar o\'chirildi');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/:id/delete')
  async doctorScheduleDelete(@Param('id') id: string, @Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (doctor) await this.scheduleService.deleteScheduleByDoctor(id, (doctor as any)._id.toString());
    return res.redirect('/doctor/schedule?toast=Jadval o\'chirildi');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/:id/update')
  async doctorScheduleUpdate(@Param('id') id: string, @Body() body: any, @Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (doctor) {
      await this.scheduleService.update(id, (doctor as any)._id.toString(), {
        start_time: body.start_time,
        end_time: body.end_time,
        break_start: body.break_start,
        break_end: body.break_end,
        slot_duration: parseInt(body.slot_duration) || 30,
      });
    }
    return res.redirect('/doctor/schedule?toast=Jadval yangilandi');
  }
}

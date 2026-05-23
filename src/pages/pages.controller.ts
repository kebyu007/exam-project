import { Body, Controller, Get, Post, Req, Res, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import { AppointmentService } from '../modules/appointment/appointment.service';
import { ScheduleService } from '../modules/schedule/schedule.service';
import { PagesService } from './pages.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly appointmentService: AppointmentService,
    private readonly scheduleService: ScheduleService,
  ) {}

  // ─── Public Pages ───────────────────────────────────────────────────────────

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('/')
  homePage(@Req() req: Request & { user?: any }, @Res() res: Response) {
    return res.render('pages/public/home', { title: 'Bosh sahifa', user: req.user });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('doctors')
  async doctorsPage(@Req() req: Request & { user?: any }, @Res() res: Response) {
    const doctors = await this.pagesService.getDoctors();
    return res.render('pages/public/doctors', { title: 'Shifokorlar', doctors, user: req.user });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('login')
  loginPage(@Res() res: Response) {
    return res.render('pages/public/login', { title: 'Kirish' });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('verify-otp')
  verifyOtpPage(@Query('email') email: string = '', @Res() res: Response) {
    return res.render('pages/public/verify-otp', { title: 'Email tasdiqlash', email });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('forgot-password')
  forgotPasswordPage(@Res() res: Response) {
    return res.render('pages/public/forgot-password', { title: 'Parolni unutdim' });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('reset-password')
  resetPasswordPage(@Query('token') token: string = '', @Res() res: Response) {
    return res.render('pages/public/reset-password', { title: 'Yangi parol', token });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('register')
  registerPage(@Res() res: Response) {
    return res.render('pages/public/register', { title: 'Ro\'yxatdan o\'tish' });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('test/toast')
  toastTestPage(@Res() res: Response) {
    return res.render('pages/public/toast-test', { title: 'Toast Test' });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.redirect('/');
  }

  // ─── Patient Pages ──────────────────────────────────────────────────────────

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
    return res.redirect('/patient/appointments');
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.doctor, UserRoles.admin])
  @Get('profile')
  async profilePage(@Req() req: Request & { user: any }, @Res() res: Response) {
    const user = await this.pagesService.getProfileUser(req.user.id);
    return res.render('pages/profile', {
      title: 'Profil',
      user,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || 'your_bot',
    });
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.doctor, UserRoles.admin])
  @Post('profile/update')
  async profileUpdate(@Req() req: Request & { user: any }, @Body() body: any, @Res() res: Response) {
    if (body.full_name) await this.pagesService.updateProfileName(req.user.id, body.full_name);
    return res.redirect('/profile');
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.doctor, UserRoles.admin])
  @Post('profile/upload')
  @UseInterceptors(FileInterceptor('profile'))
  async profileUpload(
    @Req() req: Request & { user: any },
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (file) await this.pagesService.uploadProfilePhoto(req.user.id, file);
    return res.redirect('/profile');
  }

  @Protected(true)
  @Roles([UserRoles.patient])
  @Get('patient/book/:doctorId')
  async patientBooking(@Param('doctorId') doctorId: string, @Req() req: Request & { user: any }, @Res() res: Response) {
    const data = await this.pagesService.getDoctorBookingData(doctorId);
    if (!data) return res.redirect('/doctors');
    return res.render('pages/patient/book-appointment', { title: 'Qabulga yozilish', ...data, user: req.user });
  }

  // ─── Doctor Pages ───────────────────────────────────────────────────────────

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
    return res.redirect('/doctor/appointments');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/appointments/:id/cancel')
  async doctorCancelAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentService.cancelAppointment(id);
    return res.redirect('/doctor/appointments');
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
    return res.redirect('/doctor/appointments');
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
    return res.redirect('/doctor/schedule');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/delete-all')
  async doctorScheduleDeleteAll(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (doctor) await this.scheduleService.deleteAllByDoctor((doctor as any)._id.toString());
    return res.redirect('/doctor/schedule');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/:id/delete')
  async doctorScheduleDelete(@Param('id') id: string, @Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.pagesService.getDoctorByUserId(req.user.id);
    if (doctor) await this.scheduleService.deleteScheduleByDoctor(id, (doctor as any)._id.toString());
    return res.redirect('/doctor/schedule');
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
    return res.redirect('/doctor/schedule');
  }

  // ─── Admin Pages ────────────────────────────────────────────────────────────

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin')
  async adminDashboard(@Req() req: Request & { user: any }, @Res() res: Response) {
    const stats = await this.pagesService.getAdminStats();
    return res.render('pages/admin/dashboard', { title: 'Admin paneli', user: req.user, stats });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/doctors')
  async adminDoctors(@Req() req: Request & { user: any }, @Res() res: Response) {
    const [doctors, departments] = await this.pagesService.getAdminDoctors();
    return res.render('pages/admin/doctors-management', { title: 'Shifokorlar boshqaruvi', doctors, departments, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/doctors/:id/update')
  async adminUpdateDoctor(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    await this.pagesService.updateDoctor(id, {
      specialization: body.specialization,
      experience: parseInt(body.experience),
      room_number: body.room_number,
      ...(body.bio !== undefined && { bio: body.bio }),
    });
    return res.redirect('/admin/doctors');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/doctors/:id/delete')
  async adminDeleteDoctor(@Param('id') id: string, @Res() res: Response) {
    await this.pagesService.deleteDoctor(id);
    return res.redirect('/admin/doctors');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/users')
  async adminUsers(@Req() req: Request & { user: any }, @Res() res: Response) {
    const { users, departments } = await this.pagesService.getAdminUsers();
    return res.render('pages/admin/users-management', { title: 'Foydalanuvchilar boshqaruvi', users, departments, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/users/:id/role')
  async adminChangeRole(@Param('id') id: string, @Body() body: any, @Req() req: Request & { user: any }, @Res() res: Response) {
    const newRole = body.role as UserRoles;
    await this.pagesService.changeUserRole(id, newRole, newRole === UserRoles.doctor ? {
      department_id: body.department_id,
      specialization: body.specialization,
      experience: parseInt(body.experience) || 0,
      room_number: body.room_number,
      bio: body.bio || '',
    } : undefined);
    if (req.user.id === id) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.redirect('/login');
    }
    return res.redirect('/admin/users');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/departments')
  async adminDepartments(@Req() req: Request & { user: any }, @Res() res: Response) {
    const departments = await this.pagesService.getDepartments();
    return res.render('pages/admin/departments-management', { title: 'Bo\'limlar boshqaruvi', departments, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/departments')
  async adminCreateDepartment(@Body('name') name: string, @Res() res: Response) {
    await this.pagesService.createDepartment(name);
    return res.redirect('/admin/departments');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/departments/:id/update')
  async adminUpdateDepartment(@Param('id') id: string, @Body('name') name: string, @Res() res: Response) {
    await this.pagesService.updateDepartment(id, name);
    return res.redirect('/admin/departments');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/departments/:id/delete')
  async adminDeleteDepartment(@Param('id') id: string, @Res() res: Response) {
    await this.pagesService.deleteDepartment(id);
    return res.redirect('/admin/departments');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/add-doctor')
  async adminAddDoctorPage(@Req() req: Request & { user: any }, @Res() res: Response) {
    const departments = await this.pagesService.getDepartments();
    return res.render('pages/admin/add-doctor', { title: 'Yangi shifokor qo\'shish', departments, user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/add-doctor')
  async adminAddDoctor(@Body() body: any, @Req() req: Request & { user: any }, @Res() res: Response) {
    const { error } = await this.pagesService.addDoctor(body);
    if (error) {
      const departments = await this.pagesService.getDepartments();
      return res.render('pages/admin/add-doctor', { title: 'Yangi shifokor qo\'shish', departments, user: req.user, error });
    }
    return res.redirect('/admin/doctors');
  }
}

import { Body, Controller, Get, Post, Req, Res, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment } from '../modules/appointment/models/appointment.model';
import { Department } from '../modules/department/models/department.model';
import { Doctor } from '../modules/doctors/models/doctor.model';
import { Schedule } from '../modules/schedule/models/schedules.model';
import { User } from '../modules/users/models/user.model';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import * as bcrypt from 'bcrypt';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'user-profile');

@Controller()
export class PagesController {
  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  // ─── Public Pages ───────────────────────────────────────────────────────────

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('/')
  async homePage(@Req() req: Request & { user?: any }, @Res() res: Response) {
    return res.render('pages/public/home', { title: 'Bosh sahifa', user: req.user });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('doctors')
  async doctorsPage(@Req() req: Request & { user?: any }, @Res() res: Response) {
    const doctors = await this.doctorModel.find().populate('user_id').populate('department_id').lean();
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
    const { Types } = await import('mongoose');
    const appointments = await this.appointmentModel
      .find({ patient_id: new Types.ObjectId(req.user.id) })
      .populate({ 
        path: 'doctor_id', 
        populate: { path: 'user_id' } 
      })
      .sort({ appointment_date: -1, appointment_time: 1 })
      .lean();
    console.log('👤 Patient appointments:', appointments.length, appointments);
    return res.render('pages/patient/my-appointments', {
      title: 'Mening qabullarim',
      appointments,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.patient])
  @Post('patient/appointments/:id/cancel')
  async cancelAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentModel.findByIdAndUpdate(id, { status: 'cancelled' });
    return res.redirect('/patient/appointments');
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.doctor, UserRoles.admin])
  @Get('profile')
  async profilePage(@Req() req: Request & { user: any }, @Res() res: Response) {
    const dbUser = await this.userModel.findById(req.user.id).select('-password').lean();
    return res.render('pages/profile', { title: 'Profil', user: dbUser });
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.doctor, UserRoles.admin])
  @Post('profile/update')
  async profileUpdate(@Req() req: Request & { user: any }, @Body() body: any, @Res() res: Response) {
    const update: any = {};
    if (body.full_name) update.full_name = body.full_name;
    await this.userModel.findByIdAndUpdate(req.user.id, update);
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
    if (file) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const ext = file.mimetype.split('/').at(-1);
      const filename = `${req.user.id}.${ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
      await this.userModel.findByIdAndUpdate(req.user.id, { profile: filename });
    }
    return res.redirect('/profile');
  }

  @Protected(true)
  @Roles([UserRoles.patient])
  @Get('patient/book/:doctorId')
  async patientBooking(@Param('doctorId') doctorId: string, @Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.doctorModel.findById(doctorId).populate('user_id').lean();
    if (!doctor) return res.redirect('/doctors');
    const schedules = await this.scheduleModel.find({ doctor_id: (doctor as any)._id }).lean();
    if (!schedules.length) {
      return res.render('pages/patient/book-appointment', {
        title: 'Qabulga yozilish',
        doctor,
        schedules: [],
        user: req.user,
      });
    }
    return res.render('pages/patient/book-appointment', {
      title: 'Qabulga yozilish',
      doctor,
      schedules,
      user: req.user,
    });
  }

  // ─── Doctor Pages ───────────────────────────────────────────────────────────

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Get('doctor/appointments')
  async doctorAppointments(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.doctorModel.findOne({ user_id: req.user.id }).lean();
    console.log('🔍 Doctor found:', doctor);
    if (!doctor) return res.redirect('/');

    const appointments = await this.appointmentModel
      .find({ doctor_id: (doctor as any)._id })
      .populate('patient_id')
      .sort({ appointment_date: -1, appointment_time: 1 })
      .lean();
    console.log('📋 Appointments found:', appointments.length, appointments);
    return res.render('pages/doctor/appointment-list', {
      title: 'Qabullar',
      appointments,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/appointments/:id/confirm')
  async confirmAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentModel.findByIdAndUpdate(id, { status: 'confirmed' });
    return res.redirect('/doctor/appointments');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/appointments/:id/cancel')
  async doctorCancelAppointment(@Param('id') id: string, @Res() res: Response) {
    await this.appointmentModel.findByIdAndUpdate(id, { status: 'cancelled' });
    return res.redirect('/doctor/appointments');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Get('doctor/schedule')
  async doctorSchedule(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctor = await this.doctorModel.findOne({ user_id: req.user.id }).lean();
    if (!doctor) return res.redirect('/');

    const schedules = await this.scheduleModel.find({ doctor_id: (doctor as any)._id }).lean();
    return res.render('pages/doctor/schedule-management', {
      title: 'Jadval',
      schedules,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule')
  async doctorScheduleCreate(@Req() req: Request & { user: any }, @Body() body: any, @Res() res: Response) {
    const doctor = await this.doctorModel.findOne({ user_id: req.user.id }).lean();
    if (!doctor) return res.redirect('/');
    await this.scheduleModel.create({
      doctor_id: (doctor as any)._id,
      work_day: body.work_day,
      start_time: body.start_time,
      end_time: body.end_time,
    });
    return res.redirect('/doctor/schedule');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/:id/delete')
  async doctorScheduleDelete(@Param('id') id: string, @Res() res: Response) {
    await this.scheduleModel.findByIdAndDelete(id);
    return res.redirect('/doctor/schedule');
  }

  @Protected(true)
  @Roles([UserRoles.doctor])
  @Post('doctor/schedule/:id/update')
  async doctorScheduleUpdate(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    await this.scheduleModel.findByIdAndUpdate(id, {
      work_day: body.work_day,
      start_time: body.start_time,
      end_time: body.end_time,
    });
    return res.redirect('/doctor/schedule');
  }

  // ─── Admin Pages ────────────────────────────────────────────────────────────

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin')
  async adminDashboard(@Req() req: Request & { user: any }, @Res() res: Response) {
    return res.render('pages/admin/dashboard', { title: 'Admin paneli', user: req.user });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/doctors')
  async adminDoctors(@Req() req: Request & { user: any }, @Res() res: Response) {
    const doctors = await this.doctorModel.find().populate('user_id').populate('department_id').lean();
    const departments = await this.departmentModel.find().lean();
    return res.render('pages/admin/doctors-management', {
      title: 'Shifokorlar boshqaruvi',
      doctors,
      departments,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/doctors/:id/update')
  async adminUpdateDoctor(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
    await this.doctorModel.findByIdAndUpdate(id, {
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
    await this.doctorModel.findByIdAndDelete(id);
    return res.redirect('/admin/doctors');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/users')
  async adminUsers(@Req() req: Request & { user: any }, @Res() res: Response) {
    const users = await this.userModel.find().select('-password').lean();
    const departments = await this.departmentModel.find().lean();
    const doctors = await this.doctorModel.find().lean();

    const doctorMap: Record<string, any> = {};
    for (const d of doctors) doctorMap[d.user_id.toString()] = d;

    const usersWithDoctor = users.map(u => ({
      ...u,
      doctorInfo: doctorMap[(u as any)._id.toString()] || null,
    }));

    return res.render('pages/admin/users-management', {
      title: 'Foydalanuvchilar boshqaruvi',
      users: usersWithDoctor,
      departments,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/users/:id/role')
  async adminChangeRole(@Param('id') id: string, @Body() body: any, @Req() req: Request & { user: any }, @Res() res: Response) {
    const newRole = body.role as UserRoles;
    await this.userModel.findByIdAndUpdate(id, { role: newRole });

    if (newRole === UserRoles.doctor) {
      await this.doctorModel.findOneAndUpdate(
        { user_id: id },
        {
          user_id: id,
          department_id: body.department_id,
          specialization: body.specialization,
          experience: parseInt(body.experience) || 0,
          room_number: body.room_number,
          bio: body.bio || '',
        },
        { upsert: true, new: true },
      );
    }

    // If admin changed their own role, clear cookies
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
    const departments = await this.departmentModel.find().lean();
    return res.render('pages/admin/departments-management', {
      title: 'Bo\'limlar boshqaruvi',
      departments,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/departments')
  async adminCreateDepartment(@Body('name') name: string, @Res() res: Response) {
    await this.departmentModel.create({ name });
    return res.redirect('/admin/departments');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/departments/:id/update')
  async adminUpdateDepartment(@Param('id') id: string, @Body('name') name: string, @Res() res: Response) {
    await this.departmentModel.findByIdAndUpdate(id, { name });
    return res.redirect('/admin/departments');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/departments/:id/delete')
  async adminDeleteDepartment(@Param('id') id: string, @Res() res: Response) {
    await this.departmentModel.findByIdAndDelete(id);
    return res.redirect('/admin/departments');
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get('admin/add-doctor')
  async adminAddDoctorPage(@Req() req: Request & { user: any }, @Res() res: Response) {
    const departments = await this.departmentModel.find().lean();
    return res.render('pages/admin/add-doctor', {
      title: 'Yangi shifokor qo\'shish',
      departments,
      user: req.user,
    });
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post('admin/add-doctor')
  async adminAddDoctor(@Body() body: any, @Req() req: Request & { user: any }, @Res() res: Response) {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email: body.email });
      if (existingUser) {
        const departments = await this.departmentModel.find().lean();
        return res.render('pages/admin/add-doctor', {
          title: 'Yangi shifokor qo\'shish',
          departments,
          user: req.user,
          error: 'Bu email allaqachon ro\'yxatdan o\'tgan',
        });
      }

      // Create user
      const hashedPassword = await bcrypt.hash(body.password, 10);
      const newUser = await this.userModel.create({
        full_name: body.full_name,
        email: body.email,
        password: hashedPassword,
        role: UserRoles.doctor,
        is_active: true,
      });

      // Create doctor
      await this.doctorModel.create({
        user_id: newUser._id,
        department_id: body.department_id,
        specialization: body.specialization,
        experience: parseInt(body.experience),
        room_number: body.room_number,
        bio: body.bio || '',
      });

      return res.redirect('/admin/doctors');
    } catch (error) {
      const departments = await this.departmentModel.find().lean();
      return res.render('pages/admin/add-doctor', {
        title: 'Yangi shifokor qo\'shish',
        departments,
        user: req.user,
        error: 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
      });
    }
  }
}

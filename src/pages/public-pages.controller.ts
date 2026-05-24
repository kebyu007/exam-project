import { Body, Controller, Get, Post, Req, Res, Query, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import { PagesService } from './pages.service';

@Controller()
export class PublicPagesController {
  constructor(private readonly pagesService: PagesService) {}

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
    const departments = await this.pagesService.getDepartmentsWithDoctorCount();
    return res.render('pages/public/departments', { title: 'Bo\'limlar', departments, user: req.user });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('departments')
  async departmentsPage(@Req() req: Request & { user?: any }, @Res() res: Response) {
    const departments = await this.pagesService.getDepartmentsWithDoctorCount();
    return res.render('pages/public/departments', { title: 'Bo\'limlar', departments, user: req.user });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('departments/:id')
  async departmentDoctorsPage(@Param('id') id: string, @Req() req: Request & { user?: any }, @Res() res: Response) {
    const department = await this.pagesService.getDepartmentById(id);
    if (!department) return res.redirect('/departments');
    const doctors = await this.pagesService.getDoctorsByDepartment(id);
    return res.render('pages/public/department-doctors', { title: department.name, department, doctors, user: req.user });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('login')
  loginPage(@Res() res: Response) {
    return res.render('pages/public/login', { title: 'Kirish' });
  }

  @Protected(false)
  @Roles([UserRoles.viewer])
  @Get('register')
  registerPage(@Res() res: Response) {
    return res.render('pages/public/register', { title: 'Ro\'yxatdan o\'tish' });
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
  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.redirect('/');
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
    return res.redirect('/profile?toast=Profil yangilandi');
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
    return res.redirect('/profile?toast=Rasm yangilandi');
  }
}

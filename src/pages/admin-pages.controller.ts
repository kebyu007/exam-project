import { Body, Controller, Get, Post, Req, Res, Param } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import { PagesService } from './pages.service';
import { UpdateDoctorDto } from './dtos/update-doctor.dto';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { AddDoctorDto } from './dtos/add-doctor.dto';
import { ChangeRoleDto } from './dtos/change-role.dto';

@Controller('admin')
@Protected(true)
@Roles([UserRoles.admin])
export class AdminPagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  async dashboard(@Req() req: Request & { user: any }, @Res() res: Response) {
    const stats = await this.pagesService.getAdminStats();
    return res.render('pages/admin/dashboard', { title: 'Admin paneli', user: req.user, stats });
  }

  @Get('doctors')
  async doctors(@Req() req: Request & { user: any }, @Res() res: Response) {
    const [doctors, departments] = await this.pagesService.getAdminDoctors();
    return res.render('pages/admin/doctors-management', { title: 'Shifokorlar boshqaruvi', doctors, departments, user: req.user });
  }

  @Post('doctors/:id/update')
  async updateDoctor(@Param('id') id: string, @Body() body: UpdateDoctorDto, @Res() res: Response) {
    await this.pagesService.updateDoctor(id, body);
    return res.redirect('/admin/doctors?toast=Shifokor yangilandi');
  }

  @Post('doctors/:id/delete')
  async deleteDoctor(@Param('id') id: string, @Res() res: Response) {
    await this.pagesService.deleteDoctor(id);
    return res.redirect('/admin/doctors?toast=Shifokor o\'chirildi');
  }

  @Get('users')
  async users(@Req() req: Request & { user: any }, @Res() res: Response) {
    const { users, departments } = await this.pagesService.getAdminUsers();
    return res.render('pages/admin/users-management', { title: 'Foydalanuvchilar boshqaruvi', users, departments, user: req.user });
  }

  @Post('users/:id/role')
  async changeRole(@Param('id') id: string, @Body() body: ChangeRoleDto, @Req() req: Request & { user: any }, @Res() res: Response) {
    await this.pagesService.changeUserRole(id, body.role, body.role === UserRoles.doctor ? {
      department_id: body.department_id,
      specialization: body.specialization,
      experience: body.experience,
      room_number: body.room_number,
      bio: body.bio || '',
    } : undefined);
    if (req.user.id === id) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.redirect('/login');
    }
    return res.redirect('/admin/users?toast=Rol o\'zgartirildi');
  }

  @Get('departments')
  async departments(@Req() req: Request & { user: any }, @Res() res: Response) {
    const departments = await this.pagesService.getDepartments();
    return res.render('pages/admin/departments-management', { title: 'Bo\'limlar boshqaruvi', departments, user: req.user });
  }

  @Post('departments')
  async createDepartment(@Body() body: CreateDepartmentDto, @Res() res: Response) {
    await this.pagesService.createDepartment(body.name);
    return res.redirect('/admin/departments?toast=Bo\'lim qo\'shildi');
  }

  @Post('departments/:id/update')
  async updateDepartment(@Param('id') id: string, @Body() body: CreateDepartmentDto, @Res() res: Response) {
    await this.pagesService.updateDepartment(id, body.name);
    return res.redirect('/admin/departments?toast=Bo\'lim yangilandi');
  }

  @Post('departments/:id/delete')
  async deleteDepartment(@Param('id') id: string, @Res() res: Response) {
    await this.pagesService.deleteDepartment(id);
    return res.redirect('/admin/departments?toast=Bo\'lim o\'chirildi');
  }

  @Get('add-doctor')
  async addDoctorPage(@Req() req: Request & { user: any }, @Res() res: Response) {
    const departments = await this.pagesService.getDepartments();
    return res.render('pages/admin/add-doctor', { title: 'Yangi shifokor qo\'shish', departments, user: req.user });
  }

  @Post('add-doctor')
  async addDoctor(@Body() body: AddDoctorDto, @Req() req: Request & { user: any }, @Res() res: Response) {
    const { error } = await this.pagesService.addDoctor(body);
    if (error) {
      const departments = await this.pagesService.getDepartments();
      return res.render('pages/admin/add-doctor', { title: 'Yangi shifokor qo\'shish', departments, user: req.user, error });
    }
    return res.redirect('/admin/doctors?toast=Shifokor qo\'shildi');
  }
}

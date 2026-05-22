import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DoctorsService } from './doctor.service';
import { Types } from 'mongoose';
import { CreateDoctorDto } from './dtos/create-doctor.to';
import { UpdateDoctorDto } from './dtos/update-doctor.dto';
import { Doctor } from './models/doctor.model';

@Controller('api/doctors')
export class DoctorsController {
  constructor(private readonly service: DoctorsService) {}

  @Protected(true)
  @Roles([UserRoles.admin, UserRoles.doctor, UserRoles.patient])
  @Get()
  async getAll() {
    return await this.service.getAll();
  }

  @Protected(true)
  @Roles([UserRoles.admin, UserRoles.doctor, UserRoles.patient])
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.service.getOne(id);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post()
  async create(@Body() payload: CreateDoctorDto) {
    return await this.service.create(payload);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ): Promise<Doctor> {
    return await this.service.update(id, updateDoctorDto);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Delete('id')
  async delete(@Param('id') id: string) {
    return await this.service.delete(id);
  }
}

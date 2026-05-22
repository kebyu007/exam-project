import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Type,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { Types } from 'mongoose';
import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';

@Controller('api/services')
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  @Protected(true)
  @Roles([UserRoles.admin, UserRoles.patient, UserRoles.doctor])
  @Get()
  async getAll() {
    return await this.service.getAll();
  }

  @Protected(true)
  @Roles([UserRoles.admin, UserRoles.patient, UserRoles.doctor])
  @Get(':id')
  async getOne(@Param('id') id: Types.ObjectId) {
    return await this.service.getOne(id);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Post()
  async create(@Body('name') name: string) {
    return await this.service.create(name);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Put('id')
  async update(@Param('id') id: Types.ObjectId, @Body('name') name: string) {
    return await this.service.update(id, name);
  }

  @Protected(true)
  @Roles([UserRoles.admin])
  @Delete()
  async delete(@Query('id') id: string) {
    return await this.service.delete(id);
  }
}

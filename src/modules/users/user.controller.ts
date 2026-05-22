import { Protected } from '@/common/decorators/protected.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRoles } from '@/core/constants/constants';
import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(private readonly service: UsersService) {}

  @Protected(true)
  @Roles([UserRoles.admin])
  @Get()
  async getAll() {
    return this.service.getAll();
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.admin])
  @Patch('/:id/profile-image')
  @UseInterceptors(FileInterceptor('image'))
  async updateProfile(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 8 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.service.updateProfile(id, file);
  }

  @Protected(true)
  @Roles([UserRoles.patient, UserRoles.admin])
  @Delete('/:id/profile-image')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.delete(id);
  }
}

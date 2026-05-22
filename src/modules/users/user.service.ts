import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './models/user.model';
import { Model } from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'user-profile');

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  async onModuleInit() {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  async getAll() {
    const users = await this.model.find().select('-password');

    return {
      success: true,
      data: users,
    };
  }

  async updateProfile(id: string, image: Express.Multer.File) {
    const existing = await this.model.findById(id);

    if (!existing) {
      throw new NotFoundException('user not found');
    }

    await fs.writeFile(
      path.join(
        UPLOAD_DIR,
        `${id.toString()}.${image.mimetype?.split('/').at(-1) as string}`,
      ),
      image.buffer,
    );

    await this.model.findByIdAndUpdate(id, {
      profile: `${id.toString()}.${image.mimetype?.split('/').at(-1) as string}`,
    });

    return {
      success: true,
    };
  }

  async delete(id: string) {
    const existing = await this.model.findById(id).exec();

    if (!existing) {
      throw new NotFoundException('user not found');
    }

    if (existing.profile) {
      const absolutePath = path.join(
        process.cwd(),
        'uploads',
        'user-profile',
        existing.profile,
      );

      await fs.unlink(absolutePath);
    }

    await this.model.findByIdAndDelete(id).exec();

    return {
      success: true,
    };
  }
}

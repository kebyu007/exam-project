import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Department } from './models/department.model';
import { Model, Types } from 'mongoose';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private readonly model: Model<Department>,
  ) {}

  async getAll() {
    const services = await this.model.find();

    return {
      success: true,
      data: services,
    };
  }

  async getOne(id: Types.ObjectId) {
    const service = await this.model.findById({ id });

    if (!service) {
      throw new NotFoundException('Department not found');
    }

    return {
      success: true,
      data: service,
    };
  }

  async create(name: string) {
    const existing = await this.model.findOne({ name });

    if (existing) {
      throw new ConflictException('Department already exists');
    }

    await this.model.create({ name });
    return { success: true };
  }

  async update(id: Types.ObjectId, name: string) {
    const existing = await this.model.findById({ id });

    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    await this.model.updateOne({ id }, { name });
    return { success: true };
  }

  async delete(id: string) {
    const existing = await this.model.findOneAndDelete({ _id: id });

    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    return { success: true };
  }
}

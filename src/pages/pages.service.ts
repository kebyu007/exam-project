import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentStatus } from '../modules/appointment/models/appointment.model';
import { Department } from '../modules/department/models/department.model';
import { Doctor } from '../modules/doctors/models/doctor.model';
import { Schedule } from '../modules/schedule/models/schedules.model';
import { User } from '../modules/users/models/user.model';
import { UserRoles } from '@/core/constants/constants';
import * as bcrypt from 'bcrypt';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'user-profile');

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Department.name) private readonly departmentModel: Model<Department>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  getDoctors() {
    return this.doctorModel.find().populate('user_id').populate('department_id').lean();
  }

  getPatientAppointments(patient_id: string) {
    return this.appointmentModel
      .find({ patient_id: new Types.ObjectId(patient_id) })
      .populate({ path: 'doctor_id', populate: { path: 'user_id' } })
      .sort({ appointment_date: -1, appointment_time: 1 })
      .lean({ virtuals: true });
  }

  getProfileUser(id: string) {
    return this.userModel.findById(id).select('-password').lean();
  }

  async updateProfileName(id: string, full_name: string) {
    await this.userModel.findByIdAndUpdate(id, { full_name });
  }

  async uploadProfilePhoto(id: string, file: Express.Multer.File) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const ext = file.originalname.split('.').at(-1) || file.mimetype.split('/').at(-1);
    const filename = `${id}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
    await this.userModel.findByIdAndUpdate(id, { profile: filename });
  }

  async getDoctorBookingData(doctorId: string) {
    const doctor = await this.doctorModel.findById(doctorId).populate('user_id').lean();
    if (!doctor) return null;
    const schedules = await this.scheduleModel.find({ doctor_id: (doctor as any)._id }).lean();
    return { doctor, schedules };
  }

  getDoctorByUserId(user_id: string) {
    return this.doctorModel.findOne({ user_id }).lean();
  }

  getDoctorAppointments(doctor_id: string) {
    return this.appointmentModel
      .find({ doctor_id: new Types.ObjectId(doctor_id) })
      .populate('patient_id')
      .sort({ appointment_date: -1, appointment_time: 1 })
      .lean();
  }

  getDoctorSchedules(doctor_id: string) {
    return this.scheduleModel
      .find({ doctor_id: new Types.ObjectId(doctor_id) })
      .sort({ date: 1, work_day: 1 })
      .lean();
  }

  getAdminDoctors() {
    return Promise.all([
      this.doctorModel.find().populate('user_id').populate('department_id').lean(),
      this.departmentModel.find().lean(),
    ]);
  }

  updateDoctor(id: string, data: { specialization: string; experience: number; room_number: string; bio?: string }) {
    return this.doctorModel.findByIdAndUpdate(id, data);
  }

  deleteDoctor(id: string) {
    return this.doctorModel.findByIdAndDelete(id);
  }

  async getAdminUsers() {
    const [users, departments, doctors] = await Promise.all([
      this.userModel.find().select('-password').lean(),
      this.departmentModel.find().lean(),
      this.doctorModel.find().lean(),
    ]);
    const doctorMap: Record<string, any> = {};
    for (const d of doctors) doctorMap[d.user_id.toString()] = d;
    const usersWithDoctor = users.map(u => ({ ...u, doctorInfo: doctorMap[(u as any)._id.toString()] || null }));
    return { users: usersWithDoctor, departments };
  }

  async changeUserRole(id: string, role: UserRoles, doctorData?: any) {
    await this.userModel.findByIdAndUpdate(id, { role });
    if (role === UserRoles.doctor && doctorData) {
      await this.doctorModel.findOneAndUpdate(
        { user_id: id },
        { user_id: id, ...doctorData },
        { upsert: true, new: true },
      );
    }
  }

  async getAdminStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalUsers, totalDoctors, totalDepartments, totalAppointments, todayAppointments, pendingAppointments] = await Promise.all([
      this.userModel.countDocuments(),
      this.doctorModel.countDocuments(),
      this.departmentModel.countDocuments(),
      this.appointmentModel.countDocuments(),
      this.appointmentModel.countDocuments({ appointment_date: { $gte: today } }),
      this.appointmentModel.countDocuments({ status: AppointmentStatus.PENDING }),
    ]);
    return { totalUsers, totalDoctors, totalDepartments, totalAppointments, todayAppointments, pendingAppointments };
  }

  getDepartments() {
    return this.departmentModel.find().lean();
  }

  async getDepartmentsWithDoctorCount() {
    const [departments, doctors] = await Promise.all([
      this.departmentModel.find().lean(),
      this.doctorModel.find().lean(),
    ]);
    const countMap: Record<string, number> = {};
    for (const d of doctors) {
      const key = d.department_id?.toString();
      if (key) countMap[key] = (countMap[key] || 0) + 1;
    }
    return departments.map(dept => ({ ...dept, doctorCount: countMap[(dept as any)._id.toString()] || 0 }));
  }

  getDepartmentById(id: string) {
    return this.departmentModel.findById(id).lean();
  }

  getDoctorsByDepartment(departmentId: string) {
    return this.doctorModel.find({ department_id: departmentId }).populate('user_id').lean();
  }

  createDepartment(name: string) {
    return this.departmentModel.create({ name });
  }

  updateDepartment(id: string, name: string) {
    return this.departmentModel.findByIdAndUpdate(id, { name });
  }

  deleteDepartment(id: string) {
    return this.departmentModel.findByIdAndDelete(id);
  }

  async addDoctor(body: any): Promise<{ error?: string }> {
    const existingUser = await this.userModel.findOne({ email: body.email });
    if (existingUser) return { error: 'Bu email allaqachon ro\'yxatdan o\'tgan' };

    const newUser = await this.userModel.create({
      full_name: body.full_name,
      email: body.email,
      password: await bcrypt.hash(body.password, 10),
      role: UserRoles.doctor,
      is_active: true,
    });
    await this.doctorModel.create({
      user_id: newUser._id,
      department_id: body.department_id,
      specialization: body.specialization,
      experience: parseInt(body.experience),
      room_number: body.room_number,
      bio: body.bio || '',
    });
    return {};
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentStatus } from './models/appointment.model';
import { Doctor } from '../doctors/models/doctor.model';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name) private readonly model: Model<Appointment>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  async getAll() {
    return {
      success: true,
      data: await this.model.find().populate('patient_id doctor_id'),
    };
  }

  async getAppointmentByUser(patient_id: string) {
    return {
      success: true,
      data: await this.model.find({ patient_id }).populate('doctor_id'),
    };
  }

  async getAppointmentByDoctor(user_id: string) {
    const doctor = await this.doctorModel.findOne({ user_id });
    if (!doctor) return { success: true, data: [] };
    
    return {
      success: true,
      data: await this.model.find({ doctor_id: doctor._id }).populate('patient_id'),
    };
  }

  async getBookedSlots(doctor_id: string, date: string) {
    const { Types } = await import('mongoose');
    const targetDate = new Date(date);
    const dateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const appointments = await this.model.find({
      doctor_id: new Types.ObjectId(doctor_id),
      appointment_date: dateOnly,
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
    }).select('appointment_time');
    
    return {
      success: true,
      data: appointments.map(a => a.appointment_time)
    };
  }

  async create(doctor_id: string, patient_id: string, appointment_date?: string | Date) {
    try {
      console.log('📝 Creating appointment:', { doctor_id, patient_id, appointment_date });
      
      const { Types } = await import('mongoose');
      const dateTime = appointment_date ? new Date(appointment_date) : new Date();
      const date = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
      const time = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
      
      console.log('📅 Parsed date/time:', { date, time });
      
      // Bir xil vaqtga band qilinganligini tekshirish
      const existing = await this.model.findOne({
        doctor_id: new Types.ObjectId(doctor_id),
        appointment_date: date,
        appointment_time: time,
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
      });
      
      if (existing) {
        throw new Error('Bu vaqt allaqachon band qilingan');
      }
      
      const appointment = await this.model.create({
        patient_id: new Types.ObjectId(patient_id),
        doctor_id: new Types.ObjectId(doctor_id),
        appointment_date: date,
        appointment_time: time,
        status: AppointmentStatus.PENDING,
      });
      
      console.log('✅ Appointment created:', appointment);
      return { success: true, data: appointment };
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.model.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
    if (!appointment) throw new NotFoundException('Appointment not found');
    return { success: true, data: appointment };
  }
}

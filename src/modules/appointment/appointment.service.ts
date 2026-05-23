import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentStatus } from './models/appointment.model';
import { Doctor } from '../doctors/models/doctor.model';
import { User } from '../users/models/user.model';
import { Schedule } from '../schedule/models/schedules.model';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name) private readonly model: Model<Appointment>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
    private readonly telegramService: TelegramService,
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

  async getAvailableSlots(doctor_id: string, date: string) {
    const targetDate = new Date(date);
    const dateOnly = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayName = this.getDayName(targetDate);
    
    // Jadvaldan o'sha kun uchun ish vaqtini topish
    const schedule = await this.scheduleModel.findOne({
      doctor_id: new Types.ObjectId(doctor_id),
      $or: [
        { date: dateOnly, work_day: { $exists: false } }, // Aniq sana
        { work_day: dayName as any, date: { $exists: false } } // Haftalik jadval
      ],
      is_available: { $ne: false }
    }).lean();

    if (!schedule) {
      return {
        success: false,
        message: 'Bu kun uchun jadval topilmadi',
        data: []
      };
    }

    // Band qilingan vaqtlarni olish
    const bookedSlots = await this.model.find({
      doctor_id: new Types.ObjectId(doctor_id),
      appointment_date: dateOnly,
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
    }).select('appointment_time');

    const bookedTimes = new Set(bookedSlots.map(a => a.appointment_time));

    // Bo'sh vaqtlarni hisoblash
    const availableSlots = this.generateTimeSlots(
      schedule.start_time,
      schedule.end_time,
      schedule.break_start || '13:00',
      schedule.break_end || '14:00',
      schedule.slot_duration || 30,
      bookedTimes
    );

    return {
      success: true,
      data: availableSlots,
      schedule: {
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        break_start: schedule.break_start,
        break_end: schedule.break_end,
        slot_duration: schedule.slot_duration
      }
    };
  }

  private getDayName(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    breakStart: string,
    breakEnd: string,
    slotDuration: number,
    bookedTimes: Set<string>
  ): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const [breakStartHour, breakStartMin] = breakStart.split(':').map(Number);
    const [breakEndHour, breakEndMin] = breakEnd.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const breakStartMinutes = breakStartHour * 60 + breakStartMin;
    const breakEndMinutes = breakEndHour * 60 + breakEndMin;

    while (currentMinutes + slotDuration <= endMinutes) {
      // Tushlik vaqtini o'tkazib yuborish
      if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
        currentMinutes = breakEndMinutes;
        continue;
      }

      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeSlot = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      // Band qilinmagan vaqtlarni qo'shish
      if (!bookedTimes.has(timeSlot)) {
        slots.push(timeSlot);
      }

      currentMinutes += slotDuration;
    }

    return slots;
  }

  async create(doctor_id: string, patient_id: string, appointment_date?: string | Date) {
    const dateTime = appointment_date ? new Date(appointment_date) : new Date();
    const date = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
    const time = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;

    const existing = await this.model.findOne({
      doctor_id: new Types.ObjectId(doctor_id),
      appointment_date: date,
      appointment_time: time,
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] }
    });

    if (existing) {
      throw new BadRequestException('Bu vaqt allaqachon band qilingan');
    }

    const appointment = await this.model.create({
      patient_id: new Types.ObjectId(patient_id),
      doctor_id: new Types.ObjectId(doctor_id),
      appointment_date: date,
      appointment_time: time,
      status: AppointmentStatus.PENDING,
    });

    const patient = await this.userModel.findById(patient_id);
    const doctor = await this.doctorModel.findById(doctor_id).populate('user_id');

    if (patient?.telegram_chat_id && patient.telegram_linked) {
      await this.telegramService.notifyAppointmentCreated(
        patient.telegram_chat_id,
        (doctor as any)?.user_id?.full_name || 'Doktor',
        date.toLocaleDateString('uz-UZ'),
        time
      );
    }

    const doctorUser = await this.userModel.findById((doctor as any)?.user_id?._id);
    if (doctorUser?.telegram_chat_id && doctorUser.telegram_linked) {
      await this.telegramService.notifyDoctorNewAppointment(
        doctorUser.telegram_chat_id,
        patient?.full_name || 'Bemor',
        date.toLocaleDateString('uz-UZ'),
        time
      );
    }

    return { success: true, data: appointment };
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.model.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).populate('patient_id doctor_id');
    
    if (!appointment) throw new NotFoundException('Appointment not found');

    // Status o'zgarganda xabar yuborish
    const patient = appointment.patient_id as any;
    const doctor = await this.doctorModel.findById(appointment.doctor_id).populate('user_id');
    const doctorName = (doctor as any)?.user_id?.full_name || 'Doktor';
    const date = new Date(appointment.appointment_date).toLocaleDateString('uz-UZ');
    const time = appointment.appointment_time;

    if (status === AppointmentStatus.CONFIRMED && patient?.telegram_chat_id && patient.telegram_linked) {
      await this.telegramService.notifyAppointmentConfirmed(patient.telegram_chat_id, doctorName, date, time);
    } else if (status === AppointmentStatus.CANCELLED && patient?.telegram_chat_id && patient.telegram_linked) {
      await this.telegramService.notifyAppointmentCancelled(patient.telegram_chat_id, doctorName, date, time);
    }

    return { success: true, data: appointment };
  }

  async confirmAppointment(id: string) {
    return this.updateStatus(id, AppointmentStatus.CONFIRMED);
  }

  async cancelAppointment(id: string) {
    return this.updateStatus(id, AppointmentStatus.CANCELLED);
  }

  async addPrescription(id: string, prescription: string, recommendations?: string) {
    const appointment = await this.model.findByIdAndUpdate(
      id,
      { prescription, recommendations, status: AppointmentStatus.COMPLETED },
      { new: true },
    ).populate('patient_id doctor_id');
    
    if (!appointment) throw new NotFoundException('Appointment not found');

    // Bemorga retsept haqida xabar yuborish
    const patient = appointment.patient_id as any;
    const doctor = await this.doctorModel.findById(appointment.doctor_id).populate('user_id');
    const doctorName = (doctor as any)?.user_id?.full_name || 'Doktor';
    const date = new Date(appointment.appointment_date).toLocaleDateString('uz-UZ');

    if (patient?.telegram_chat_id && patient.telegram_linked) {
      await this.telegramService.notifyPrescription(
        patient.telegram_chat_id,
        doctorName,
        date,
        prescription,
        recommendations || '',
      );
    }

    return { success: true, data: appointment };
  }
}

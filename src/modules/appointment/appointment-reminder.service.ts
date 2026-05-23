import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentStatus } from './models/appointment.model';
import { Doctor } from '../doctors/models/doctor.model';
import { User } from '../users/models/user.model';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AppointmentReminderService {
  constructor(
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly telegramService: TelegramService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // 24 soat oldin eslatma
    await this.sendReminderForTimeRange(now, in24Hours, 24);
    
    // 1 soat oldin eslatma
    await this.sendReminderForTimeRange(now, in1Hour, 1);
  }

  private async sendReminderForTimeRange(startTime: Date, endTime: Date, hoursLeft: number) {
    const appointments = await this.appointmentModel
      .find({
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
        appointment_date: {
          $gte: new Date(startTime.toDateString()),
          $lte: new Date(endTime.toDateString()),
        },
        reminder_sent: { $ne: hoursLeft },
      })
      .populate('patient_id doctor_id')
      .lean();

    for (const apt of appointments) {
      const patient = apt.patient_id as any;
      const doctor = await this.doctorModel.findById(apt.doctor_id).populate('user_id');
      const doctorUser = (doctor as any)?.user_id;
      const doctorName = doctorUser?.full_name || 'Doktor';
      const date = new Date(apt.appointment_date).toLocaleDateString('uz-UZ');
      const time = apt.appointment_time;

      // Bemorga eslatma
      if (patient?.telegram_chat_id && patient.telegram_linked) {
        await this.telegramService.notifyAppointmentReminder(
          patient.telegram_chat_id,
          doctorName,
          date,
          time,
          hoursLeft,
        );
      }

      // Doktorga eslatma
      if (doctorUser?.telegram_chat_id && doctorUser.telegram_linked) {
        await this.telegramService.notifyDoctorAppointmentReminder(
          doctorUser.telegram_chat_id,
          patient?.full_name || 'Bemor',
          date,
          time,
          hoursLeft,
        );
      }

      // Eslatma yuborilganligini belgilash
      await this.appointmentModel.findByIdAndUpdate(apt._id, {
        $addToSet: { reminder_sent: hoursLeft },
      });
    }
  }
}

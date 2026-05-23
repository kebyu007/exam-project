import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Markup } from 'telegraf';
import { Context } from 'telegraf';
import { User } from '../users/models/user.model';
import { Appointment, AppointmentStatus } from '../appointment/models/appointment.model';
import { Doctor } from '../doctors/models/doctor.model';
import { Schedule } from '../schedule/models/schedules.model';

const DAYS_UZ: Record<string, string> = {
  monday: 'Dushanba', tuesday: 'Seshanba', wednesday: 'Chorshanba',
  thursday: 'Payshanba', friday: 'Juma', saturday: 'Shanba', sunday: 'Yakshanba',
};
const WEEK_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};
const SHORT_DAYS = ['Yak', 'Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha'];

@Injectable()
export class TelegramBotService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Appointment.name) private readonly appointmentModel: Model<Appointment>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
    @InjectModel(Schedule.name) private readonly scheduleModel: Model<Schedule>,
  ) {}

  getUserByTelegram(telegramId?: number) {
    if (!telegramId) return null;
    return this.userModel.findOne({ telegram_chat_id: telegramId.toString(), telegram_linked: true });
  }

  async linkTelegram(userId: string, chatId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return null;
    await this.userModel.findByIdAndUpdate(userId, { telegram_chat_id: chatId, telegram_linked: true });
    return user;
  }

  async getDoctorByUserId(userId: string) {
    return this.doctorModel.findOne({ user_id: userId });
  }

  doctorKeyboard(): ReturnType<typeof Markup.keyboard> {
    return Markup.keyboard([
      ['📅 Mening qabullarim', '⏰ Jadval belgilash'],
      ['📊 Statistika', '⚙️ Sozlamalar'],
    ]).resize();
  }

  patientKeyboard(): ReturnType<typeof Markup.keyboard> {
    return Markup.keyboard([
      ['📅 Qabulga yozilish', '📋 Mening qabullarim'],
      ['👨‍⚕️ Shifokorlar', '⚙️ Sozlamalar'],
    ]).resize();
  }

  async startBooking(ctx: Context, user: any, sessions: Map<number, any>) {
    const doctors = await this.doctorModel.find().populate('user_id').limit(10).lean();
    if (doctors.length === 0) {
      await ctx.reply('❌ Hozircha shifokorlar yo\'q.');
      return;
    }
    let message = '👨‍⚕️ Shifokorni tanlang (raqamini yozing):\n\n';
    doctors.forEach((doc: any, i) => {
      message += `${i + 1}. ${doc.user_id?.full_name} - ${doc.specialization}\n`;
    });
    sessions.set(ctx.from!.id, { step: 'select_doctor', doctors: doctors.map((d: any) => d._id.toString()) });
    await ctx.reply(message, Markup.keyboard([['❌ Bekor qilish']]).resize());
  }

  async selectDoctor(ctx: Context, index: number, session: any, sessions: Map<number, any>) {
    const doctorId = session.doctors?.[index - 1];
    if (!doctorId) { await ctx.reply('❌ Noto\'g\'ri raqam.'); return; }

    const doctor = await this.doctorModel.findById(doctorId).populate('user_id').lean();
    const schedules = await this.scheduleModel.find({ doctor_id: new Types.ObjectId(doctorId) }).lean();
    if (schedules.length === 0) {
      await ctx.reply('❌ Bu shifokor uchun jadval yo\'q.');
      sessions.delete(ctx.from!.id);
      return;
    }

    const dateBased = schedules.filter((s: any) => s.date);
    const list = dateBased.length > 0 ? dateBased : schedules.filter((s: any) => s.work_day && !s.date);
    const type = dateBased.length > 0 ? 'date' : 'weekly';

    let message = `👨‍⚕️ ${(doctor?.user_id as any)?.full_name}\n\n📅 Jadvallar:\n`;
    list.forEach((s: any, i) => {
      message += s.date
        ? `${i + 1}. ${new Date(s.date).toLocaleDateString('uz-UZ')} (${SHORT_DAYS[new Date(s.date).getDay()]}) ${s.start_time}-${s.end_time}\n`
        : `${i + 1}. ${DAYS_UZ[s.work_day] || s.work_day} ${s.start_time}-${s.end_time}\n`;
    });
    message += '\nRaqamini tanlang:';

    Object.assign(session, { step: 'select_schedule', doctorId, schedules: list, type });
    sessions.set(ctx.from!.id, session);
    await ctx.reply(message);
  }

  async selectSchedule(ctx: Context, index: number, session: any, sessions: Map<number, any>) {
    const schedule = session.schedules?.[index - 1];
    if (!schedule) { await ctx.reply('❌ Noto\'g\'ri raqam.'); return; }

    session.selectedSchedule = schedule;

    if (session.type === 'date' && schedule.date) {
      session.appointmentDate = new Date(schedule.date).toISOString().split('T')[0];
      sessions.set(ctx.from!.id, session);
      await this.showTimeSlots(ctx, session, sessions);
    } else {
      const targetDay = WEEK_MAP[schedule.work_day];
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === targetDay) dates.push(d.toISOString().split('T')[0]);
      }
      const buttons = dates.map(date => {
        const d = new Date(date);
        return [Markup.button.callback(`${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`, `select_date_${date}`)];
      });
      session.step = 'awaiting_date_selection';
      sessions.set(ctx.from!.id, session);
      await ctx.reply(`📅 ${DAYS_UZ[schedule.work_day]} kuni uchun sanani tanlang:`, Markup.inlineKeyboard(buttons));
    }
  }

  async showTimeSlots(ctx: Context, session: any, sessions: Map<number, any>) {
    const schedule = session.selectedSchedule;
    if (!schedule || !session.appointmentDate) {
      await ctx.reply('❌ Sessiya muddati tugagan. /book ni qaytadan bosing.');
      return;
    }

    const [sh, sm] = schedule.start_time.split(':').map(Number);
    const [eh, em] = schedule.end_time.split(':').map(Number);
    const slotDuration = schedule.slot_duration || 30;
    const [bsh, bsm] = (schedule.break_start || '13:00').split(':').map(Number);
    const [beh, bem] = (schedule.break_end || '14:00').split(':').map(Number);
    const breakStartMin = bsh * 60 + bsm;
    const breakEndMin = beh * 60 + bem;

    const slots: string[] = [];
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur < end) {
      if (cur >= breakStartMin && cur < breakEndMin) { cur = breakEndMin; continue; }
      slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
      cur += slotDuration;
    }

    const booked = await this.appointmentModel.find({
      doctor_id: new Types.ObjectId(session.doctorId),
      appointment_date: new Date(session.appointmentDate),
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    }).lean();
    const bookedSet = new Set(booked.map(a => a.appointment_time));

    const morningSlots = slots.filter(s => parseInt(s.split(':')[0]) < 12);
    const eveningSlots = slots.filter(s => parseInt(s.split(':')[0]) >= 12);

    session.morningSlots = morningSlots;
    session.eveningSlots = eveningSlots;
    session.bookedSet = Array.from(bookedSet);
    sessions.set(ctx.from!.id, session);

    const buttons: any[] = [];
    if (morningSlots.length > 0) buttons.push([Markup.button.callback('🌅 Kunduzi', 'show_morning')]);
    if (eveningSlots.length > 0) buttons.push([Markup.button.callback('🌆 Kechqurun', 'show_evening')]);

    await ctx.reply(
      `📅 Sana: ${new Date(session.appointmentDate).toLocaleDateString('uz-UZ')}\n\n⏰ Vaqtni tanlang:`,
      Markup.inlineKeyboard(buttons)
    );
  }

  async confirmBooking(ctx: Context, time: string, session: any, sessions: Map<number, any>) {
    if (!session.doctorId || !session.appointmentDate) {
      await ctx.reply('❌ Sessiya muddati tugagan. /book ni qaytadan bosing.');
      sessions.delete(ctx.from!.id);
      return;
    }

    const schedule = session.selectedSchedule;
    if (schedule?.start_time && schedule?.end_time) {
      const [h, m] = time.split(':').map(Number);
      const [sh, sm] = schedule.start_time.split(':').map(Number);
      const [eh, em] = schedule.end_time.split(':').map(Number);
      if (h * 60 + m < sh * 60 + sm || h * 60 + m >= eh * 60 + em) {
        await ctx.reply(`❌ Vaqt ${schedule.start_time} - ${schedule.end_time} oralig'ida bo'lishi kerak.`);
        return;
      }
    }

    const existing = await this.appointmentModel.findOne({
      doctor_id: new Types.ObjectId(session.doctorId),
      appointment_date: new Date(session.appointmentDate),
      appointment_time: time,
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
    });
    if (existing) { await ctx.reply('❌ Bu vaqt band. Boshqa vaqt tanlang:'); return; }

    await this.appointmentModel.create({
      patient_id: new Types.ObjectId(ctx.from!.id.toString()),
      doctor_id: new Types.ObjectId(session.doctorId),
      appointment_date: new Date(session.appointmentDate),
      appointment_time: time,
      status: AppointmentStatus.PENDING,
    });

    // patient_id ni user._id dan olish kerak — session da saqlangan
    await this.appointmentModel.findOneAndUpdate(
      { doctor_id: new Types.ObjectId(session.doctorId), appointment_date: new Date(session.appointmentDate), appointment_time: time },
      { patient_id: new Types.ObjectId(session.userId) }
    );

    const doctor = await this.doctorModel.findById(session.doctorId).populate('user_id').lean();
    await ctx.reply(
      `✅ Qabulga muvaffaqiyatli yozildingiz!\n\n` +
      `👨‍⚕️ Shifokor: ${(doctor?.user_id as any)?.full_name || 'Shifokor'}\n` +
      `📆 Sana: ${new Date(session.appointmentDate).toLocaleDateString('uz-UZ')}\n` +
      `⏰ Vaqt: ${time}\n\nQabul tasdiqlanishi kutilmoqda.`
    );
    sessions.delete(ctx.from!.id);
  }

  async showMyAppointments(ctx: Context, user: any) {
    const appointments = await this.appointmentModel
      .find({ patient_id: user._id })
      .populate({ path: 'doctor_id', populate: { path: 'user_id' } })
      .sort({ appointment_date: -1 })
      .limit(10)
      .lean();

    if (appointments.length === 0) { await ctx.reply('📅 Sizda qabullar yo\'q.'); return; }

    const statusLabel: Record<string, string> = {
      pending: '⏳ Kutilmoqda', confirmed: '✅ Tasdiqlangan',
      completed: '✔️ Yakunlangan', cancelled: '❌ Bekor qilingan',
    };

    for (const apt of appointments) {
      const doctor = apt.doctor_id as any;
      let message = `📅 Qabul:\n\n👨‍⚕️ Doktor: ${doctor?.user_id?.full_name}\n` +
        `📆 Sana: ${new Date(apt.appointment_date).toLocaleDateString('uz-UZ')}\n` +
        `⏰ Vaqt: ${apt.appointment_time}\n📊 Status: ${statusLabel[apt.status] || apt.status}`;
      if (apt.prescription) message += `\n\n💊 Retsept:\n${apt.prescription.substring(0, 100)}${apt.prescription.length > 100 ? '...' : ''}`;

      const canCancel = apt.status === 'pending' || apt.status === 'confirmed';
      await ctx.reply(message, canCancel ? Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish', `cancel_my_apt_${apt._id}`)]]) : undefined);
    }
  }

  async showDoctors(ctx: Context) {
    const doctors = await this.doctorModel.find().populate('user_id').limit(10).lean();
    if (doctors.length === 0) { await ctx.reply('❌ Hozircha shifokorlar yo\'q.'); return; }
    for (const doc of doctors) {
      const docUser = doc.user_id as any;
      await ctx.reply(
        `👨‍⚕️ ${docUser?.full_name}\n🩺 ${doc.specialization}\n📊 ${doc.experience} yil tajriba`,
        Markup.inlineKeyboard([[Markup.button.callback('📅 Qabulga yozilish', `book_doctor_${doc._id}`)]])
      );
    }
  }

  async showDoctorAppointments(ctx: Context, doctor: any) {
    const appointments = await this.appointmentModel
      .find({ doctor_id: doctor._id, status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] } })
      .populate('patient_id')
      .sort({ appointment_date: 1 })
      .limit(10)
      .lean();

    if (appointments.length === 0) { await ctx.reply('📅 Qabullar yo\'q.'); return; }

    for (const apt of appointments) {
      const patient = apt.patient_id as any;
      const buttons: any[] = apt.status === 'pending'
        ? [[Markup.button.callback('✅ Tasdiqlash', `confirm_apt_${apt._id}`), Markup.button.callback('❌ Bekor qilish', `cancel_apt_${apt._id}`)]]
        : apt.status === 'confirmed'
        ? [[Markup.button.callback('📝 Retsept yozish', `prescribe_${apt._id}`), Markup.button.callback('✔️ Yakunlash', `complete_apt_${apt._id}`)]]
        : [];

      await ctx.reply(
        `👤 ${patient?.full_name}\n📆 ${new Date(apt.appointment_date).toLocaleDateString('uz-UZ')} ${apt.appointment_time}\n📊 Status: ${apt.status === 'pending' ? '⏳ Kutilmoqda' : '✅ Tasdiqlangan'}`,
        buttons.length > 0 ? Markup.inlineKeyboard(buttons) : undefined
      );
    }
  }

  async showDoctorStatistics(ctx: Context, doctor: any) {
    const [total, pending, confirmed, completed, todayCount] = await Promise.all([
      this.appointmentModel.countDocuments({ doctor_id: doctor._id }),
      this.appointmentModel.countDocuments({ doctor_id: doctor._id, status: AppointmentStatus.PENDING }),
      this.appointmentModel.countDocuments({ doctor_id: doctor._id, status: AppointmentStatus.CONFIRMED }),
      this.appointmentModel.countDocuments({ doctor_id: doctor._id, status: AppointmentStatus.COMPLETED }),
      this.appointmentModel.countDocuments({
        doctor_id: doctor._id,
        appointment_date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      }),
    ]);
    await ctx.reply(
      `📊 Statistika:\n\n📅 Bugungi qabullar: ${todayCount}\n⏳ Kutilmoqda: ${pending}\n✅ Tasdiqlangan: ${confirmed}\n✔️ Yakunlangan: ${completed}\n📈 Jami qabullar: ${total}`
    );
  }

  async savePrescription(ctx: Context, text: string, session: any, sessions: Map<number, any>) {
    const apt = await this.appointmentModel
      .findByIdAndUpdate(session.appointmentId, { prescription: text, recommendations: text, status: AppointmentStatus.COMPLETED }, { new: true })
      .populate('patient_id doctor_id');

    const patient = apt?.patient_id as any;
    if (patient?.telegram_chat_id) {
      await ctx.telegram.sendMessage(
        patient.telegram_chat_id,
        `💊 Yangi retsept!\n\n👨‍⚕️ Doktor: ${(apt?.doctor_id as any)?.user_id?.full_name}\n` +
        `📆 Sana: ${new Date(apt!.appointment_date).toLocaleDateString('uz-UZ')}\n\n📝 Retsept:\n${text}`
      );
    }
    await ctx.reply('✅ Retsept saqlandi va bemorga yuborildi!');
    sessions.delete(ctx.from!.id);
  }

  async confirmAppointmentAction(ctx: any) {
    const appointmentId = ctx.match![1];
    await this.appointmentModel.findByIdAndUpdate(appointmentId, { status: AppointmentStatus.CONFIRMED });
    const apt = await this.appointmentModel.findById(appointmentId).populate('patient_id');
    const patient = apt?.patient_id as any;
    if (patient?.telegram_chat_id) {
      await ctx.telegram.sendMessage(patient.telegram_chat_id,
        `✅ Qabulingiz tasdiqlandi!\n\n📆 Sana: ${new Date(apt!.appointment_date).toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${apt!.appointment_time}`
      );
    }
    await ctx.answerCbQuery('✅ Qabul tasdiqlandi');
    await ctx.editMessageReplyMarkup(undefined);
  }

  async cancelAppointmentAction(ctx: any) {
    const appointmentId = ctx.match![1];
    await this.appointmentModel.findByIdAndUpdate(appointmentId, { status: AppointmentStatus.CANCELLED });
    const apt = await this.appointmentModel.findById(appointmentId).populate('patient_id');
    const patient = apt?.patient_id as any;
    if (patient?.telegram_chat_id) {
      await ctx.telegram.sendMessage(patient.telegram_chat_id,
        `❌ Qabulingiz bekor qilindi.\n\n📆 Sana: ${new Date(apt!.appointment_date).toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${apt!.appointment_time}`
      );
    }
    await ctx.answerCbQuery('❌ Qabul bekor qilindi');
    await ctx.editMessageReplyMarkup(undefined);
  }

  async cancelMyAppointmentAction(ctx: any, user: any) {
    const appointmentId = ctx.match![1];
    const apt = await this.appointmentModel.findById(appointmentId);
    if (!apt || apt.patient_id.toString() !== user._id.toString()) {
      await ctx.answerCbQuery('❌ Bu qabulni bekor qila olmaysiz');
      return;
    }
    await this.appointmentModel.findByIdAndUpdate(appointmentId, { status: AppointmentStatus.CANCELLED });
    const doctor = await this.doctorModel.findById(apt.doctor_id).populate('user_id');
    const doctorUser = (doctor as any)?.user_id;
    if (doctorUser?.telegram_chat_id && doctorUser.telegram_linked) {
      await ctx.telegram.sendMessage(doctorUser.telegram_chat_id,
        `❌ Bemor qabulni bekor qildi\n\n👤 Bemor: ${user.full_name}\n📆 Sana: ${new Date(apt.appointment_date).toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${apt.appointment_time}`
      );
    }
    await ctx.answerCbQuery('✅ Qabul bekor qilindi');
    await ctx.editMessageText(`❌ Qabul bekor qilindi\n\n📆 Sana: ${new Date(apt.appointment_date).toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${apt.appointment_time}`);
  }

  async completeAppointmentAction(ctx: any) {
    const appointmentId = ctx.match![1];
    await this.appointmentModel.findByIdAndUpdate(appointmentId, { status: AppointmentStatus.COMPLETED });
    const apt = await this.appointmentModel.findById(appointmentId).populate('patient_id');
    const patient = apt?.patient_id as any;
    if (patient?.telegram_chat_id) {
      await ctx.telegram.sendMessage(patient.telegram_chat_id,
        `✔️ Qabulingiz yakunlandi!\n\n📆 Sana: ${new Date(apt!.appointment_date).toLocaleDateString('uz-UZ')}\n⏰ Vaqt: ${apt!.appointment_time}\n\nSog'lig'ingiz yaxshi bo'lsin!`
      );
    }
    await ctx.answerCbQuery('✅ Qabul yakunlandi');
    await ctx.editMessageReplyMarkup(undefined);
  }

  async bookDoctorAction(ctx: any, sessions: Map<number, any>) {
    const doctorId = ctx.match![1];
    const doctor = await this.doctorModel.findById(doctorId).populate('user_id').lean();
    if (!doctor) { await ctx.answerCbQuery('❌ Shifokor topilmadi'); return; }

    const schedules = await this.scheduleModel.find({ doctor_id: new Types.ObjectId(doctorId) }).lean();
    if (schedules.length === 0) {
      await ctx.answerCbQuery('❌ Bu shifokor uchun jadval yo\'q');
      await ctx.reply('❌ Bu shifokor uchun hozircha jadval belgilanmagan.');
      return;
    }

    const dateBased = schedules.filter((s: any) => s.date);
    const weeklyBased = schedules.filter((s: any) => s.work_day && !s.date);
    const list = dateBased.length > 0 ? dateBased : weeklyBased;
    const type = dateBased.length > 0 ? 'date' : 'weekly';

    let message = `👨‍⚕️ ${(doctor.user_id as any)?.full_name} - ${doctor.specialization}\n\n`;
    message += dateBased.length > 0 ? '📅 Mavjud kunlar:\n' : '📅 Haftalik jadval:\n';
    list.forEach((s: any, i) => {
      message += s.date
        ? `${i + 1}. ${new Date(s.date).toLocaleDateString('uz-UZ')} (${SHORT_DAYS[new Date(s.date).getDay()]}) ${s.start_time}-${s.end_time}\n`
        : `${i + 1}. ${DAYS_UZ[s.work_day] || s.work_day} ${s.start_time}-${s.end_time}\n`;
    });
    message += '\nRaqamini yozing:';

    sessions.set(ctx.from!.id, { step: 'select_schedule', doctorId, schedules: list, type });
    await ctx.answerCbQuery();
    await ctx.reply(message);
  }
}

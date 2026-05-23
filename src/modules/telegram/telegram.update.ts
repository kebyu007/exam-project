import { Update, Ctx, Start, Help, Command, On, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { TelegramBotService } from './telegram.bot.service';

interface SessionContext extends Context {
  match?: RegExpExecArray;
}

@Update()
export class TelegramUpdate {
  private userSessions = new Map<number, any>();

  constructor(private readonly botService: TelegramBotService) {}

  @Start()
  async start(@Ctx() ctx: SessionContext) {
    const args = (ctx.message as any)?.text?.split(' ')[1];
    if (args?.startsWith('link_')) {
      const userId = args.replace('link_', '');
      const user = await this.botService.linkTelegram(userId, ctx.chat!.id.toString());
      if (user) {
        await ctx.reply(`✅ Telegram muvaffaqiyatli bog'landi!\n\nSalom, ${user.full_name}! Menyu uchun /menu ni bosing.`);
      } else {
        await ctx.reply('❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
      }
      return;
    }
    await ctx.reply(
      `🏥 Smart Clinic botiga xush kelibsiz!\n\nBotdan foydalanish uchun avval veb-saytda ro'yxatdan o'ting va Telegram'ni bog'lang.\n\nBuyruqlar:\n/menu - Asosiy menyu\n/help - Yordam`
    );
  }

  @Command('menu')
  async menu(@Ctx() ctx: Context) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.reply('❌ Telegram bog\'lanmagan. Avval veb-saytda bog\'lang.'); return; }
    const doctor = await this.botService.getDoctorByUserId(user._id.toString());
    await ctx.reply(doctor ? '👨‍⚕️ Doktor menyusi:' : '👤 Bemor menyusi:', doctor ? this.botService.doctorKeyboard() : this.botService.patientKeyboard());
  }

  @On('text')
  async onText(@Ctx() ctx: SessionContext) {
    const text = (ctx.message as any)?.text;
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.reply('❌ Telegram bog\'lanmagan. /start ni bosing.'); return; }

    if (text === '/cancel' || text === '❌ Bekor qilish') {
      const hadSession = this.userSessions.has(ctx.from!.id);
      this.userSessions.delete(ctx.from!.id);
      const doctor = await this.botService.getDoctorByUserId(user._id.toString());
      await ctx.reply(
        hadSession ? '❌ Joriy amal bekor qilindi.\n\n📋 Asosiy menyu:' : 'ℹ️ Hozirda faol amal yo\'q.\n\n📋 Asosiy menyu:',
        doctor ? this.botService.doctorKeyboard() : this.botService.patientKeyboard()
      );
      return;
    }

    const session = this.userSessions.get(ctx.from!.id) || {};
    const doctor = await this.botService.getDoctorByUserId(user._id.toString());

    if (doctor) {
      if (text === '📅 Mening qabullarim') {
        await this.botService.showDoctorAppointments(ctx, doctor);
      } else if (text === '⏰ Jadval belgilash') {
        await ctx.reply('⏰ Jadval belgilash uchun veb-saytdan foydalaning:\nhttp://localhost:3000/doctor/schedule');
      } else if (text === '📊 Statistika') {
        await this.botService.showDoctorStatistics(ctx, doctor);
      } else if (text === '⚙️ Sozlamalar') {
        await ctx.reply(`⚙️ Sozlamalar:\n\n👤 Ism: ${user.full_name}\n📧 Email: ${user.email}\n🩺 Mutaxassislik: ${doctor.specialization}\n📊 Tajriba: ${doctor.experience} yil\n🔗 Telegram: ✅ Bog'langan\n\nhttp://localhost:3000/profile`);
      } else if (session.step === 'write_prescription') {
        await this.botService.savePrescription(ctx, text, session, this.userSessions);
      }
    } else {
      if (text === '📅 Qabulga yozilish') {
        await this.botService.startBooking(ctx, user, this.userSessions);
      } else if (text === '📋 Mening qabullarim') {
        await this.botService.showMyAppointments(ctx, user);
      } else if (text === '👨‍⚕️ Shifokorlar') {
        await this.botService.showDoctors(ctx);
      } else if (text === '⚙️ Sozlamalar') {
        await ctx.reply(`⚙️ Sozlamalar:\n\n👤 Ism: ${user.full_name}\n📧 Email: ${user.email}\n🔗 Telegram: ✅ Bog'langan\n\nhttp://localhost:3000/profile`);
      } else if (session.step === 'select_doctor' && text.match(/^\d+$/)) {
        session.userId = user._id.toString();
        this.userSessions.set(ctx.from!.id, session);
        await this.botService.selectDoctor(ctx, parseInt(text), session, this.userSessions);
      } else if (session.step === 'select_schedule' && text.match(/^\d+$/)) {
        session.userId = user._id.toString();
        this.userSessions.set(ctx.from!.id, session);
        await this.botService.selectSchedule(ctx, parseInt(text), session, this.userSessions);
      } else if (session.step === 'select_time') {
        if (text.match(/^\d{2}:\d{2}$/)) {
          session.userId = user._id.toString();
          await this.botService.confirmBooking(ctx, text, session, this.userSessions);
        } else {
          await ctx.reply('❌ Vaqt formati noto\'g\'ri. HH:MM formatda kiriting (masalan: 09:00):');
        }
      }
    }
  }

  @Action(/^confirm_apt_(.+)$/)
  async confirmAppointment(@Ctx() ctx: SessionContext) {
    await this.botService.confirmAppointmentAction(ctx);
  }

  @Action(/^cancel_apt_(.+)$/)
  async cancelAppointment(@Ctx() ctx: SessionContext) {
    await this.botService.cancelAppointmentAction(ctx);
  }

  @Action(/^cancel_my_apt_(.+)$/)
  async cancelMyAppointment(@Ctx() ctx: SessionContext) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.answerCbQuery('❌ Xatolik yuz berdi'); return; }
    await this.botService.cancelMyAppointmentAction(ctx, user);
  }

  @Action(/^prescribe_(.+)$/)
  async prescribeAction(@Ctx() ctx: SessionContext) {
    const session = this.userSessions.get(ctx.from!.id) || {};
    session.step = 'write_prescription';
    session.appointmentId = ctx.match![1];
    this.userSessions.set(ctx.from!.id, session);
    await ctx.answerCbQuery();
    await ctx.reply('📝 Retsept va maslahatlarni yozing (bir xabar ichida):');
  }

  @Action(/^complete_apt_(.+)$/)
  async completeAppointment(@Ctx() ctx: SessionContext) {
    await this.botService.completeAppointmentAction(ctx);
  }

  @Action(/^select_time_(.+)$/)
  async selectTimeAction(@Ctx() ctx: SessionContext) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.answerCbQuery('❌ Xatolik'); return; }
    const session = this.userSessions.get(ctx.from!.id) || {};
    session.userId = user._id.toString();
    await ctx.answerCbQuery();
    await this.botService.confirmBooking(ctx, ctx.match![1], session, this.userSessions);
  }

  @Action(/^select_date_(.+)$/)
  async selectDateAction(@Ctx() ctx: SessionContext) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.answerCbQuery('❌ Xatolik'); return; }
    const session = this.userSessions.get(ctx.from!.id) || {};
    session.appointmentDate = ctx.match![1];
    session.userId = user._id.toString();
    this.userSessions.set(ctx.from!.id, session);
    await ctx.answerCbQuery();
    await this.botService.showTimeSlots(ctx, session, this.userSessions);
  }

  @Action(/^book_doctor_(.+)$/)
  async bookDoctorAction(@Ctx() ctx: SessionContext) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.answerCbQuery('❌ Telegram bog\'lanmagan'); return; }
    await this.botService.bookDoctorAction(ctx, this.userSessions);
  }

  @Action('show_morning')
  async showMorningSlots(@Ctx() ctx: SessionContext) {
    const session = this.userSessions.get(ctx.from!.id) || {};
    const bookedSet = new Set(session.bookedSet || []);
    const buttons = (session.morningSlots || []).map((time: string) => [
      Markup.button.callback(bookedSet.has(time) ? `${time} ❌` : time, bookedSet.has(time) ? 'booked' : `select_time_${time}`)
    ]);
    buttons.push([Markup.button.callback('⬅️ Ortga', 'back_to_time_menu')]);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
  }

  @Action('show_evening')
  async showEveningSlots(@Ctx() ctx: SessionContext) {
    const session = this.userSessions.get(ctx.from!.id) || {};
    const bookedSet = new Set(session.bookedSet || []);
    const buttons = (session.eveningSlots || []).map((time: string) => [
      Markup.button.callback(bookedSet.has(time) ? `${time} ❌` : time, bookedSet.has(time) ? 'booked' : `select_time_${time}`)
    ]);
    buttons.push([Markup.button.callback('⬅️ Ortga', 'back_to_time_menu')]);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
  }

  @Action('back_to_time_menu')
  async backToTimeMenu(@Ctx() ctx: SessionContext) {
    const session = this.userSessions.get(ctx.from!.id) || {};
    const buttons: any[] = [];
    if ((session.morningSlots || []).length > 0) buttons.push([Markup.button.callback('🌅 Kunduzi', 'show_morning')]);
    if ((session.eveningSlots || []).length > 0) buttons.push([Markup.button.callback('🌆 Kechqurun', 'show_evening')]);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
  }

  @Action('booked')
  async bookedSlot(@Ctx() ctx: SessionContext) {
    await ctx.answerCbQuery('❌ Bu vaqt band');
  }

  @Command('myappointments')
  async myAppointmentsCommand(@Ctx() ctx: Context) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.reply('❌ Telegram bog\'lanmagan. /start ni bosing.'); return; }
    await this.botService.showMyAppointments(ctx, user);
  }

  @Command('doctors')
  async doctorsCommand(@Ctx() ctx: Context) {
    await this.botService.showDoctors(ctx);
  }

  @Command('book')
  async bookCommand(@Ctx() ctx: Context) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    if (!user) { await ctx.reply('❌ Telegram bog\'lanmagan. /start ni bosing.'); return; }
    await this.botService.startBooking(ctx, user, this.userSessions);
  }

  @Command('cancel')
  async cancelCommand(@Ctx() ctx: Context) {
    const user = await this.botService.getUserByTelegram(ctx.from?.id);
    const hadSession = this.userSessions.has(ctx.from!.id);
    this.userSessions.delete(ctx.from!.id);
    const doctor = user ? await this.botService.getDoctorByUserId(user._id.toString()) : null;
    await ctx.reply(
      hadSession ? '❌ Joriy amal bekor qilindi.' : 'ℹ️ Hozirda faol amal yo\'q.',
      doctor ? this.botService.doctorKeyboard() : this.botService.patientKeyboard()
    );
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply(
      `📋 Yordam:\n\n🔹 Asosiy komandalar:\n/start - Botni boshlash\n/menu - Asosiy menyu\n/myappointments - Mening qabullarim\n/doctors - Shifokorlar ro'yxati\n/book - Qabulga yozilish\n/cancel - Joriy amalni bekor qilish\n/help - Yordam`
    );
  }
}

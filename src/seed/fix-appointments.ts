import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment } from '../modules/appointment/models/appointment.model';

async function fixAppointments() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appointmentModel = app.get<Model<Appointment>>('AppointmentModel');

  const appointments = await appointmentModel.find({ appointment_time: { $exists: false } });
  console.log(`Found ${appointments.length} appointments without time`);

  for (const apt of appointments) {
    const date = new Date(apt.appointment_date);
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    await appointmentModel.updateOne(
      { _id: apt._id },
      { 
        $set: { 
          appointment_time: time,
          appointment_date: dateOnly
        } 
      }
    );
    console.log(`✅ Fixed appointment ${apt._id}: ${dateOnly.toISOString().split('T')[0]} ${time}`);
  }

  console.log('✅ All appointments fixed!');
  await app.close();
}

fixAppointments().catch(console.error);

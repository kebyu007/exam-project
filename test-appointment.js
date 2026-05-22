// Test appointment yaratish
// MongoDB shell'da ishga tushiring: mongosh smart-clinic < test-appointment.js

use smart-clinic

// Doctor va patient ID'larini oling
const doctor = db.doctors.findOne();
const patient = db.users.findOne({ role: 'patient' });

if (!doctor || !patient) {
  print('❌ Doctor yoki patient topilmadi!');
  quit();
}

print('Doctor ID:', doctor._id);
print('Patient ID:', patient._id);

// Appointment yaratish
const result = db.appointments.insertOne({
  patient_id: patient._id,
  doctor_id: doctor._id,
  appointment_date: new Date('2026-05-23'),
  appointment_time: '10:00',
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Appointment yaratildi:', result.insertedId);

// Tekshirish
const apt = db.appointments.findOne({ _id: result.insertedId });
print('Yaratilgan appointment:', JSON.stringify(apt, null, 2));

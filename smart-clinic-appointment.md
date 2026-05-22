# Smart Clinic Appointment System

## Loyiha haqida

Smart Clinic Appointment System - bu bemorlar onlayn shifokor qabuliga yozilishi mumkin bo'lgan tibbiy appointment platformasi.

## Texnologiyalar

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Dasturlash tili
- **MongoDB** - Ma'lumotlar bazasi
- **Mongoose** - ODM
- **JWT** - Autentifikatsiya
- **Nodemailer** - Email yuborish
- **Winston** - Logging
- **HBS (Handlebars)** - Template engine

### Frontend
- **HBS (Handlebars)** - Server-side rendering
- **Bootstrap 5** - CSS framework
- **Vanilla JavaScript** - Client-side logic

## Asosiy funksiyalar

### Autentifikatsiya
- Ro'yxatdan o'tish
- Kirish
- Email aktivatsiya
- JWT autentifikatsiya

### Bemor (Patient) funksiyalari
- Shifokorlarni ko'rish
- Qabulga yozilish
- Qabullar tarixini ko'rish
- Profilni boshqarish

### Shifokor (Doctor) funksiyalari
- Ish jadvalini boshqarish
- Qabullarni tasdiqlash
- Bemorlar ro'yxatini ko'rish

### Admin funksiyalari
- Shifokorlarni boshqarish
- Bo'limlarni boshqarish
- Foydalanuvchilarni boshqarish

## O'rnatish

```bash
# Dependencies o'rnatish
pnpm install

# .env faylni sozlash
cp .env.sample .env
# .env faylda kerakli o'zgaruvchilarni to'ldiring

# MongoDB ishga tushirish (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Development rejimda ishga tushirish
pnpm run start:dev
```

## Environment o'zgaruvchilari

```env
PORT=3000
MONGO_URL=mongodb://localhost:27017/smart-clinic
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your-cookie-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Loyiha strukturasi

```
src/
├── auth/                 # Autentifikatsiya moduli
├── users/                # Foydalanuvchilar moduli
├── doctors/              # Shifokorlar moduli
├── appointments/         # Qabullar moduli
├── schedules/            # Jadvallar moduli
├── departments/          # Bo'limlar moduli
├── email/                # Email xizmati
├── pages/                # HBS sahifalar controller
├── common/               # Umumiy komponentlar
│   ├── guards/          # Auth va Roles guardlar
│   ├── filters/         # Exception filterlar
│   ├── interceptors/    # Interceptorlar
│   ├── pipes/           # Custom pipelar
│   └── decorators/      # Custom decoratorlar
├── core/                 # Core funksiyalar
│   ├── constants/       # Konstantalar
│   └── database/        # Database konfiguratsiya
├── config/               # Konfiguratsiya
└── main.ts              # Entry point

views/
├── layouts/             # Layout templatelar
├── partials/            # Partial templatelar
└── pages/               # Sahifa templatelar
    ├── public/          # Umumiy sahifalar
    ├── patient/         # Bemor sahifalari
    ├── doctor/          # Shifokor sahifalari
    └── admin/           # Admin sahifalari

public/
└── css/                 # CSS fayllar
```

## API Endpoints

### Auth
- `POST /auth/register` - Ro'yxatdan o'tish
- `POST /auth/login` - Kirish
- `GET /auth/logout` - Chiqish

### Doctors
- `GET /api/doctors` - Barcha shifokorlar
- `GET /api/doctors/:id` - Bitta shifokor
- `POST /api/doctors` - Yangi shifokor (Admin)
- `PUT /api/doctors/:id` - Shifokorni yangilash (Admin)
- `DELETE /api/doctors/:id` - Shifokorni o'chirish (Admin)

### Appointments
- `GET /api/appointments` - Barcha qabullar
- `GET /api/appointments/my` - Mening qabullarim (Patient)
- `POST /api/appointments` - Yangi qabul (Patient)
- `PUT /api/appointments/:id/status` - Qabul holatini o'zgartirish (Doctor)

### Schedules
- `GET /api/schedules` - Barcha jadvallar
- `GET /api/schedules/doctor/:id` - Shifokor jadvali
- `POST /api/schedules` - Yangi jadval (Doctor)
- `PUT /api/schedules/:id` - Jadvalni yangilash (Doctor)
- `DELETE /api/schedules/:id` - Jadvalni o'chirish (Doctor)

### Departments
- `GET /api/departments` - Barcha bo'limlar
- `POST /api/departments` - Yangi bo'lim (Admin)
- `PUT /api/departments/:id` - Bo'limni yangilash (Admin)
- `DELETE /api/departments/:id` - Bo'limni o'chirish (Admin)

## Web sahifalari

### Public sahifalar
- `/` - Bosh sahifa
- `/doctors` - Shifokorlar ro'yxati
- `/auth/login` - Kirish sahifasi
- `/auth/register` - Ro'yxatdan o'tish sahifasi

### Patient sahifalari
- `/patient/appointments` - Mening qabullarim
- `/patient/profile` - Profil

### Doctor sahifalari
- `/doctor/appointments` - Qabullar ro'yxati
- `/doctor/schedule` - Ish jadvali

### Admin sahifalari
- `/admin/doctors` - Shifokorlarni boshqarish
- `/admin/departments` - Bo'limlarni boshqarish

## Rollar

- **viewer** - Umumiy sahifalarni ko'rish
- **patient** - Bemor funksiyalari
- **doctor** - Shifokor funksiyalari
- **admin** - Admin funksiyalari

## Testing

```bash
# Unit testlar
pnpm run test

# E2E testlar
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Production

```bash
# Build
pnpm run build

# Production rejimda ishga tushirish
pnpm run start:prod
```

## Xususiyatlar

- ✅ JWT autentifikatsiya
- ✅ Role-based access control (RBAC)
- ✅ Server-side rendering (HBS)
- ✅ Email xabarnomalar
- ✅ File upload (profil rasmlari)
- ✅ Logging (Winston)
- ✅ Validation (class-validator)
- ✅ Error handling
- ✅ MongoDB integration
- ✅ Responsive design (Bootstrap 5)

## Muallif

Smart Clinic Appointment System

## Litsenziya

MIT

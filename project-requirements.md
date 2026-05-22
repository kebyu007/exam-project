# Smart Clinic Appointment System

## Project Description

Smart Clinic Appointment System is a healthcare appointment platform where patients can book doctor appointments online.

The system allows:
- Patients to book appointments
- Doctors to manage schedules
- Admins to manage clinic data
- Telegram and email notifications

Frontend must be rendered using HBS inside NestJS.

---

# Technologies

## Backend
- NestJS
- TypeScript
- Sequelize ORM or MongoDB
- PostgreSQL
- JWT Authentication
- Nodemailer
- Multer
- Telegraf
- Jest

## Frontend
- HBS (Handlebars)
- Bootstrap 5

---

# Main Features

## Authentication
- Register
- Login
- Email activation
- JWT Authentication

## Patient Features
- Browse doctors
- Book appointments
- View appointment history

## Doctor Features
- Manage schedules
- Approve appointments
- View patient list

## Admin Features
- Manage doctors
- Manage departments
- Manage users

## Telegram Bot
- Appointment reminders
- Doctor schedules
- Daily appointment reports

---

# Database Models

## User
```ts
id
full_name
email
password
role
telegram_id
is_active
```

## Doctor
```ts
id
specialization
experience
room_number
user_id
```

## Department
```ts
id
name
```

## Appointment
```ts
id
patient_id
doctor_id
appointment_date
status
```

## Schedule
```ts
id
doctor_id
work_day
start_time
end_time
```

---

# Folder Structure

```bash
src/
│
├── auth/
├── users/
├── doctors/
├── appointments/
├── schedules/
├── telegram/
├── mail/
├── common/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   ├── pipes/
│   └── decorators/
│
├── views/
├── public/
└── main.ts
```

---

# Lessons Covered

## Lesson 2
- Sequelize ORM
- Relations
- CRUD

## Lesson 3-5
- TypeScript
- OOP
- Utility Types
- Generics
- Decorators

## Lesson 6
- Controllers
- Routing
- Request handling

## Lesson 7
- Providers
- Dependency Injection
- Modules

## Lesson 8
- Middleware
- Exception Filters

## Lesson 9
- Pipes
- Guards
- ValidationPipe

## Lesson 10
- Interceptors
- Custom Decorators

## Lesson 11
- CRUD operations

## Lesson 12
- File uploads
- Static files

## Lesson 13
- Real project architecture

## Lesson 14-16
- Unit tests
- E2E tests

## Lesson 17
- Sending emails

## Lesson 18-19
- Telegram bot development

---

# Authentication Roles

## Roles
- Admin
- Doctor
- Patient

---

# Middleware Tasks

Students must implement:
- Request logger
- Auth middleware

---

# Guards

Students must create:
- JwtAuthGuard
- RolesGuard

---

# Custom Pipes

Students must create:
- ParseAppointmentIdPipe
- DateValidationPipe

---

# Interceptors

Students must create:
- LoggingInterceptor
- ResponseTransformInterceptor

---

# Exception Filters

Students must create:
- HttpExceptionFilter
- DatabaseExceptionFilter

---

# Frontend Pages

## Public Pages
- Home
- Doctors
- Login
- Register

## Patient Pages
- My Appointments
- Profile

## Doctor Pages
- Appointment List
- Schedule Management

## Admin Pages
- Doctors Management
- Departments Management

---

# Telegram Bot Commands

```bash
/start
/myappointments
/doctors
/help
```

---

# Validation Requirements

- Email validation
- Appointment date validation
- Schedule validation

---

# Additional Tasks

## Easy
- Pagination

## Medium
- Doctor search

## Hard
- Appointment calendar system

---

# Time Duration

Estimated completion time:
- 3 days

---

# Expected Outcome

Students will learn:
- Real NestJS architecture
- Sequelize ORM
- Authentication
- Telegram bots
- Testing
- File uploads
- HBS rendering
- Validation and guards
# 🚗 Car Service Booking System

## 📌 Overview

This project simulates a real-world car service platform where:

- Users book service appointments
- Admin manages bookings
- System includes authentication, OTP, email, logging, and middleware
- System includes password reset

---

## 🎯 Objective

Build a full-stack system using:

- Node.js (Express)
- PostgreSQL (pg) or MongoDB (mongoose)
- HBS or EJS

---

## ⚙️ Tech Requirements

- Express.js
- PostgreSQL + pg
- JOI (validation)
- JWT (access + refresh)
- Bcrypt
- Nodemailer
- Winston

---

## 👤 Roles

### 1. User
- Register/Login
- Create booking
- View own bookings

### 2. Admin
- View all bookings
- Update booking status

---

## 🔐 Authentication

### Required:
- Register
- Login
- JWT
- Refresh token
- Password hashing

---

## 📂 Database Tables

### Users
- id
- name
- email (unique)
- password

### Services
- id
- name (Oil change, Repair, etc.)

### Bookings
- id
- user_id
- service_id
- date
- status (pending, confirmed, done)

---

## 📡 API Requirements

### 🔐 Auth

- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/refresh`

---

### 🛠 Services

- GET `/services`

---

### 📅 Bookings

- POST `/bookings`
- GET `/bookings` (user)
- GET `/bookings/all` (admin)
- PATCH `/bookings/:id/status` (admin)

---

## 🧠 Validation (JOI)

Validate:
- Email format
- Date correctness
- Required fields

---

## 🛡 Middleware

- Auth middleware
- Role-based guard (admin)
- Error handler

---

## 📧 Email

When booking is created:
- Send confirmation email

---

## 📱 OTP

- Send OTP before confirming booking
- Booking only created if OTP verified

---

## 🧠 Device Detection

- Save device info during booking

---

## 📊 Logging (Winston)

Log:
- Bookings
- Errors
- Login attempts

---

## 🖥 Frontend (HBS/EJS)

### Pages Required:

- Register/Login
- Booking Form
- My Bookings
- Admin Dashboard

---

## 🚨 Error Handling

- Centralized error handler
- Proper HTTP responses

---

## 📁 Project Structure
```
src/
├── controllers/
├── services/
├── db/
├── routes/
├── middlewares/
├── validators/
├── utils/
└── views/
```

---

## ✅ Minimum Requirements

- Auth (JWT + bcrypt)
- Booking system
- JOI validation
- Middleware
- Error handling
- Logging

---

## ⭐ Bonus Features

- OTP verification
- Email confirmation
- Filtering bookings
- Pagination

---

## ⏳ Time Limit

2 days

---

## 📊 Evaluation Criteria

### Backend (70%)
- Auth correctness
- DB design
- Validation
- Middleware

### Frontend (15%)
- UI functionality

### Advanced (15%)
- OTP
- Logging
- Email

---

## 🚀 Submission

- GitHub repo
- README included
- `.env.example`

---

Build something production-like. Think like an engineer, not just a student. 🚀

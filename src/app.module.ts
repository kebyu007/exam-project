import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as winston from 'winston';
import path from 'path';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/user.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { DepartmentModule } from './modules/department/department.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { PagesModule } from './pages/pages.module';
import { EmailModule } from './modules/email/email.module';
import { SeederModule } from './seed/seeder.module';
import { DoctorsModule } from './modules/doctors/doctor.module';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    MongooseModule.forRoot(process.env.MONGO_URL as string),
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: path.join(process.cwd(), 'uploads'),
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    SeederModule,
    AuthModule,
    UsersModule,
    AppointmentModule,
    DepartmentModule,
    DoctorsModule,
    ScheduleModule,
    PagesModule,
    EmailModule,
    ...(process.env.TELEGRAM_BOT_TOKEN ? [TelegramModule] : []),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import hbs from 'hbs';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

process.on('unhandledRejection', (reason: any) => {
  if (reason?.code === 'ETIMEDOUT' || reason?.code === 'ECONNREFUSED') {
    console.warn('⚠️  Telegram bot ulanmadi:', reason.code);
    console.warn('💡 Bot funksiyalari ishlamaydi, lekin server ishlayapti.');
    return;
  }
  console.error('Unhandled rejection:', reason);
});


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));

  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public'));
  app.setBaseViewsDir(join(process.cwd(), 'views'));
  app.setViewEngine('hbs');
  hbs.registerPartials(join(process.cwd(), 'views/partials'));
  app.set('view options', { layout: 'layouts/layout' });

  hbs.registerHelper('formatDate', (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  });

  hbs.registerHelper('add', (a: number, b: number) => a + b);

  hbs.registerHelper('multiply', (a: number, b: number) => a * b);

  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  hbs.registerHelper('array', (...args) => args.slice(0, -1));

  const WEEK_DAYS_UZ: Record<string, string> = {
    monday: 'Dushanba',
    tuesday: 'Seshanba',
    wednesday: 'Chorshanba',
    thursday: 'Payshanba',
    friday: 'Juma',
    saturday: 'Shanba',
    sunday: 'Yakshanba',
  };
  hbs.registerHelper('weekDayUz', (day: string) => WEEK_DAYS_UZ[day] || day);

  hbs.registerHelper('weekDayName', (date: Date) => {
    if (!date) return '';
    const days = [
      'Yakshanba',
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
    ];
    return days[new Date(date).getDay()];
  });

  hbs.registerHelper('today', () => new Date().toISOString().split('T')[0]);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, () => console.log('🚀 Server running on port', port));
}
bootstrap();

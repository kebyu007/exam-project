import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import hbs from 'hbs';

process.on('unhandledRejection', (reason: any) => {
  if (reason?.type === 'system' && reason?.code === 'ETIMEDOUT') {
    console.warn('⚠️  Telegram bot ulanmadi (ETIMEDOUT). Bot funksiyalari ishlamaydi.');
    return;
  }
  console.error('Unhandled rejection:', reason);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, () => console.log('🚀 Server running on port', port));
}
bootstrap();

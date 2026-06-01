import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const message = raw
      ? (typeof raw === 'object' && 'message' in raw ? (raw as any).message : String(raw))
      : 'Xatolik yuz berdi';
    const msg: string = Array.isArray(message) ? message[0] : message;

    if (host.getType() !== 'http') {
      this.logger.error(
        `${status} ${msg}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
      return;
    }

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status} ${msg}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const acceptsJson = req.headers['accept']?.includes('application/json')
      || req.headers['content-type']?.includes('application/json');
    if (acceptsJson) {
      return res.status(status).json({ message: msg });
    }

    if (res.headersSent) return;

    const referer = (req.headers['referer'] || '/').split('?')[0];
    return res.redirect(`${referer}?error=${encodeURIComponent(msg)}`);
  }
}

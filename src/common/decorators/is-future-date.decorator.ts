import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsFutureDate(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      options: {
        message: 'appointment_date must not be in the past',
        ...options,
      },
      validator: {
        validate(value: any) {
          if (!(value instanceof Date)) return false;
          return value.getTime() > Date.now();
        },
      },
    });
  };
}

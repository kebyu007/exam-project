import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsWeekday(options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isWeekday',
      target: object.constructor,
      propertyName,
      options: {
        message: 'work_day must be a weekday (Monday-Friday)',
        ...options,
      },
      validator: {
        validate(value: string) {
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;

          const day = date.getUTCDay();
          return day >= 1 && day <= 5;
        },
      },
    });
  };
}

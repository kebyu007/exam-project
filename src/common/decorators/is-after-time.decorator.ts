import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAfterTime(property: string, options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfterTime',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: {
        message: `end_time must be after start_time`,
        ...options,
      },
      validator: {
        validate(value: string, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (!value || !relatedValue) return false;

          return value > relatedValue;
        },
      },
    });
  };
}
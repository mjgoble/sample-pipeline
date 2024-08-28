import { z } from 'zod';

export class StackConfigLoader {
  public static parseConfig<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);

    if (result.success) {
      return result.data;
    } else {
      throw new Error(
        '##################################################################\n' +
        'Invalid stackParameters format:\n' +
        `${JSON.stringify(result.error.issues, null, 2)}\n` +
        '##################################################################\n',
      );
    }
  }
}

const { z } = require('zod');

const orderSchema = z.object({
  accountId: z.number().int().positive({ message: 'Hesap ID pozitif tam sayı olmalıdır' }),
  symbol: z.string().min(1, { message: 'Hisse sembolü boş olamaz' }),
  quantity: z.number().int({ message: 'Adet tam sayı olmalıdır' }).positive({ message: 'Adet pozitif tam sayı olmalıdır' }),
});

module.exports = { orderSchema };

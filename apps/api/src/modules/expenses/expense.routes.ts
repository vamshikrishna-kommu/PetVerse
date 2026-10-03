import { Router } from 'express';
import { expenseController } from './expense.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';

const router: Router = Router();

const createExpenseSchema = z.object({
  petId: z.string().optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().default('INR'),
  category: z.enum([
    'veterinary',
    'medication',
    'vaccination',
    'food',
    'grooming',
    'accessories',
    'insurance',
    'emergency',
    'other',
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  clinicName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
});

const updateExpenseSchema = createExpenseSchema.partial();

router.use(authenticate);

router.get('/', expenseController.list);
router.post('/', validate(createExpenseSchema), expenseController.create);
router.get('/analytics', expenseController.analytics);
router.get('/export', expenseController.exportCsv);
router.get('/:id', expenseController.getById);
router.put('/:id', validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;

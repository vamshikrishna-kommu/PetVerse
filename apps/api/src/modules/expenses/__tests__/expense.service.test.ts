import mongoose from 'mongoose';
import { expenseService } from '../expense.service';
import { ExpenseModel } from '../expense.model';
import { PetModel } from '../../pets/pet.model';
import { UserModel } from '../../users/user.model';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Expense Tracking Service — Unit & Integration Tests', () => {
  let userId: string;
  let strangerUserId: string;
  let petId: string;
  let createdExpenseId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const user = await UserModel.create({
      email: `expense_owner_${Date.now()}@testverse.com`,
      profile: { firstName: 'Finance', lastName: 'Owner' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    userId = user._id.toString();

    const stranger = await UserModel.create({
      email: `expense_stranger_${Date.now()}@testverse.com`,
      profile: { firstName: 'Intruder', lastName: 'User' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    strangerUserId = stranger._id.toString();

    const pet = await PetModel.create({
      ownerId: new mongoose.Types.ObjectId(userId),
      name: 'Barnaby',
      species: 'dog',
      breed: 'Golden Retriever',
      dob: '2021-04-12',
      weight: 30,
    });
    petId = pet._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ _id: { $in: [userId, strangerUserId] } });
    await PetModel.findByIdAndDelete(petId);
    await ExpenseModel.deleteMany({ userId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Expense Creation & Ownership Boundaries', () => {
    it('Creates an expense linked to user and pet', async () => {
      const expense = await expenseService.createExpense(userId, {
        petId,
        amount: 2500,
        currency: 'INR',
        category: 'veterinary',
        date: '2026-09-15',
        clinicName: 'Cessna Lifeline Veterinary Hospital, Bengaluru',
        notes: 'Annual dental cleaning and antibiotic injection',
        receiptUrl: 'https://cloudinary.com/receipt-123.jpg',
      });

      expect(expense).toBeDefined();
      expect(expense.amount).toBe(2500);
      expect(expense.petName).toBe('Barnaby');
      expect(expense.category).toBe('veterinary');
      createdExpenseId = expense._id.toString();
    });

    it('Rejects expense creation for a pet owned by a different user', async () => {
      await expect(
        expenseService.createExpense(strangerUserId, {
          petId,
          amount: 50,
          category: 'food',
          date: '2026-09-16',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('Querying, Filtering & CSV Export', () => {
    beforeAll(async () => {
      // Add a couple more expenses
      await expenseService.createExpense(userId, {
        petId,
        amount: 45.0,
        category: 'food',
        date: '2026-09-20',
        notes: 'Grain-free kibble 15kg',
      });

      await expenseService.createExpense(userId, {
        petId,
        amount: 25.0,
        category: 'toys',
        date: '2026-09-22',
        notes: 'Chew toy and squeaker',
      });
    });

    it('Queries expenses with category filtering', async () => {
      const res = await expenseService.getExpenses(userId, { category: 'veterinary' });
      expect(res.expenses.length).toBe(1);
      expect(res.expenses[0].category).toBe('veterinary');
    });

    it('Queries all expenses with pagination', async () => {
      const res = await expenseService.getExpenses(userId, { page: 1, limit: 10 });
      expect(res.total).toBeGreaterThanOrEqual(3);
      expect(res.expenses.length).toBeGreaterThanOrEqual(3);
    });

    it('Exports expense records as formatted CSV string', async () => {
      const csv = await expenseService.exportExpensesCsv(userId);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Date,Category,Pet,Amount,Currency,Clinic / Provider,Notes,Receipt URL');
      expect(csv).toContain('Barnaby');
      expect(csv).toContain('Cessna Lifeline Veterinary Hospital, Bengaluru');
    });
  });

  describe('Financial Analytics Calculation', () => {
    it('Calculates lifetime total, monthly breakdown, and category distribution', async () => {
      const analytics = await expenseService.getExpenseAnalytics(userId, 2026);
      expect(analytics).toBeDefined();
      expect(analytics.totalSpending).toBeGreaterThanOrEqual(215.5);
      expect(Array.isArray(analytics.trend)).toBe(true);
      expect(Array.isArray(analytics.byCategory)).toBe(true);

      const vetCategory = analytics.byCategory.find((c: any) => c.category === 'veterinary');
      expect(vetCategory).toBeDefined();
      expect(vetCategory?.amount).toBe(2500);
    });
  });

  describe('Update & Deletion Authorization', () => {
    it('Rejects stranger from deleting another user’s expense', async () => {
      await expect(
        expenseService.deleteExpense(strangerUserId, createdExpenseId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('Owner can successfully update and delete their expense', async () => {
      const updated = await expenseService.updateExpense(userId, createdExpenseId, {
        amount: 160.0,
        notes: 'Updated dental price with tax',
      });
      expect(updated.amount).toBe(160.0);

      await expenseService.deleteExpense(userId, createdExpenseId);
      await expect(
        expenseService.getExpenseById(userId, createdExpenseId)
      ).rejects.toThrow(NotFoundError);
    });
  });
});

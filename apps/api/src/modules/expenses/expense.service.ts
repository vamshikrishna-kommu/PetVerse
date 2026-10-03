import { ExpenseModel } from './expense.model';
import { PetModel } from '../pets/pet.model';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors/AppError';
import type { IExpense, IExpenseAnalytics, ExpenseCategory } from '@petverse/shared-types';

export interface CreateExpenseDTO {
  petId?: string;
  amount: number;
  currency?: string;
  category: ExpenseCategory;
  date: string;
  clinicName?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseDTO extends Partial<CreateExpenseDTO> {}

export interface ExpenseQueryDTO {
  petId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ExpenseService {
  async createExpense(userId: string, data: CreateExpenseDTO): Promise<IExpense> {
    let petName: string | undefined;

    if (data.petId) {
      const pet = await PetModel.findOne({ _id: data.petId, isDeleted: { $ne: true } });
      if (!pet) {
        throw new NotFoundError('Pet not found');
      }
      if (pet.ownerId.toString() !== userId) {
        throw new ForbiddenError('You can only record expenses for your own pets');
      }
      petName = pet.name;
    }

    const expense = await ExpenseModel.create({
      userId,
      petId: data.petId,
      petName,
      amount: data.amount,
      currency: data.currency || 'INR',
      category: data.category,
      date: data.date,
      clinicName: data.clinicName,
      notes: data.notes,
      receiptUrl: data.receiptUrl,
    });

    return expense.toJSON() as unknown as IExpense;
  }

  async getExpenses(userId: string, query: ExpenseQueryDTO): Promise<{ expenses: IExpense[]; total: number; page: number; totalPages: number }> {
    const filter: any = { userId };

    if (query.petId) {
      filter.petId = query.petId;
    }

    if (query.category && query.category !== 'all') {
      filter.category = query.category;
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = query.startDate;
      if (query.endDate) filter.date.$lte = query.endDate;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { clinicName: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        { petName: { $regex: q, $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      ExpenseModel.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ExpenseModel.countDocuments(filter),
    ]);

    const formatted = expenses.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
    })) as IExpense[];

    return {
      expenses: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getExpenseById(userId: string, expenseId: string): Promise<IExpense> {
    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense record not found');
    if (expense.userId !== userId) throw new ForbiddenError('Unauthorized to view this expense');
    return expense.toJSON() as unknown as IExpense;
  }

  async updateExpense(userId: string, expenseId: string, data: UpdateExpenseDTO): Promise<IExpense> {
    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense record not found');
    if (expense.userId !== userId) throw new ForbiddenError('Unauthorized to modify this expense');

    if (data.petId && data.petId !== expense.petId) {
      const pet = await PetModel.findOne({ _id: data.petId, isDeleted: { $ne: true } });
      if (!pet) throw new NotFoundError('Pet not found');
      if (pet.ownerId.toString() !== userId) throw new ForbiddenError('Unauthorized pet access');
      expense.petId = data.petId;
      expense.petName = pet.name;
    }

    if (data.amount !== undefined) expense.amount = data.amount;
    if (data.currency) expense.currency = data.currency;
    if (data.category) expense.category = data.category;
    if (data.date) expense.date = data.date;
    if (data.clinicName !== undefined) expense.clinicName = data.clinicName;
    if (data.notes !== undefined) expense.notes = data.notes;
    if (data.receiptUrl !== undefined) expense.receiptUrl = data.receiptUrl;

    await expense.save();
    return expense.toJSON() as unknown as IExpense;
  }

  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense record not found');
    if (expense.userId !== userId) throw new ForbiddenError('Unauthorized to delete this expense');
    await expense.deleteOne();
  }

  async getExpenseAnalytics(userId: string, targetYear?: number): Promise<IExpenseAnalytics> {
    const now = new Date();
    const currentYear = targetYear || now.getFullYear();
    const currentMonthPrefix = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const yearPrefix = `${currentYear}-`;

    const allUserExpenses = await ExpenseModel.find({ userId }).lean();

    let totalSpending = 0;
    let monthlySpending = 0;
    let yearlySpending = 0;

    const categoryMap = new Map<ExpenseCategory, number>();
    const petMap = new Map<string, { petName: string; amount: number }>();
    const monthTotals = new Array(12).fill(0);

    for (const exp of allUserExpenses) {
      totalSpending += exp.amount;

      if (exp.date.startsWith(yearPrefix)) {
        yearlySpending += exp.amount;
        const monthIndex = parseInt(exp.date.split('-')[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          monthTotals[monthIndex] += exp.amount;
        }
      }

      if (exp.date.startsWith(currentMonthPrefix)) {
        monthlySpending += exp.amount;
      }

      // Category breakdown
      const curCatVal = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, curCatVal + exp.amount);

      // Pet breakdown
      const pKey = exp.petId || 'unassigned';
      const curPet = petMap.get(pKey) || { petName: exp.petName || 'General / Unassigned', amount: 0 };
      curPet.amount += exp.amount;
      petMap.set(pKey, curPet);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      percentage: totalSpending > 0 ? Math.round((amount / totalSpending) * 1000) / 10 : 0,
    })).sort((a, b) => b.amount - a.amount);

    const byPet = Array.from(petMap.entries()).map(([petId, data]) => ({
      petId: petId === 'unassigned' ? undefined : petId,
      petName: data.petName,
      amount: Math.round(data.amount * 100) / 100,
    })).sort((a, b) => b.amount - a.amount);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trend = monthNames.map((month, idx) => ({
      month,
      amount: Math.round(monthTotals[idx] * 100) / 100,
    }));

    return {
      totalSpending: Math.round(totalSpending * 100) / 100,
      monthlySpending: Math.round(monthlySpending * 100) / 100,
      yearlySpending: Math.round(yearlySpending * 100) / 100,
      byCategory,
      byPet,
      trend,
    };
  }

  async exportExpensesCsv(userId: string): Promise<string> {
    const expenses = await ExpenseModel.find({ userId }).sort({ date: -1 }).lean();

    const headers = ['Date', 'Category', 'Pet', 'Amount', 'Currency', 'Clinic / Provider', 'Notes', 'Receipt URL'];
    const rows = expenses.map((exp) => [
      `"${exp.date}"`,
      `"${exp.category}"`,
      `"${exp.petName || 'General'}"`,
      exp.amount.toFixed(2),
      `"${exp.currency || 'INR'}"`,
      `"${(exp.clinicName || '').replace(/"/g, '""')}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
      `"${(exp.receiptUrl || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const expenseService = new ExpenseService();

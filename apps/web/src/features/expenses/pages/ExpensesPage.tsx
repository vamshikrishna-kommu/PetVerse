import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  PieChart as PieChartIcon,
  Plus,
  Download,
  Filter,
  Trash2,
  Receipt,
  Search,
  ExternalLink,
  Tag,
  Clock,
  Sparkles,
  AlertCircle,
  Building2,
} from 'lucide-react';
import {
  useExpenses,
  useExpenseAnalytics,
  useCreateExpense,
  useDeleteExpense,
} from '../hooks/useExpenses';
import { usePets } from '@/features/pets/hooks/usePets';
import type { ExpenseCategory, IExpense, IPet } from '@petverse/shared-types';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/cn';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  veterinary: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  medication: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  vaccination: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  food: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  grooming: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  accessories: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  insurance: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  emergency: 'bg-red-500/10 text-red-600 border-red-500/20',
  other: 'bg-surface-3 text-muted border-border',
  vet: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  medicine: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  toys: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
};

export default function ExpensesPage() {
  const [selectedPet, setSelectedPet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Queries
  const { data: petsData } = usePets();
  const pets: IPet[] = petsData?.data || [];

  const { data: analytics, isLoading: analyticsLoading } = useExpenseAnalytics();

  const {
    data: expensesData,
    isLoading: expensesLoading,
  } = useExpenses({
    petId: selectedPet !== 'all' ? selectedPet : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery.trim() || undefined,
  });

  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  // Log expense form
  const [formState, setFormState] = useState({
    amount: '',
    category: 'veterinary' as ExpenseCategory,
    petId: '',
    date: new Date().toISOString().split('T')[0],
    clinicName: '',
    notes: '',
    receiptUrl: '',
  });

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formState.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        amount: numAmount,
        category: formState.category,
        petId: formState.petId || undefined,
        date: formState.date,
        clinicName: formState.clinicName || undefined,
        notes: formState.notes || undefined,
        receiptUrl: formState.receiptUrl || undefined,
      });
      toast.success('Expense recorded successfully');
      setShowLogModal(false);
      setFormState({
        amount: '',
        category: 'veterinary',
        petId: '',
        date: new Date().toISOString().split('T')[0],
        clinicName: '',
        notes: '',
        receiptUrl: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this expense record?')) return;
    try {
      await deleteExpenseMutation.mutateAsync(id);
      toast.success('Expense record deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete expense');
    }
  };

  const handleExportCsv = async () => {
    try {
      const { expenseApi } = await import('@/services/api/expenseApi');
      await expenseApi.exportCsv();
      toast.success('Expense report downloaded');
    } catch (err) {
      toast.error('Failed to export CSV report');
    }
  };

  const topCategory = analytics?.byCategory?.[0];

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-500" /> Pet Expense Tracker
          </h1>
          <p className="text-muted text-sm mt-1">
            Track veterinary bills, medications, dietary expenses, and insurance budgets across all your animals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary flex items-center gap-2 text-xs"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="btn btn-primary flex items-center gap-2 text-xs shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-border bg-gradient-to-br from-surface to-surface-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">Total Lifetime Spend</span>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(analytics?.totalSpending ?? 0)}
            </div>
          </div>
        </div>

        <div className="card p-5 border-border bg-gradient-to-br from-surface to-surface-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">This Month Spend</span>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(analytics?.monthlySpending ?? 0)}
            </div>
          </div>
        </div>

        <div className="card p-5 border-border bg-gradient-to-br from-surface to-surface-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">This Year Spend</span>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(analytics?.yearlySpending ?? 0)}
            </div>
          </div>
        </div>

        <div className="card p-5 border-border bg-gradient-to-br from-surface to-surface-2 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <PieChartIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-medium">Top Category</span>
            <div className="text-lg font-bold text-foreground capitalize">
              {topCategory ? `${topCategory.category} (${topCategory.percentage}%)` : 'None'}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="card p-6 border-border lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Monthly Spending Pattern ({new Date().getFullYear()})
          </h2>
          <p className="text-xs text-muted">
            Track seasonal variations such as annual vaccinations, flea/tick cycles, and grooming appointments.
          </p>

          <div className="pt-4 flex items-end justify-between gap-2 h-44 border-b border-border pb-2">
            {analytics?.trend?.map((item) => {
              const maxAmount = Math.max(...(analytics.trend.map((t) => t.amount) || [1]), 100);
              const heightPct = Math.max(8, Math.round((item.amount / maxAmount) * 100));
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-semibold text-muted opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    ${item.amount}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-lg transition-all ${
                      item.amount > 0
                        ? 'bg-primary group-hover:bg-primary-hover shadow-sm'
                        : 'bg-surface-3'
                    }`}
                  />
                  <span className="text-[11px] font-medium text-muted mt-1">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-6 border-border space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-500" /> Spending by Category
          </h2>
          <div className="space-y-3 pt-2">
            {analytics?.byCategory?.slice(0, 5).map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize text-foreground">{cat.category}</span>
                  <span className="text-muted">
                    {formatCurrency(cat.amount)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-surface-3 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!analytics?.byCategory || analytics.byCategory.length === 0) && (
              <div className="text-center py-8 text-xs text-muted">
                No category data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Pet Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted font-medium">Pet:</span>
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="input py-1.5 px-3 text-xs"
            >
              <option value="all">All Pets</option>
              {pets.map((pet: IPet) => (
                <option key={pet._id} value={pet._id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input py-1.5 px-3 text-xs capitalize"
            >
              <option value="all">All Categories</option>
              <option value="veterinary">Veterinary</option>
              <option value="medication">Medication</option>
              <option value="vaccination">Vaccination</option>
              <option value="food">Food & Nutrition</option>
              <option value="grooming">Grooming</option>
              <option value="accessories">Accessories</option>
              <option value="insurance">Insurance</option>
              <option value="emergency">Emergency Care</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search provider or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-muted border-b border-border uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pet</th>
                <th className="py-3 px-4">Provider / Clinic</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expensesData?.expenses?.map((item) => (
                <tr key={item._id} className="hover:bg-surface-2/60 transition">
                  <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge border text-[11px] font-semibold capitalize ${
                        CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {item.petName || <span className="text-muted italic">General</span>}
                  </td>
                  <td className="py-3 px-4 text-muted flex items-center gap-1.5">
                    {item.clinicName ? (
                      <>
                        <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{item.clinicName}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted max-w-xs truncate">
                    {item.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-foreground whitespace-nowrap">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.receiptUrl ? (
                      <a
                        href={item.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-primary-hover inline-flex items-center gap-1 font-semibold"
                      >
                        <Receipt className="w-3.5 h-3.5" /> View
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-muted hover:text-danger rounded-lg transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {(!expensesData?.expenses || expensesData.expenses.length === 0) && !expensesLoading && (
          <div className="py-16 text-center space-y-3">
            <DollarSign className="w-12 h-12 text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">No Expense Records Found</h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              Start recording pet expenses to analyze veterinary bills, dietary expenditures, and wellness costs over time.
            </p>
            <button
              onClick={() => setShowLogModal(true)}
              className="btn btn-primary text-xs inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> Log Your First Expense
            </button>
          </div>
        )}
      </div>

      {/* LOG EXPENSE MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card max-w-lg w-full p-6 border-border space-y-5 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Log Pet Care Expense
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="75.00"
                    value={formState.amount}
                    onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category *
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as any })}
                    className="input w-full capitalize"
                    required
                  >
                    <option value="veterinary">Veterinary Care</option>
                    <option value="medication">Medication & Pharmacy</option>
                    <option value="vaccination">Vaccination Booster</option>
                    <option value="food">Food & Supplements</option>
                    <option value="grooming">Grooming & Hygiene</option>
                    <option value="accessories">Accessories & Toys</option>
                    <option value="insurance">Pet Insurance Premium</option>
                    <option value="emergency">Emergency Hospitalization</option>
                    <option value="other">Other Incidentals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Assigned Pet
                  </label>
                  <select
                    value={formState.petId}
                    onChange={(e) => setFormState({ ...formState, petId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">General Household / Shared</option>
                    {pets.map((pet: IPet) => (
                      <option key={pet._id} value={pet._id}>
                        {pet.name} ({pet.species})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Clinic / Veterinary Hospital / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Downtown Animal Hospital"
                  value={formState.clinicName}
                  onChange={(e) => setFormState({ ...formState, clinicName: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Receipt or Invoice URL (Cloudinary / Link)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formState.receiptUrl}
                  onChange={(e) => setFormState({ ...formState, receiptUrl: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Annual exam + Rabies 3yr vaccine and ear cleaning."
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="input w-full resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {createExpenseMutation.isPending ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

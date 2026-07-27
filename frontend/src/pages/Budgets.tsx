import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, AlertTriangle, Calendar as CalendarIcon, Target } from 'lucide-react'
import { formatCurrency } from '../lib/utils'
import { budgetsApi, categoriesApi } from '../lib/api'
import { BudgetWithProgress, BudgetPeriod, Category } from '../types'
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  Select,
  Field,
  Badge,
  Modal,
  Money,
  ProgressBar,
  IconTile,
  EmptyState,
  Skeleton,
} from '../components/ui'

interface BudgetFormProps {
  budget?: BudgetWithProgress | null
  onClose: () => void
}

const periodLabels: Record<BudgetPeriod, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

function BudgetForm({ budget, onClose }: BudgetFormProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: budget?.name || '',
    amount: budget?.amount?.toString() || '',
    period: (budget?.period || 'monthly') as BudgetPeriod,
    category_id: budget?.category_id?.toString() || '',
    start_date: budget?.start_date || new Date().toISOString().split('T')[0],
    end_date: budget?.end_date || '',
    is_active: budget?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const mutation = useMutation({
    mutationFn: (data: {
      name: string
      amount: number
      period: BudgetPeriod
      category_id?: number
      start_date: string
      end_date?: string
      is_active?: boolean
    }) => (budget ? budgetsApi.update(budget.id, data) : budgetsApi.create(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onClose()
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.detail || 'Failed to save budget' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrors({ amount: 'Amount must be greater than 0' })
      return
    }
    if (!formData.start_date) {
      setErrors({ start_date: 'Start date is required' })
      return
    }

    mutation.mutate({
      name: formData.name,
      amount: parseFloat(formData.amount),
      period: formData.period,
      start_date: formData.start_date,
      is_active: formData.is_active,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
      end_date: formData.end_date || undefined,
    })
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const expenseCategories: Category[] =
    (categories?.data as Category[] | undefined)?.filter(
      (c) => c.name !== 'Salary' && c.name !== 'Investments'
    ) || []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && (
        <div className="text-sm text-flame bg-flame-soft border border-flame/30 p-3 rounded-xl">{errors.submit}</div>
      )}

      <Field label="Name" htmlFor="budget-name" error={errors.name}>
        <Input
          id="budget-name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Monthly Food Budget"
          invalid={!!errors.name}
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount" htmlFor="budget-amount" error={errors.amount}>
          <Input
            id="budget-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            placeholder="10000"
            invalid={!!errors.amount}
          />
        </Field>
        <Field label="Period" htmlFor="budget-period">
          <Select id="budget-period" value={formData.period} onChange={(e) => handleChange('period', e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </Field>
      </div>

      <Field label="Category (optional — leave empty for total budget)" htmlFor="budget-category">
        <Select
          id="budget-category"
          value={formData.category_id}
          onChange={(e) => handleChange('category_id', e.target.value)}
        >
          <option value="">All Categories (Total Budget)</option>
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date" htmlFor="budget-start" error={errors.start_date}>
          <Input
            id="budget-start"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            invalid={!!errors.start_date}
          />
        </Field>
        <Field label="End Date (optional)" htmlFor="budget-end">
          <Input
            id="budget-end"
            type="date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
          className="h-4 w-4 rounded border-hairline bg-surface-2 text-mint focus:ring-mint/50"
        />
        <span className="text-sm text-text-hi">Active</span>
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" fullWidth loading={mutation.isPending}>
          {budget ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

export default function Budgets() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithProgress | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithProgress | null>(null)

  const { data: budgetsData, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setDeleteTarget(null)
    },
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to delete budget'),
  })

  const budgets: BudgetWithProgress[] = budgetsData?.data || []

  const closeModal = () => {
    setShowModal(false)
    setEditingBudget(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const activeBudgets = budgets.filter((b) => b.is_active)
  const inactiveBudgets = budgets.filter((b) => !b.is_active)

  const getPeriodEnd = (budget: BudgetWithProgress) => {
    const today = new Date()
    let end = budget.end_date ? new Date(budget.end_date) : new Date()

    if (budget.period === 'monthly') {
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (budget.period === 'weekly') {
      const start = new Date(today)
      start.setDate(today.getDate() - today.getDay())
      end = new Date(start)
      end.setDate(start.getDate() + 6)
    } else if (budget.period === 'daily') {
      end = new Date(today)
    }

    return end
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-hi">Budgets</h1>
          <p className="text-sm text-text-lo">Set spending limits and track your progress</p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null)
            setShowModal(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {activeBudgets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeBudgets.map((budget) => {
            const end = getPeriodEnd(budget)
            const progress = budget.progress_percentage
            const isOverBudget = progress >= 100
            const daysLeft = Math.max(
              0,
              Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            )

            return (
              <Card key={budget.id} className={isOverBudget ? 'border-flame/30' : undefined}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconTile tone={isOverBudget ? 'flame' : 'violet'}>
                        <Target className="h-5 w-5" />
                      </IconTile>
                      <div className="min-w-0">
                        <h3 className="font-medium text-text-hi truncate">{budget.name}</h3>
                        <p className="text-xs text-text-lo truncate">
                          {budget.category?.name
                            ? `${budget.category.icon || ''} ${budget.category.name}`
                            : 'All Categories'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge tone="primary">{periodLabels[budget.period]}</Badge>
                      {isOverBudget && (
                        <Badge tone="expense">
                          <AlertTriangle className="h-3 w-3" />
                          Over
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-lo">Spent</span>
                      <Money amount={budget.spent_amount} className={isOverBudget ? 'text-flame font-semibold' : 'font-semibold'} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-lo">Budget</span>
                      <Money amount={budget.amount} className="font-semibold" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-lo">Remaining</span>
                      <Money
                        amount={budget.remaining_amount}
                        className={isOverBudget ? 'text-flame font-semibold' : 'text-mint font-semibold'}
                      />
                    </div>
                  </div>

                  <ProgressBar value={progress} tone="auto" />

                  <div className="flex justify-between text-xs text-text-lo">
                    <span className="tnum">{progress.toFixed(0)}% used</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                    </span>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {(inactiveBudgets.length > 0 || activeBudgets.length === 0) && budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Budgets</CardTitle>
          </CardHeader>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Period</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Spent</th>
                  <th className="text-right">Progress</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...activeBudgets, ...inactiveBudgets].map((budget) => (
                  <tr key={budget.id}>
                    <td className="font-medium">{budget.name}</td>
                    <td>
                      {budget.category ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${budget.category.color || '#8B7CFF'}22`,
                            color: budget.category.color || '#8B7CFF',
                          }}
                        >
                          {budget.category.icon} {budget.category.name}
                        </span>
                      ) : (
                        <span className="text-text-lo text-sm">All Categories</span>
                      )}
                    </td>
                    <td>
                      <Badge tone="primary">{periodLabels[budget.period]}</Badge>
                    </td>
                    <td className="text-right font-medium tnum">{formatCurrency(budget.amount)}</td>
                    <td className="text-right tnum">{formatCurrency(budget.spent_amount)}</td>
                    <td className="text-right w-32">
                      <ProgressBar value={budget.progress_percentage} tone="auto" />
                    </td>
                    <td>
                      <Badge tone={budget.is_active ? 'success' : 'gray'}>
                        {budget.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingBudget(budget)
                            setShowModal(true)
                          }}
                          className="p-1.5 rounded-lg text-text-lo hover:text-text-hi hover:bg-white/5"
                          aria-label="Edit budget"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(budget)}
                          className="p-1.5 rounded-lg text-text-lo hover:text-flame hover:bg-flame-soft"
                          aria-label="Delete budget"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {budgets.length === 0 && (
        <Card>
          <EmptyState
            icon={<Target className="h-6 w-6 text-text-lo" />}
            title="No budgets yet"
            description="Create a budget to track your spending limits"
            action={
              <Button
                className="mt-2"
                onClick={() => {
                  setEditingBudget(null)
                  setShowModal(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create Budget
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={showModal || !!editingBudget}
        onClose={closeModal}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
      >
        <BudgetForm budget={editingBudget} onClose={closeModal} />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete budget"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-lo">
          Are you sure you want to delete{' '}
          <span className="font-medium text-text-hi">{deleteTarget?.name}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

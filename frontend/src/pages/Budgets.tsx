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
import toast from 'react-hot-toast'

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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoriesApi.list()
      return res.data
    },
  })

  const mutation = useMutation({
    mutationFn: (data: {
      name: string
      amount: number
      period: BudgetPeriod
      category_id?: number
      start_date: string
      end_date?: string
      is_active: boolean
    }) => {
      if (budget) {
        return budgetsApi.update(budget.id, data)
      }
      return budgetsApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-insights'] })
      toast.success(budget ? 'Budget updated successfully' : 'Budget created successfully')
      onClose()
    },
    onError: () => {
      toast.error(budget ? 'Failed to update budget' : 'Failed to create budget')
    },
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Enter a valid amount'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    mutation.mutate({
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      period: formData.period,
      category_id: formData.category_id ? parseInt(formData.category_id, 10) : undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      is_active: formData.is_active,
    })
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const expenseCategories = categories?.filter((c) => c.type === 'expense' || c.type === 'both') || []

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Budget Name" htmlFor="budget-name" error={errors.name}>
        <Input
          id="budget-name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Monthly Dining Out"
          invalid={!!errors.name}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {budget ? 'Update Budget' : 'Create Budget'}
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

  const { data: budgets = [], isLoading } = useQuery<BudgetWithProgress[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await budgetsApi.list()
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-insights'] })
      toast.success('Budget deleted successfully')
      setDeleteTarget(null)
    },
    onError: () => {
      toast.error('Failed to delete budget')
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const activeBudgets = budgets.filter((b) => b.is_active)

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
    <div className="space-y-6 pb-12">
      {/* Top Header & Mobile Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-hi">Budgets</h1>
          <p className="text-sm text-text-lo">Set spending limits and track your progress</p>
        </div>
        <Button
          fullWidth
          className="sm:w-auto font-semibold shadow-md"
          onClick={() => {
            setEditingBudget(null)
            setShowModal(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {/* Active Budget Cards with Direct Mobile Edit & Delete Buttons */}
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

                  <div className="flex items-center justify-between text-xs text-text-lo pt-1">
                    <span className="tnum font-medium">{progress.toFixed(0)}% used</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                    </span>
                  </div>

                  {/* Touch-Friendly Action Buttons on Cards for Mobile & Desktop */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline/60">
                    <button
                      onClick={() => {
                        setEditingBudget(budget)
                        setShowModal(true)
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-3 hover:bg-surface-1 text-text-hi text-xs font-medium rounded-xl border border-hairline transition-colors"
                      title="Edit Budget"
                    >
                      <Edit className="h-3.5 w-3.5 text-mint" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(budget)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-flame-soft hover:bg-flame/20 text-flame text-xs font-medium rounded-xl border border-flame/30 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State when no budgets exist */}
      {budgets.length === 0 && (
        <Card className="p-8">
          <EmptyState
            icon={<Target className="h-8 w-8 text-mint" />}
            title="No budgets created yet"
            description="Create budgets to control your spending by category or overall total."
            action={
              <Button
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

      {/* Inactive or All Budgets Table */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>All Registered Budgets</CardTitle>
          </CardHeader>
          <div className="table-container overflow-x-auto">
            <table className="table w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-3/50 text-xs font-semibold text-text-lo">
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Period</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Spent</th>
                  <th className="p-3 text-right">Progress</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-3/30 transition-colors">
                    <td className="p-3 font-medium text-text-hi">{b.name}</td>
                    <td className="p-3 text-text-lo">
                      {b.category?.name ? `${b.category.icon || ''} ${b.category.name}` : 'All Categories'}
                    </td>
                    <td className="p-3">
                      <Badge tone="primary">{periodLabels[b.period]}</Badge>
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(b.amount)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {formatCurrency(b.spent_amount)}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {b.progress_percentage.toFixed(0)}%
                    </td>
                    <td className="p-3">
                      <Badge tone={b.is_active ? 'success' : 'gray'}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingBudget(b)
                            setShowModal(true)
                          }}
                          className="p-1.5 text-text-lo hover:text-mint rounded-lg hover:bg-surface-3 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="p-1.5 text-text-lo hover:text-flame rounded-lg hover:bg-surface-3 transition-colors"
                          title="Delete"
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

      {/* Modal for Creating & Editing Budgets */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingBudget(null)
        }}
        title={editingBudget ? 'Edit Budget' : 'Add New Budget'}
      >
        <BudgetForm
          budget={editingBudget}
          onClose={() => {
            setShowModal(false)
            setEditingBudget(null)
          }}
        />
      </Modal>

      {/* Modal for Confirming Delete */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Budget">
        <div className="space-y-4">
          <p className="text-sm text-text-lo">
            Are you sure you want to delete <strong className="text-text-hi">{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

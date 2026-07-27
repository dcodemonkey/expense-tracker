import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Save,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { categoriesApi, transactionsApi } from '../lib/api'
import { Category, TransactionType } from '../types'
import { Modal, Button, Input, Select, Field, Label } from './ui'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const typeMeta: Record<
  TransactionType,
  { label: string; icon: typeof ArrowDownRight; active: string }
> = {
  expense: {
    label: 'Expense',
    icon: ArrowDownRight,
    active: 'bg-flame-soft text-flame border-flame/40',
  },
  income: {
    label: 'Income',
    icon: ArrowUpRight,
    active: 'bg-mint-soft text-mint border-mint/40',
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowLeftRight,
    active: 'bg-violet-soft text-violet border-violet/40',
  },
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'INR',
    type: 'expense' as TransactionType,
    category_id: '' as string | number,
    description: '',
    merchant_name: '',
    transaction_date: new Date().toISOString().split('T')[0],
    source: 'manual' as const,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof transactionsApi.create>[0]) =>
      transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaction added')
      onSuccess()
      onClose()
      resetForm()
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create transaction'
      setErrors({ submit: message })
      toast.error(message)
    },
  })

  const resetForm = () => {
    setFormData({
      amount: '',
      currency: 'INR',
      type: 'expense',
      category_id: '',
      description: '',
      merchant_name: '',
      transaction_date: new Date().toISOString().split('T')[0],
      source: 'manual',
    })
    setErrors({})
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrors({ amount: 'Amount is required and must be greater than 0' })
      return
    }
    if (!formData.category_id) {
      setErrors({ category_id: 'Category is required' })
      return
    }
    if (!formData.transaction_date) {
      setErrors({ transaction_date: 'Date is required' })
      return
    }

    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      category_id:
        typeof formData.category_id === 'string'
          ? parseInt(formData.category_id)
          : formData.category_id,
    })
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const allCategories: Category[] = categories?.data || []
  const expenseCategories = allCategories.filter(
    (c) => c.name !== 'Salary' && c.name !== 'Investments'
  )
  const incomeCategories = allCategories.filter(
    (c) => c.name === 'Salary' || c.name === 'Investments'
  )

  return (
    <Modal open={isOpen} onClose={onClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Type</Label>
          <div className="flex gap-2">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((type) => {
              const meta = typeMeta[type]
              const Icon = meta.icon
              const active = formData.type === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('type', type)}
                  className={cn(
                    'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 border',
                    active
                      ? meta.active
                      : 'bg-surface-2 text-text-lo border-hairline hover:bg-surface-3 hover:text-text-hi'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{meta.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <Field label="Amount" htmlFor="modal-amount" error={errors.amount}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-lo pointer-events-none">
              ₹
            </span>
            <Input
              id="modal-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="pl-8"
              placeholder="0.00"
              invalid={!!errors.amount}
            />
          </div>
        </Field>

        <Field label="Category" htmlFor="modal-category" error={errors.category_id}>
          <Select
            id="modal-category"
            value={formData.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className={errors.category_id ? 'border-flame/60 focus:ring-flame/50' : ''}
          >
            <option value="">Select category</option>
            {formData.type === 'expense' && (
              <optgroup label="Expenses">
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </optgroup>
            )}
            {formData.type === 'income' && (
              <optgroup label="Income">
                {incomeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </optgroup>
            )}
            {formData.type === 'transfer' && (
              <optgroup label="Transfer">
                {expenseCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>

        <Field label="Date" htmlFor="modal-date" error={errors.transaction_date}>
          <Input
            id="modal-date"
            type="date"
            value={formData.transaction_date}
            onChange={(e) => handleChange('transaction_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            invalid={!!errors.transaction_date}
          />
        </Field>

        <Field label="Merchant Name (optional)" htmlFor="modal-merchant">
          <Input
            id="modal-merchant"
            type="text"
            value={formData.merchant_name}
            onChange={(e) => handleChange('merchant_name', e.target.value)}
            placeholder="e.g., Swiggy, Uber, Amazon"
          />
        </Field>

        <Field label="Description (optional)" htmlFor="modal-description">
          <textarea
            id="modal-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="input min-h-[80px] resize-y"
            placeholder="Add a note..."
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={createMutation.isPending}>
            {!createMutation.isPending && <Save className="w-5 h-5" />}
            {createMutation.isPending ? 'Saving…' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import {
  Edit,
  Trash2,
  ArrowLeft,
  Copy,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { formatDate, formatDateTime } from '../lib/utils'
import { transactionsApi, categoriesApi } from '../lib/api'
import { Transaction, TransactionType, TransactionStatus, Category } from '../types'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  Field,
  Label,
  Badge,
  Modal,
  Money,
  IconTile,
  EmptyState,
  Skeleton,
} from '../components/ui'

const typeMeta: Record<
  TransactionType,
  { icon: typeof ArrowDownRight; tone: 'flame' | 'mint' | 'violet' }
> = {
  expense: { icon: ArrowDownRight, tone: 'flame' },
  income: { icon: ArrowUpRight, tone: 'mint' },
  transfer: { icon: ArrowLeftRight, tone: 'violet' },
}

const statusTone: Record<TransactionStatus, 'warning' | 'success' | 'gray'> = {
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'gray',
}

export default function TransactionDetail() {
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editForm, setEditForm] = useState({
    amount: '',
    currency: 'INR',
    type: 'expense' as TransactionType,
    category_id: '' as string | number,
    description: '',
    merchant_name: '',
    transaction_date: '',
    status: 'confirmed' as TransactionStatus,
  })

  const { data: transactionData, isLoading, error } = useQuery({
    queryKey: ['transactions', id],
    queryFn: () => transactionsApi.get(parseInt(id!)),
    enabled: !!id,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (txnId: number) => transactionsApi.delete(txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaction deleted')
      navigate('/transactions')
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'Failed to delete transaction'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id: txnId, data }: { id: number; data: any }) =>
      transactionsApi.update(txnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transactions', id] })
      toast.success('Transaction updated')
      setShowEditModal(false)
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || 'Failed to update transaction'),
  })

  const transaction: Transaction | undefined = transactionData?.data

  const categories: Category[] = categoriesData?.data || []
  const expenseCategories = categories.filter(
    (c) => c.name !== 'Salary' && c.name !== 'Investments'
  )
  const incomeCategories = categories.filter(
    (c) => c.name === 'Salary' || c.name === 'Investments'
  )

  useEffect(() => {
    if (transaction) {
      setEditForm({
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        type: transaction.type,
        category_id: transaction.category_id || '',
        description: transaction.description || '',
        merchant_name: transaction.merchant_name || '',
        transaction_date: transaction.transaction_date,
        status: transaction.status,
      })
    }
  }, [transaction])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Transaction ID copied')
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return
    updateMutation.mutate({
      id: transaction.id,
      data: {
        amount: parseFloat(editForm.amount),
        currency: editForm.currency,
        type: editForm.type,
        category_id: editForm.category_id
          ? parseInt(editForm.category_id as string)
          : undefined,
        description: editForm.description,
        merchant_name: editForm.merchant_name,
        transaction_date: editForm.transaction_date,
        status: editForm.status,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <EmptyState
        title="Transaction not found"
        description="This transaction may have been deleted."
        action={
          <Button onClick={() => navigate('/transactions')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Transactions
          </Button>
        }
      />
    )
  }

  const meta = typeMeta[transaction.type]
  const TypeIcon = meta.icon
  const editCategories = editForm.type === 'income' ? incomeCategories : expenseCategories

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/transactions')}
          aria-label="Back to transactions"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(transaction.id.toString())}
            title="Copy ID"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <IconTile tone={meta.tone} className="w-16 h-16 text-2xl rounded-2xl">
              {transaction.category?.icon || <TypeIcon className="w-8 h-8" />}
            </IconTile>
            <div>
              <h1 className="text-xl font-display font-semibold text-text-hi">
                {transaction.merchant_name || transaction.category?.name || 'Transaction'}
              </h1>
              <p className="text-sm text-text-lo">{formatDate(transaction.transaction_date)}</p>
            </div>
          </div>
          <Money
            amount={Number(transaction.amount)}
            currency={transaction.currency}
            tone={transaction.type === 'expense' ? 'expense' : 'income'}
            className="text-3xl sm:text-4xl font-display font-semibold"
          />
        </CardHeader>

        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-lo">Type</p>
              <div className="mt-1">
                <Badge
                  tone={
                    transaction.type === 'expense'
                      ? 'expense'
                      : transaction.type === 'income'
                        ? 'income'
                        : 'warning'
                  }
                >
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-text-lo">Status</p>
              <div className="mt-1">
                <Badge tone={statusTone[transaction.status]}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-text-lo">Category</p>
              <div className="mt-1">
                {transaction.category ? (
                  <Badge tone="gray">
                    {transaction.category.icon} {transaction.category.name}
                  </Badge>
                ) : (
                  <span className="text-text-lo text-sm">Uncategorized</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-text-lo">Source</p>
              <div className="mt-1">
                <Badge tone="gray">{transaction.source}</Badge>
              </div>
            </div>
          </div>

          {user?.role === 'admin' && (transaction.location || transaction.verified_location) && (
            <div className="pt-4 border-t border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-hi">Location Audit & Verification</p>
                <span className="text-xs bg-mint-soft text-mint px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified GPS System Active
                </span>
              </div>

              {transaction.location && (
                <div className="flex items-center justify-between p-3 bg-surface-2 border border-hairline rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="grid place-items-center w-8 h-8 rounded-lg bg-surface-3 text-text-hi">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-text-lo font-medium">User Inputted Note</p>
                      <p className="text-sm font-medium text-text-hi">{transaction.location}</p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(transaction.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-mint" />
                    Search Text
                  </a>
                </div>
              )}

              {transaction.verified_latitude && transaction.verified_longitude ? (
                <div className="flex items-center justify-between p-3 bg-mint-soft/20 border border-mint/40 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="grid place-items-center w-8 h-8 rounded-lg bg-mint-soft text-mint">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] text-mint font-semibold flex items-center gap-1">
                        Tamper-Proof Hardware GPS Pin
                      </p>
                      <p className="text-sm font-medium text-text-hi">
                        {transaction.verified_location || `GPS: ${transaction.verified_latitude}, ${transaction.verified_longitude}`}
                      </p>
                      <p className="text-xs text-text-lo font-mono">
                        {Number(transaction.verified_latitude).toFixed(5)}, {Number(transaction.verified_longitude).toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${transaction.verified_latitude},${transaction.verified_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Verify Pin
                  </a>
                </div>
              ) : null}
            </div>
          )}

          {transaction.description && (
            <div className="pt-4 border-t border-hairline">
              <p className="text-sm text-text-lo">Description</p>
              <p className="font-medium text-text-hi mt-1">{transaction.description}</p>
            </div>
          )}

          {transaction.raw_message && (
            <div className="pt-4 border-t border-hairline">
              <p className="text-sm text-text-lo">Original Message</p>
              <div className="mt-1 p-3 bg-surface-2 border border-hairline rounded-xl text-sm font-mono text-text-lo">
                {transaction.raw_message}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-hairline grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-lo">Created</p>
              <p className="font-medium text-text-hi">{formatDateTime(transaction.created_at)}</p>
            </div>
            <div>
              <p className="text-text-lo">Updated</p>
              <p className="font-medium text-text-hi">{formatDateTime(transaction.updated_at)}</p>
            </div>
            {transaction.parsed_confidence != null && (
              <div>
                <p className="text-text-lo">Parse Confidence</p>
                <p className="font-medium text-text-hi tnum">
                  {(transaction.parsed_confidence * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Edit modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Transaction"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Field label="Amount" htmlFor="edit-amount">
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              required
            />
          </Field>

          <div>
            <Label>Type</Label>
            <div className="flex gap-2">
              {(['expense', 'income', 'transfer'] as TransactionType[]).map((type) => {
                const tm = typeMeta[type]
                const Icon = tm.icon
                const active = editForm.type === type
                const activeCls =
                  type === 'expense'
                    ? 'bg-flame-soft text-flame border-flame/40'
                    : type === 'income'
                      ? 'bg-mint-soft text-mint border-mint/40'
                      : 'bg-violet-soft text-violet border-violet/40'
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, type })}
                    className={
                      'flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 border ' +
                      (active
                        ? activeCls
                        : 'bg-surface-2 text-text-lo border-hairline hover:bg-surface-3 hover:text-text-hi')
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <Field label="Category" htmlFor="edit-category">
            <Select
              id="edit-category"
              value={editForm.category_id}
              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
            >
              <option value="">Select category</option>
              {editCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Merchant Name" htmlFor="edit-merchant">
            <Input
              id="edit-merchant"
              type="text"
              value={editForm.merchant_name}
              onChange={(e) => setEditForm({ ...editForm, merchant_name: e.target.value })}
              placeholder="e.g., Swiggy"
            />
          </Field>

          <Field label="Description" htmlFor="edit-description">
            <textarea
              id="edit-description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="input min-h-[80px] resize-y"
              placeholder="Add a note..."
            />
          </Field>

          <Field label="Date" htmlFor="edit-date">
            <Input
              id="edit-date"
              type="date"
              value={editForm.transaction_date}
              onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </Field>

          <Field label="Status" htmlFor="edit-status">
            <Select
              id="edit-status"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value as TransactionStatus })
              }
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Field>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowEditModal(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth loading={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Transaction"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(transaction.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-lo">
          Are you sure you want to delete this transaction? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

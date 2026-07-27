import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { transactionsApi, categoriesApi } from '../lib/api'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Receipt,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { Transaction, TransactionType, Category } from '../types'
import AddTransactionModal from '../components/AddTransactionModal'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  Badge,
  Money,
  EmptyState,
  Skeleton,
} from '../components/ui'

import { useAuth } from '../hooks/useAuth'

const typeBadgeTone: Record<TransactionType, 'expense' | 'income' | 'warning'> = {
  expense: 'expense',
  income: 'income',
  transfer: 'warning',
}

export default function Transactions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })
  const categories: Category[] = categoriesData?.data || []

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', page, search, typeFilter, categoryFilter],
    queryFn: () =>
      transactionsApi.list({
        skip: (page - 1) * 20,
        limit: 20,
        merchant: search || undefined,
        type: typeFilter || undefined,
        category_id: categoryFilter || undefined,
      }),
  })

  const transactions: Transaction[] = transactionsData?.data || []
  const pageSize = 20
  const hasNextPage = transactions.length === pageSize
  const showPagination = page > 1 || hasNextPage

  const hasFilters = !!search || !!typeFilter || !!categoryFilter

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-hi">Transactions</h1>
          <p className="text-sm text-text-lo">Manage your expenses and income</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="hidden sm:inline-flex">
          <Plus className="w-4 h-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        {/* Filter bar */}
        <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex-1 sm:max-w-xs">
            <Input
              type="text"
              placeholder="Search by merchant..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType | '')
                setPage(1)
              }}
              className="w-auto"
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </Select>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value ? parseInt(e.target.value) : '')
                setPage(1)
              }}
              className="w-auto"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </Select>
            {categoryFilter !== '' && (
              <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('')}>
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        {isLoading ? (
          <CardBody className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </CardBody>
        ) : transactions.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Receipt className="w-7 h-7" />}
              title="No transactions found"
              description={
                hasFilters
                  ? 'Try adjusting your filters.'
                  : 'Add your first transaction to get started.'
              }
              action={
                !hasFilters ? (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4" />
                    Add Transaction
                  </Button>
                ) : undefined
              }
            />
          </CardBody>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/transactions/${transaction.id}`)}
                    >
                      <td className="whitespace-nowrap text-text-lo">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td>
                        <p className="font-medium text-text-hi">
                          {transaction.merchant_name || 'Unknown'}
                        </p>
                        {transaction.description && (
                          <p className="text-xs text-text-lo truncate max-w-xs">
                            {transaction.description}
                          </p>
                        )}
                        {user?.role === 'admin' && transaction.location && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(transaction.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-mint hover:underline inline-flex items-center gap-1 mt-0.5"
                            title="[ADMIN ONLY] Open location in Google Maps"
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{transaction.location}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-75 shrink-0" />
                          </a>
                        )}
                      </td>
                      <td>
                        {transaction.category ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCategoryFilter(transaction.category!.id)
                              setPage(1)
                            }}
                            className="badge bg-white/5 text-text-hi hover:bg-white/10 transition-colors"
                          >
                            {transaction.category.icon} {transaction.category.name}
                          </button>
                        ) : (
                          <span className="text-text-lo text-sm">Uncategorized</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Money
                          amount={Number(transaction.amount)}
                          currency={transaction.currency}
                          tone={transaction.type === 'expense' ? 'expense' : 'income'}
                          className="font-semibold"
                        />
                      </td>
                      <td>
                        <Badge tone={typeBadgeTone[transaction.type]}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-xs text-text-lo capitalize">
                          {transaction.source}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          className="p-1.5 rounded-lg text-text-lo hover:text-text-hi hover:bg-white/5 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/transactions/${transaction.id}`)
                          }}
                          aria-label="View transaction"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showPagination && (
              <div className="card-header flex items-center justify-between border-t border-b-0">
                <p className="text-sm text-text-lo">
                  Showing {transactions.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
                  {(page - 1) * pageSize + transactions.length}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasNextPage}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }}
      />
    </div>
  )
}

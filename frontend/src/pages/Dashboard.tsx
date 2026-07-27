import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Wallet,
  AlertTriangle,
  Sparkles,
  Plus,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { insightsApi } from '../lib/api'
import { DashboardSummary, SpendingTrend } from '../types'
import { formatCurrency, formatDate, cn } from '../lib/utils'
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  StatCard,
  Money,
  ProgressBar,
  EmptyState,
  Skeleton,
  IconTile,
} from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await insightsApi.dashboard()).data as DashboardSummary,
  })

  const { data: trend } = useQuery({
    queryKey: ['spending-trend', 30],
    queryFn: async () => (await insightsApi.spendingTrend(30)).data as SpendingTrend,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-52 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="Couldn’t load your dashboard"
        description="Please refresh the page to try again."
      />
    )
  }

  const net = data.this_month_net
  const positive = net >= 0
  const totalFlow = data.this_month_income + data.this_month_expenses
  const incomeShare = totalFlow > 0 ? (data.this_month_income / totalFlow) * 100 : 0

  const sparkData =
    trend?.daily?.map((d) => ({ date: d.date, amount: Number(d.amount) })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-text-lo">{greeting()},</p>
          <h1 className="text-2xl font-display font-semibold text-text-hi">
            {user?.full_name?.split(' ')[0] || 'there'}
          </h1>
        </div>
        <Link to="/transactions/new" className="btn-primary hidden sm:inline-flex">
          <Plus className="w-4 h-4" />
          Add
        </Link>
      </div>

      {/* Signature hero */}
      <section className="relative overflow-hidden rounded-3xl border border-hairline bg-surface shadow-elevated">
        <div className="absolute inset-0 bg-hero-glow" aria-hidden="true" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="min-w-0">
              <p className="text-sm text-text-lo">Net this month</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span
                  className={cn(
                    'font-display font-semibold tracking-tight tnum text-4xl sm:text-5xl',
                    positive ? 'text-mint' : 'text-flame'
                  )}
                >
                  {positive ? '+' : '-'}
                  {formatCurrency(Math.abs(net))}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    positive ? 'text-mint' : 'text-flame'
                  )}
                >
                  {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </span>
              </div>

              {/* Income vs expense split */}
              <div className="mt-5 max-w-md">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full bg-mint" style={{ width: `${incomeShare}%` }} />
                  <div className="h-full bg-flame" style={{ width: `${100 - incomeShare}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-text-lo">
                    <span className="w-2 h-2 rounded-full bg-mint" />
                    Income <span className="text-text-hi tnum">{formatCurrency(data.this_month_income)}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-text-lo">
                    <span className="w-2 h-2 rounded-full bg-flame" />
                    Spent <span className="text-text-hi tnum">{formatCurrency(data.this_month_expenses)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Daily spend sparkline */}
            <div className="w-full lg:w-72 h-24 shrink-0">
              {sparkData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3DE1B0" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3DE1B0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <Tooltip
                      cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                      contentStyle={{
                        background: '#1C242E',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12,
                        color: '#F5F7FA',
                        fontSize: 12,
                      }}
                      labelFormatter={(l) => formatDate(String(l))}
                      formatter={(v: number) => [formatCurrency(v), 'Spent']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#3DE1B0"
                      strokeWidth={2}
                      fill="url(#sparkFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full grid place-items-center text-xs text-text-lo">
                  Daily spend appears here
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Today’s spend"
          value={<Money amount={data.today_expenses} />}
          icon={<CreditCard className="w-5 h-5" />}
          tone="flame"
        />
        <StatCard
          label="Today’s income"
          value={<Money amount={data.today_income} />}
          icon={<Wallet className="w-5 h-5" />}
          tone="mint"
        />
        <StatCard
          label="Spent this month"
          value={<Money amount={data.this_month_expenses} />}
          icon={<ArrowDownRight className="w-5 h-5" />}
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top categories */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
            <Link to="/insights" className="text-sm text-text-lo hover:text-mint">
              View insights
            </Link>
          </CardHeader>
          <CardBody>
            {data.top_categories.length > 0 ? (
              <div className="space-y-4">
                {data.top_categories.map((cat, i) => {
                  const pct =
                    data.this_month_expenses > 0
                      ? (cat.amount / data.this_month_expenses) * 100
                      : 0
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-text-hi">
                          {cat.icon && <span className="text-base">{cat.icon}</span>}
                          <span className="font-medium">{cat.name}</span>
                        </span>
                        <Money amount={cat.amount} className="font-semibold" />
                      </div>
                      <ProgressBar value={pct} tone="violet" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState title="No spending yet" description="Add a transaction to see your top categories." />
            )}
          </CardBody>
        </Card>

        {/* Side column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <Link to="/transactions" className="text-sm text-text-lo hover:text-mint">
                All
              </Link>
            </CardHeader>
            <CardBody className="!py-2">
              {data.recent_transactions.length > 0 ? (
                <div className="divide-y divide-hairline/60">
                  {data.recent_transactions.slice(0, 5).map((txn) => (
                    <Link
                      to={`/transactions/${txn.id}`}
                      key={txn.id}
                      className="flex items-center justify-between py-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <IconTile tone={txn.type === 'expense' ? 'flame' : 'mint'}>
                          {txn.category?.icon ? (
                            <span className="text-base">{txn.category.icon}</span>
                          ) : txn.type === 'expense' ? (
                            <CreditCard className="w-5 h-5" />
                          ) : (
                            <Wallet className="w-5 h-5" />
                          )}
                        </IconTile>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-hi truncate group-hover:text-mint transition-colors">
                            {txn.merchant_name || txn.category?.name || 'Transaction'}
                          </p>
                          <p className="text-xs text-text-lo">{formatDate(txn.transaction_date)}</p>
                        </div>
                      </div>
                      <Money
                        amount={Number(txn.amount)}
                        tone={txn.type === 'expense' ? 'expense' : 'income'}
                        className="text-sm font-semibold"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="Nothing here yet" description="Your recent transactions will show up here." />
              )}
            </CardBody>
          </Card>

          {(data.budget_alerts?.length ?? 0) > 0 && (
            <Card className="border-flame/25">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-flame">
                  <AlertTriangle className="w-4 h-4" />
                  Budget alerts
                </CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {data.budget_alerts.map((budget) => (
                  <div key={budget.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-hi">{budget.name}</span>
                      <span className="text-flame font-semibold tnum">
                        {budget.progress_percentage.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar value={budget.progress_percentage} />
                    <p className="text-xs text-text-lo">
                      {formatCurrency(Number(budget.spent_amount))} of{' '}
                      {formatCurrency(Number(budget.amount))}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {data.daily_insight && (
            <Card className="border-violet/25">
              <CardBody className="flex gap-3">
                <IconTile tone="violet">
                  <Sparkles className="w-5 h-5" />
                </IconTile>
                <div>
                  <p className="font-medium text-text-hi">{data.daily_insight.title}</p>
                  {data.daily_insight.description && (
                    <p className="text-sm text-text-lo mt-0.5">{data.daily_insight.description}</p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

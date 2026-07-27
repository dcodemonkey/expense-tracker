import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  Download,
  AlertTriangle,
  Calendar,
  Wallet,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { cn, formatCurrency, formatDate } from '../lib/utils'
import { insightsApi, transactionsApi } from '../lib/api'
import {
  DashboardSummary,
  SpendingTrend,
  MerchantAnalysis,
  CategoryBreakdown,
  DailyInsight,
} from '../types'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  StatCard,
  Money,
  IconTile,
  EmptyState,
  Badge,
} from '../components/ui'

type TabId = 'overview' | 'trends' | 'merchants' | 'categories' | 'insights'
type TrendPeriod = 'daily' | 'weekly' | 'monthly'

// Dark-premium chart palette (mint / violet / amber / flame first).
const COLORS = ['#3DE1B0', '#417BF5', '#F5B85C', '#A86DFB', '#FF6455', '#38BDF8', '#F472B6']

const CHART_GRID = 'rgba(255,255,255,0.06)'
const CHART_AXIS = '#8A94A6'
const CHART_TOOLTIP = {
  background: '#1C242E',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#F5F7FA',
  fontSize: 12,
}

interface InsightTabsProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

function InsightTabs({ activeTab, setActiveTab }: InsightTabsProps) {
  const tabs: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'merchants', label: 'Merchants', icon: ShoppingCart },
    { id: 'categories', label: 'Categories', icon: BarChart3 },
    { id: 'insights', label: 'AI Insights', icon: TrendingDown },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border',
              activeTab === tab.id
                ? 'bg-mint-soft text-mint border-mint/30'
                : 'bg-surface-2 text-text-lo border-hairline hover:text-text-hi hover:bg-surface-3'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface DateRange {
  startDate: string
  endDate: string
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRange & { onChange: (range: DateRange) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        className="w-auto"
      />
      <span className="text-text-lo text-sm">to</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        className="w-auto"
      />
    </div>
  )
}

function SpendingTrendChart({ data }: { data: Array<{ date: string; amount: number }> }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-text-lo">No data available for this period</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="insightsSpentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3DE1B0" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3DE1B0" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="date" stroke={CHART_AXIS} tick={{ fontSize: 12, fill: CHART_AXIS }} tickLine={false} axisLine={false} />
        <YAxis
          stroke={CHART_AXIS}
          tick={{ fontSize: 12, fill: CHART_AXIS }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
          formatter={(value: number) => [formatCurrency(value), 'Amount']}
          labelFormatter={(l) => formatDate(String(l))}
          contentStyle={CHART_TOOLTIP}
        />
        <Area type="monotone" dataKey="amount" stroke="#3DE1B0" strokeWidth={2} fillOpacity={1} fill="url(#insightsSpentFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function CategoryBreakdownChart({ data }: { data: CategoryBreakdown[] }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-text-lo">No category data available</div>
  }

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.category_color || COLORS[index % COLORS.length],
  }))

  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={104}
              paddingAngle={2}
              dataKey="total_amount"
              nameKey="category_name"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Amount']} contentStyle={CHART_TOOLTIP} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((entry) => (
          <div key={entry.category_id} className="flex items-center gap-2 text-sm min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-text-lo truncate">{entry.category_name}</span>
            <span className="text-text-hi tnum ml-auto">{entry.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MerchantList({ merchants }: { merchants: MerchantAnalysis[] }) {
  if (!merchants || merchants.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-6 w-6 text-text-lo" />}
        title="No merchant data available"
        description="Merchant analysis will appear as you add more transactions."
      />
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Merchant</th>
            <th>Category</th>
            <th className="text-right">Total Spent</th>
            <th className="text-right">Transactions</th>
            <th className="text-right">Avg Amount</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((merchant, index) => (
            <tr key={index}>
              <td className="font-medium">{merchant.merchant}</td>
              <td>{merchant.category && <span className="badge-primary">{merchant.category}</span>}</td>
              <td className="text-right font-medium tnum">{formatCurrency(merchant.total_amount)}</td>
              <td className="text-right tnum">{merchant.transaction_count}</td>
              <td className="text-right text-text-lo tnum">{formatCurrency(merchant.average_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InsightCard({ insight }: { insight: DailyInsight }) {
  const priorityBorder: Record<number, string> = {
    0: 'border-flame/30',
    1: 'border-amber/30',
    2: 'border-violet/30',
    3: 'border-mint/30',
  }

  const iconMap: Record<string, React.ReactNode> = {
    daily_summary: <DollarSign className="h-5 w-5" />,
    budget_alert: <AlertTriangle className="h-5 w-5" />,
    category_breakdown: <BarChart3 className="h-5 w-5" />,
    spending_trend: <TrendingUp className="h-5 w-5" />,
    anomaly_detection: <AlertTriangle className="h-5 w-5" />,
  }

  const iconTone: Record<string, 'mint' | 'violet' | 'flame' | 'amber'> = {
    daily_summary: 'mint',
    budget_alert: 'flame',
    category_breakdown: 'violet',
    spending_trend: 'amber',
    anomaly_detection: 'flame',
  }

  return (
    <Card className={priorityBorder[insight.priority] || undefined}>
      <CardBody className="flex items-start gap-3">
        <IconTile tone={iconTone[insight.insight_type] || 'violet'}>
          {iconMap[insight.insight_type] || <TrendingDown className="h-5 w-5" />}
        </IconTile>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-hi">{insight.title}</h3>
          {insight.description && <p className="text-sm text-text-lo mt-1">{insight.description}</p>}
          <div className="flex items-center gap-2 mt-2 text-xs text-text-lo">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(insight.insight_date)}</span>
            <span>•</span>
            <span>Priority: {insight.priority}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function Insights() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('daily')
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await insightsApi.dashboard()).data as DashboardSummary,
  })

  const { data: trendData } = useQuery({
    queryKey: ['spending-trend', dateRange.startDate, dateRange.endDate],
    queryFn: async () => (await insightsApi.spendingTrend(30)).data as SpendingTrend,
  })

  const { data: merchantData } = useQuery({
    queryKey: ['merchant-analysis', dateRange.startDate, dateRange.endDate],
    queryFn: async () =>
      (await insightsApi.merchantAnalysis(dateRange.startDate, dateRange.endDate)).data as MerchantAnalysis[],
  })

  const { data: categoryData } = useQuery({
    queryKey: ['category-breakdown', dateRange.startDate, dateRange.endDate],
    queryFn: async () =>
      (await insightsApi.categoryBreakdown(dateRange.startDate, dateRange.endDate)).data as CategoryBreakdown[],
  })

  const { data: insightsData } = useQuery({
    queryKey: ['daily-insights', dateRange.startDate, dateRange.endDate],
    queryFn: async () =>
      (await insightsApi.dailyInsights(dateRange.startDate, dateRange.endDate)).data as DailyInsight[],
  })

  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      let txs: any[] = []
      try {
        const res = await transactionsApi.list({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          limit: 1000,
        })
        const rawData = res.data
        txs = Array.isArray(rawData) ? rawData : (rawData?.items || [])
      } catch (e) {
        console.warn('Backend list fetch warning, falling back to loaded page metrics', e)
      }

      const headers = ['Type', 'Name / Date', 'Amount (INR)', 'Category / Details', 'Source / Notes']
      const rows: string[][] = []

      if (txs.length > 0) {
        txs.forEach((t: any) => {
          rows.push([
            `"${t.type || 'expense'}"`,
            `"${t.transaction_date || t.date || ''}"`,
            t.amount || 0,
            `"${t.category?.name || t.merchant_name || 'General'}"`,
            `"${(t.description || t.source || '').replace(/"/g, '""')}"`,
          ])
        })
      } else if (categoryData && categoryData.length > 0) {
        categoryData.forEach((c: any) => {
          rows.push([
            '"Category Breakdown"',
            `"${c.category_name || c.name || ''}"`,
            c.total_amount || c.amount || 0,
            `"${c.percentage || 0}% of total"`,
            '"Category Aggregates"',
          ])
        })
      } else {
        rows.push([
          '"Summary Report"',
          `"${dateRange.startDate} to ${dateRange.endDate}"`,
          dashboardData?.this_month_expenses || 0,
          '"This Month Expenses"',
          '"Expense Tracker Export"',
        ])
      }

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `insights_export_${dateRange.startDate}_to_${dateRange.endDate}.csv`)
      document.body.appendChild(link)
      link.click()

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(url)
      }, 100)

      toast.success('Insights report exported to CSV successfully!')
    } catch (err: any) {
      console.error('Export error:', err)
      toast.error('Export failed: ' + (err?.message || 'Download error'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-hi">Insights &amp; Analytics</h1>
          <p className="text-sm text-text-lo">Understand your spending patterns and make better financial decisions</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} />
          <Button variant="secondary" onClick={handleExport} loading={exporting}>
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      <InsightTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="This Month Expenses"
              value={<Money amount={dashboardData.this_month_expenses} />}
              icon={<CreditCard className="h-5 w-5" />}
              tone="flame"
            />
            <StatCard
              label="This Month Income"
              value={<Money amount={dashboardData.this_month_income} />}
              icon={<Wallet className="h-5 w-5" />}
              tone="mint"
            />
            <StatCard
              label="Net Balance"
              value={<Money amount={dashboardData.this_month_net} />}
              icon={
                dashboardData.this_month_net >= 0 ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )
              }
              tone={dashboardData.this_month_net >= 0 ? 'mint' : 'flame'}
            />
            <StatCard
              label="Today's Expenses"
              value={<Money amount={dashboardData.today_expenses} />}
              icon={<DollarSign className="h-5 w-5" />}
              tone="violet"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Categories This Month</CardTitle>
              </CardHeader>
              <CardBody>
                {dashboardData.top_categories.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.top_categories.map((cat, index) => {
                      const pct =
                        dashboardData.this_month_expenses > 0
                          ? (cat.amount / dashboardData.this_month_expenses) * 100
                          : 0
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="grid place-items-center w-10 h-10 rounded-xl text-lg shrink-0"
                              style={{ backgroundColor: `${cat.color || '#8B7CFF'}22` }}
                            >
                              <span>{cat.icon || '🏷️'}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-text-hi truncate">{cat.name}</p>
                              <p className="text-sm text-text-lo">{pct.toFixed(1)}% of expenses</p>
                            </div>
                          </div>
                          <Money amount={cat.amount} className="font-semibold" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-text-lo text-center py-8">No category data available</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardBody className="!py-2">
                {dashboardData.recent_transactions.length > 0 ? (
                  <div className="divide-y divide-hairline/60">
                    {dashboardData.recent_transactions.slice(0, 5).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <IconTile tone={txn.type === 'expense' ? 'flame' : 'mint'}>
                            {txn.category?.icon ? (
                              <span className="text-base">{txn.category.icon}</span>
                            ) : txn.type === 'expense' ? (
                              <CreditCard className="h-5 w-5" />
                            ) : (
                              <Wallet className="h-5 w-5" />
                            )}
                          </IconTile>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-hi truncate">
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-lo text-center py-8">No recent transactions</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'trends' && trendData && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Trends</CardTitle>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm transition-colors',
                    trendPeriod === period ? 'bg-mint-soft text-mint' : 'text-text-lo hover:bg-white/5'
                  )}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardBody>
            <SpendingTrendChart data={trendData[trendPeriod]} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'merchants' && merchantData && (
        <Card>
          <CardHeader>
            <CardTitle>Top Merchants</CardTitle>
            <DateRangePicker startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} />
          </CardHeader>
          <CardBody>
            <MerchantList merchants={merchantData} />
          </CardBody>
        </Card>
      )}

      {activeTab === 'categories' && categoryData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardBody>
              <CategoryBreakdownChart data={categoryData} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Category Details</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Transactions</th>
                      <th className="text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((cat, index) => (
                      <tr key={index}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              className="grid place-items-center w-8 h-8 rounded-lg text-sm shrink-0"
                              style={{ backgroundColor: `${cat.category_color || '#8B7CFF'}22` }}
                            >
                              <span>{cat.category_icon}</span>
                            </div>
                            {cat.category_name}
                          </div>
                        </td>
                        <td className="text-right font-medium tnum">{formatCurrency(cat.total_amount)}</td>
                        <td className="text-right tnum">{cat.transaction_count}</td>
                        <td className="text-right tnum">{cat.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'insights' && insightsData && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-semibold text-text-hi">AI Insights</h2>
          {insightsData.length > 0 ? (
            <div className="space-y-4">
              {insightsData.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={<TrendingDown className="h-6 w-6 text-text-lo" />}
                title="No insights yet"
                description="Insights will appear as you add more transactions"
              />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

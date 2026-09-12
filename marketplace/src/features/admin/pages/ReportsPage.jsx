import { useEffect, useMemo, useState } from 'react'
import { FileBarChart, Download, FileText, TrendingUp, Hash } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { orderService } from '@/services/order.service'
import { productService } from '@/services/product.service'
import { adminService } from '@/services/admin.service'
import { getMaterial } from '@/data/materials'
import { getSeller } from '@/data/sellers'
import { formatCurrency } from '@/lib/utils'
import { exportReportToExcel, exportReportToPdf } from '@/lib/reportExport'

const CHART_COLORS = ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#e11d48', '#9333ea', '#0284c7', '#16a34a']

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'purchase', label: 'Purchase Report' },
  { id: 'buyer', label: 'Buyer Report' },
  { id: 'seller', label: 'Seller Report' },
  { id: 'product', label: 'Product Report' },
  { id: 'revenue', label: 'Revenue Report' },
  { id: 'material', label: 'Material-wise Report' },
  { id: 'monthly', label: 'Monthly Report' },
]

function buildReport(type, { orders, products, users }) {
  switch (type) {
    case 'sales': {
      const bySeller = {}
      orders.forEach((o) => {
        const key = o.sellerId
        bySeller[key] ||= { seller: getSeller(key)?.companyName || key, orders: 0, units: 0, revenue: 0 }
        bySeller[key].orders += 1
        bySeller[key].revenue += o.status === 'Delivered' ? o.total : 0
      })
      return {
        subtitle: 'All orders, grouped by seller',
        columns: [
          { key: 'seller', label: 'Seller' },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue (Delivered)', format: 'currency' },
        ],
        rows: Object.values(bySeller).sort((a, b) => b.revenue - a.revenue),
      }
    }
    case 'purchase': {
      const byBuyer = {}
      orders.forEach((o) => {
        const key = o.buyerCompany
        byBuyer[key] ||= { buyer: key, orders: 0, spend: 0 }
        byBuyer[key].orders += 1
        byBuyer[key].spend += o.total
      })
      return {
        subtitle: 'All orders, grouped by buyer',
        columns: [
          { key: 'buyer', label: 'Buyer' },
          { key: 'orders', label: 'Orders' },
          { key: 'spend', label: 'Total Spend', format: 'currency' },
        ],
        rows: Object.values(byBuyer).sort((a, b) => b.spend - a.spend),
      }
    }
    case 'buyer': {
      const buyers = users.filter((u) => u.role === 'buyer')
      return {
        subtitle: 'All registered buyer accounts',
        columns: [
          { key: 'company', label: 'Company' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' },
          { key: 'joined', label: 'Joined' },
        ],
        rows: buyers.map((b) => ({
          company: b.companyName || b.name,
          email: b.email,
          status: b.status,
          joined: new Date(b.createdAt).toLocaleDateString(),
        })),
      }
    }
    case 'seller': {
      const sellers = users.filter((u) => u.role === 'seller')
      return {
        subtitle: 'All registered seller accounts',
        columns: [
          { key: 'company', label: 'Company' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' },
          { key: 'products', label: 'Listings' },
          { key: 'joined', label: 'Joined' },
        ],
        rows: sellers.map((s) => ({
          company: s.companyName || s.name,
          email: s.email,
          status: s.status,
          products: products.filter((p) => p.sellerId === s.sellerId).length,
          joined: new Date(s.createdAt).toLocaleDateString(),
        })),
      }
    }
    case 'product': {
      return {
        subtitle: 'Full product catalog',
        columns: [
          { key: 'name', label: 'Product' },
          { key: 'material', label: 'Material' },
          { key: 'seller', label: 'Seller' },
          { key: 'price', label: 'Price', format: 'currency' },
          { key: 'status', label: 'Status' },
        ],
        rows: products.map((p) => ({
          name: p.name,
          material: getMaterial(p.materialId)?.label || p.materialId,
          seller: getSeller(p.sellerId)?.companyName || p.sellerId,
          price: p.price,
          status: p.status,
        })),
      }
    }
    case 'revenue': {
      const months = monthBuckets()
      orders.forEach((o) => {
        if (o.status !== 'Delivered') return
        const b = bucketFor(months, o.placedAt)
        if (b) b.revenue += o.total
      })
      return {
        subtitle: 'Delivered & settled revenue, last 6 months',
        columns: [
          { key: 'label', label: 'Month' },
          { key: 'revenue', label: 'Revenue', format: 'currency' },
        ],
        rows: months,
      }
    }
    case 'material': {
      const byMaterial = {}
      orders.forEach((o) => {
        const product = products.find((p) => p.id === o.productId)
        const materialId = product?.materialId
        if (!materialId) return
        byMaterial[materialId] ||= { material: getMaterial(materialId)?.label || materialId, orders: 0, revenue: 0 }
        byMaterial[materialId].orders += 1
        byMaterial[materialId].revenue += o.status === 'Delivered' ? o.total : 0
      })
      return {
        subtitle: 'All orders, grouped by material category',
        columns: [
          { key: 'material', label: 'Material' },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue (Delivered)', format: 'currency' },
        ],
        rows: Object.values(byMaterial).sort((a, b) => b.revenue - a.revenue),
      }
    }
    case 'monthly': {
      const months = monthBuckets()
      orders.forEach((o) => {
        const b = bucketFor(months, o.placedAt)
        if (b) {
          b.orders += 1
          if (o.status === 'Delivered') b.revenue += o.total
        }
      })
      return {
        subtitle: 'Orders placed & revenue, last 6 months',
        columns: [
          { key: 'label', label: 'Month' },
          { key: 'orders', label: 'Orders' },
          { key: 'revenue', label: 'Revenue', format: 'currency' },
        ],
        rows: months,
      }
    }
    default:
      return { subtitle: '', columns: [], rows: [] }
  }
}

function monthBuckets() {
  const months = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }), orders: 0, revenue: 0 })
  }
  return months
}

function bucketFor(months, dateStr) {
  const d = new Date(dateStr)
  return months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [orders, setOrders] = useState(null)
  const [products, setProducts] = useState(null)
  const [users, setUsers] = useState(null)

  useEffect(() => {
    orderService.listAllOrders().then(setOrders)
    productService.listAll().then(setProducts)
    adminService.listAllUsers().then(setUsers)
  }, [])

  const loaded = orders && products && users
  const report = useMemo(() => {
    if (!loaded) return null
    return buildReport(reportType, { orders, products, users })
  }, [reportType, loaded, orders, products, users])

  const activeLabel = REPORT_TYPES.find((r) => r.id === reportType)?.label

  const chartInfo = useMemo(() => {
    if (!report || report.rows.length === 0) return null
    const labelCol = report.columns[0]
    const numericCol = [...report.columns].reverse().find((c) => c.format === 'currency') || report.columns.find((c) => typeof report.rows[0][c.key] === 'number')
    if (!numericCol) return null
    const sorted = [...report.rows].sort((a, b) => (b[numericCol.key] || 0) - (a[numericCol.key] || 0))
    const top = sorted.slice(0, 8).map((r) => ({
      name: String(r[labelCol.key] ?? '—').slice(0, 18),
      value: r[numericCol.key] || 0,
    }))
    const total = sorted.reduce((s, r) => s + (r[numericCol.key] || 0), 0)
    return { data: top, label: numericCol.label, isCurrency: numericCol.format === 'currency', total, count: report.rows.length }
  }, [report])

  function handleExportExcel() {
    exportReportToExcel({ title: activeLabel, columns: report.columns, rows: report.rows })
  }
  function handleExportPdf() {
    exportReportToPdf({ title: activeLabel, subtitle: report.subtitle, columns: report.columns, rows: report.rows })
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader
        icon={FileBarChart}
        eyebrow="Business intelligence"
        title="Reports"
        subtitle="Export platform activity and performance reports."
        actions={
          <div className="flex items-end gap-2">
            <div className="w-56">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="border-white/20 bg-white/5 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExportExcel} disabled={!report}>
            <Download className="size-4" /> Excel
          </Button>
          <Button variant="outline" onClick={handleExportPdf} disabled={!report}>
            <FileText className="size-4" /> PDF
          </Button>
        </div>
        }
      />

      {report && chartInfo && (
        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <StatCard label="Rows in report" value={chartInfo.count} icon={Hash} tone="default" />
          <StatCard
            label={`Total ${chartInfo.label}`}
            value={chartInfo.isCurrency ? formatCurrency(chartInfo.total) : chartInfo.total}
            icon={TrendingUp}
            tone="copper"
          />
          <StatCard
            label="Top entry"
            value={chartInfo.data[0]?.name || '—'}
            icon={FileBarChart}
            tone="verdigris"
          />
        </div>
      )}

      {report && chartInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4" /> {chartInfo.label} by {report.columns[0].label.toLowerCase()}</CardTitle>
            <CardDescription>Top {chartInfo.data.length} entries in this report, visualized</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartInfo.data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-300)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }} tickFormatter={(v) => chartInfo.isCurrency ? `$${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={(v) => [chartInfo.isCurrency ? formatCurrency(v) : v, chartInfo.label]}
                  contentStyle={{ borderRadius: 10, border: '1px solid var(--color-paper-300)', fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartInfo.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileBarChart className="size-4" /> {activeLabel}</CardTitle>
          {report?.subtitle && <CardDescription>{report.subtitle}</CardDescription>}
        </CardHeader>
        <CardContent className="p-0">
          {!report ? (
            <div className="space-y-2.5 p-6">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-paper-300 bg-paper-100 text-left text-xs text-ink-500">
                    {report.columns.map((c) => (
                      <th key={c.key} className="px-6 py-3 font-medium">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i} className="border-b border-paper-200 last:border-0 hover:bg-paper-100">
                      {report.columns.map((c) => (
                        <td key={c.key} className="px-6 py-3 text-ink-700">
                          {c.format === 'currency' ? formatCurrency(row[c.key] || 0) : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {report.rows.length === 0 && (
                    <tr><td colSpan={report.columns.length} className="px-6 py-10 text-center text-ink-500">No data for this report yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

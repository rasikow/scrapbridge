import { formatCurrency } from '@/lib/utils'
import { getSeller } from '@/data/sellers'

function buildDocumentHtml(order, { kind }) {
  const seller = getSeller(order.sellerId)
  const title = kind === 'receipt' ? 'Payment Receipt' : 'Tax Invoice'
  const docNumber = kind === 'receipt' ? `RCPT-${order.id.replace('ORD-', '')}` : `INV-${order.id.replace('ORD-', '')}`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title} · ${order.id}</title>
<style>
  body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; color: #151b1e; padding: 48px; max-width: 680px; margin: 0 auto; }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
  .brand-mark { width: 32px; height: 32px; border-radius: 6px; background: #c1793f; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-family: monospace; }
  .brand-name { font-size: 18px; font-weight: 700; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #667075; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #e9ebe6; font-size: 13px; }
  th { color: #667075; font-weight: 500; }
  .total-row td { font-weight: 700; font-size: 15px; border-bottom: none; padding-top: 16px; }
  .section { margin-top: 24px; font-size: 13px; color: #384245; }
  .section strong { color: #151b1e; }
  .footer { margin-top: 40px; font-size: 11px; color: #9aa3a6; }
</style>
</head>
<body>
  <div class="brand">
    <div class="brand-mark">S</div>
    <div class="brand-name">ScrapBridge</div>
  </div>
  <h1>${title}</h1>
  <p class="meta">${docNumber} · Order ${order.id} · ${new Date(order.placedAt).toLocaleDateString()}</p>

  <div class="section">
    <strong>Seller:</strong> ${seller?.companyName || '—'}<br/>
    ${seller?.location || ''}
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${order.productName}</td>
        <td>${order.quantity.toLocaleString()} ${order.unit}</td>
        <td>${formatCurrency(order.unitPrice, order.currency)}</td>
        <td>${formatCurrency(order.total, order.currency)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="3">Total ${kind === 'receipt' ? 'paid' : 'due'}</td>
        <td>${formatCurrency(order.total, order.currency)}</td>
      </tr>
    </tbody>
  </table>

  <p class="footer">This is a system-generated ${kind} from the ScrapBridge prototype and is not a fiscal document.</p>
</body>
</html>`
}

function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadInvoice(order) {
  downloadHtml(`invoice-${order.id}.html`, buildDocumentHtml(order, { kind: 'invoice' }))
}

export function downloadReceipt(order) {
  downloadHtml(`receipt-${order.id}.html`, buildDocumentHtml(order, { kind: 'receipt' }))
}

export function printInvoice(order) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(buildDocumentHtml(order, { kind: 'invoice' }))
  win.document.close()
  win.focus()
  win.print()
}

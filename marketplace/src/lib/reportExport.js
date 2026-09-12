import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from '@/lib/utils'

function formatValue(value, column) {
  if (value == null) return '—'
  if (column.format === 'currency') return formatCurrency(Number(value) || 0)
  return String(value)
}

/**
 * Exports tabular report data to a real .xlsx workbook. SheetJS is used in
 * write-only mode here (we generate files, we never parse untrusted
 * uploads), which avoids the known SheetJS parsing CVEs entirely.
 */
export function exportReportToExcel({ title, columns, rows }) {
  const sheetData = [
    columns.map((c) => c.label),
    ...rows.map((row) => columns.map((c) => formatValue(row[c.key], c))),
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  worksheet['!cols'] = columns.map((c) => ({ wch: Math.max(12, c.label.length + 4) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, `${slug(title)}.xlsx`)
}

export function exportReportToPdf({ title, subtitle, columns, rows }) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(18, 24, 27)
  doc.text('ScrapBridge', 14, 16)

  doc.setFontSize(11)
  doc.text(title, 14, 24)

  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(102, 112, 117)
    doc.text(subtitle, 14, 30)
  }

  autoTable(doc, {
    startY: 34,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => formatValue(row[c.key], c))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [18, 24, 27], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 246, 245] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${slug(title)}.pdf`)
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

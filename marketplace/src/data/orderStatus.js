export const ORDER_STATUSES = [
  'Pending',
  'Approved',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
]

export const STATUS_TONE = {
  Pending: 'warning',
  Approved: 'verdigris',
  Processing: 'verdigris',
  Packed: 'verdigris',
  Shipped: 'copper',
  Delivered: 'success',
  Cancelled: 'danger',
}

// Ordered progression used to render the shipment timeline (Cancelled is a
// terminal branch handled separately).
export const STATUS_SEQUENCE = ['Pending', 'Approved', 'Processing', 'Packed', 'Shipped', 'Delivered']

export const BUYER_NOTIFICATIONS = [
  { id: 'n1', title: 'Order ORD-02005 shipped', body: 'Gulf Recycling Industries dispatched your copper scrap order.', time: '2 hours ago', unread: true, tone: 'verdigris' },
  { id: 'n2', title: 'Quote approved', body: 'Northstar Metals Co. accepted your quote request for Aluminium Taint/Tabor.', time: '5 hours ago', unread: true, tone: 'success' },
  { id: 'n3', title: 'Document expiring soon', body: 'Your VAT certificate expires in 14 days — update it to avoid order delays.', time: '1 day ago', unread: false, tone: 'warning' },
  { id: 'n4', title: 'Order ORD-02001 delivered', body: 'Delivery confirmed at your Jebel Ali warehouse.', time: '3 days ago', unread: false, tone: 'success' },
  { id: 'n5', title: 'Price alert — Steel HMS 1&2', body: 'Reference price moved -0.6% this week.', time: '4 days ago', unread: false, tone: 'default' },
]

export const ADMIN_NOTIFICATIONS = [
  { id: 'an1', title: 'New buyer registration', body: 'Northgate Import Co. submitted documents for approval.', time: '20 minutes ago', unread: true, tone: 'copper' },
  { id: 'an2', title: 'New seller registration', body: 'Canton Metals Recovery is awaiting license verification.', time: '1 hour ago', unread: true, tone: 'copper' },
  { id: 'an3', title: 'Product flagged for review', body: 'A new listing was submitted and needs moderation.', time: '3 hours ago', unread: false, tone: 'warning' },
  { id: 'an4', title: 'Dispute opened', body: 'Buyer requested a refund on order ORD-02008.', time: '1 day ago', unread: false, tone: 'danger' },
  { id: 'an5', title: 'Monthly report ready', body: 'July marketplace performance report has been generated.', time: '2 days ago', unread: false, tone: 'default' },
]

export const SELLER_NOTIFICATIONS = [
  { id: 'sn1', title: 'New order received', body: 'Meridian Metals Trading LLC ordered 318 kg of Copper Scrap — Mixed.', time: '35 minutes ago', unread: true, tone: 'copper' },
  { id: 'sn2', title: 'Low stock alert', body: 'Brass — Honey Brass is below your reorder threshold (240 kg remaining).', time: '3 hours ago', unread: true, tone: 'warning' },
  { id: 'sn3', title: 'Product approved', body: 'Your listing "Steel Scrap — HMS 1&2" passed marketplace moderation.', time: '1 day ago', unread: false, tone: 'success' },
  { id: 'sn4', title: 'Payment received', body: 'Payout of $69,000.85 for order ORD-02003 was settled.', time: '2 days ago', unread: false, tone: 'success' },
  { id: 'sn5', title: 'Quote request', body: 'Falcon Traders FZE requested a quote for E-Waste Mixed Boards.', time: '3 days ago', unread: false, tone: 'default' },
]

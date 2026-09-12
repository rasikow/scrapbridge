import {
  LayoutDashboard, Store, Heart, ClipboardList, UserCircle,
  Package, PlusCircle, Receipt, ShieldCheck, Users, FolderTree, FileBarChart,
  UserCheck, Factory, PackageCheck, ScrollText, Gavel,
} from 'lucide-react'

export const NAV_BY_ROLE = {
  buyer: [
    { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/buyer/marketplace', label: 'Marketplace', icon: Store },
    { to: '/buyer/auctions', label: 'Auctions', icon: Gavel },
    { to: '/buyer/my-bids', label: 'My Bids', icon: ClipboardList },
    { to: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/buyer/orders', label: 'Orders', icon: ClipboardList },
    { to: '/buyer/profile', label: 'Company Profile', icon: UserCircle },
  ],
  seller: [
    { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seller/products', label: 'Products', icon: Package },
    { to: '/seller/products/new', label: 'Add Product', icon: PlusCircle },
    { to: '/seller/auctions', label: 'Auctions', icon: Gavel },
    { to: '/seller/orders', label: 'Orders', icon: Receipt },
    { to: '/seller/profile', label: 'Company Profile', icon: UserCircle },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/approvals/buyers', label: 'Buyer Approvals', icon: UserCheck },
    { to: '/admin/approvals/sellers', label: 'Seller Approvals', icon: Factory },
    { to: '/admin/approvals/products', label: 'Product Approvals', icon: PackageCheck },
    { to: '/admin/auctions', label: 'Auctions', icon: Gavel },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree },
    { to: '/admin/orders', label: 'Orders', icon: Receipt },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  ],
}

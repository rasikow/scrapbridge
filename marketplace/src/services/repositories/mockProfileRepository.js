import { sleep } from '@/lib/utils'
import { safeSetItem } from '@/lib/safeStorage'

// Reads the same mock DB the auth repository seeds/writes, so a company's
// registration data (documents, license numbers, etc.) shows up here too.
const DB_KEY = 'marketplace_mock_db_v1'
const PREFS_KEY = 'marketplace_mock_notification_prefs_v1'

const DEFAULT_PREFS = {
  emailOrderUpdates: true,
  emailApprovals: true,
  emailPriceAlerts: false,
  inAppNotifications: true,
}

// Fallback profile detail for the seeded demo accounts, which were created
// directly in the users table (not through the registration wizard) and so
// have no matching `buyers`/`sellers` row.
const DEMO_BUYER_PROFILE = {
  companyName: 'Meridian Metals Trading LLC',
  businessRegNumber: 'BRN-102938',
  vatNumber: 'VAT-556213',
  companyAddress: '14 Industrial Avenue, Jebel Ali Free Zone, Dubai, UAE',
  contactPerson: 'Arjun Mehta',
  mobile: '+971 50 987 6543',
}

const DEMO_SELLER_PROFILE = {
  companyName: 'Gulf Recycling Industries',
  businessRegNumber: 'BRN-778213',
  environmentalLicense: 'ENV-44210',
  wasteHandlingLicense: 'WHL-99013',
  companyAddress: 'Plot 7, Dubai Industrial City, Dubai, UAE',
  contactPerson: 'Fatima Al-Sayed',
  mobile: '+971 4 512 0099',
  bankName: 'Emirates NBD',
  accountName: 'Gulf Recycling Industries LLC',
  accountNumber: '••••• 4471',
  iban: 'AE07 0331 2345 6789 0123 456',
  swift: 'EBILAEAD',
}

function readDb() {
  return JSON.parse(localStorage.getItem(DB_KEY) || '{"users":[],"buyers":[],"sellers":[],"documents":[]}')
}

function readPrefs() {
  return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
}

function writePrefs(map) {
  safeSetItem(PREFS_KEY, JSON.stringify(map))
}

export const mockProfileRepository = {
  async getBuyerProfile(userId) {
    await sleep(300)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    const buyer = db.buyers.find((b) => b.userId === userId)
    const docsRow = db.documents.find((d) => d.userId === userId)

    return {
      companyName: buyer?.companyName || user?.companyName || DEMO_BUYER_PROFILE.companyName,
      businessRegNumber: buyer?.businessRegNumber || DEMO_BUYER_PROFILE.businessRegNumber,
      vatNumber: buyer?.vatNumber || DEMO_BUYER_PROFILE.vatNumber,
      companyAddress: buyer?.companyAddress || DEMO_BUYER_PROFILE.companyAddress,
      contactPerson: buyer?.contactPerson || user?.name || DEMO_BUYER_PROFILE.contactPerson,
      email: user?.email || '',
      mobile: buyer?.mobile || DEMO_BUYER_PROFILE.mobile,
      status: user?.status || 'approved',
      documents: docsRow?.files
        ? Object.entries(docsRow.files).filter(([, v]) => v).map(([key, file]) => ({ key, ...file }))
        : [
            { key: 'tradeLicense', name: 'trade-license.pdf', sizeKb: 412, uploadedAt: '2025-02-10T09:00:00.000Z' },
            { key: 'vatCertificate', name: 'vat-certificate.pdf', sizeKb: 288, uploadedAt: '2025-02-10T09:02:00.000Z' },
            { key: 'companyRegistration', name: 'company-registration.pdf', sizeKb: 356, uploadedAt: '2025-02-10T09:04:00.000Z' },
          ],
    }
  },

  async getSellerProfile(userId) {
    await sleep(300)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    const seller = db.sellers.find((s) => s.userId === userId)
    const docsRow = db.documents.find((d) => d.userId === userId)

    return {
      companyName: seller?.companyName || user?.companyName || DEMO_SELLER_PROFILE.companyName,
      businessRegNumber: seller?.businessRegNumber || DEMO_SELLER_PROFILE.businessRegNumber,
      environmentalLicense: seller?.environmentalLicense || DEMO_SELLER_PROFILE.environmentalLicense,
      wasteHandlingLicense: seller?.wasteHandlingLicense || DEMO_SELLER_PROFILE.wasteHandlingLicense,
      companyAddress: seller?.companyAddress || DEMO_SELLER_PROFILE.companyAddress,
      contactPerson: seller?.contactPerson || user?.name || DEMO_SELLER_PROFILE.contactPerson,
      email: user?.email || '',
      mobile: seller?.mobile || DEMO_SELLER_PROFILE.mobile,
      status: user?.status || 'approved',
      bank: {
        bankName: DEMO_SELLER_PROFILE.bankName,
        accountName: DEMO_SELLER_PROFILE.accountName,
        accountNumber: DEMO_SELLER_PROFILE.accountNumber,
        iban: DEMO_SELLER_PROFILE.iban,
        swift: DEMO_SELLER_PROFILE.swift,
      },
      documents: docsRow?.files
        ? Object.entries(docsRow.files).filter(([, v]) => v).map(([key, file]) => ({ key, ...file }))
        : [
            { key: 'tradeLicense', name: 'trade-license.pdf', sizeKb: 398, uploadedAt: '2025-01-15T09:00:00.000Z' },
            { key: 'companyRegistration', name: 'company-registration.pdf', sizeKb: 322, uploadedAt: '2025-01-15T09:02:00.000Z' },
            { key: 'environmentalCertificate', name: 'environmental-certificate.pdf', sizeKb: 410, uploadedAt: '2025-01-15T09:04:00.000Z' },
          ],
    }
  },

  async updatePassword(userId, currentPassword, newPassword) {
    await sleep(500)
    const db = readDb()
    const idx = db.users.findIndex((u) => u.id === userId)
    if (idx === -1) throw new Error('Account not found')
    if (db.users[idx].password !== currentPassword) {
      const err = new Error('Current password is incorrect')
      err.code = 'auth/wrong-password'
      throw err
    }
    db.users[idx].password = newPassword
    safeSetItem(DB_KEY, JSON.stringify(db))
    return true
  },

  async getNotificationPrefs(userId) {
    await sleep(150)
    return { ...DEFAULT_PREFS, ...(readPrefs()[userId] || {}) }
  },

  async updateNotificationPrefs(userId, prefs) {
    await sleep(300)
    const map = readPrefs()
    map[userId] = prefs
    writePrefs(map)
    return prefs
  },
}

// Mock repository — stands in for Firebase Authentication + the `users`,
// `buyers`, `sellers`, `documents` and `approvals` Firestore collections.
//
// Every function here has the exact shape its Firebase counterpart will
// have (`async`, same params, same return shape) so `auth.service.js` can
// swap the import with zero changes anywhere else in the app once a real
// Firebase project is connected.

import { generateRefCode, sleep } from '@/lib/utils'
import { recordAuditEvent } from '@/services/repositories/mockAuditRepository'
import { registerApprovedSeller } from '@/data/sellers'
import { safeSetItem } from '@/lib/safeStorage'

const DB_KEY = 'marketplace_mock_db_v2'
const SESSION_KEY = 'marketplace_mock_session_v1'

// Seed timestamps are relative to "now" (rather than hardcoded calendar
// dates) so the admin dashboard's "last 6 months" charts always have real
// data to plot, regardless of when this prototype is actually demoed.
function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
}

function seedDb() {
  return {
    users: [
      {
        id: 'usr_admin',
        role: 'admin',
        email: 'admin@scrapexchange.io',
        password: 'Admin@123',
        name: 'Priya Nair',
        status: 'approved',
        createdAt: monthsAgo(11),
      },
      {
        id: 'usr_buyer_1',
        role: 'buyer',
        email: 'buyer@demo.com',
        password: 'Buyer@123',
        name: 'Arjun Mehta',
        companyName: 'Meridian Metals Trading LLC',
        status: 'approved',
        createdAt: monthsAgo(5),
      },
      {
        id: 'usr_seller_1',
        role: 'seller',
        email: 'seller@demo.com',
        password: 'Seller@123',
        sellerId: 'slr_gulf_recycling',
        name: 'Fatima Al-Sayed',
        companyName: 'Gulf Recycling Industries',
        status: 'approved',
        createdAt: monthsAgo(5),
      },
      {
        id: 'usr_buyer_pending',
        role: 'buyer',
        email: 'pending@demo.com',
        password: 'Pending@123',
        name: 'Michael Torres',
        companyName: 'Northgate Import Co.',
        status: 'pending',
        createdAt: monthsAgo(2),
      },
      {
        id: 'usr_seller_pending',
        role: 'seller',
        email: 'seller.pending@demo.com',
        password: 'Pending@123',
        name: 'Wei Chen',
        companyName: 'Canton Metals Recovery',
        status: 'pending',
        createdAt: monthsAgo(1),
      },
    ],
    buyers: [
      {
        userId: 'usr_buyer_pending',
        refCode: 'BYR-N0RTH1',
        companyName: 'Northgate Import Co.',
        businessRegNumber: 'BRN-550219',
        vatNumber: 'VAT-991823',
        companyAddress: '220 Harborview Blvd, Houston, TX, USA',
        contactPerson: 'Michael Torres',
        mobile: '+1 713 555 0148',
        status: 'pending',
        submittedAt: monthsAgo(2),
      },
    ],
    sellers: [
      {
        userId: 'usr_seller_pending',
        refCode: 'SLR-CANT0N',
        companyName: 'Canton Metals Recovery',
        businessRegNumber: 'BRN-662104',
        environmentalLicense: 'ENV-88213',
        wasteHandlingLicense: 'WHL-40021',
        companyAddress: 'No. 8 Recycling Road, Guangzhou, China',
        contactPerson: 'Wei Chen',
        mobile: '+86 138 0013 8000',
        status: 'pending',
        submittedAt: monthsAgo(1),
      },
    ],
    documents: [
      {
        userId: 'usr_buyer_pending',
        role: 'buyer',
        files: {
          tradeLicense: { name: 'trade-license.pdf', sizeKb: 340, uploadedAt: monthsAgo(2) },
          vatCertificate: { name: 'vat-certificate.pdf', sizeKb: 210, uploadedAt: monthsAgo(2) },
          companyRegistration: { name: 'company-registration.pdf', sizeKb: 298, uploadedAt: monthsAgo(2) },
        },
      },
      {
        userId: 'usr_seller_pending',
        role: 'seller',
        files: {
          tradeLicense: { name: 'trade-license.pdf', sizeKb: 402, uploadedAt: monthsAgo(1) },
          companyRegistration: { name: 'company-registration.pdf', sizeKb: 315, uploadedAt: monthsAgo(1) },
          environmentalCertificate: { name: 'environmental-certificate.pdf', sizeKb: 388, uploadedAt: monthsAgo(1) },
        },
      },
    ],
    approvals: [
      {
        id: 'apr_seed_buyer',
        userId: 'usr_buyer_pending',
        role: 'buyer',
        companyName: 'Northgate Import Co.',
        status: 'pending',
        requestedAt: monthsAgo(2),
      },
      {
        id: 'apr_seed_seller',
        userId: 'usr_seller_pending',
        role: 'seller',
        companyName: 'Canton Metals Recovery',
        status: 'pending',
        requestedAt: monthsAgo(1),
      },
    ],
  }
}

function readDb() {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) {
    const seeded = seedDb()
    safeSetItem(DB_KEY, JSON.stringify(seeded))
    return seeded
  }
  return JSON.parse(raw)
}

function writeDb(db) {
  safeSetItem(DB_KEY, JSON.stringify(db))
}

function toPublicUser(user) {
  if (!user) return null
  // eslint-disable-next-line no-unused-vars
  const { password, ...publicUser } = user
  return publicUser
}

export const mockAuthRepository = {
  async login(email, password) {
    await sleep(500)
    const db = readDb()
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!user || user.password !== password) {
      const err = new Error('Invalid email or password.')
      err.code = 'auth/invalid-credentials'
      throw err
    }
    if (user.status === 'pending') {
      const err = new Error('Your account is awaiting admin approval.')
      err.code = 'auth/pending-approval'
      throw err
    }
    if (user.status === 'rejected') {
      const err = new Error('Your registration was rejected. Contact support for details.')
      err.code = 'auth/rejected'
      throw err
    }
    if (user.status === 'suspended') {
      const err = new Error('Your account has been suspended. Contact your account manager.')
      err.code = 'auth/suspended'
      throw err
    }
    safeSetItem(SESSION_KEY, JSON.stringify({ userId: user.id }))
    recordAuditEvent({ actor: user.name, role: user.role, action: 'Logged in', target: null, category: 'login' })
    return toPublicUser(user)
  },

  async logout() {
    await sleep(150)
    localStorage.removeItem(SESSION_KEY)
  },

  async getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!session) return null
    const db = readDb()
    const user = db.users.find((u) => u.id === session.userId)
    return toPublicUser(user)
  },

  async registerBuyer(payload) {
    await sleep(700)
    const db = readDb()
    if (db.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      const err = new Error('An account with this email already exists.')
      err.code = 'auth/email-in-use'
      throw err
    }
    const id = `usr_${generateRefCode('BYR').toLowerCase()}`
    const refCode = generateRefCode('BYR')
    const user = {
      id,
      role: 'buyer',
      email: payload.email,
      password: payload.password,
      name: payload.contactPerson,
      companyName: payload.companyName,
      status: 'pending',
      refCode,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    db.buyers.push({
      userId: id,
      refCode,
      companyName: payload.companyName,
      businessRegNumber: payload.businessRegNumber,
      vatNumber: payload.vatNumber,
      companyAddress: payload.companyAddress,
      contactPerson: payload.contactPerson,
      mobile: payload.mobile,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    })
    db.documents.push({
      userId: id,
      role: 'buyer',
      files: payload.documents || [],
    })
    db.approvals.push({
      id: `apr_${generateRefCode().toLowerCase()}`,
      userId: id,
      role: 'buyer',
      companyName: payload.companyName,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    })
    writeDb(db)
    return { refCode, id }
  },

  async registerSeller(payload) {
    await sleep(700)
    const db = readDb()
    if (db.users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      const err = new Error('An account with this email already exists.')
      err.code = 'auth/email-in-use'
      throw err
    }
    const id = `usr_${generateRefCode('SLR').toLowerCase()}`
    const refCode = generateRefCode('SLR')
    const user = {
      id,
      role: 'seller',
      email: payload.email,
      password: payload.password,
      name: payload.contactPerson,
      companyName: payload.companyName,
      status: 'pending',
      refCode,
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)
    db.sellers.push({
      userId: id,
      refCode,
      companyName: payload.companyName,
      businessRegNumber: payload.businessRegNumber,
      environmentalLicense: payload.environmentalLicense,
      wasteHandlingLicense: payload.wasteHandlingLicense,
      companyAddress: payload.companyAddress,
      contactPerson: payload.contactPerson,
      mobile: payload.mobile,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    })
    db.documents.push({
      userId: id,
      role: 'seller',
      files: payload.documents || [],
    })
    db.approvals.push({
      id: `apr_${generateRefCode().toLowerCase()}`,
      userId: id,
      role: 'seller',
      companyName: payload.companyName,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    })
    writeDb(db)
    return { refCode, id }
  },

  // --- Admin: approvals & user management ---

  async listApprovals({ role, status } = {}) {
    await sleep(350)
    const db = readDb()
    let rows = db.approvals.map((a) => {
      const user = db.users.find((u) => u.id === a.userId)
      const profile = a.role === 'buyer'
        ? db.buyers.find((b) => b.userId === a.userId)
        : db.sellers.find((s) => s.userId === a.userId)
      const docs = db.documents.find((d) => d.userId === a.userId)
      return { ...a, status: user?.status || a.status, user, profile, documents: docs?.files || [] }
    })
    if (role) rows = rows.filter((r) => r.role === role)
    if (status) rows = rows.filter((r) => r.status === status)
    return rows.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
  },

  async approveUser(userId, adminName = 'Admin') {
    await sleep(500)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new Error('Account not found')
    user.status = 'approved'
    const approval = db.approvals.find((a) => a.userId === userId)
    if (approval) approval.status = 'approved'

    if (user.role === 'seller') {
      const seller = db.sellers.find((s) => s.userId === userId)
      if (!user.sellerId) user.sellerId = `slr_${generateRefCode().toLowerCase().replace('ref-', '')}`
      registerApprovedSeller({
        id: user.sellerId,
        companyName: seller?.companyName || user.companyName,
        location: seller?.companyAddress,
      })
    }

    writeDb(db)
    recordAuditEvent({ actor: adminName, role: 'admin', action: `Approved ${user.role}`, target: user.companyName || user.name, category: 'approval' })
    return toPublicUser(user)
  },

  async rejectUser(userId, reason, adminName = 'Admin') {
    await sleep(500)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new Error('Account not found')
    user.status = 'rejected'
    user.rejectionReason = reason || 'Did not meet verification requirements.'
    const approval = db.approvals.find((a) => a.userId === userId)
    if (approval) approval.status = 'rejected'
    writeDb(db)
    recordAuditEvent({ actor: adminName, role: 'admin', action: `Rejected ${user.role}`, target: user.companyName || user.name, category: 'approval' })
    return toPublicUser(user)
  },

  async requestMoreDocuments(userId, note, adminName = 'Admin') {
    await sleep(400)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new Error('Account not found')
    user.moreDocsRequested = true
    user.moreDocsNote = note
    writeDb(db)
    recordAuditEvent({ actor: adminName, role: 'admin', action: 'Requested additional documents', target: user.companyName || user.name, category: 'approval' })
    return toPublicUser(user)
  },

  async suspendUser(userId, adminName = 'Admin') {
    await sleep(400)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new Error('Account not found')
    user.status = 'suspended'
    writeDb(db)
    recordAuditEvent({ actor: adminName, role: 'admin', action: `Suspended ${user.role}`, target: user.companyName || user.name, category: 'user' })
    return toPublicUser(user)
  },

  async activateUser(userId, adminName = 'Admin') {
    await sleep(400)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new Error('Account not found')
    user.status = 'approved'
    writeDb(db)
    recordAuditEvent({ actor: adminName, role: 'admin', action: `Activated ${user.role}`, target: user.companyName || user.name, category: 'user' })
    return toPublicUser(user)
  },

  async resetUserPassword(userId, adminName = 'Admin') {
    await sleep(500)
    const db = readDb()
    const user = db.users.find((u) => u.id === userId)
    if (!user) throw new Error('Account not found')
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 8)}!`
    user.password = tempPassword
    writeDb(db)
    recordAuditEvent({ actor: adminName, role: 'admin', action: 'Reset password', target: user.companyName || user.name, category: 'user' })
    return tempPassword
  },

  async listAllUsers() {
    await sleep(350)
    const db = readDb()
    return db.users.map(toPublicUser)
  },
}

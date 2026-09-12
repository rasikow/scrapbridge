import { USE_FIREBASE } from '@/lib/firebase'
import { mockAuthRepository } from '@/services/repositories/mockAuthRepository'

// When a real Firebase project is connected, add
// `src/services/repositories/firebaseAuthRepository.js` implementing the
// same method signatures (login, logout, getCurrentUser, registerBuyer,
// registerSeller) against Firebase Auth + Firestore, then swap the import
// below. Nothing else in the app needs to change.

const repository = USE_FIREBASE ? mockAuthRepository : mockAuthRepository

export const authService = {
  login: (email, password) => repository.login(email, password),
  logout: () => repository.logout(),
  getCurrentUser: () => repository.getCurrentUser(),
  registerBuyer: (payload) => repository.registerBuyer(payload),
  registerSeller: (payload) => repository.registerSeller(payload),
}

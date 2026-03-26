import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Creates a new device-owner account with email/password auth.
 */
export async function registerDeviceOwner(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return {
    uid: credential.user.uid,
    email: credential.user.email,
  };
}

/**
 * Logs in an existing device owner.
 */
export async function loginDeviceOwner(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return {
    uid: credential.user.uid,
    email: credential.user.email,
  };
}

/**
 * Returns the currently authenticated owner's UID or null.
 */
export function getCurrentOwnerUid() {
  return auth.currentUser?.uid ?? null;
}

export async function logoutDeviceOwner() {
  await signOut(auth);
}

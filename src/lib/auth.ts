/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Usuario, UserRole } from '../types';

/**
 * Creates/Updates the user profile document in Firestore post-authentication.
 *
 * SECURITY: This function intentionally never persists passwords. Credentials are
 * handled exclusively by Firebase Authentication, which stores them hashed/salted.
 */
export async function createOrUpdateUserDocument(uid: string, email: string, nome: string, role: UserRole, telefone?: string): Promise<Usuario> {
  const userRef = doc(db, 'usuarios', uid);
  const userDoc: Record<string, any> = {
    uid,
    email,
    nome,
    role,
    criadoEm: serverTimestamp()
  };
  if (telefone) {
    userDoc.telefone = telefone;
  }

  try {
    await setDoc(userRef, userDoc);
    return { ...userDoc, criadoEm: new Date().toISOString() } as Usuario;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `usuarios/${uid}`);
    throw error;
  }
}

/**
 * Retrieves the user profile document from Firestore.
 */
export async function getUserProfile(uid: string): Promise<Usuario | null> {
  const userRef = doc(db, 'usuarios', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as Usuario;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usuarios/${uid}`);
    throw error;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging, Messaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Database ID (Required for correct routing)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Messaging (FCM) safely with fallback support for iframe and non-supporting environments
let messagingInstance: Messaging | null = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
    messagingInstance = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Cloud Messaging client initialization is skipped or unsupported on this browser/sandbox: ', error);
}

export const messaging = messagingInstance;


// Operational types for structured Firestore error handling (System Diagnosis requirement)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  isSignedIn: boolean;
}

/**
 * Custom error handler to catch and report Firestore-level permission or layout issues.
 *
 * SECURITY: This handler intentionally does NOT include personally identifiable
 * information (email, uid, provider data) in the message it throws/logs, since that
 * message can surface in the UI or in logs. Only non-sensitive diagnostics are kept.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    isSignedIn: auth.currentUser != null
  };
  console.error('Firestore Error:', errInfo);
  throw new Error(`Falha na operação "${operationType}"${path ? ` em ${path}` : ''}. Verifique sua conexão e permissões.`);
}

// Perform mandatory server validation check on boot
async function validateFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      // Ignored for normal initialization when path test document is simply empty or not found
    }
  }
}

validateFirestoreConnection();

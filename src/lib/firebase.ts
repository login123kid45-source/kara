import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App, Firestore, and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

// Google Workspace OAuth Scopes configured via set_up_oauth (used only if user connects Workspace Hub)
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/contacts.readonly',
];

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

let cachedAccessToken: string | null = null;

// Local Email & Password session storage keys (used when Firebase Console Email/Password provider is not yet enabled)
const EMAIL_ACCOUNTS_STORAGE_KEY = 'kara_email_accounts_v2';
const ACTIVE_EMAIL_SESSION_KEY = 'kara_active_email_session_v2';

export interface StoredEmailAccount {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: number;
}

type AuthChangeCallback = (user: User | null, token: string | null) => void;
const authListeners = new Set<AuthChangeCallback>();

function hashPassword(email: string, password: string): string {
  const raw = `${email.toLowerCase().trim()}::${password}`;
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `kh_${(h >>> 0).toString(16)}`;
}

function deterministicUidFromEmail(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').slice(0, 48);
  return `usr_${clean || 'account'}`;
}

function getStoredEmailAccounts(): Record<string, StoredEmailAccount> {
  try {
    const raw = localStorage.getItem(EMAIL_ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredEmailAccounts(accounts: Record<string, StoredEmailAccount>) {
  try {
    localStorage.setItem(EMAIL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

function getActiveFallbackSession(): User | null {
  try {
    const raw = localStorage.getItem(ACTIVE_EMAIL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.uid || !parsed.email) return null;
    return parsed as User;
  } catch {
    return null;
  }
}

function setActiveFallbackSession(account: StoredEmailAccount | null): User | null {
  try {
    if (!account) {
      localStorage.removeItem(ACTIVE_EMAIL_SESSION_KEY);
      return null;
    }
    const syntheticUser = {
      uid: account.uid,
      email: account.email,
      displayName: account.displayName,
      emailVerified: true,
      isAnonymous: false,
      providerData: [{ providerId: 'password', email: account.email }],
    } as unknown as User;
    localStorage.setItem(ACTIVE_EMAIL_SESSION_KEY, JSON.stringify(syntheticUser));
    return syntheticUser;
  } catch {
    return null;
  }
}

function notifyAuthListeners(user: User | null) {
  authListeners.forEach((cb) => cb(user, cachedAccessToken));
}

export function isFirebaseCloudUser(): boolean {
  return Boolean(auth.currentUser);
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Structured Firestore Error Handler
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
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth Lifecycle Helpers
export const initAuth = (onAuthChange: AuthChangeCallback) => {
  authListeners.add(onAuthChange);

  const unsubFirebase = onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      onAuthChange(firebaseUser, cachedAccessToken);
    } else {
      const fallbackUser = getActiveFallbackSession();
      if (fallbackUser) {
        onAuthChange(fallbackUser, null);
      } else {
        cachedAccessToken = null;
        onAuthChange(null, null);
      }
    }
  });

  return () => {
    authListeners.delete(onAuthChange);
    unsubFirebase();
  };
};

// Local fallback authenticator when Firebase Email/Password provider is not yet enabled in console
function authenticateLocalEmailAccount(
  email: string,
  password: string,
  displayName?: string,
  mode: 'signin' | 'signup' = 'signin'
): User {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getStoredEmailAccounts();
  const existing = accounts[cleanEmail];
  const expectedHash = hashPassword(cleanEmail, password);

  if (existing) {
    if (existing.passwordHash !== expectedHash) {
      const err: any = new Error('Incorrect password for this email address.');
      err.code = 'auth/wrong-password';
      throw err;
    }
    if (displayName && displayName.trim()) {
      existing.displayName = displayName.trim().slice(0, 80);
      accounts[cleanEmail] = existing;
      saveStoredEmailAccounts(accounts);
    }
    const userObj = setActiveFallbackSession(existing)!;
    notifyAuthListeners(userObj);
    return userObj;
  }

  // Create new account seamlessly (even if user clicked Sign In on their first visit)
  const fallbackName = (displayName || cleanEmail.split('@')[0] || 'Explorer')
    .trim()
    .slice(0, 80);
  const newAccount: StoredEmailAccount = {
    uid: deterministicUidFromEmail(cleanEmail),
    email: cleanEmail,
    passwordHash: expectedHash,
    displayName: fallbackName,
    createdAt: Date.now(),
  };
  accounts[cleanEmail] = newAccount;
  saveStoredEmailAccounts(accounts);
  const userObj = setActiveFallbackSession(newAccount)!;
  notifyAuthListeners(userObj);
  return userObj;
}

export const emailPasswordSignIn = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  const cleanEmail = email.trim();
  try {
    const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
    setActiveFallbackSession(null);
    return result.user;
  } catch (err: any) {
    const code = err?.code || '';
    // If account doesn't exist yet in Firebase, try creating it automatically so first-time login works seamlessly
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      try {
        const created = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const nameToUse = (displayName || cleanEmail.split('@')[0] || 'Explorer')
          .trim()
          .slice(0, 80);
        await updateProfile(created.user, { displayName: nameToUse });
        setActiveFallbackSession(null);
        return created.user;
      } catch (createErr: any) {
        const createCode = createErr?.code || '';
        if (
          createCode === 'auth/operation-not-allowed' ||
          createCode === 'auth/configuration-not-found' ||
          createCode === 'auth/network-request-failed'
        ) {
          return authenticateLocalEmailAccount(cleanEmail, password, displayName, 'signin');
        }
        if (createCode === 'auth/email-already-in-use') {
          throw err; // Wrong password for existing Firebase account
        }
      }
    }

    // If Email/Password provider is not yet toggled in Firebase Console, seamlessly authenticate via persistent local account
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/configuration-not-found' ||
      code === 'auth/network-request-failed' ||
      code === 'auth/internal-error'
    ) {
      return authenticateLocalEmailAccount(cleanEmail, password, displayName, 'signin');
    }

    throw err;
  }
};

export const emailPasswordSignUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const cleanEmail = email.trim();
  const cleanName = (displayName || cleanEmail.split('@')[0] || 'Explorer')
    .trim()
    .slice(0, 80);

  try {
    const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (cleanName) {
      await updateProfile(result.user, { displayName: cleanName });
    }
    setActiveFallbackSession(null);
    return result.user;
  } catch (err: any) {
    const code = err?.code || '';
    // If email is already registered in Firebase, try signing them in directly with their password
    if (code === 'auth/email-already-in-use') {
      const signedIn = await signInWithEmailAndPassword(auth, cleanEmail, password);
      setActiveFallbackSession(null);
      return signedIn.user;
    }

    // If Email/Password provider is not yet enabled in Firebase Console, register & sign in seamlessly
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/configuration-not-found' ||
      code === 'auth/network-request-failed' ||
      code === 'auth/internal-error'
    ) {
      return authenticateLocalEmailAccount(cleanEmail, password, cleanName, 'signup');
    }

    throw err;
  }
};

// Optional Google Workspace OAuth helper for Workspace Hub (Drive/Gmail/Calendar/Contacts)
export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string | null;
} | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Workspace OAuth error:', error);
    throw error;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  setActiveFallbackSession(null);
  cachedAccessToken = null;
  try {
    await auth.signOut();
  } catch {}
  notifyAuthListeners(null);
};

// Validation Constants synchronized with firebase-blueprint.json
export type KaraMode = 'regular' | 'bratty' | 'uncensored' | 'romantic' | 'parent';
export type MemoryCategory = 'preference' | 'fact' | 'emotion' | 'bond';

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const VALID_MODES: KaraMode[] = ['regular', 'bratty', 'uncensored', 'romantic', 'parent'];
const VALID_CATEGORIES: MemoryCategory[] = ['preference', 'fact', 'emotion', 'bond'];

export function sanitizeId(id: string): string {
  const cleaned = id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export interface UserProfileData {
  uid: string;
  displayName: string;
  preferredMode: KaraMode;
  autoAdaptMode: boolean;
  soapWashCount: number;
  bondLevel: number;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

export interface MemoryItemData {
  id: string;
  userId: string;
  category: MemoryCategory;
  content: string;
  importance: number;
  createdAt?: Timestamp | any;
}

export interface ChatMessageData {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  mode: KaraMode;
  emotionDetected: string;
  soapTriggered: boolean;
  createdAt?: Timestamp | any;
}

export interface SoapIncidentData {
  id: string;
  userId: string;
  offendingWord: string;
  scoldingMessage: string;
  resolved: boolean;
  createdAt?: Timestamp | any;
  updatedAt?: Timestamp | any;
}

// Local storage helpers for accounts when Firebase Console Email/Password is not enabled yet
export function loadLocalAccountData<T>(uid: string, collectionKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`kara_${collectionKey}_${sanitizeId(uid)}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalAccountData<T>(uid: string, collectionKey: string, data: T) {
  try {
    localStorage.setItem(`kara_${collectionKey}_${sanitizeId(uid)}`, JSON.stringify(data));
  } catch {}
}

// Ensure UserProfile exists in Firestore (or local account storage if fallback session)
export async function ensureUserProfile(
  user: User,
  overrideDisplayName?: string
): Promise<UserProfileData> {
  const uid = sanitizeId(user.uid);
  const emailPrefix = user.email ? user.email.split('@')[0] : 'Friend';
  const displayName =
    (overrideDisplayName || user.displayName || emailPrefix || 'Friend')
      .trim()
      .slice(0, 80) || 'Friend';

  if (!auth.currentUser) {
    const existingLocal = loadLocalAccountData<UserProfileData | null>(uid, 'profile', null);
    if (existingLocal) {
      if (overrideDisplayName && overrideDisplayName.trim()) {
        existingLocal.displayName = displayName;
        saveLocalAccountData(uid, 'profile', existingLocal);
      }
      return existingLocal;
    }
    const localProfile: UserProfileData = {
      uid,
      displayName,
      preferredMode: 'regular',
      autoAdaptMode: true,
      soapWashCount: 0,
      bondLevel: 16,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveLocalAccountData(uid, 'profile', localProfile);
    return localProfile;
  }

  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const newProfile = {
    uid,
    displayName,
    preferredMode: 'regular' as KaraMode,
    autoAdaptMode: true,
    soapWashCount: 0,
    bondLevel: 12,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserProfileFields(
  uid: string,
  updates: Partial<
    Pick<
      UserProfileData,
      'displayName' | 'preferredMode' | 'autoAdaptMode' | 'soapWashCount' | 'bondLevel'
    >
  >
) {
  const safeUid = sanitizeId(uid);

  if (!auth.currentUser) {
    const current = loadLocalAccountData<UserProfileData>(safeUid, 'profile', {
      uid: safeUid,
      displayName: 'Explorer',
      preferredMode: 'regular',
      autoAdaptMode: true,
      soapWashCount: 0,
      bondLevel: 16,
    });
    const merged: UserProfileData = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    saveLocalAccountData(safeUid, 'profile', merged);
    return;
  }

  const path = `users/${safeUid}`;
  const payload: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (updates.displayName !== undefined) {
    payload.displayName = updates.displayName.trim().slice(0, 80) || 'Friend';
  }
  if (updates.preferredMode !== undefined && VALID_MODES.includes(updates.preferredMode)) {
    payload.preferredMode = updates.preferredMode;
  }
  if (updates.autoAdaptMode !== undefined) {
    payload.autoAdaptMode = Boolean(updates.autoAdaptMode);
  }
  if (updates.soapWashCount !== undefined) {
    payload.soapWashCount = Math.max(0, Math.min(100000, Math.floor(updates.soapWashCount)));
  }
  if (updates.bondLevel !== undefined) {
    payload.bondLevel = Math.max(0, Math.min(100, Math.floor(updates.bondLevel)));
  }

  try {
    await updateDoc(doc(db, 'users', safeUid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveChatMessage(
  uid: string,
  msg: Omit<ChatMessageData, 'id' | 'userId' | 'createdAt'> & { id?: string }
) {
  const safeUid = sanitizeId(uid);
  const msgId = sanitizeId(
    msg.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  if (!VALID_ID_REGEX.test(msgId)) return;

  if (!auth.currentUser) {
    const list = loadLocalAccountData<ChatMessageData[]>(safeUid, 'messages', []);
    const newEntry: ChatMessageData = {
      id: msgId,
      userId: safeUid,
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: (msg.content || '...').trim().slice(0, 8000) || '...',
      mode: VALID_MODES.includes(msg.mode) ? msg.mode : 'regular',
      emotionDetected: (msg.emotionDetected || 'Neutral').trim().slice(0, 40) || 'Neutral',
      soapTriggered: Boolean(msg.soapTriggered),
      createdAt: Date.now(),
    };
    const existingIdx = list.findIndex((m) => m.id === msgId);
    if (existingIdx >= 0) {
      list[existingIdx] = newEntry;
    } else {
      list.push(newEntry);
    }
    saveLocalAccountData(safeUid, 'messages', list.slice(-80));
    return;
  }

  const path = `users/${safeUid}/messages/${msgId}`;
  const payload = {
    id: msgId,
    userId: safeUid,
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: (msg.content || '...').trim().slice(0, 8000) || '...',
    mode: VALID_MODES.includes(msg.mode) ? msg.mode : 'regular',
    emotionDetected: (msg.emotionDetected || 'Neutral').trim().slice(0, 40) || 'Neutral',
    soapTriggered: Boolean(msg.soapTriggered),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', safeUid, 'messages', msgId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteChatMessage(uid: string, msgId: string) {
  const safeUid = sanitizeId(uid);
  const safeMsgId = sanitizeId(msgId);

  if (!auth.currentUser) {
    const list = loadLocalAccountData<ChatMessageData[]>(safeUid, 'messages', []);
    saveLocalAccountData(
      safeUid,
      'messages',
      list.filter((m) => m.id !== safeMsgId)
    );
    return;
  }

  const path = `users/${safeUid}/messages/${safeMsgId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'messages', safeMsgId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMemoryItem(
  uid: string,
  memory: { category: MemoryCategory; content: string; importance: number }
) {
  const safeUid = sanitizeId(uid);
  const memId = sanitizeId(
    `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );

  if (!auth.currentUser) {
    const list = loadLocalAccountData<MemoryItemData[]>(safeUid, 'memories', []);
    const entry: MemoryItemData = {
      id: memId,
      userId: safeUid,
      category: VALID_CATEGORIES.includes(memory.category) ? memory.category : 'fact',
      content: memory.content.trim().slice(0, 500) || 'User preference noted.',
      importance: Math.max(1, Math.min(5, Math.floor(memory.importance || 3))),
      createdAt: Date.now(),
    };
    saveLocalAccountData(safeUid, 'memories', [entry, ...list].slice(0, 60));
    return entry;
  }

  const path = `users/${safeUid}/memories/${memId}`;
  const payload = {
    id: memId,
    userId: safeUid,
    category: VALID_CATEGORIES.includes(memory.category) ? memory.category : 'fact',
    content: memory.content.trim().slice(0, 500) || 'User preference noted.',
    importance: Math.max(1, Math.min(5, Math.floor(memory.importance || 3))),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', safeUid, 'memories', memId), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteMemoryItem(uid: string, memoryId: string) {
  const safeUid = sanitizeId(uid);
  const safeMemId = sanitizeId(memoryId);

  if (!auth.currentUser) {
    const list = loadLocalAccountData<MemoryItemData[]>(safeUid, 'memories', []);
    saveLocalAccountData(
      safeUid,
      'memories',
      list.filter((m) => m.id !== safeMemId)
    );
    return;
  }

  const path = `users/${safeUid}/memories/${safeMemId}`;
  try {
    await deleteDoc(doc(db, 'users', safeUid, 'memories', safeMemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createSoapIncident(
  uid: string,
  offendingWord: string,
  scoldingMessage: string
): Promise<string> {
  const safeUid = sanitizeId(uid);
  const incidentId = sanitizeId(`soap_${Date.now()}`);

  if (!auth.currentUser) {
    return incidentId;
  }

  const path = `users/${safeUid}/soapIncidents/${incidentId}`;
  const payload = {
    id: incidentId,
    userId: safeUid,
    offendingWord: (offendingWord || 'foul word').trim().slice(0, 64) || 'foul word',
    scoldingMessage:
      (scoldingMessage || 'Time to wash your mouth out with soap!').trim().slice(0, 600) ||
      'Time to wash your mouth out with soap!',
    resolved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', safeUid, 'soapIncidents', incidentId), payload);
    return incidentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveSoapIncident(uid: string, incidentId: string) {
  const safeUid = sanitizeId(uid);
  const safeIncidentId = sanitizeId(incidentId);
  if (!auth.currentUser) return;

  const path = `users/${safeUid}/soapIncidents/${safeIncidentId}`;
  try {
    await updateDoc(doc(db, 'users', safeUid, 'soapIncidents', safeIncidentId), {
      resolved: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export { collection, query, where, orderBy, limit, onSnapshot, doc };

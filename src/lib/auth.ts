import { db, type User } from './db';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function hashWithWebCrypto(password: string, salt: string): Promise<string | null> {
  try {
    const encoder = new TextEncoder();
    const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await crypto.subtle.exportKey('raw', key);
    const hashArray = Array.from(new Uint8Array(exported));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return salt + ':' + hashHex;
  } catch {
    return null;
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const result = await hashWithWebCrypto(password, salt);
    if (result) return result;
  }
  const hash = simpleHash(salt + password);
  return salt + ':' + hash;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length < 2) return false;
  const saltHex = parts[0];
  const hashHex = parts[1];
  if (!saltHex || !hashHex) return false;

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const integrityCheck = await hashWithWebCrypto(password, saltHex);
    if (integrityCheck) {
      const computedHash = integrityCheck.split(':')[1];
      return computedHash === hashHex;
    }
  }

  return simpleHash(saltHex + password) === hashHex;
}

export async function loginLocal(email: string, password: string): Promise<User | null> {
  const user = await db.users.where('email').equals(email.toLowerCase()).first();
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  return valid ? user : null;
}

export async function signupLocal(email: string, password: string, displayName: string): Promise<User> {
  const existing = await db.users.where('email').equals(email.toLowerCase()).first();
  if (existing) throw new Error('Email ja cadastrado');
  const hash = await hashPassword(password);
  const user: User = {
    id: generateId(),
    email: email.toLowerCase(),
    password_hash: hash,
    display_name: displayName,
    created_at: new Date().toISOString(),
  };
  await db.users.add(user);
  return user;
}

export async function updatePasswordLocal(userId: string, newPassword: string): Promise<void> {
  const hash = await hashPassword(newPassword);
  await db.users.update(userId, { password_hash: hash });
}

export async function updateDisplayNameLocal(userId: string, name: string): Promise<void> {
  await db.users.update(userId, { display_name: name });
}

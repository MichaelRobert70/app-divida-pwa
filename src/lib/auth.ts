import { db, type User } from './db';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  const hashArray = Array.from(new Uint8Array(exported));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await crypto.subtle.exportKey('raw', key);
  const hashArray = Array.from(new Uint8Array(exported));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hashHex;
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
    id: crypto.randomUUID(),
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

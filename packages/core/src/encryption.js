const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const getPasswordKey = async (password) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('primer-encryption-salt'),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
};

const deriveKey = async (password, salt) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptData = async (data, password) => {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  const encryptedPackage = {
    v: 1,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(ciphertext),
  };

  return JSON.stringify(encryptedPackage);
};

export const decryptData = async (encryptedString, password) => {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  let encryptedPackage;
  try {
    encryptedPackage = JSON.parse(encryptedString);
  } catch {
    throw new Error('Invalid encrypted data format');
  }

  if (encryptedPackage.v !== 1) {
    throw new Error('Unsupported encryption version');
  }

  const salt = base64ToArrayBuffer(encryptedPackage.salt);
  const iv = base64ToArrayBuffer(encryptedPackage.iv);
  const ciphertext = base64ToArrayBuffer(encryptedPackage.data);

  const key = await deriveKey(password, new Uint8Array(salt));

  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      ciphertext
    );
  } catch {
    throw new Error('Decryption failed - invalid password or corrupted data');
  }

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext));
};

export const encryptForExport = async (data, password) => {
  const encrypted = await encryptData(data, password);
  const encoded = btoa(encrypted);
  return `PRIMER-V1:${encoded}`;
};

export const decryptFromImport = async (exportString, password) => {
  const prefix = 'PRIMER-V1:';
  if (!exportString.startsWith(prefix)) {
    throw new Error('Not an encrypted export - plain JSON detected');
  }
  const encoded = exportString.slice(prefix.length);
  const encrypted = atob(encoded);
  return decryptData(encrypted, password);
};

export const isEncryptedExport = (data) => {
  if (typeof data !== 'string') return false;
  return data.trim().startsWith('PRIMER-V1:');
};
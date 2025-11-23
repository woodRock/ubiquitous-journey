// src/lib/crypto.ts

// Generate a new RSA-OAEP key pair
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export a CryptoKey to a string
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

// Import a public key from a string
export async function importPublicKey(keyStr: string): Promise<CryptoKey> {
  const keyJwk = JSON.parse(keyStr);
  return await crypto.subtle.importKey(
    'jwk',
    keyJwk,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

// Encrypt a message with a public key
export async function encryptMessage(
  publicKey: CryptoKey,
  message: string
): Promise<ArrayBuffer> {
  const encodedMessage = new TextEncoder().encode(message);
  return await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    encodedMessage
  );
}

// Decrypt a message with a private key
export async function decryptMessage(
  privateKey: CryptoKey,
  ciphertext: ArrayBuffer
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

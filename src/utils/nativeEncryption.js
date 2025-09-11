class NativeEncryption {
  
  // Generate RSA key pair for user
  static async generateUserKeyPair() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );
      
      return keyPair;
    } catch (error) {
      console.error('Error generating RSA key pair:', error);
      throw new Error('Failed to generate encryption keys');
    }
  }

  // Export public key to base64 format
  static async exportPublicKey(publicKey) {
    try {
      const exported = await window.crypto.subtle.exportKey("spki", publicKey);
      const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
      return exportedAsBase64;
    } catch (error) {
      console.error('Error exporting public key:', error);
      throw new Error('Failed to export public key');
    }
  }

  // Import public key from base64
  static async importPublicKey(base64Key) {
    try {
      const binaryKey = Uint8Array.from(atob(base64Key), char => char.charCodeAt(0));
      const publicKey = await window.crypto.subtle.importKey(
        "spki",
        binaryKey,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        true,
        ["encrypt"]
      );
      return publicKey;
    } catch (error) {
      console.error('Error importing public key:', error);
      throw new Error('Failed to import public key');
    }
  }

  // Generate AES key for conversation
  static async generateConversationKey() {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );
      return key;
    } catch (error) {
      console.error('Error generating AES key:', error);
      throw new Error('Failed to generate conversation key');
    }
  }

  // Export AES key to raw format
  static async exportAESKey(aesKey) {
    try {
      const exported = await window.crypto.subtle.exportKey("raw", aesKey);
      return new Uint8Array(exported);
    } catch (error) {
      console.error('Error exporting AES key:', error);
      throw new Error('Failed to export AES key');
    }
  }

  // Import AES key from raw bytes
  static async importAESKey(keyBytes) {
    try {
      const key = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
      );
      return key;
    } catch (error) {
      console.error('Error importing AES key:', error);
      throw new Error('Failed to import AES key');
    }
  }

  // Encrypt AES key with RSA public key
  static async encryptKeyForUser(aesKey, publicKey) {
    try {
      const keyData = await this.exportAESKey(aesKey);
      const encrypted = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        keyData
      );
      return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    } catch (error) {
      console.error('Error encrypting key for user:', error);
      throw new Error('Failed to encrypt key for user');
    }
  }

  // Decrypt AES key with RSA private key
  static async decryptKeyFromUser(encryptedKeyBase64, privateKey) {
    try {
      const encryptedKey = Uint8Array.from(atob(encryptedKeyBase64), char => char.charCodeAt(0));
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedKey
      );
      return await this.importAESKey(new Uint8Array(decrypted));
    } catch (error) {
      console.error('Error decrypting key from user:', error);
      throw new Error('Failed to decrypt conversation key');
    }
  }

  // Encrypt message with AES
  static async encryptMessage(message, aesKey) {
    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedMessage = new TextEncoder().encode(message);
      
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKey,
        encodedMessage
      );

      return {
        encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv)),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt message with AES
  static async decryptMessage(encryptedData, ivBase64, aesKey) {
    try {
      const encrypted = Uint8Array.from(atob(encryptedData), char => char.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivBase64), char => char.charCodeAt(0));
      
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Generate private key fingerprint (for verification)
  static async generateKeyFingerprint(privateKey) {
    try {
      const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
      const hash = await window.crypto.subtle.digest("SHA-256", exported);
      const hashArray = Array.from(new Uint8Array(hash));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch (error) {
      console.error('Error generating key fingerprint:', error);
      return null;
    }
  }
}

export default NativeEncryption;
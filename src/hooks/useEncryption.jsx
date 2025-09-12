import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useEncryption(user) {
  const [isKeysReady, setIsKeysReady] = useState(false);
  const [userKeyPair, setUserKeyPair] = useState(null);
  const [encryptionReady, setEncryptionReady] = useState(false);

  // Helper functions for crypto operations
  const exportPublicKey = async (publicKey) => {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  };

  const exportPrivateKey = async (privateKey) => {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  };

  const importPublicKey = async (keyString) => {
    const keyData = new Uint8Array(
      atob(keyString).split('').map(char => char.charCodeAt(0))
    );
    return await crypto.subtle.importKey(
      'spki',
      keyData,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  };

  const importPrivateKey = async (keyString) => {
    const keyData = new Uint8Array(
      atob(keyString).split('').map(char => char.charCodeAt(0))
    );
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    );
  };

  const generateConversationKey = async () => {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const encryptKeyForUser = async (aesKey, publicKey) => {
    const exported = await crypto.subtle.exportKey('raw', aesKey);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      exported
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  };

  const decryptKeyFromUser = async (encryptedKeyString, privateKey) => {
    const encryptedData = new Uint8Array(
      atob(encryptedKeyString).split('').map(char => char.charCodeAt(0))
    );
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedData
    );
    return await crypto.subtle.importKey(
      'raw',
      decrypted,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  };

  // Initialize user keys function
  const initializeUserKeys = useCallback(async () => {
    if (!user?.id) {
      console.log('No user provided to initialize keys');
      return;
    }

    try {
      console.log(' Generating new keys for existing user...');
      
      // Check if user already has keys in the database
      const { data: existingKeys, error: fetchError } = await supabase
        .from('user_encryption_keys')
        .select('public_key, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing keys:', fetchError);
        // Don't throw, continue with local keys
      }

      let keyPair;

      if (existingKeys?.public_key) {
        // Try to get keys from localStorage
        const storedPrivateKey = localStorage.getItem(`privateKey_${user.id}`);
        
        if (storedPrivateKey) {
          try {
            const privateKey = await importPrivateKey(storedPrivateKey);
            const publicKey = await importPublicKey(existingKeys.public_key);
            
            keyPair = { privateKey, publicKey };
            console.log('Restored existing keys from localStorage');
          } catch (importError) {
            console.warn('Failed to restore keys from localStorage:', importError);
            keyPair = null;
          }
        }
      }

      if (!keyPair) {
        // Generate new RSA key pair
        console.log(' Generating RSA key pair...');
        keyPair = await crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['encrypt', 'decrypt']
        );
        
        const publicKeyString = await exportPublicKey(keyPair.publicKey);
        const privateKeyString = await exportPrivateKey(keyPair.privateKey);

        // Store private key in localStorage
        localStorage.setItem(`privateKey_${user.id}`, privateKeyString);

        // Try to store public key in database (sin key_algorithm)
        try {
          const { error: upsertError } = await supabase
            .from('user_encryption_keys')
            .upsert({
              user_id: user.id,
              public_key: publicKeyString,
              is_active: true
            }, {
              onConflict: 'user_id'
            });

          if (upsertError) {
            console.warn('Could not store public key in database:', upsertError);
            // Continue anyway, we have local keys
          } else {
            console.log(' Generated and stored new keys');
          }
        } catch (dbError) {
          console.warn('Database error storing keys:', dbError);
          // Continue anyway, we have local keys
        }
      }

      setUserKeyPair(keyPair);
      setIsKeysReady(true);
      setEncryptionReady(true);
      
      console.log(' Encryption keys ready');

    } catch (error) {
      console.error('Error initializing user keys:', error);
      setIsKeysReady(false);
      setEncryptionReady(false);
    }
  }, [user?.id]);

  // Effect to initialize keys when user changes
  useEffect(() => {
    if (!user?.id) {
      setIsKeysReady(false);
      setUserKeyPair(null);
      setEncryptionReady(false);
      return;
    }

    // Prevent multiple initializations
    if (userKeyPair && isKeysReady) return;

    let isMounted = true;
    let timeout = setTimeout(() => {
      if (isMounted && !userKeyPair) {
        initializeUserKeys();
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [user?.id, initializeUserKeys]);

  // Function to get another user's public key
  const getUserPublicKey = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('public_key')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const publicKey = await importPublicKey(data.public_key);
      return publicKey;
    } catch (error) {
      console.error('Error getting user public key:', error);
      throw new Error('Failed to get user public key');
    }
  }, []);

  // Function to encrypt message
  const encryptMessage = useCallback(async (message, conversationKey) => {
    if (!conversationKey) throw new Error('No conversation key available');
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        conversationKey,
        data
      );
      
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  }, []);

  // Function to decrypt message
  const decryptMessage = useCallback(async (encryptedMessage, conversationKey) => {
    if (!conversationKey) throw new Error('No conversation key available');
    
    try {
      const data = new Uint8Array(
        atob(encryptedMessage).split('').map(char => char.charCodeAt(0))
      );
      
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        conversationKey,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw error;
    }
  }, []);

  return {
    isKeysReady,
    userKeyPair,
    encryptionReady,
    getUserPublicKey,
    encryptMessage,
    decryptMessage,
    initializeUserKeys,
    generateConversationKey,
    encryptKeyForUser,
    decryptKeyFromUser
  };
}
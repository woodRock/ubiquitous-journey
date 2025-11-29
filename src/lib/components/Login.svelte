<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { generateKeyPair, exportKey } from '$lib/crypto';
  import { privateKey as privateKeyStore } from '$lib/stores/keyStore';
  import './Login.css';

  let email = '';
  let password = '';
  let error: string | null = null;
  let loading = false;

  async function signUp() {
    loading = true;
    error = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User signed up:', user);

      // Generate and store keys
      console.log('Generating keys...');
      const keyPair = await generateKeyPair();
      const publicKeyStr = await exportKey(keyPair.publicKey);
      const privateKeyStr = await exportKey(keyPair.privateKey);
      console.log('Keys generated.');

      console.log('Writing user to Firestore...');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        publicKey: publicKeyStr,
      });
      console.log('User written to Firestore.');

      localStorage.setItem(`privateKey-${user.uid}`, privateKeyStr);

      // Also update the key store
      const privateKey = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(privateKeyStr),
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );
      privateKeyStore.set(privateKey);

    } catch (e: any) {
      console.error('Error during sign up:', e);
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function login() {
    loading = true;
    error = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // After login, check if the private key exists. If not, this is a new device/browser.
      if (!localStorage.getItem(`privateKey-${user.uid}`)) {
        console.log('No private key found for this user on this device. Generating new keys...');
        
        // Generate and store a new key pair
        const keyPair = await generateKeyPair();
        const publicKeyStr = await exportKey(keyPair.publicKey);
        const privateKeyStr = await exportKey(keyPair.privateKey);
        
        // Update the public key in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          publicKey: publicKeyStr,
        }, { merge: true }); // Use merge: true to avoid overwriting other fields

        // Store the new private key locally
        localStorage.setItem(`privateKey-${user.uid}`, privateKeyStr);
        console.log('New keys generated and stored for existing user.');

        // Also update the key store
        const privateKey = await crypto.subtle.importKey(
            'jwk',
            JSON.parse(privateKeyStr),
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['decrypt']
        );
        privateKeyStore.set(privateKey);
      }

    } catch (e: any)
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-container">
  <div class="login-form">
    <h2>Login or Sign Up</h2>
    <div class="input-group">
      <input type="email" placeholder="Email" bind:value={email} />
      <input type="password" placeholder="Password" bind:value={password} />
      <div class="button-group">
        <button on:click={login} disabled={loading} class="login-button">Login</button>
        <button on:click={signUp} disabled={loading} class="signup-button">Sign Up</button>
      </div>
    </div>
    {#if loading}
      <p class="loading-message">Loading...</p>
    {/if}
    {#if error}
      <p class="error-message">{error}</p>
    {/if}
  </div>
</div>

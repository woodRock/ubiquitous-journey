<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { generateKeyPair, exportKey } from '$lib/crypto';
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
      const publicKey = await exportKey(keyPair.publicKey);
      const privateKey = await exportKey(keyPair.privateKey);
      console.log('Keys generated.');

      console.log('Writing user to Firestore...');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        publicKey: publicKey,
      });
      console.log('User written to Firestore.');

      localStorage.setItem(`privateKey-${user.uid}`, privateKey);

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
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
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

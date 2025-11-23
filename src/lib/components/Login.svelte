<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { generateKeyPair, exportKey } from '$lib/crypto';

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

<div class="flex flex-col items-center justify-center w-full">
  <div class="w-full max-w-md bg-gray-800 rounded-lg shadow-md p-8">
    <h2 class="text-2xl font-bold mb-6 text-center">Login or Sign Up</h2>
    <div class="flex flex-col gap-4">
      <input type="email" placeholder="Email" bind:value={email} class="bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input type="password" placeholder="Password" bind:value={password} class="bg-gray-700 text-white rounded-md p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <div class="flex gap-4">
        <button on:click={login} disabled={loading} class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50">Login</button>
        <button on:click={signUp} disabled={loading} class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:opacity-50">Sign Up</button>
      </div>
    </div>
    {#if loading}
      <p class="mt-4 text-center">Loading...</p>
    {/if}
    {#if error}
      <p class="mt-4 text-center text-red-500">{error}</p>
    {/if}
  </div>
</div>

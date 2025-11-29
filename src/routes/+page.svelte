<script lang="ts">
  import Login from '$lib/components/Login.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import { user } from '$lib/stores/userStore';
  import { privateKey } from '$lib/stores/keyStore';
  import { auth } from '$lib/firebase';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      user.set(authUser);
      if (authUser) {
        // User is logged in, try to load their private key from localStorage
        const privateKeyStr = localStorage.getItem(`privateKey-${authUser.uid}`);
        if (privateKeyStr) {
          try {
            const key = await crypto.subtle.importKey(
              'jwk',
              JSON.parse(privateKeyStr),
              { name: 'RSA-OAEP', hash: 'SHA-256' },
              true,
              ['decrypt']
            );
            privateKey.set(key);
          } catch (e) {
            console.error("Failed to import private key from localStorage:", e);
            privateKey.set(null);
          }
        } else {
          // This case is handled by the login logic, which will generate a new key
          privateKey.set(null);
        }
      } else {
        // User is logged out
        privateKey.set(null);
      }
    });
    return unsubscribe;
  });
</script>

<div class="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
  <main class="w-full max-w-4xl p-4">
    {#if $user}
      <Chat />
    {:else}
      <Login />
    {/if}
  </main>
</div>

<script lang="ts">
  import Login from '$lib/components/Login.svelte';
  import Chat from '$lib/components/Chat.svelte';
  import { user } from '$lib/stores/userStore';
  import { auth } from '$lib/firebase';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      user.set(authUser);
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

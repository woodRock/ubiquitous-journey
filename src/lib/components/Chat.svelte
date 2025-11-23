<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { user, otherUsers } from '$lib/stores/userStore';
  import { onMount } from 'svelte';
  import { collection, onSnapshot, addDoc, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
  import {
    importPublicKey,
    encryptMessage,
    decryptMessage,
  } from '$lib/crypto';
  import type { AppUser } from '$lib/stores/userStore';


  interface Message {
    id: string;
    from: string;
    to: string;
    participants: string[];
    timestamp: any;
    content: { [key: string]: any };
    decryptedText?: string;
  }

  let selectedUser: AppUser | null = null;
  let messages: Message[] = [];
  let newMessage = '';
  let privateKey: CryptoKey | null = null;
  let currentUserData: AppUser | null = null;
  let chatContainer: HTMLDivElement;

  $: if (messages && chatContainer) {
    // Use timeout to wait for DOM update before scrolling
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 0);
  }

  onMount(async () => {
    if ($user) {
        const userDoc = await getDoc(doc(db, 'users', $user.uid));
        if (userDoc.exists()) {
            currentUserData = { id: userDoc.id, ...userDoc.data() } as AppUser;
        }
    }

    // Get private key from local storage
    const privateKeyStr = localStorage.getItem(`privateKey-${$user?.uid}`);
    if (privateKeyStr) {
      const privateKeyJwk = JSON.parse(privateKeyStr);
      privateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );
    }
  });

  let unsubscribeMessages: () => void;

  $: if (selectedUser && $user) {
    if (unsubscribeMessages) {
      unsubscribeMessages();
    }
    const messagesCollection = collection(db, 'messages');
    const q = query(
      messagesCollection,
      where('participants', 'array-contains', $user.uid),
      orderBy('timestamp', 'asc')
    );

    unsubscribeMessages = onSnapshot(q, async (snapshot) => {
      const allMessages: Message[] = [];
      for (const doc of snapshot.docs) {
        const message = { id: doc.id, ...doc.data() } as Message;
        // Client-side filter for the selected conversation
        if (message.participants.includes(selectedUser.id)) {
          if (privateKey && message.content && message.content[$user.uid]) {
            try {
              const ciphertext = new Uint8Array(Object.values(message.content[$user.uid]));
              message.decryptedText = await decryptMessage(privateKey, ciphertext.buffer);
            } catch (e) {
              // Don't log decryption errors for now, as they are expected for own messages before fix
              // console.error('Decryption failed:', e);
              message.decryptedText = 'Could not decrypt message';
            }
          }
          allMessages.push(message);
        }
      }
      messages = allMessages;
    });
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUser || !$user || !currentUserData) return;

    const recipientPublicKey = await importPublicKey(selectedUser.publicKey);
    const senderPublicKey = await importPublicKey(currentUserData.publicKey);

    const ciphertextForRecipient = await encryptMessage(recipientPublicKey, newMessage);
    const ciphertextForSender = await encryptMessage(senderPublicKey, newMessage);

    await addDoc(collection(db, 'messages'), {
      from: $user.uid,
      to: selectedUser.id,
      participants: [$user.uid, selectedUser.id],
      timestamp: new Date(),
      content: {
          [$user.uid]: { ...new Uint8Array(ciphertextForSender) },
          [selectedUser.id]: { ...new Uint8Array(ciphertextForRecipient) }
      }
    });

    newMessage = '';
  }

  function logout() {
    auth.signOut();
  }
</script>

<div class="bg-gray-900 text-gray-200 rounded-lg shadow-md w-full h-[80vh] flex flex-col">
  <!-- Header -->
  <div class="p-4 border-b border-gray-700 flex justify-between items-center">
    <h2 class="text-xl font-bold text-white">Encrypted Chat</h2>
    <div class="flex items-center gap-4">
      <p class="text-sm text-gray-400">Welcome, {$user?.email}</p>
      <button on:click={logout} class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md text-sm transition duration-300">Logout</button>
    </div>
  </div>

  <div class="flex flex-grow h-full overflow-hidden">
    <!-- User List -->
    <div class="w-1/3 md:w-1/4 bg-gray-800 border-r border-gray-700 flex flex-col">
      <h3 class="text-lg font-semibold p-4 border-b border-gray-700 text-white">Contacts</h3>
      <ul class="flex-grow overflow-y-auto">
        {#each $otherUsers as u}
          <li>
            <button on:click={() => (selectedUser = u)} class="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition duration-150" class:bg-gray-700={selectedUser?.id === u.id}>
              <span class="relative flex h-5 w-5 shrink-0 overflow-hidden rounded-full">
                <img class="aspect-square h-full w-full" alt="Avatar" src={`https://api.dicebear.com/8.x/initials/svg?seed=${u.email}`} />
              </span>
              <span class="flex-grow truncate">{u.email}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Chat Window -->
    <div class="w-2/3 md:w-3/4 flex flex-col bg-gray-900">
      {#if selectedUser}
        <div class="p-4 border-b border-gray-700 flex items-center gap-3">
           <span class="relative flex h-6 w-6 shrink-0 overflow-hidden rounded-full">
                <img class="aspect-square h-full w-full" alt="Avatar" src={`https://api.dicebear.com/8.x/initials/svg?seed=${selectedUser.email}`} />
            </span>
          <h3 class="text-lg font-semibold text-white">Chat with {selectedUser.email}</h3>
        </div>
        <div class="flex-grow p-4 overflow-y-auto flex flex-col gap-4" bind:this={chatContainer}>
          {#each messages as message}
            <div class="flex items-end gap-2" class:flex-row-reverse={$user?.uid === message.from}>
              <div class="rounded-lg p-3 max-w-lg" class:bg-blue-600={$user?.uid === message.from} class:bg-gray-700={$user?.uid !== message.from}>
                <p class="text-white">{message.decryptedText || '...'}</p>
              </div>
            </div>
          {/each}
        </div>
        <div class="p-4 border-t border-gray-700 flex gap-4 items-center">
          <input type="text" bind:value={newMessage} placeholder="Type a message..." class="flex-grow bg-gray-700 text-white rounded-full py-3 px-5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" on:keydown={(e) => e.key === 'Enter' && sendMessage()} />
          <button on:click={sendMessage} aria-label="Send message" class="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      {:else}
        <div class="flex-grow flex items-center justify-center">
          <p class="text-gray-500">Select a user to start chatting.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { user, otherUsers } from '$lib/stores/userStore';
  import { privateKey } from '$lib/stores/keyStore';
  import { collection, onSnapshot, addDoc, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
  import {
    importPublicKey,
    encryptMessage,
    decryptMessage,
  } from '$lib/crypto';
  import type { AppUser } from '$lib/stores/userStore';
  import './Chat.css';


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
  let currentUserData: AppUser | null = null;
  let chatContainer: HTMLDivElement;

  $: if (messages && chatContainer) {
    // Use timeout to wait for DOM update before scrolling
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 0);
  }

  let unsubscribeMessages: () => void;

  $: if (selectedUser && $user && $privateKey) {
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
          if (message.content && message.content[$user.uid]) {
            try {
              const ciphertext = new Uint8Array(Object.values(message.content[$user.uid]));
              message.decryptedText = await decryptMessage($privateKey, ciphertext.buffer);
            } catch (e) {
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

    // Get current user data for public key
    const userDoc = await getDoc(doc(db, 'users', $user.uid));
    if (userDoc.exists()) {
        currentUserData = { id: userDoc.id, ...userDoc.data() } as AppUser;
    } else {
        console.error("Could not find current user's data in Firestore.");
        return;
    }

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

<div class="chat-container">
  <!-- Header -->
  <div class="chat-header">
    <h2>Encrypted Chat</h2>
    <div class="header-user-info">
      <p>Welcome, {$user?.email}</p>
      <button on:click={logout} class="logout-button">Logout</button>
    </div>
  </div>

  <div class="chat-body">
    <!-- User List -->
    <div class="user-list">
      <h3>Contacts</h3>
      <ul>
        {#each $otherUsers as u}
          <li>
            <button on:click={() => (selectedUser = u)} class="user-button" class:selected={selectedUser?.id === u.id}>
              <span class="avatar avatar-small">
                <img alt="Avatar" src={`https://api.dicebear.com/8.x/initials/svg?seed=${u.email}`} />
              </span>
              <span class="user-email">{u.email}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Chat Window -->
    <div class="chat-window">
      {#if selectedUser}
        <div class="chat-window-header">
           <span class="avatar avatar-small">
                <img alt="Avatar" src={`https://api.dicebear.com/8.x/initials/svg?seed=${selectedUser.email}`} />
            </span>
          <h3>Chat with {selectedUser.email}</h3>
        </div>
        <div class="messages-container" bind:this={chatContainer}>
          {#each messages as message}
            <div class="message-row" class:sent={$user?.uid === message.from}>
              <div class="message" class:sent={$user?.uid === message.from} class:received={$user?.uid !== message.from}>
                <p>{message.decryptedText || '...'}</p>
              </div>
            </div>
          {/each}
        </div>
        <div class="chat-input-area">
          <input type="text" bind:value={newMessage} placeholder="Type a message..." class="chat-input" on:keydown={(e) => e.key === 'Enter' && sendMessage()} />
          <button on:click={sendMessage} aria-label="Send message" class="send-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      {:else}
        <div class="placeholder-text">
          <p>Select a user to start chatting.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

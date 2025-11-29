<script lang="ts">
  import { db } from '$lib/firebase';
  import { user, otherUsers } from '$lib/stores/userStore';
  import { collection, addDoc } from 'firebase/firestore';

  let groupName = '';
  let selectedUsers: string[] = [];

  async function createGroup() {
    if (!$user || !groupName || selectedUsers.length === 0) return;

    const participants = [...selectedUsers, $user.uid];

    await addDoc(collection(db, 'groups'), {
      name: groupName,
      participants: participants,
      createdBy: $user.uid,
    });

    groupName = '';
    selectedUsers = [];
  }
</script>

<div class="create-group-container">
  <h2>Create Group</h2>
  <div class="form-group">
    <label for="groupName">Group Name</label>
    <input type="text" id="groupName" bind:value={groupName} placeholder="Enter group name" />
  </div>
  <div class="form-group">
    <label>Select Users</label>
    <div class="user-selection">
      {#each $otherUsers as u}
        <label>
          <input type="checkbox" bind:group={selectedUsers} value={u.id} />
          {u.displayName || u.email}
        </label>
      {/each}
    </div>
  </div>
  <button on:click={createGroup}>Create Group</button>
</div>

<style>
  .create-group-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: #1f2937;
    border-radius: 0.5rem;
    color: #f3f4f6;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  input[type="text"] {
    background-color: #374151;
    color: #f3f4f6;
    border-radius: 0.375rem;
    padding: 0.75rem;
    border: 1px solid #4b5563;
  }
  .user-selection {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  button {
    background-color: #2563eb;
    color: #ffffff;
    font-weight: 700;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    transition: background-color: 0.3s;
  }
  button:hover {
    background-color: #1d4ed8;
  }
</style>

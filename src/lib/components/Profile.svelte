<script lang="ts">
  import { user } from '$lib/stores/userStore';
  import { db } from '$lib/firebase';
  import { doc, updateDoc } from 'firebase/firestore';
  import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

  let displayName = '';
  let photoURL = '';
  let fileInput: HTMLInputElement;

  async function updateProfile() {
    if (!$user) return;

    let newPhotoURL = $user.photoURL;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${$user.uid}`);
      await uploadBytes(storageRef, file);
      newPhotoURL = await getDownloadURL(storageRef);
    }

    const userRef = doc(db, 'users', $user.uid);
    await updateDoc(userRef, {
      displayName: displayName || $user.displayName,
      photoURL: newPhotoURL,
    });

    alert('Profile updated!');
  }
</script>

<div class="profile-container">
  <h2>Edit Profile</h2>
  <div class="form-group">
    <label for="displayName">Display Name</label>
    <input type="text" id="displayName" bind:value={displayName} placeholder="Enter new display name" />
  </div>
  <div class="form-group">
    <label for="photoURL">Profile Picture</label>
    <input type="file" id="photoURL" bind:this={fileInput} accept="image/*" />
  </div>
  <button on:click={updateProfile}>Update Profile</button>
</div>

<style>
  .profile-container {
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
  input {
    background-color: #374151;
    color: #f3f4f6;
    border-radius: 0.375rem;
    padding: 0.75rem;
    border: 1px solid #4b5563;
  }
  button {
    background-color: #2563eb;
    color: #ffffff;
    font-weight: 700;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    transition: background-color 0.3s;
  }
  button:hover {
    background-color: #1d4ed8;
  }
</style>
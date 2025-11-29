<script lang="ts">
  import { auth } from '$lib/firebase';
  import { sendPasswordResetEmail } from 'firebase/auth';

  let email = '';
  let message = '';
  let error = '';

  async function resetPassword() {
    message = '';
    error = '';
    try {
      await sendPasswordResetEmail(auth, email);
      message = 'Password reset email sent! Please check your inbox.';
    } catch (e: any) {
      error = e.message;
    }
  }
</script>

<div class="forgot-password-container">
  <h2>Forgot Password</h2>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={email} placeholder="Enter your email" />
  </div>
  <button on:click={resetPassword}>Send Password Reset Email</button>
  {#if message}
    <p class="message">{message}</p>
  {/if}
  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .forgot-password-container {
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
  .message {
    color: #22c55e;
  }
  .error {
    color: #ef4444;
  }
</style>

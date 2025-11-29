<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }
</script>

<div class="modal-backdrop" on:click={closeModal}>
  <div class="modal-content" on:click|stopPropagation>
    <slot></slot>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .modal-content {
    background-color: #1f2937;
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
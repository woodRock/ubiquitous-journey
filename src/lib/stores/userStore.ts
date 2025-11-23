import { writable, derived } from 'svelte/store';
import type { User as AuthUser } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '$lib/firebase';

export const user = writable<AuthUser | null>(null);

export interface AppUser {
  id: string;
  email: string;
  publicKey: string;
}

export const otherUsers = derived<typeof user, AppUser[]>(user, ($user, set) => {
  if ($user) {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AppUser));
      set(allUsers.filter(u => u.id !== $user.uid));
    });

    return () => {
      unsubscribe();
    };
  } else {
    set([]);
  }
}, []);

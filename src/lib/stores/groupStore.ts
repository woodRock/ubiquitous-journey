import { writable, derived } from 'svelte/store';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '$lib/firebase';
import { user } from './userStore';

export interface Group {
  id: string;
  name: string;
  participants: string[];
  createdBy: string;
}

export const groups = derived<typeof user, Group[]>(user, ($user, set) => {
  if ($user) {
    const groupsCollection = collection(db, 'groups');
    const q = query(groupsCollection, where('participants', 'array-contains', $user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allGroups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
      set(allGroups);
    });

    return () => {
      unsubscribe();
    };
  } else {
    set([]);
  }
}, []);

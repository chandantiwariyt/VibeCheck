import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { JournalEntry, JournalMessage, ReflectionMode } from '../types';

export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  const collectionPath = 'entries';
  try {
    const q = query(
      collection(db, collectionPath),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const entries: JournalEntry[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      entries.push({
        id: docSnap.id,
        userId: data.userId,
        title: data.title || 'Untitled Reflection',
        content: data.content || '',
        mode: (data.mode as ReflectionMode) || 'reflection',
        summary: data.summary || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt || new Date().toISOString()),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : (data.updatedAt || new Date().toISOString()),
      });
    });

    // Client-side sort by updatedAt descending
    entries.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return entries;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function createJournalEntry(params: {
  userId: string;
  title: string;
  content: string;
  mode: ReflectionMode;
  summary?: string;
  tags?: string[];
}): Promise<string> {
  const collectionPath = 'entries';
  try {
    const entryRef = doc(collection(db, collectionPath));
    const entryId = entryRef.id;

    const payload = {
      id: entryId,
      userId: params.userId,
      title: params.title.trim().slice(0, 200),
      content: params.content.slice(0, 10000),
      mode: params.mode,
      summary: (params.summary || '').slice(0, 2500),
      tags: (params.tags || []).slice(0, 5),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(entryRef, payload);
    return entryId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
}

export async function updateJournalEntry(
  entryId: string,
  updates: {
    title?: string;
    content?: string;
    mode?: ReflectionMode;
    summary?: string;
    tags?: string[];
  }
): Promise<void> {
  const docPath = `entries/${entryId}`;
  try {
    const entryRef = doc(db, 'entries', entryId);
    const updatePayload: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.title !== undefined) updatePayload.title = updates.title.trim().slice(0, 200);
    if (updates.content !== undefined) updatePayload.content = updates.content.slice(0, 10000);
    if (updates.mode !== undefined) updatePayload.mode = updates.mode;
    if (updates.summary !== undefined) updatePayload.summary = updates.summary.slice(0, 2500);
    if (updates.tags !== undefined) updatePayload.tags = updates.tags.slice(0, 5);

    await updateDoc(entryRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteJournalEntry(entryId: string): Promise<void> {
  const docPath = `entries/${entryId}`;
  try {
    // Delete messages subcollection documents
    const messagesPath = `entries/${entryId}/messages`;
    const messagesQuery = query(collection(db, 'entries', entryId, 'messages'));
    const messagesSnap = await getDocs(messagesQuery).catch(() => null);
    if (messagesSnap) {
      for (const msgDoc of messagesSnap.docs) {
        await deleteDoc(msgDoc.ref).catch(() => {});
      }
    }

    // Delete entry doc
    await deleteDoc(doc(db, 'entries', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function fetchEntryMessages(
  entryId: string,
  userId: string
): Promise<JournalMessage[]> {
  const collectionPath = `entries/${entryId}/messages`;
  try {
    const q = query(
      collection(db, 'entries', entryId, 'messages'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const messages: JournalMessage[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        entryId: data.entryId,
        userId: data.userId,
        role: data.role as 'user' | 'model',
        content: data.content,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : (data.createdAt || new Date().toISOString()),
      });
    });

    // Client-side sort by createdAt ascending
    messages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function addEntryMessage(params: {
  entryId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
}): Promise<string> {
  const collectionPath = `entries/${params.entryId}/messages`;
  try {
    const msgRef = doc(collection(db, 'entries', params.entryId, 'messages'));
    const messageId = msgRef.id;

    const payload = {
      id: messageId,
      entryId: params.entryId,
      userId: params.userId,
      role: params.role,
      content: params.content.slice(0, 10000),
      createdAt: serverTimestamp(),
    };

    await setDoc(msgRef, payload);
    return messageId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
}

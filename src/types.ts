export type ReflectionMode = 'reflection' | 'brainstorm' | 'summary' | 'conversation';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mode: ReflectionMode;
  summary: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalMessage {
  id: string;
  entryId: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface SummaryResult {
  summary: string;
  keyTakeaways: string[];
  tone?: string;
}

export interface ReflectionPromptIdea {
  id: string;
  category: string;
  prompt: string;
  mode: ReflectionMode;
}

export interface ReflectionTemplate {
  id: string;
  name: string;
  description: string;
  mode: ReflectionMode;
  defaultTitle: string;
  content: string;
  tags: string[];
}

export interface MoodOption {
  id: string;
  label: string;
  color: string;
}

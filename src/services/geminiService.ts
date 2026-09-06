import { ReflectionMode, SummaryResult } from '../types';

export interface ReflectParams {
  prompt: string;
  title?: string;
  mode?: ReflectionMode;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

export async function generateReflection(params: ReflectParams): Promise<string> {
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned status ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

export async function generateSummary(params: {
  title: string;
  content: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<SummaryResult> {
  const response = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned status ${response.status}`);
  }

  return response.json();
}

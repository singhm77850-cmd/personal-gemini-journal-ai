import { auth } from '../firebase';
import { ChatMessage, SummarizeResponse, JournalInsightData, JournalEntry } from '../types';

async function getAuthHeader(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated. Please sign in.');
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function sendChatMessage(params: {
  messages: ChatMessage[];
  mode?: string;
  journalContext?: string;
}): Promise<string> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned error ${res.status}`);
  }

  const data = await res.json();
  return data.reply;
}

export async function summarizeJournalSession(params: {
  messages: ChatMessage[];
  currentTitle?: string;
}): Promise<SummarizeResponse> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/summarize', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned error ${res.status}`);
  }

  return res.json();
}

export async function generateUserInsights(journalSummaries: Partial<JournalEntry>[]): Promise<JournalInsightData> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/insights', {
    method: 'POST',
    headers,
    body: JSON.stringify({ journalSummaries }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Server returned error ${res.status}`);
  }

  return res.json();
}

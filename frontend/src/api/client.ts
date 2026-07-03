/* ============================================================
   TheraAssist AI — API Client
   ============================================================ */

import type { ChatResponse, SessionSummary, Session, Report } from '../types';

const BASE = '/api';

async function json<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/* ---- Chat ---- */

export async function startSession(): Promise<ChatResponse> {
  return json<ChatResponse>(`${BASE}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message: '' }),
  });
}

export async function sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
  return json<ChatResponse>(`${BASE}/chat`, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}

/* ---- Sessions ---- */

export async function listSessions(): Promise<SessionSummary[]> {
  return json<SessionSummary[]>(`${BASE}/sessions`);
}

export async function getSession(sessionId: string): Promise<Session> {
  return json<Session>(`${BASE}/session/${sessionId}`);
}

/* ---- Reports ---- */

export async function generateReport(sessionId: string): Promise<Report> {
  return json<Report>(`${BASE}/generate-report`, {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export function getDownloadUrl(sessionId: string): string {
  return `${BASE}/download-report/${sessionId}`;
}

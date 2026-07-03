/* ============================================================
   TheraAssist AI — TypeScript Interfaces
   ============================================================ */

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface PatientInfo {
  name: string | null;
  phone: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  timezone: string | null;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface Session {
  session_id: string;
  current_step: string;
  patient_info: PatientInfo;
  issue_summary: string | null;
  question_index: number;
  answers: QuestionAnswer[];
  completed: boolean;
  safety_flag?: boolean;
  conversation_log: ChatMessage[];
  created_at: string;
  updated_at: string;
  analytics?: Analytics | null;
}

export interface SessionSummary {
  session_id: string;
  patient_name: string;
  phone: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  completed: boolean;
  current_step: string;
  safety_flag?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  step: string;
  completed: boolean;
  safety_alert?: boolean;
  question_index?: number;
  total_questions?: number;
}

export interface MoodBreakdown {
  mood: string;
  score: number;
}

export interface Analytics {
  session_id: string;
  stress_score: number;
  mood_stability: number;
  sleep_health: number;
  risk_score: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  readiness_score: number;
  mood_breakdown: MoodBreakdown[];
  appetite_energy_flag: boolean;
  chronicity: boolean;
  safety_flag?: boolean;
  disclaimer?: string;
}

export interface Report {
  session_id: string;
  generated_at: string;
  patient_info: { name: string; phone: string };
  appointment: { date: string; time: string; timezone: string };
  primary_concern: string;
  emotional_patterns: string[];
  therapy_medication_history: string[];
  risk_flags: string[];
  suggested_therapy_direction: string[];
  session_opening_strategy: string[];
  analytics: Analytics;
  question_responses: QuestionAnswer[];
  limitations?: string;
}

export type ConversationStep =
  | 'greeting'
  | 'name'
  | 'phone'
  | 'date'
  | 'time'
  | 'timezone'
  | 'issue'
  | 'questions'
  | 'complete';

export const STEP_LABELS: Record<ConversationStep, string> = {
  greeting: 'Welcome',
  name: 'Full Name',
  phone: 'Phone Number',
  date: 'Appointment Date',
  time: 'Appointment Time',
  timezone: 'Timezone',
  issue: 'Primary Concern',
  questions: 'Assessment',
  complete: 'Complete',
};

export const STEP_ORDER: ConversationStep[] = [
  'greeting', 'name', 'phone', 'date', 'time', 'timezone', 'issue', 'questions', 'complete'
];

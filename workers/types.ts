export interface TimezoneData {
  version: string;
  updated: string;
  zones: Record<string, TimezoneTransition[]>;
}
export interface TimezoneTransition { start: string; offset: number; }
export interface TimezoneApiResponse { zone: string; offset: number; updated: string; }
export interface ReminderPayload {
  timezone: string;
  email: string;
  action: 'wakeup' | 'custom';
  targetTime?: string;
}
export interface UserPreference {
  workStart: number;
  workEnd: number;
  timezone: string;
  learnedPatterns?: { dayOfWeek: number; activeHours: number[] }[];
}
export interface GatewayContext {
  userId?: string;
  apiKey?: string;
  rateLimitRemaining: number;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
}
export interface SSRData {
  city: string;
  currentTime: string;
  offset: number;
  isDST: boolean;
  nextDSTTransition?: string;
}
export interface LocalizedFormat {
  date: string;
  time: string;
  numericDate: string;
  calendarType: 'gregorian';
}
export interface CalibrationResult {
  offset: number;
  confidence: number;
  sources: number;
  updated: string;
}
export interface SignedTimeResult {
  time: string;
  signature: string;
  algorithm: string;
  timestamp: string;
}
export interface MeetingSuggestion {
  time: Date;
  painScore: number;
  readableTime: string;
  copyText: string;
}

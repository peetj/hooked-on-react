import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";

export type View = "welcome" | "login" | "register" | "dashboard" | "quiz" | "leaderboard" | "social" | "badges" | "admin";
export type AccountSection = "profile" | "account" | "security" | "preferences";

export type AuthState = {
  token: string | null;
  user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } | null;
};

export type ThemeName = "midnight" | "ember" | "nova" | "sunset" | "circuit";
export type ArenaEffectsPalette = "classic" | "ember" | "nova" | "sunset" | "circuit";
export type ArenaEffectsSettings = {
  intensity: number;
  gridLineCount: number;
  gridColorRange: number;
  effectTransparency: number;
  energyDotCount: number;
  energyPalette: ArenaEffectsPalette;
};

export type ActiveRun = {
  sessionId: string;
  stream: QuizStream;
  mode: SessionMode;
  paused: boolean;
  remainingTimeSec: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
};

export type TimerTone = "safe" | "warn" | "danger" | "critical";

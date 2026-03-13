export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type QuestionType = "mcq" | "multi" | "truefalse";

export type Topic =
  | "react-basics"
  | "jsx"
  | "props"
  | "state"
  | "events"
  | "lists-keys"
  | "forms"
  | "effects"
  | "hooks"
  | "context"
  | "performance"
  | "typescript"
  | "testing"
  | "tooling"
  | "accessibility"
  | "security"
  | "platform";

export type Question = {
  id: string;
  type: QuestionType;
  topic: Topic;
  difficulty: Difficulty;
  weight: number; // importance/coverage weight
  prompt: string;
  options: string[];
  answer: number[]; // indices into options
  explanation: string;
  tags?: string[];
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type SessionState = {
  sessionId: string;
  userId: string;
  createdAt: string;
  rating: number; // adaptive rating, starts at 0
  streak: number;
  totalAnswered: number;
  topicMastery: Record<Topic, number>; // -3..+3
};

export type ServedQuestion = {
  sessionId: string;
  question: Omit<Question, "answer">;
  timeLimitSec: number;
  servedToken: string; // one-time token to prevent replay/cheating
};

export type SubmitAnswerRequest = {
  sessionId: string;
  questionId: string;
  selected: number[];
  servedToken: string;
  clientTimeTakenMs?: number; // optional, for UX analytics only
};

export type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  rarity: "common" | "rare" | "epic";
};

export type SubmitAnswerResponse = {
  correct: boolean;
  correctAnswer: number[];
  explanation: string;
  ratingDelta: number;
  newRating: number;
  newStreak: number;
  nextTimeLimitSec: number;
  unlockedBadges?: BadgeDef[];
};

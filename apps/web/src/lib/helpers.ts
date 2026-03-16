import type { QuizStream, ServedQuestion, SessionMode } from "@react-quiz-1000/shared";
import type { ThemeName, TimerTone } from "./types";

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export function getThemeSwatch(theme: ThemeName) {
  switch (theme) {
    case "ember":
      return "from-red-700 via-orange-500 to-amber-200";
    case "nova":
      return "from-fuchsia-700 via-rose-500 to-orange-300";
    case "sunset":
      return "from-orange-700 via-rose-500 to-amber-200";
    case "circuit":
      return "from-emerald-600 via-teal-400 to-lime-200";
    default:
      return "from-slate-950 via-slate-700 to-cyan-400";
  }
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getTopicLabel(topic: ServedQuestion["question"]["topic"] | undefined) {
  switch (topic) {
    case "react-basics":
      return "React Basics";
    case "jsx":
      return "JSX";
    case "props":
      return "Props";
    case "state":
      return "State";
    case "events":
      return "Events";
    case "lists-keys":
      return "Lists and Keys";
    case "forms":
      return "Forms";
    case "effects":
      return "Effects";
    case "hooks":
      return "Hooks";
    case "context":
      return "Context";
    case "performance":
      return "Performance";
    case "typescript":
      return "TypeScript";
    case "testing":
      return "Testing";
    case "tooling":
      return "Tooling";
    case "accessibility":
      return "Accessibility";
    case "security":
      return "Security";
    case "platform":
      return "Platform";
    default:
      return "Challenge";
  }
}

export function getStreamLabel(stream: QuizStream) {
  switch (stream) {
    case "1":
      return "Tier 1";
    case "2":
      return "Tier 2";
    case "3":
      return "Tier 3";
    case "4":
      return "Tier 4";
    case "5":
      return "Tier 5";
    default:
      return "Adaptive";
  }
}

export function getStreamDescription(stream: QuizStream) {
  switch (stream) {
    case "1":
      return "Foundations and syntax reps";
    case "2":
      return "Core component and state practice";
    case "3":
      return "Production-ready React patterns";
    case "4":
      return "Advanced timing, architecture, and debugging";
    case "5":
      return "Expert traps and edge cases";
    default:
      return "Mixed difficulty that reacts to your streak";
  }
}

export function getQuestionTypeLabel(type: ServedQuestion["question"]["type"] | undefined) {
  switch (type) {
    case "multi":
      return "Multi-select";
    case "truefalse":
      return "True or false";
    default:
      return "Single answer";
  }
}

export function getDifficultyLabel(difficulty: number | undefined) {
  return difficulty ? `Level ${difficulty}` : "Adaptive";
}

export function getModeLabel(mode: SessionMode) {
  return mode === "practice" ? "Learn" : "Timed";
}

export function getModeDescription(mode: SessionMode) {
  return mode === "practice" ? "Relaxed mode with no clock and a live code example after each answer" : "Clock on and leaderboard eligible";
}

export function getTimerTone(remainingRatio: number): TimerTone {
  if (remainingRatio > 0.66) return "safe";
  if (remainingRatio > 0.4) return "warn";
  if (remainingRatio > 0.2) return "danger";
  return "critical";
}

export function formatCountdown(ms: number) {
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
}

import fs from "node:fs";
import path from "node:path";
import type { Question, Topic, Difficulty } from "@react-quiz-1000/shared";

const questionsPath = path.join(process.cwd(), "src/questions/questions.json");
const raw = fs.readFileSync(questionsPath, "utf8");
export const QUESTION_BANK = JSON.parse(raw) as Question[];

export function getQuestionById(id: string) {
  return QUESTION_BANK.find((q) => q.id === id);
}

export function topicList(): Topic[] {
  return [
    "react-basics",
    "jsx",
    "props",
    "state",
    "events",
    "lists-keys",
    "forms",
    "effects",
    "hooks",
    "context",
    "performance",
    "typescript",
    "testing",
    "tooling",
    "accessibility",
    "security",
    "platform"
  ];
}

export function clampDifficulty(x: number): Difficulty {
  if (x <= 1) return 1;
  if (x >= 5) return 5;
  return Math.round(x) as Difficulty;
}

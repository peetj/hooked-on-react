export type BadgeDef = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  rarity: "common" | "rare" | "epic";
};

export const BADGES: BadgeDef[] = [
  { id: "first-blood", name: "First Blood", desc: "Answer your first question.", emoji: "⚔️", rarity: "common" },
  { id: "on-a-roll", name: "On a Roll", desc: "Reach a 5-question streak.", emoji: "🔥", rarity: "common" },
  { id: "hot-streak", name: "Hot Streak", desc: "Reach a 10-question streak.", emoji: "🌶️", rarity: "rare" },
  { id: "unstoppable", name: "Unstoppable", desc: "Reach a 20-question streak.", emoji: "🏆", rarity: "epic" },

  { id: "the-grind", name: "The Grind", desc: "Answer 50 questions.", emoji: "⛏️", rarity: "common" },
  { id: "centurion", name: "Centurion", desc: "Answer 100 questions.", emoji: "🛡️", rarity: "rare" },

  { id: "speedy", name: "Speedy", desc: "Average answer time under 7s (after 30 questions).", emoji: "⚡", rarity: "rare" },
  { id: "accurate", name: "Accurate", desc: "Maintain 85%+ accuracy (after 50 questions).", emoji: "🎯", rarity: "rare" },

  { id: "hooked", name: "Hooked", desc: "Get 25 hook/effect questions correct.", emoji: "🪝", rarity: "rare" },
  { id: "testing-aware", name: "Testing Aware", desc: "Get 20 testing questions correct.", emoji: "🧪", rarity: "rare" },
  { id: "a11y-ally", name: "A11y Ally", desc: "Get 15 accessibility questions correct.", emoji: "♿", rarity: "rare" },
  { id: "ts-tamer", name: "TS Tamer", desc: "Get 15 TypeScript questions correct.", emoji: "📘", rarity: "rare" },

  { id: "comeback", name: "Comeback Kid", desc: "Get 5 correct answers within 10 questions after a miss.", emoji: "🧠", rarity: "common" },

  { id: "friendly", name: "Friendly", desc: "Become mutual followers with 3 people.", emoji: "🤝", rarity: "common" },
  { id: "cheerleader", name: "Cheerleader", desc: "Send 10 encouragements.", emoji: "📣", rarity: "common" }
];

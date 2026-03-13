import fs from "node:fs";
import path from "node:path";
import type { Question, Topic, Difficulty, QuestionType } from "@react-quiz-1000/shared";

// Deterministic PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

function shuffle<T>(rng: () => number, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const TOPICS: Topic[] = [
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

const HOOKS = [
  { name: "useState", why: "local component state" },
  { name: "useEffect", why: "run side-effects after render" },
  { name: "useMemo", why: "memoize expensive derived values" },
  { name: "useCallback", why: "memoize function references" },
  { name: "useRef", why: "store mutable values without re-render" },
  { name: "useContext", why: "read values from context" },
  { name: "useReducer", why: "complex state transitions" },
  { name: "useId", why: "stable unique ids for a11y" },
  { name: "useLayoutEffect", why: "measure DOM before paint" }
] as const;

const TESTING = [
  { concept: "React Testing Library", right: "Test the UI like a user would", wrong: ["Test implementation details", "Rely on CSS selectors", "Mock every component"] },
  { concept: "fake timers", right: "Control time-based code deterministically", wrong: ["Make tests slower", "Disable async", "Prevent rerenders"] },
  { concept: "act()", right: "Flush React updates before assertions", wrong: ["Mock fetch", "Silence console", "Speed up tests"] },
  { concept: "flaky tests", right: "Tests that pass/fail nondeterministically", wrong: ["Tests without snapshots", "Tests with TypeScript", "Tests that run in CI"] },
  { concept: "MSW", right: "Mock network at the request level", wrong: ["Rewrite bundler config", "Minify JS", "Generate mocks from DB schema"] }
] as const;

const TS_CONCEPTS = [
  { q: "What does `React.FC<Props>` provide?", a: "It types `props` (and historically `children`), but it’s optional.", correct: "A way to type component props", wrong: ["A way to create classes", "A runtime validator", "A bundler plugin"] },
  { q: "What is a discriminated union useful for?", a: "Modeling variants with a `type` field so TS can narrow safely.", correct: "Modeling variant shapes with narrowing", wrong: ["Minifying code", "Faster renders", "Avoiding hooks"] }
] as const;

const PLATFORM = [
  { concept: "localStorage", right: "Synchronous key/value storage in the browser", wrong: ["A NoSQL server DB", "A React hook", "A cookie encryption API"] },
  { concept: "CORS", right: "Browser restriction on cross-origin requests", wrong: ["A React router", "A CSS feature", "A TypeScript compiler flag"] },
  { concept: "HTTP-only cookies", right: "Cookies inaccessible to JS (mitigates XSS token theft)", wrong: ["Cookies that never expire", "Cookies only for GET", "Cookies stored in memory only"] }
] as const;

function difficultyForIndex(i: number): Difficulty {
  // Gentle ramp: mostly 1-3 early, more 4-5 later.
  if (i < 150) return 1;
  if (i < 350) return 2;
  if (i < 650) return 3;
  if (i < 850) return 4;
  return 5;
}

function weightFor(topic: Topic, difficulty: Difficulty): number {
  const core = new Set<Topic>(["react-basics", "jsx", "props", "state", "hooks", "effects", "forms"]);
  const w = (core.has(topic) ? 1.4 : 1.0) * (difficulty >= 4 ? 1.2 : 1.0);
  return Math.round(w * 10) / 10;
}

function makeMcq(id: string, topic: Topic, difficulty: Difficulty, prompt: string, options: string[], answer: number[], explanation: string, tags: string[] = []): Question {
  return {
    id,
    type: answer.length > 1 ? "multi" : "mcq",
    topic,
    difficulty,
    weight: weightFor(topic, difficulty),
    prompt,
    options,
    answer,
    explanation,
    tags
  };
}

function idFor(n: number) {
  return `q${String(n).padStart(4, "0")}`;
}

function build(seed = 1337, total = 1000): Question[] {
  const rng = mulberry32(seed);
  const out: Question[] = [];

  // A small curated starter set (handwritten-ish)
  out.push(
    makeMcq(
      idFor(1),
      "react-basics",
      1,
      "In React, what is a component?",
      ["A reusable piece of UI described by code", "A database table", "A CSS preprocessor", "A browser API"],
      [0],
      "A component is a reusable building block that returns UI (usually JSX) based on props/state.",
      ["fundamentals"]
    )
  );

  // Template-driven generation
  while (out.length < total) {
    const n = out.length + 1;
    const topic = pick(rng, TOPICS);
    const difficulty = difficultyForIndex(n);

    const mode: QuestionType = pick(rng, ["mcq", "mcq", "mcq", "truefalse", "multi"]);

    if (topic === "hooks") {
      const h = pick(rng, HOOKS);
      const prompt = `Which React hook is primarily used to ${h.why}?`;
      const distractors = shuffle(rng, HOOKS.filter((x) => x.name !== h.name).map((x) => x.name)).slice(0, 3);
      const opts = shuffle(rng, [h.name, ...distractors]);
      const answer = [opts.indexOf(h.name)];
      out.push(makeMcq(idFor(n), topic, difficulty, prompt, opts, answer, `${h.name} is used to ${h.why}.`));
      continue;
    }

    if (topic === "testing") {
      const t = pick(rng, TESTING);
      const prompt = `In frontend testing, what’s the main idea behind ${t.concept}?`;
      const opts = shuffle(rng, [t.right, ...shuffle(rng, t.wrong).slice(0, 3)]);
      out.push(makeMcq(idFor(n), topic, difficulty, prompt, opts, [opts.indexOf(t.right)], `${t.concept}: ${t.right}.`, ["testing-platform"]));
      continue;
    }

    if (topic === "typescript") {
      const c = pick(rng, TS_CONCEPTS);
      const prompt = c.q;
      const opts = shuffle(rng, [c.correct, ...c.wrong]);
      out.push(makeMcq(idFor(n), topic, difficulty, prompt, opts, [opts.indexOf(c.correct)], c.a, ["ts"]));
      continue;
    }

    if (topic === "platform") {
      const p = pick(rng, PLATFORM);
      const prompt = `In web apps, what best describes ${p.concept}?`;
      const opts = shuffle(rng, [p.right, ...shuffle(rng, p.wrong).slice(0, 3)]);
      out.push(makeMcq(idFor(n), topic, difficulty, prompt, opts, [opts.indexOf(p.right)], `${p.concept}: ${p.right}.`, ["platform"]));
      continue;
    }

    // Generic patterns per topic (keeps things varied but accurate)
    const generic = (() => {
      switch (topic) {
        case "jsx":
          return {
            prompt: "Which statement about JSX is true?",
            correct: "JSX is syntax that compiles to JavaScript function calls",
            wrong: [
              "JSX only works in the browser (not in build tools)",
              "JSX is valid JSON",
              "JSX automatically prevents all XSS"
            ],
            explanation: "JSX is a syntax extension. Build tools transform it into JavaScript (e.g. React.createElement / jsx-runtime)."
          };
        case "props":
          return {
            prompt: "What’s a good rule of thumb about props?",
            correct: "Props are inputs to a component and should be treated as read-only",
            wrong: ["Props should be mutated to share state", "Props only exist in class components", "Props are stored in the DOM"],
            explanation: "Treat props as read-only inputs. If you need to change something, lift state up or use callbacks."
          };
        case "state":
          return {
            prompt: "Which is true about React state updates (useState)?",
            correct: "State updates may be batched and applied asynchronously",
            wrong: ["State updates always happen immediately", "State is stored in localStorage by default", "State can’t trigger re-renders"],
            explanation: "React can batch updates for performance. Use the functional updater when relying on previous state."
          };
        case "effects":
          return {
            prompt: "What is `useEffect` mainly for?",
            correct: "Synchronizing your component with external systems (subscriptions, network, DOM APIs)",
            wrong: ["Creating global variables", "Replacing reducers", "Declaring CSS"] ,
            explanation: "Effects are for side-effects after render—things outside React’s pure render.",
          };
        case "forms":
          return {
            prompt: "In React forms, a controlled input means…",
            correct: "The input value is driven by React state and updated via onChange",
            wrong: ["The input is read-only", "The input can’t be validated", "The browser stores the value in Redux"],
            explanation: "Controlled inputs bind value to state; uncontrolled inputs keep value in the DOM."
          };
        case "lists-keys":
          return {
            prompt: "Why are `key` props important when rendering lists?",
            correct: "They help React match items between renders to preserve state and minimize DOM work",
            wrong: ["They encrypt list items", "They sort items automatically", "They are required for CSS"],
            explanation: "Keys give React stable identity for elements. Avoid using array index when items can reorder."
          };
        case "events":
          return {
            prompt: "In React, event handlers like onClick usually receive…",
            correct: "A SyntheticEvent (or a typed event) that normalizes browser differences",
            wrong: ["A string with the event name", "A Node.js EventEmitter", "A DOM mutation record"],
            explanation: "React wraps browser events to provide a consistent API (in most environments)."
          };
        case "context":
          return {
            prompt: "When is React Context a good fit?",
            correct: "When many components need the same value without prop drilling",
            wrong: ["When you need a database", "When you need to avoid re-renders entirely", "When you want to mutate props"],
            explanation: "Context is for shared values like theme, auth, locale—not every piece of app state."
          };
        case "performance":
          return {
            prompt: "Which change most directly reduces unnecessary re-renders?",
            correct: "Stabilizing props (e.g., memoizing callbacks/values) for memoized children",
            wrong: ["Adding more useEffect", "Using inline styles everywhere", "Converting everything to class components"],
            explanation: "If children are memoized, stable prop references help them skip re-render."
          };
        case "tooling":
          return {
            prompt: "What does Vite primarily provide during development?",
            correct: "A fast dev server with ESM-based HMR",
            wrong: ["A NoSQL database", "A React hook library", "A replacement for TypeScript"],
            explanation: "Vite serves native ESM in dev and uses fast transforms + HMR."
          };
        case "accessibility":
          return {
            prompt: "Which practice improves accessibility in React UIs?",
            correct: "Using semantic HTML (e.g., button for actions) and proper labels",
            wrong: ["Putting everything in divs", "Relying only on color to convey meaning", "Removing focus outlines"],
            explanation: "Semantics + labels + keyboard focus are core. ARIA is a supplement, not a replacement."
          };
        case "security":
          return {
            prompt: "Which statement about `dangerouslySetInnerHTML` is most accurate?",
            correct: "It can introduce XSS if you inject unsanitized user content",
            wrong: ["It automatically sanitizes HTML", "It’s required for rendering Markdown safely", "It only works on the server"],
            explanation: "Only inject trusted/sanitized HTML. Prefer rendering data as text whenever possible."
          };
        case "react-basics":
        default:
          return {
            prompt: "React is best described as…",
            correct: "A library for building user interfaces with components",
            wrong: ["A relational database", "An operating system", "A CSS framework"],
            explanation: "React focuses on composing UI from components and rendering based on state."
          };
      }
    })();

    if (mode === "truefalse") {
      const statement = rng() > 0.5 ? generic.correct : pick(rng, generic.wrong);
      const isTrue = statement === generic.correct;
      out.push({
        id: idFor(n),
        type: "truefalse",
        topic,
        difficulty,
        weight: weightFor(topic, difficulty),
        prompt: `True or False: ${statement}`,
        options: ["True", "False"],
        answer: [isTrue ? 0 : 1],
        explanation: generic.explanation
      });
      continue;
    }

    const opts = shuffle(rng, [generic.correct, ...shuffle(rng, generic.wrong).slice(0, 3)]);
    out.push(makeMcq(idFor(n), topic, difficulty, generic.prompt, opts, [opts.indexOf(generic.correct)], generic.explanation));
  }

  return out.slice(0, total);
}

const questions = build(1337, 1000);

const outPath = path.join(process.cwd(), "src/questions/questions.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(questions, null, 2) + "\n", "utf8");

// eslint-disable-next-line no-console
console.log(`wrote ${questions.length} questions to ${outPath}`);

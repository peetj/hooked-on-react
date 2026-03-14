import type { Question, ResourceLink, Topic } from "@react-quiz-1000/shared";

const TOPIC_RESOURCES: Record<Topic, ResourceLink[]> = {
  "react-basics": [
    { label: "React: Your First Component", url: "https://react.dev/learn/your-first-component" },
    { label: "React: Describing the UI", url: "https://react.dev/learn/describing-the-ui" }
  ],
  jsx: [
    { label: "React: Writing Markup with JSX", url: "https://react.dev/learn/writing-markup-with-jsx" },
    { label: "React: JavaScript in JSX with Curly Braces", url: "https://react.dev/learn/javascript-in-jsx-with-curly-braces" }
  ],
  props: [
    { label: "React: Passing Props to a Component", url: "https://react.dev/learn/passing-props-to-a-component" },
    { label: "React: Conditional Rendering", url: "https://react.dev/learn/conditional-rendering" }
  ],
  state: [
    { label: "React: State, A Component's Memory", url: "https://react.dev/learn/state-a-components-memory" },
    { label: "React: Queueing a Series of State Updates", url: "https://react.dev/learn/queueing-a-series-of-state-updates" }
  ],
  events: [
    { label: "React: Responding to Events", url: "https://react.dev/learn/responding-to-events" },
    { label: "React: Separating Events from Effects", url: "https://react.dev/learn/separating-events-from-effects" }
  ],
  "lists-keys": [
    { label: "React: Rendering Lists", url: "https://react.dev/learn/rendering-lists" },
    { label: "React: Preserving and Resetting State", url: "https://react.dev/learn/preserving-and-resetting-state" }
  ],
  forms: [
    { label: "React: Managing State", url: "https://react.dev/learn/managing-state" },
    { label: "React: Sharing State Between Components", url: "https://react.dev/learn/sharing-state-between-components" }
  ],
  effects: [
    { label: "React: Synchronizing with Effects", url: "https://react.dev/learn/synchronizing-with-effects" },
    { label: "React: Removing Effect Dependencies", url: "https://react.dev/learn/removing-effect-dependencies" }
  ],
  hooks: [
    { label: "React: Reusing Logic with Custom Hooks", url: "https://react.dev/learn/reusing-logic-with-custom-hooks" },
    { label: "React Reference: Hooks", url: "https://react.dev/reference/react/hooks" }
  ],
  context: [
    { label: "React: Passing Data Deeply with Context", url: "https://react.dev/learn/passing-data-deeply-with-context" },
    { label: "React: Scaling Up with Reducer and Context", url: "https://react.dev/learn/scaling-up-with-reducer-and-context" }
  ],
  performance: [
    { label: "React: Keeping Components Pure", url: "https://react.dev/learn/keeping-components-pure" },
    { label: "React Reference: memo", url: "https://react.dev/reference/react/memo" }
  ],
  typescript: [
    { label: "TypeScript Handbook: Everyday Types", url: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html" },
    { label: "React TypeScript Cheatsheets", url: "https://react-typescript-cheatsheet.netlify.app/" }
  ],
  testing: [
    { label: "React: Testing Overview", url: "https://react.dev/learn/testing" },
    { label: "Testing Library: Queries", url: "https://testing-library.com/docs/queries/about/" }
  ],
  tooling: [
    { label: "Vite Guide", url: "https://vite.dev/guide/" },
    { label: "React: Build a React App from Scratch", url: "https://react.dev/learn/build-a-react-app-from-scratch" }
  ],
  accessibility: [
    { label: "React Accessibility", url: "https://legacy.reactjs.org/docs/accessibility.html" },
    { label: "MDN: Accessibility", url: "https://developer.mozilla.org/en-US/docs/Learn/Accessibility" }
  ],
  security: [
    { label: "React DOM Elements", url: "https://legacy.reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml" },
    { label: "MDN: Content Security Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" }
  ],
  platform: [
    { label: "MDN: Browser compatibility", url: "https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing" },
    { label: "React: Responding to Events", url: "https://react.dev/learn/responding-to-events" }
  ]
};

const TOPIC_CONTEXT: Record<Topic, string> = {
  "react-basics": "Focus on the core React mental model: UI is a function of state and props, and components are the units of composition.",
  jsx: "JSX is just syntax, but the hard part is remembering where JavaScript expressions end and where markup structure still matters.",
  props: "Most props questions are really about data flow: who owns the data, who transforms it, and where you create unnecessary coupling.",
  state: "State questions usually punish assumptions about immediate updates. Think about batching, snapshots, and how React schedules work.",
  events: "Events are where intent begins. Good React code keeps event handlers about user intent and moves synchronization work elsewhere.",
  "lists-keys": "Keys are not decorative. They are how React tracks identity, which is why bad keys create state leaks and reorder bugs.",
  forms: "Form questions are often about source of truth. Decide whether React owns the value, the DOM owns it, or a library mediates it.",
  effects: "Effect questions are usually really dependency and lifecycle questions. Reach for effects only when you are synchronizing with something external.",
  hooks: "Hooks reward consistency. Ask what data a hook closes over, when it re-runs, and whether the abstraction actually removes duplication.",
  context: "Context is for shared read access and coordination, not a shortcut to avoid thinking about component boundaries.",
  performance: "Performance questions are mostly about identity churn, unnecessary work, and measuring before optimizing.",
  typescript: "TypeScript should tighten the contract around your component surface area, not make the implementation harder to read.",
  testing: "Testing questions often separate implementation detail from user-observable behavior. Prefer what the user can see and do.",
  tooling: "Tooling questions are usually about build assumptions, module boundaries, and what happens between source and runtime.",
  accessibility: "Accessibility is product quality, not polish. The right answer usually preserves semantics, keyboard flow, and screen-reader meaning.",
  security: "Security questions often hinge on trust boundaries: what input is untrusted, what gets escaped, and where HTML or URLs are interpreted.",
  platform: "Platform questions punish browser assumptions. Think about the runtime environment, event model, and differences across devices."
};

export function buildExplanation(question: Question) {
  return `${question.explanation}\n\n${TOPIC_CONTEXT[question.topic]}`;
}

export function getQuestionResources(question: Question) {
  return TOPIC_RESOURCES[question.topic] ?? [];
}

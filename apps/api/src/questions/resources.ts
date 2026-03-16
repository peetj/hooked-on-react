import type { PlaygroundExample, Question, ResourceLink, Topic } from "@react-quiz-1000/shared";

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

const TOPIC_PLAYGROUNDS: Partial<Record<Topic, PlaygroundExample>> = {
  "react-basics": {
    title: "Compose a Small Component",
    description: "Edit the component and see how JSX, props, and composition shape the rendered UI.",
    code: `function Badge({ label, tone }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "8px 12px",
        borderRadius: 999,
        background: tone === "warm" ? "#ff8c42" : "#6f7bff",
        color: "white",
        fontWeight: 700
      }}
    >
      {label}
    </span>
  );
}

function Example() {
  return (
    <div>
      <h3>React Arena</h3>
      <p>Components let you reuse UI with different props.</p>
      <Badge label="Foundations" tone="warm" />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Example />);`
  },
  jsx: {
    title: "JSX and Expressions",
    description: "Change the values and markup to see where JavaScript expressions fit inside JSX.",
    code: `function Example() {
  const player = "Ari";
  const streak = 4;
  const nextTier = streak >= 5 ? "Tier 3" : "Tier 2";

  return (
    <section>
      <h3>{player}'s dashboard</h3>
      <p>Current streak: {streak}</p>
      <p>Next unlock: {nextTier}</p>
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  props: {
    title: "Prop Flow",
    description: "Props move data down the tree. Change the values being passed and watch the child update.",
    code: `function ScoreCard({ title, score }) {
  return (
    <div>
      <strong>{title}</strong>
      <div>{score} pts</div>
    </div>
  );
}

function Example() {
  return (
    <div>
      <ScoreCard title="Daily React" score={320} />
      <ScoreCard title="Weekly Streak" score={980} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  state: {
    title: "State Snapshot",
    description: "Click the buttons and observe how React renders from the latest state snapshot.",
    code: `function Example() {
  const [count, setCount] = React.useState(0);

  function incrementTwice() {
    setCount((value) => value + 1);
    setCount((value) => value + 1);
  }

  return (
    <div>
      <h3>Counter: {count}</h3>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={incrementTwice}>+2 safely</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  events: {
    title: "Event Intent",
    description: "Keep the click handler focused on user intent and inspect how the UI responds.",
    code: `function Example() {
  const [message, setMessage] = React.useState("Waiting for input");

  return (
    <div>
      <button onClick={() => setMessage("Player queued for next run")}>
        Queue run
      </button>
      <p>{message}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  "lists-keys": {
    title: "List Identity",
    description: "Reorder the array and see why stable keys matter when React preserves item identity.",
    code: `function Example() {
  const [reverse, setReverse] = React.useState(false);
  const players = reverse
    ? [{ id: 3, name: "Kai" }, { id: 2, name: "Nova" }, { id: 1, name: "Ari" }]
    : [{ id: 1, name: "Ari" }, { id: 2, name: "Nova" }, { id: 3, name: "Kai" }];

  return (
    <div>
      <button onClick={() => setReverse((value) => !value)}>Toggle order</button>
      <ul>
        {players.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  forms: {
    title: "Controlled Input",
    description: "Edit the input and watch the React state become the single source of truth.",
    code: `function Example() {
  const [name, setName] = React.useState("React learner");

  return (
    <form>
      <label>
        Display name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <p>Preview: {name}</p>
    </form>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  effects: {
    title: "Effect Synchronization",
    description: "Effects should synchronize with something external. Toggle the value and observe the document title update.",
    code: `function Example() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    document.title = "Clicks: " + count;
    return () => {
      document.title = "React Arena";
    };
  }, [count]);

  return <button onClick={() => setCount((value) => value + 1)}>Clicks: {count}</button>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  hooks: {
    title: "Custom Hook Reuse",
    description: "A custom hook shares logic, not UI. Change the hook and both consumers update.",
    code: `function usePulse() {
  const [on, setOn] = React.useState(true);
  React.useEffect(() => {
    const id = setInterval(() => setOn((value) => !value), 700);
    return () => clearInterval(id);
  }, []);
  return on;
}

function Indicator({ label }) {
  const on = usePulse();
  return <p>{label}: {on ? "active" : "cooldown"}</p>;
}

function Example() {
  return (
    <div>
      <Indicator label="Timer" />
      <Indicator label="Status" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  context: {
    title: "Context Provider",
    description: "Context makes shared values available lower in the tree without prop drilling every layer.",
    code: `const ThemeContext = React.createContext("ember");

function Status() {
  const theme = React.useContext(ThemeContext);
  return <p>Current arena theme: {theme}</p>;
}

function Example() {
  return (
    <ThemeContext.Provider value="midnight">
      <Status />
    </ThemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  performance: {
    title: "Derived Work",
    description: "Performance tuning starts with avoiding unnecessary work. Change the array or the filter logic and inspect the result.",
    code: `function Example() {
  const [query, setQuery] = React.useState("");
  const items = ["hooks", "state", "effects", "context", "testing"];
  const filtered = items.filter((item) => item.includes(query.toLowerCase()));

  return (
    <div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter topics" />
      <ul>
        {filtered.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  typescript: {
    title: "Type-Safe Props",
    description: "This example shows the runtime shape. In a real TypeScript file you would add a props type for the component contract.",
    code: `function PlayerCard(props) {
  return (
    <article>
      <h3>{props.name}</h3>
      <p>Role: {props.role}</p>
    </article>
  );
}

function Example() {
  return <PlayerCard name="Ari" role="Learner" />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  testing: {
    title: "User-Visible Output",
    description: "Good tests assert what users can observe. Edit the state and think about which text a test should query.",
    code: `function Example() {
  const [status, setStatus] = React.useState("Idle");

  return (
    <div>
      <button onClick={() => setStatus("Submitted")}>Submit</button>
      <p aria-live="polite">Status: {status}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  tooling: {
    title: "Component Module",
    description: "Tooling questions often come down to where code is split and how the runtime loads it. Keep the example focused on one module boundary.",
    code: `function Example() {
  return (
    <div>
      <h3>Build tools bundle this component</h3>
      <p>Try changing the text to simulate a quick iteration loop.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  accessibility: {
    title: "Accessible Controls",
    description: "Accessible UI preserves semantics and readable names. Edit the label text and button copy.",
    code: `function Example() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" placeholder="player@example.com" />
      <button type="submit">Save profile</button>
    </form>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  security: {
    title: "Escape Untrusted Content",
    description: "React escapes strings by default. Change the message to see plain text rendering without injecting HTML.",
    code: `function Example() {
  const unsafe = "<img src=x onerror=alert('xss') />";
  return (
    <div>
      <h3>React escapes this string</h3>
      <pre>{unsafe}</pre>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  },
  platform: {
    title: "Platform Feedback",
    description: "Different platforms trigger the same React event system in different environments. Keep the UI simple and inspect the event result.",
    code: `function Example() {
  const [message, setMessage] = React.useState("Tap or click the button");

  return (
    <div>
      <button onClick={() => setMessage("Input received by React")}>Interact</button>
      <p>{message}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Example />);`
  }
};

export function buildExplanation(question: Question) {
  return `${question.explanation}\n\n${TOPIC_CONTEXT[question.topic]}`;
}

export function getQuestionResources(question: Question) {
  return TOPIC_RESOURCES[question.topic] ?? [];
}

export function getQuestionPlayground(question: Question) {
  return TOPIC_PLAYGROUNDS[question.topic];
}

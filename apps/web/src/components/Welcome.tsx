import { cx } from "../lib/api";
import type { ThemeName } from "../lib/types";

function Feature(props: { title: string; desc: string }) {
  return (
    <div className="quest-feature-card rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{props.title}</div>
      <div className="mt-1 text-sm text-slate-600">{props.desc}</div>
    </div>
  );
}

export function Welcome(props: { theme: ThemeName; onLogin: () => void; onRegister: () => void; onGuest: () => void }) {
  return (
    <div className="grid gap-6">
      <div
        className={cx(
          "quest-hero grid overflow-hidden rounded-[2rem] border border-slate-200 p-8 shadow-sm backdrop-blur xl:grid-cols-[1.1fr_0.9fr]",
          props.theme === "midnight"
            ? "quest-hero-midnight"
            : props.theme === "ember"
              ? "quest-hero-ember"
              : props.theme === "nova"
                ? "quest-hero-nova"
                : props.theme === "sunset"
                  ? "quest-hero-sunset"
                  : "quest-hero-circuit"
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          New - Timed - Adaptive
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">1000 React questions, but it feels like a game.</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Beginner-friendly, but not beginner-only: you'll meet the obvious stuff (props/state) and the subtle stuff (keys, stale closures, test
          flakiness, accessibility, security, platform quirks).
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500" onClick={props.onRegister}>
            Create account
          </button>
          <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm hover:bg-slate-50" onClick={props.onLogin}>
            Log in
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Feature title="Weighted" desc="Covers fundamentals more often and revisits weak spots." />
          <Feature title="Incremental" desc="Difficulty ramps up as your rating rises." />
          <Feature title="Testing-aware" desc="Questions include timing, flake, mocks, a11y, and CI gotchas." />
        </div>
      </div>
    </div>
  );
}

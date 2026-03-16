import { cx } from "../lib/api";
import type { ThemeName } from "../lib/types";

function Feature(props: { title: string; desc: string }) {
  return (
    <div className="quest-feature-card rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface-glass)" }}>
      <div className="font-semibold" style={{ color: "var(--text-strong)" }}>{props.title}</div>
      <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{props.desc}</div>
    </div>
  );
}

export function Welcome(props: { theme: ThemeName; onLogin: () => void; onRegister: () => void; onGuest: () => void }) {
  const themeClass =
    props.theme === "midnight"
      ? "quest-hero-midnight"
      : props.theme === "ember"
        ? "quest-hero-ember"
        : props.theme === "nova"
          ? "quest-hero-nova"
          : props.theme === "sunset"
            ? "quest-hero-sunset"
            : "quest-hero-circuit";

  return (
    <div className="grid gap-6">
      <div
        className={cx(
          "quest-hero grid overflow-hidden rounded-[2rem] border p-8 shadow-sm backdrop-blur xl:grid-cols-[1.1fr_0.9fr]",
          themeClass
        )}
        style={{ borderColor: "var(--line)" }}
      >
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          New - Timed - Adaptive
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--text-strong)" }}>
          1000 React questions, but it feels like a game.
        </h1>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Beginner-friendly, but not beginner-only: you'll meet the obvious stuff (props/state) and the subtle stuff (keys, stale closures, test
          flakiness, accessibility, security, platform quirks).
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="quest-btn-primary rounded-xl px-5 py-3 text-sm font-semibold shadow" onClick={props.onRegister}>
            Create account
          </button>
          <button className="quest-btn-secondary rounded-xl px-5 py-3 text-sm" onClick={props.onLogin}>
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

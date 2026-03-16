import { useState } from "react";
import { api, cx } from "../lib/api";
import type { ThemeName } from "../lib/types";

export function AuthCard(props: {
  mode: "login" | "register";
  theme: ThemeName;
  onDone: (auth: { token: string; user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } }) => void;
  onSwitch: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [adminBootstrapKey, setAdminBootstrapKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = props.mode === "login" ? "Log in" : "Create your account";
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
    <div className="mx-auto max-w-md">
      <div className={cx("quest-hero quest-auth-card rounded-[2rem] border p-8", themeClass)} style={{ borderColor: "var(--line)" }}>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>{title}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>No spam. Just questions.</p>

        <div className="mt-5 grid gap-3">
          {props.mode === "register" && (
            <label className="grid gap-1 text-sm">
              <span style={{ color: "var(--text-muted)" }}>Display name</span>
              <input
                className="quest-input rounded-xl px-3 py-2 outline-none"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
          )}
          {props.mode === "register" && (
            <label className="grid gap-1 text-sm">
              <span style={{ color: "var(--text-muted)" }}>Admin bootstrap key</span>
              <input
                type="password"
                className="quest-input rounded-xl px-3 py-2 outline-none"
                value={adminBootstrapKey}
                onChange={(e) => setAdminBootstrapKey(e.target.value)}
              />
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>Optional. Only needed when creating the first admin account.</span>
            </label>
          )}
          <label className="grid gap-1 text-sm">
            <span style={{ color: "var(--text-muted)" }}>Email</span>
            <input
              type="email"
              className="quest-input rounded-xl px-3 py-2 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span style={{ color: "var(--text-muted)" }}>Password</span>
            <input
              type="password"
              className="quest-input rounded-xl px-3 py-2 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>Min 8 characters.</span>
          </label>

          {error && (
            <div className="rounded-xl px-3 py-2 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger-text)" }}>
              {error}
            </div>
          )}

          <button
            className="quest-btn-primary mt-2 rounded-xl px-4 py-2 text-sm font-semibold shadow disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const path = props.mode === "login" ? "/auth/login" : "/auth/register";
                const body =
                  props.mode === "login"
                    ? { email, password }
                    : {
                        email,
                        password,
                        displayName: displayName || "New Adventurer",
                        ...(adminBootstrapKey ? { adminBootstrapKey } : {})
                      };
                const r = await api<{ token: string; user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } }>(path, { method: "POST", body });
                props.onDone(r);
              } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Working..." : props.mode === "login" ? "Log in" : "Create account"}
          </button>

          <button
            className="quest-btn-secondary rounded-xl px-4 py-2 text-sm"
            onClick={props.onSwitch}
          >
            {props.mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

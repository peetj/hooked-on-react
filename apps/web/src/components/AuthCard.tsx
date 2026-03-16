import { useState } from "react";
import { api } from "../lib/api";

export function AuthCard(props: {
  mode: "login" | "register";
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

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">No spam. Just questions.</p>

      <div className="mt-5 grid gap-3">
        {props.mode === "register" && (
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Display name</span>
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
        )}
        {props.mode === "register" && (
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Admin bootstrap key</span>
            <input
              type="password"
              className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
              value={adminBootstrapKey}
              onChange={(e) => setAdminBootstrapKey(e.target.value)}
            />
            <span className="text-xs text-slate-500">Optional. Only needed when creating the first admin account.</span>
          </label>
        )}
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Email</span>
          <input
            type="email"
            className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Password</span>
          <input
            type="password"
            className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-xs text-slate-500">Min 8 characters.</span>
        </label>

        {error && <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

        <button
          className="mt-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
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

        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50" onClick={props.onSwitch}>
          {props.mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Dev note: set <span className="font-mono">VITE_API_URL</span> to point at the backend.
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import type { ServedQuestion, SubmitAnswerResponse } from "@react-quiz-1000/shared";
import { Admin, Leaderboard, Social } from "./components/Panels";

type View = "welcome" | "login" | "register" | "dashboard" | "quiz" | "leaderboard" | "social" | "admin";

type AuthState = {
  token: string | null;
  user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function useAuth(): [AuthState, (next: AuthState) => void, () => void] {
  const [auth, setAuth] = useState<AuthState>(() => {
    const raw = localStorage.getItem("rq_auth");
    if (!raw) return { token: null, user: null };
    try {
      return JSON.parse(raw) as AuthState;
    } catch {
      return { token: null, user: null };
    }
  });

  const set = (next: AuthState) => {
    setAuth(next);
    localStorage.setItem("rq_auth", JSON.stringify(next));
  };

  const clear = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem("rq_auth");
  };

  return [auth, set, clear];
}

async function api<T>(path: string, opts: { token?: string | null; method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export default function App() {
  const [view, setView] = useState<View>("welcome");
  const [auth, setAuthState, clearAuth] = useAuth();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [served, setServed] = useState<ServedQuestion | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);

  const startedAtRef = useRef<number>(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  const timeLimitMs = useMemo(() => (served ? served.timeLimitSec * 1000 : 0), [served]);

  useEffect(() => {
    if (!served) return;
    startedAtRef.current = Date.now();
    setTimeLeftMs(timeLimitMs);
    setSelected([]);
    setFeedback(null);

    const t = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const left = Math.max(0, timeLimitMs - elapsed);
      setTimeLeftMs(left);
    }, 100);

    return () => clearInterval(t);
  }, [served, timeLimitMs]);

  useEffect(() => {
    if (auth.token) setView("dashboard");
  }, [auth.token]);

  async function startSession() {
    if (!auth.token) throw new Error("Not logged in");
    const r = await api<{ sessionId: string }>("/session/start", { token: auth.token, method: "POST" });
    setSessionId(r.sessionId);
    setView("quiz");
  }

  async function loadNextQuestion() {
    if (!auth.token || !sessionId) throw new Error("Missing session");
    const q = await api<ServedQuestion>(`/session/${sessionId}/question`, { token: auth.token });
    setServed(q);
  }

  async function submitAnswer() {
    if (!auth.token || !sessionId || !served) return;

    const timeTakenMs = Date.now() - startedAtRef.current;
    const resp = await api<SubmitAnswerResponse>(`/session/${sessionId}/answer`, {
      token: auth.token,
      method: "POST",
      body: { questionId: served.question.id, selected, servedToken: served.servedToken, clientTimeTakenMs: timeTakenMs }
    });
    setFeedback(resp);
  }

  useEffect(() => {
    if (view !== "quiz") return;
    if (!sessionId) return;
    if (served) return;
    void loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, sessionId]);

  useEffect(() => {
    if (!served) return;
    if (feedback) return;
    if (timeLeftMs > 0) return;
    // auto-submit when time runs out
    void submitAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftMs, served, feedback]);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow" />
            <div className="leading-tight">
              <div className="font-semibold">React Quest</div>
              <div className="text-xs text-slate-500">1000 Questions • Adaptive • Timed</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {auth.user ? (
              <>
                <nav className="hidden items-center gap-2 sm:flex">
                  <button
                    className={cx(
                      "rounded-xl px-3 py-2 text-sm",
                      view === "dashboard" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() => setView("dashboard")}
                  >
                    Play
                  </button>
                  <button
                    className={cx(
                      "rounded-xl px-3 py-2 text-sm",
                      view === "leaderboard" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() => setView("leaderboard")}
                  >
                    Leaderboard
                  </button>
                  <button
                    className={cx(
                      "rounded-xl px-3 py-2 text-sm",
                      view === "social" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() => setView("social")}
                  >
                    Social
                  </button>
                  {(auth.user.role === "mod" || auth.user.role === "admin") && (
                    <button
                      className={cx(
                        "rounded-xl px-3 py-2 text-sm",
                        view === "admin" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      onClick={() => setView("admin")}
                    >
                      Admin
                    </button>
                  )}
                </nav>

                <div className="hidden text-sm text-slate-600 sm:block">
                  Signed in as <span className="font-medium text-slate-800">{auth.user.displayName}</span>
                </div>
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => {
                    clearAuth();
                    setView("welcome");
                    setSessionId(null);
                    setServed(null);
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => setView("login")}
                >
                  Log in
                </button>
                <button
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
                  onClick={() => setView("register")}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {view === "welcome" && (
          <Welcome
            onLogin={() => setView("login")}
            onRegister={() => setView("register")}
            onGuest={() => setView("register")}
          />
        )}

        {view === "login" && (
          <AuthCard
            mode="login"
            onDone={(next) => {
              setAuthState(next);
              setView("dashboard");
            }}
            onSwitch={() => setView("register")}
          />
        )}

        {view === "register" && (
          <AuthCard
            mode="register"
            onDone={(next) => {
              setAuthState(next);
              setView("dashboard");
            }}
            onSwitch={() => setView("login")}
          />
        )}

        {view === "dashboard" && auth.user && (
          <Dashboard
            onStart={async () => {
              await startSession();
              await loadNextQuestion();
            }}
            onOpenLeaderboard={() => setView("leaderboard")}
            onOpenSocial={() => setView("social")}
          />
        )}

        {view === "leaderboard" && (
          <Leaderboard token={auth.token} />
        )}

        {view === "social" && (
          <Social token={auth.token} />
        )}

        {view === "admin" && (
          <Admin token={auth.token} />
        )}

        {view === "quiz" && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Timed</span> • {served?.question.topic ?? ""} • difficulty {served?.question.difficulty ?? ""}
                </div>
                <div className={cx("rounded-xl px-3 py-1 text-sm font-semibold", timeLeftMs < 5000 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700")}>
                  {Math.ceil(timeLeftMs / 1000)}s
                </div>
              </div>
            </div>

            {served && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-lg font-semibold">{served.question.prompt}</div>
                <div className="mt-4 grid gap-2">
                  {served.question.options.map((opt, idx) => {
                    const multi = served.question.type === "multi";
                    const checked = selected.includes(idx);
                    const reveal = Boolean(feedback);
                    const isCorrect = feedback?.correctAnswer.includes(idx) ?? false;
                    const wasChosen = checked;

                    return (
                      <button
                        key={idx}
                        disabled={reveal}
                        onClick={() => {
                          setSelected((prev) => {
                            if (multi) {
                              return prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx];
                            }
                            return [idx];
                          });
                        }}
                        className={cx(
                          "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
                          reveal
                            ? isCorrect
                              ? "border-emerald-200 bg-emerald-50"
                              : wasChosen
                                ? "border-rose-200 bg-rose-50"
                                : "border-slate-200 bg-white"
                            : checked
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        <span
                          className={cx(
                            "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                            reveal
                              ? isCorrect
                                ? "bg-emerald-600 text-white"
                                : wasChosen
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-200 text-slate-700"
                              : checked
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 text-slate-700"
                          )}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm text-slate-800">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!feedback ? (
                    <>
                      <button
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void submitAnswer()}
                        disabled={selected.length === 0}
                      >
                        Lock it in
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                        onClick={() => setSelected([])}
                      >
                        Clear
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={cx("rounded-xl px-3 py-2 text-sm font-semibold", feedback.correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                        {feedback.correct ? "Correct!" : "Not quite."} • streak {feedback.newStreak} • rating {feedback.newRating.toFixed(1)} ({feedback.ratingDelta >= 0 ? "+" : ""}
                        {feedback.ratingDelta.toFixed(1)})
                      </div>
                      <button
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                        onClick={async () => {
                          setServed(null);
                          await loadNextQuestion();
                        }}
                      >
                        Next question
                      </button>
                    </>
                  )}
                </div>

                {feedback && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explanation</div>
                    <div className="mt-1 text-sm text-slate-700">{feedback.explanation}</div>
                  </div>
                )}

                <div className="mt-5 text-xs text-slate-500">
                  Tip: This quiz adapts. It will gently push you harder when you’re on a streak, and revisit weak topics when you slip.
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-slate-500">
          API: <span className="font-mono">{API_URL}</span>
        </footer>
      </main>
    </div>
  );
}

function Welcome(props: { onLogin: () => void; onRegister: () => void; onGuest: () => void }) {
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          New • Timed • Adaptive
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">1000 React questions, but it feels like a game.</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Beginner-friendly, but not beginner-only: you’ll meet the obvious stuff (props/state) and the subtle stuff (keys, stale closures, test
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

function Feature(props: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{props.title}</div>
      <div className="mt-1 text-sm text-slate-600">{props.desc}</div>
    </div>
  );
}

function Dashboard(props: { onStart: () => Promise<void>; onOpenLeaderboard: () => void; onOpenSocial: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-slate-500">Workflow</div>
        <ol className="mt-3 grid gap-2 text-sm text-slate-700">
          <li>
            <span className="font-semibold">1.</span> Start a run
          </li>
          <li>
            <span className="font-semibold">2.</span> Answer timed questions
          </li>
          <li>
            <span className="font-semibold">3.</span> Get instant explanation + skill rating adjustment
          </li>
          <li>
            <span className="font-semibold">4.</span> Flex on the leaderboard (politely)
          </li>
        </ol>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await props.onStart();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Starting…" : "Start a run"}
          </button>

          <button
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm hover:bg-slate-50"
            onClick={props.onOpenLeaderboard}
          >
            View leaderboard
          </button>
          <button className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm hover:bg-slate-50" onClick={props.onOpenSocial}>
            Social feed
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500">Next: badges, daily run, and (maybe) live duels.</div>
      </div>
    </div>
  );
}

function AuthCard(props: {
  mode: "login" | "register";
  onDone: (auth: { token: string; user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } }) => void;
  onSwitch: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
              const body = props.mode === "login" ? { email, password } : { email, password, displayName: displayName || "New Adventurer" };
              const r = await api<{ token: string; user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } }>(path, { method: "POST", body });
              props.onDone(r);
            } catch (e: unknown) {
              setError(e instanceof Error ? e.message : "Something went wrong");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Working…" : props.mode === "login" ? "Log in" : "Create account"}
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

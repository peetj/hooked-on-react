import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { BadgeDef, QuizStream, ServedQuestion, SessionMode, SubmitAnswerResponse } from "@react-quiz-1000/shared";
import { Admin, Leaderboard, Social } from "./components/Panels";
import { BadgeToast } from "./components/BadgeToast";
import { BadgesPanel } from "./components/BadgesPanel";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { ReactQuestArenaDashboard } from "./components/ReactQuestArenaDashboard";

type View = "welcome" | "login" | "register" | "dashboard" | "quiz" | "leaderboard" | "social" | "badges" | "admin" | "account";
type AccountSection = "profile" | "account" | "security" | "preferences";

type AuthState = {
  token: string | null;
  user: { id: string; email: string; displayName: string; role?: "user" | "mod" | "admin" } | null;
};

type ThemeName = "midnight" | "ember" | "nova" | "sunset" | "circuit";

type ActiveRun = {
  sessionId: string;
  stream: QuizStream;
  mode: SessionMode;
  paused: boolean;
  remainingTimeSec: number;
  correctCount: number;
  wrongCount: number;
  streak: number;
};

type TimerTone = "safe" | "warn" | "danger" | "critical";

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

function useTheme(): [ThemeName, (next: ThemeName) => void] {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const raw = localStorage.getItem("rq_theme");
    return raw === "ember" || raw === "nova" || raw === "sunset" || raw === "circuit" || raw === "midnight" ? raw : "midnight";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const set = (next: ThemeName) => {
    setTheme(next);
    localStorage.setItem("rq_theme", next);
  };

  return [theme, set];
}

function usePreferredStream(): [QuizStream, (next: QuizStream) => void] {
  const [stream, setStream] = useState<QuizStream>(() => {
    const raw = localStorage.getItem("rq_stream");
    return raw === "adaptive" || raw === "1" || raw === "2" || raw === "3" || raw === "4" || raw === "5" ? raw : "2";
  });

  const set = (next: QuizStream) => {
    setStream(next);
    localStorage.setItem("rq_stream", next);
  };

  return [stream, set];
}

function useSessionMode(): [SessionMode, (next: SessionMode) => void] {
  const [mode, setMode] = useState<SessionMode>(() => {
    const raw = localStorage.getItem("rq_mode");
    return raw === "practice" ? "practice" : "ranked";
  });

  const set = (next: SessionMode) => {
    setMode(next);
    localStorage.setItem("rq_mode", next);
  };

  return [mode, set];
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

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function getThemeSwatch(theme: ThemeName) {
  switch (theme) {
    case "ember":
      return "from-red-700 via-orange-500 to-amber-200";
    case "nova":
      return "from-fuchsia-700 via-rose-500 to-orange-300";
    case "sunset":
      return "from-orange-700 via-rose-500 to-amber-200";
    case "circuit":
      return "from-emerald-600 via-teal-400 to-lime-200";
    default:
      return "from-slate-950 via-slate-700 to-cyan-400";
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getTopicLabel(topic: ServedQuestion["question"]["topic"] | undefined) {
  switch (topic) {
    case "react-basics":
      return "React Basics";
    case "jsx":
      return "JSX";
    case "props":
      return "Props";
    case "state":
      return "State";
    case "events":
      return "Events";
    case "lists-keys":
      return "Lists and Keys";
    case "forms":
      return "Forms";
    case "effects":
      return "Effects";
    case "hooks":
      return "Hooks";
    case "context":
      return "Context";
    case "performance":
      return "Performance";
    case "typescript":
      return "TypeScript";
    case "testing":
      return "Testing";
    case "tooling":
      return "Tooling";
    case "accessibility":
      return "Accessibility";
    case "security":
      return "Security";
    case "platform":
      return "Platform";
    default:
      return "Challenge";
  }
}

function getStreamLabel(stream: QuizStream) {
  switch (stream) {
    case "1":
      return "Tier 1";
    case "2":
      return "Tier 2";
    case "3":
      return "Tier 3";
    case "4":
      return "Tier 4";
    case "5":
      return "Tier 5";
    default:
      return "Adaptive";
  }
}

function getStreamDescription(stream: QuizStream) {
  switch (stream) {
    case "1":
      return "Foundations and syntax reps";
    case "2":
      return "Core component and state practice";
    case "3":
      return "Production-ready React patterns";
    case "4":
      return "Advanced timing, architecture, and debugging";
    case "5":
      return "Expert traps and edge cases";
    default:
      return "Mixed difficulty that reacts to your streak";
  }
}

function getQuestionTypeLabel(type: ServedQuestion["question"]["type"] | undefined) {
  switch (type) {
    case "multi":
      return "Multi-select";
    case "truefalse":
      return "True or false";
    default:
      return "Single answer";
  }
}

function getDifficultyLabel(difficulty: number | undefined) {
  return difficulty ? `Level ${difficulty}` : "Adaptive";
}

function getModeLabel(mode: SessionMode) {
  return mode === "practice" ? "Learn" : "Timed";
}

function getModeDescription(mode: SessionMode) {
  return mode === "practice" ? "Relaxed mode with no clock and a live code example after each answer" : "Clock on and leaderboard eligible";
}

function getTimerTone(remainingRatio: number): TimerTone {
  if (remainingRatio > 0.66) return "safe";
  if (remainingRatio > 0.4) return "warn";
  if (remainingRatio > 0.2) return "danger";
  return "critical";
}

function formatCountdown(ms: number) {
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
}

export default function App() {
  const [view, setView] = useState<View>("welcome");
  const [accountSection, setAccountSection] = useState<AccountSection>("profile");
  const [auth, setAuthState, clearAuth] = useAuth();
  const [theme, setTheme] = useTheme();
  const [preferredStream, setPreferredStream] = usePreferredStream();
  const [sessionMode, setSessionMode] = useSessionMode();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [served, setServed] = useState<ServedQuestion | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<BadgeDef[]>([]);
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => localStorage.getItem("rq_reduce_motion") === "1");
  const [shake, setShake] = useState(false);
  const prevRatingRef = useRef<number>(0);
  const [levelUp, setLevelUp] = useState<{ from: number; to: number } | null>(null);

  const startedAtRef = useRef<number>(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [timerArmed, setTimerArmed] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  const timeLimitMs = useMemo(() => (served ? served.timeLimitSec * 1000 : 0), [served]);
  const displayCorrect = feedback?.correctCount ?? served?.correctCount ?? activeRun?.correctCount ?? 0;
  const displayWrong = feedback?.wrongCount ?? served?.wrongCount ?? activeRun?.wrongCount ?? 0;
  const displayStreak = feedback?.newStreak ?? served?.streak ?? activeRun?.streak ?? 0;
  const timerTone = served ? getTimerTone(timeLimitMs > 0 ? timeLeftMs / timeLimitMs : 0) : "safe";
  const activeMode = served?.mode ?? activeRun?.mode ?? sessionMode;
  const showTimer = Boolean(served && served.mode === "ranked" && served.timeLimitSec > 0);

  useEffect(() => {
    if (!served) return;
    setTimerArmed(false);
    startedAtRef.current = Date.now();
    setTimeLeftMs(timeLimitMs);
    setSelected([]);
    setFeedback(null);
    if (served.mode === "practice" || timeLimitMs <= 0) return;
    setTimerArmed(true);

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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!auth.token) {
      setActiveRun(null);
      return;
    }

    let cancelled = false;
    void api<{ active: ActiveRun | null }>("/session/active", { token: auth.token })
      .then((result) => {
        if (cancelled) return;
        setActiveRun(result.active);
        if (!result.active) setSessionId(null);
      })
      .catch(() => {
        if (!cancelled) setActiveRun(null);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  async function startSession(nextMode = sessionMode) {
    if (!auth.token) throw new Error("Not logged in");
    setRunError(null);
    setFeedback(null);
    setServed(null);
    setSelected([]);
    setActiveRun(null);

    try {
      const r = await api<{ sessionId: string; stream: QuizStream; mode: SessionMode }>("/session/start", {
        token: auth.token,
        method: "POST",
        body: { stream: preferredStream, mode: nextMode }
      });
      setSessionMode(nextMode);
      setSessionId(r.sessionId);
      setView("quiz");
    } catch (error) {
      setRunError(toErrorMessage(error));
      throw error;
    }
  }

  async function loadNextQuestion(nextSessionId = sessionId) {
    if (!auth.token || !nextSessionId) throw new Error("Missing session");
    setIsQuestionLoading(true);
    setRunError(null);
    setSelected([]);
    setFeedback(null);
    setTimerArmed(false);

    try {
      const q = await api<ServedQuestion>(`/session/${nextSessionId}/question`, { token: auth.token });
      setServed(q);
      setSessionId(q.sessionId);
      setActiveRun({
        sessionId: q.sessionId,
        stream: q.stream,
        mode: q.mode,
        paused: false,
        remainingTimeSec: q.timeLimitSec,
        correctCount: q.correctCount,
        wrongCount: q.wrongCount,
        streak: q.streak
      });
    } catch (error) {
      setRunError(toErrorMessage(error));
      throw error;
    } finally {
      setIsQuestionLoading(false);
    }
  }

  async function submitAnswer() {
    if (!auth.token || !sessionId || !served) return;

    setRunError(null);

    try {
      const timeTakenMs = Date.now() - startedAtRef.current;
      const resp = await api<SubmitAnswerResponse>(`/session/${sessionId}/answer`, {
        token: auth.token,
        method: "POST",
        body: { questionId: served.question.id, selected, servedToken: served.servedToken, clientTimeTakenMs: timeTakenMs }
      });
      setFeedback(resp);
      setActiveRun({
        sessionId,
        stream: served.stream,
        mode: resp.mode,
        paused: false,
        remainingTimeSec: 0,
        correctCount: resp.correctCount,
        wrongCount: resp.wrongCount,
        streak: resp.newStreak
      });

      if (!resp.correct) {
        setShake(true);
        window.setTimeout(() => setShake(false), 420);
      }

      if (resp.mode === "ranked") {
        const prev = prevRatingRef.current;
        prevRatingRef.current = resp.newRating;
        const tier = (x: number) => (x < 0 ? -1 : x < 15 ? 0 : x < 30 ? 1 : 2);
        if (tier(prev) < tier(resp.newRating)) {
          setLevelUp({ from: prev, to: resp.newRating });
          window.setTimeout(() => setLevelUp(null), 1800);
        }
      }

      if (resp.unlockedBadges?.length) {
        setBadgeQueue((q) => [...q, ...resp.unlockedBadges!]);
      }
    } catch (error) {
      setRunError(toErrorMessage(error));
      throw error;
    }
  }

  async function pauseSession() {
    if (!auth.token || !sessionId || !served || feedback) return;
    setIsPausing(true);
    setRunError(null);

    try {
      const result = await api<{ ok: true; remainingTimeSec: number }>(`/session/${sessionId}/pause`, {
        token: auth.token,
        method: "POST"
      });
      setActiveRun({
        sessionId,
        stream: served.stream,
        mode: served.mode,
        paused: true,
        remainingTimeSec: result.remainingTimeSec,
        correctCount: served.correctCount,
        wrongCount: served.wrongCount,
        streak: served.streak
      });
      setServed(null);
      setSelected([]);
      setFeedback(null);
      setTimerArmed(false);
      setView("dashboard");
    } catch (error) {
      setRunError(toErrorMessage(error));
      throw error;
    } finally {
      setIsPausing(false);
    }
  }

  async function resumeSession() {
    if (!auth.token || !activeRun) return;
    setRunError(null);
    setSessionId(activeRun.sessionId);
    setServed(null);
    setFeedback(null);
    setSelected([]);
    setTimerArmed(false);
    setView("quiz");

    try {
      if (activeRun.paused) {
        await api<{ ok: true; remainingTimeSec: number }>(`/session/${activeRun.sessionId}/resume`, {
          token: auth.token,
          method: "POST"
        });
      }
      await loadNextQuestion(activeRun.sessionId);
    } catch (error) {
      setRunError(toErrorMessage(error));
      throw error;
    }
  }

  async function handleLogout() {
    if (auth.token && sessionId && served && !feedback) {
      try {
        await pauseSession();
      } catch {
        // Best-effort pause; clear local auth either way.
      }
    }

    clearAuth();
    setView("welcome");
    setSessionId(null);
    setActiveRun(null);
    setServed(null);
    setSelected([]);
    setFeedback(null);
    setTimerArmed(false);
    setRunError(null);
  }

  useEffect(() => {
    if (view !== "quiz") return;
    if (!sessionId) return;
    if (served) return;
    if (isQuestionLoading || runError) return;
    void loadNextQuestion(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, sessionId, served, isQuestionLoading, runError]);

  useEffect(() => {
    if (!served) return;
    if (feedback) return;
    if (served.mode === "practice") return;
    if (!timerArmed) return;
    if (timeLeftMs > 0) return;
    // auto-submit when time runs out
    void submitAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeftMs, served, feedback, timerArmed]);

  const immersiveMode = (view === "dashboard" || view === "quiz") && !!auth.user;

  return (
    <div className={`theme-shell theme-${theme} min-h-full`}>
      <FeedbackPanel user={auth.user} view={view} reduceMotion={reduceMotion} />

      {badgeQueue[0] && (
        <BadgeToast
          badge={badgeQueue[0]}
          reduceMotion={reduceMotion}
          onDone={() => setBadgeQueue((q) => q.slice(1))}
        />
      )}

      {levelUp && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 mx-auto flex max-w-xl justify-center px-4">
          <div
            className={cx(
              "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow",
              reduceMotion ? "" : "animate-[pop_400ms_ease-out]"
            )}
          >
            Level up! Rating {levelUp.from.toFixed(1)} {"->"} {levelUp.to.toFixed(1)}
          </div>
        </div>
      )}

      <header className={cx("shell-header relative z-10", immersiveMode && "shell-header-dashboard")}>
        <div className={cx("shell-header-panel flex flex-col gap-5 px-6 py-5", immersiveMode && "shell-header-panel-dashboard")}>
          <div className="shell-utility-row">
            <div className="shell-utility-spacer" />
            <div className="shell-actions flex flex-wrap items-center justify-end gap-2">
              <ThemeSwitcher theme={theme} onChange={setTheme} />
              {auth.user ? (
                <AccountMenu
                  initials={getInitials(auth.user.displayName)}
                  onOpenSection={(section) => {
                    setAccountSection(section);
                    setView("account");
                  }}
                  onLogout={() => void handleLogout()}
                />
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

          {!immersiveMode && (
            <>
              <div className="shell-brand-row">
                <div className="shell-brand flex items-center gap-3">
                  <div className="theme-logo" aria-hidden="true">
                    <div className="theme-logo-core">
                      <div className="theme-logo-mark">
                        <div className="theme-logo-mark-shadow" />
                      </div>
                    </div>
                  </div>
                  <div className="shell-brand-copy leading-tight">
                    <div className="shell-brand-title">React Quest Arena</div>
                    <div className="shell-brand-subtitle">Code fast. Climb the leaderboard. Master React.</div>
                    <div className="shell-brand-ribbon">1000+ Challenges - Timed Battles - Epic Streaks</div>
                  </div>
                </div>
              </div>

              {auth.user && (
                <nav className="shell-nav shell-nav-wide">
                  <button
                    className={cx(
                      "shell-nav-button",
                      view === "dashboard" ? "shell-nav-button-active" : ""
                    )}
                    onClick={() => setView("dashboard")}
                  >
                    Play
                  </button>
                  <button
                    className={cx(
                      "shell-nav-button",
                      view === "leaderboard" ? "shell-nav-button-active" : ""
                    )}
                    onClick={() => setView("leaderboard")}
                  >
                    Leaderboard
                  </button>
                  <button
                    className={cx(
                      "shell-nav-button",
                      view === "social" ? "shell-nav-button-active" : ""
                    )}
                    onClick={() => setView("social")}
                  >
                    Social
                  </button>
                  <button
                    className={cx(
                      "shell-nav-button",
                      view === "badges" ? "shell-nav-button-active" : ""
                    )}
                    onClick={() => setView("badges")}
                  >
                    Badges
                  </button>
                  {(auth.user.role === "mod" || auth.user.role === "admin") && (
                    <button
                      className={cx(
                        "shell-nav-button",
                        view === "admin" ? "shell-nav-button-active" : ""
                      )}
                      onClick={() => setView("admin")}
                    >
                      Admin
                    </button>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </header>

      <main className={immersiveMode ? cx("dashboard-main-stage", view === "quiz" && "quiz-main-stage") : "mx-auto max-w-5xl px-4 py-8"}>
        {view === "welcome" && (
          <Welcome
            theme={theme}
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
            theme={theme}
            error={runError}
            selectedStream={preferredStream}
            sessionMode={sessionMode}
            activeRun={activeRun}
            onSelectStream={setPreferredStream}
            onSessionModeChange={setSessionMode}
            onStart={startSession}
            onStartMode={startSession}
            onResume={() => void resumeSession()}
            onOpenLeaderboard={() => setView("leaderboard")}
            onOpenSocial={() => setView("social")}
            onOpenBadges={() => setView("badges")}
            onOpenAdmin={() => setView("admin")}
            isAdmin={auth.user.role === "mod" || auth.user.role === "admin"}
          />
        )}

        {view === "account" && auth.user && (
          <AccountCenter
            user={auth.user}
            activeRun={activeRun}
            section={accountSection}
            onSectionChange={setAccountSection}
            theme={theme}
            onThemeChange={setTheme}
            reduceMotion={reduceMotion}
            onReduceMotionChange={(value) => {
              setReduceMotion(value);
              localStorage.setItem("rq_reduce_motion", value ? "1" : "0");
            }}
            selectedStream={preferredStream}
            sessionMode={sessionMode}
            onSelectStream={setPreferredStream}
            onSessionModeChange={setSessionMode}
          />
        )}

        {view === "leaderboard" && (
          <Leaderboard token={auth.token} selectedStream={preferredStream} onSelectStream={setPreferredStream} />
        )}

        {view === "social" && (
          <Social token={auth.token} />
        )}

        {view === "badges" && (
          <BadgesPanel token={auth.token} />
        )}

        {view === "admin" && (
          <Admin token={auth.token} />
        )}

        {view === "quiz" && (
          <div className="quiz-stage-shell">
            <div className={cx("arena-board quiz-arena-board", `arena-board-${theme}`)}>
              <div className="arena-board-backdrop" />
              <PixelField reduceMotion={reduceMotion} />
              <div className="section-banner">
                <span className="section-banner-line" />
                <h2 className="section-banner-title">{activeMode === "practice" ? "Learn Arena" : "Live Challenge"}</h2>
                <span className="section-banner-line" />
              </div>

              {served && (
                <div className="quiz-hud quiz-surface">
                  <div className="quiz-hud-top">
                    <div>
                      <div className="quiz-kicker">
                        {getModeLabel(served.mode)} run - {getStreamLabel(served.stream)}
                      </div>
                      <div className="quiz-topic-title">{getTopicLabel(served.question.topic)}</div>
                      <div className="quiz-topic-subtitle">
                        {getQuestionTypeLabel(served.question.type)} mode - {getStreamDescription(served.stream)}
                      </div>
                      <div className="quiz-chip-row">
                        <span className="quiz-chip">{getModeLabel(served.mode)}</span>
                        <span className="quiz-chip">{getDifficultyLabel(served.question.difficulty)}</span>
                        <span className="quiz-chip">{getQuestionTypeLabel(served.question.type)}</span>
                        <span className="quiz-chip">{showTimer ? `${served.timeLimitSec}s round` : "Clock off"}</span>
                      </div>
                    </div>

                    {showTimer ? (
                      <div className={cx("timer-pill", `timer-pill-${timerTone}`)}>
                        <span className="timer-pill-label">Time left</span>
                        <span className="timer-pill-value">{formatCountdown(timeLeftMs)}</span>
                      </div>
                    ) : (
                      <div className="timer-pill timer-pill-practice">
                        <span className="timer-pill-label">Run mode</span>
                        <span className="timer-pill-value">Learn Mode</span>
                        <span className="timer-pill-note">Clock off, relaxed pace, and a runnable code example after the answer.</span>
                      </div>
                    )}
                  </div>

                  <div className="quiz-stat-grid">
                    <QuizStatCard label="Mode" value={getModeLabel(served.mode)} tone="accent" />
                    <QuizStatCard label="Correct" value={String(displayCorrect)} tone="success" prominent />
                    <QuizStatCard label="Wrong" value={String(displayWrong)} tone="danger" prominent />
                    <QuizStatCard label="Streak" value={String(displayStreak)} tone="neutral" />
                  </div>
                </div>
              )}

              {runError && (
                <div className="quiz-alert quiz-alert-danger">
                  <div className="quiz-alert-title">Quiz action failed</div>
                  <div className="quiz-alert-copy">{runError}</div>
                  <div className="quiz-action-row">
                    <button
                      className="quiz-action quiz-action-danger"
                      disabled={!sessionId || isQuestionLoading}
                      onClick={() => {
                        setServed(null);
                        setFeedback(null);
                        setRunError(null);
                        void loadNextQuestion(sessionId ?? undefined).catch(() => undefined);
                      }}
                    >
                      Retry question
                    </button>
                    <button className="quiz-action quiz-action-secondary" onClick={() => setView("dashboard")}>
                      Back to dashboard
                    </button>
                  </div>
                </div>
              )}

              {isQuestionLoading && !served && <div className="quiz-loading-card">Loading the next question...</div>}

              {served && (
                <div className={cx("quiz-question-shell", shake && !reduceMotion ? "animate-[shake_380ms_ease-in-out]" : "")}>
                  <div className="quiz-question-kicker">Question prompt</div>
                  <div className="quiz-prompt">{served.question.prompt}</div>
                  <div className="quiz-options">
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
                            "quiz-option",
                            reveal
                              ? isCorrect
                                ? "quiz-option-correct"
                                : wasChosen
                                  ? "quiz-option-wrong"
                                  : "quiz-option-idle"
                              : checked
                                ? "quiz-option-selected"
                                : "quiz-option-idle"
                          )}
                        >
                          <span
                            className={cx(
                              "quiz-option-badge",
                              reveal
                                ? isCorrect
                                  ? "quiz-option-badge-correct"
                                  : wasChosen
                                    ? "quiz-option-badge-wrong"
                                    : "quiz-option-badge-idle"
                                : checked
                                  ? "quiz-option-badge-selected"
                                  : "quiz-option-badge-idle"
                            )}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="quiz-option-copy">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="quiz-action-row">
                    {!feedback ? (
                      <>
                        <button className="quiz-action quiz-action-primary" onClick={() => void submitAnswer()} disabled={selected.length === 0}>
                          Lock it in
                        </button>
                        <button className="quiz-action quiz-action-secondary" onClick={() => setSelected([])}>
                          Clear
                        </button>
                        <button className="quiz-action quiz-action-ghost" disabled={isPausing} onClick={() => void pauseSession()}>
                          {isPausing ? "Pausing..." : "Pause and return later"}
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          className={cx(
                            "quiz-feedback-banner",
                            feedback.correct ? "quiz-feedback-banner-success" : "quiz-feedback-banner-fail",
                            feedback.mode === "practice" && "quiz-feedback-banner-practice"
                          )}
                        >
                          {feedback.correct ? "Correct!" : "Not quite."} Streak {feedback.newStreak}.{" "}
                          {feedback.mode === "practice"
                            ? "Learn mode - no leaderboard score."
                            : `Rating ${feedback.newRating.toFixed(1)} (${feedback.ratingDelta >= 0 ? "+" : ""}${feedback.ratingDelta.toFixed(1)})`}
                        </div>
                        <button
                          className="quiz-action quiz-action-primary"
                          onClick={async () => {
                            setServed(null);
                            setFeedback(null);
                            try {
                              await loadNextQuestion(sessionId ?? undefined);
                            } catch {
                              // Error state is already surfaced in the quiz panel.
                            }
                          }}
                        >
                          Next question
                        </button>
                        <button className="quiz-action quiz-action-secondary" onClick={() => setView("dashboard")}>
                          Back to dashboard
                        </button>
                      </>
                    )}
                  </div>

                  {feedback && (
                    <div className="quiz-explanation-panel">
                      <div className="quiz-explanation-eyebrow">Why this answer wins</div>
                      <div className="quiz-explanation-copy">
                        {feedback.explanation.split("\n\n").map((paragraph) => (
                          <p key={paragraph} className="quiz-explanation-paragraph">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {feedback.resources && feedback.resources.length > 0 && (
                        <div className="mt-4">
                          <div className="quiz-explanation-eyebrow">Keep learning</div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {feedback.resources.map((resource) => (
                              <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="resource-card">
                                <span className="resource-card-label">{resource.label}</span>
                                <span className="resource-card-url">{resource.url.replace(/^https?:\/\//, "")}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {feedback.mode === "practice" && feedback.playground && (
                        <LearnPlayground example={feedback.playground} />
                      )}
                    </div>
                  )}

                  <div className="quiz-tip-note">
                    {activeMode === "practice"
                      ? "Learn mode keeps the clock off, opens a runnable example after each answer, and lets you pause or sign out without losing your place."
                      : "Timed runs keep the clock on and score this stream's leaderboard. You can still pause mid-run and return later."}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="mt-12 flex flex-wrap items-center justify-center gap-3 text-center text-xs text-slate-500">
          <span>
            API: <span className="font-mono">{API_URL}</span>
          </span>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => {
                const v = e.target.checked;
                setReduceMotion(v);
                localStorage.setItem("rq_reduce_motion", v ? "1" : "0");
              }}
            />
            Reduce motion
          </label>
        </footer>
      </main>
    </div>
  );
}

function Welcome(props: { theme: ThemeName; onLogin: () => void; onRegister: () => void; onGuest: () => void }) {
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

function Feature(props: { title: string; desc: string }) {
  return (
    <div className="quest-feature-card rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{props.title}</div>
      <div className="mt-1 text-sm text-slate-600">{props.desc}</div>
    </div>
  );
}

function Dashboard(props: {
  theme: ThemeName;
  error: string | null;
  selectedStream: QuizStream;
  sessionMode: SessionMode;
  activeRun: ActiveRun | null;
  onSelectStream: (next: QuizStream) => void;
  onSessionModeChange: (next: SessionMode) => void;
  onStart: (mode?: SessionMode) => Promise<void>;
  onStartMode: (mode: SessionMode) => Promise<void>;
  onResume: () => void;
  onOpenLeaderboard: () => void;
  onOpenSocial: () => void;
  onOpenBadges: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const extraStreams: QuizStream[] = ["adaptive", "4", "5"];
  const showSupportRail = true;

  return (
    <div className={cx("arena-dashboard-stage", `arena-dashboard-stage-${props.theme}`)}>
      <ReactQuestArenaDashboard
        selectedStream={props.selectedStream}
        sessionMode={props.sessionMode}
        busy={busy}
        onSelectStream={props.onSelectStream}
        onStartTimed={async () => {
          setBusy(true);
          try {
            await props.onStartMode("ranked");
          } catch {
            // Parent already surfaces run errors.
          } finally {
            setBusy(false);
          }
        }}
        onStartLearn={async () => {
          setBusy(true);
          try {
            await props.onStartMode("practice");
          } catch {
            // Parent already surfaces run errors.
          } finally {
            setBusy(false);
          }
        }}
        onOpenLeaderboard={props.onOpenLeaderboard}
        onOpenSocial={props.onOpenSocial}
      />

      {showSupportRail && (
        <div className="arena-dashboard-support">
          <div className="arena-dashboard-chipset arena-dashboard-mode-card">
            <div className="arena-dashboard-chip-label">Run mode</div>
            <div className="arena-dashboard-chip-row">
              {(["ranked", "practice"] as SessionMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cx("arena-dashboard-chip", props.sessionMode === mode && "arena-dashboard-chip-active")}
                  onClick={() => props.onSessionModeChange(mode)}
                >
                  {getModeLabel(mode)}
                </button>
              ))}
            </div>
            <div className="arena-dashboard-status-copy">{getModeDescription(props.sessionMode)}</div>
            <div className="arena-dashboard-mode-actions">
              <button
                type="button"
                className={cx("arena-dashboard-resume-button", props.sessionMode === "ranked" && "arena-dashboard-resume-button-active")}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await props.onStartMode("ranked");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Start timed run
              </button>
              <button
                type="button"
                className={cx("arena-dashboard-resume-button arena-dashboard-resume-button-learn", props.sessionMode === "practice" && "arena-dashboard-resume-button-active")}
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await props.onStartMode("practice");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Start learn mode
              </button>
            </div>
          </div>

          <div className="arena-dashboard-chipset">
            <div className="arena-dashboard-chip-label">Additional lanes</div>
            <div className="arena-dashboard-chip-row">
              {extraStreams.map((stream) => (
                <button
                  key={stream}
                  type="button"
                  className={cx("arena-dashboard-chip", props.selectedStream === stream && "arena-dashboard-chip-active")}
                  onClick={() => props.onSelectStream(stream)}
                >
                  {getStreamLabel(stream)}
                </button>
              ))}
            </div>
          </div>

          {(extraStreams.includes(props.selectedStream) || props.activeRun) && (
            <div className="arena-dashboard-status">
              <div className="arena-dashboard-status-kicker">Selected stream</div>
              <div className="arena-dashboard-status-title">
                {getModeLabel(props.sessionMode)} - {getStreamLabel(props.selectedStream)} - {getStreamDescription(props.selectedStream)}
              </div>
              <div className="arena-dashboard-status-copy">
                Tier cards on the poster drive Tier 1-3. Adaptive, Tier 4, and Tier 5 stay available here so the main screen can match the supplied art exactly.
              </div>
            </div>
          )}

          {props.activeRun && (
            <div className="arena-dashboard-resume">
              <div>
                <div className="arena-dashboard-status-kicker">{props.activeRun.paused ? "Paused run" : "Live run"}</div>
                <div className="arena-dashboard-status-title">
                  {getModeLabel(props.activeRun.mode)} - {getStreamLabel(props.activeRun.stream)} ready to {props.activeRun.paused ? "resume" : "continue"}
                </div>
                <div className="arena-dashboard-status-copy">
                  {props.activeRun.correctCount} correct - {props.activeRun.wrongCount} wrong - streak {props.activeRun.streak}
                  {props.activeRun.mode === "practice"
                    ? ". Clock stays off and the run is waiting for you."
                    : props.activeRun.paused
                      ? `. Clock resumes with about ${props.activeRun.remainingTimeSec}s left.`
                      : ". Sign out is safe and the run will still be here when you come back."}
                </div>
              </div>
              <button type="button" className="arena-dashboard-resume-button" onClick={props.onResume}>
                {props.activeRun.paused ? "Resume run" : "Jump back in"}
              </button>
            </div>
          )}

          {props.error && <div className="arena-dashboard-error">{props.error}</div>}
        </div>
      )}
    </div>
  );
}

function ThemeSwitcher(props: { theme: ThemeName; onChange: (next: ThemeName) => void }) {
  const options: Array<{ id: ThemeName; label: string }> = [
    { id: "midnight", label: "Midnight" },
    { id: "ember", label: "Ember" },
    { id: "nova", label: "Nova" },
    { id: "sunset", label: "Sunset" },
    { id: "circuit", label: "Circuit" }
  ];

  return (
    <label className="theme-picker">
      <span className={`theme-picker-swatch bg-gradient-to-r ${getThemeSwatch(props.theme)}`} />
      <select value={props.theme} onChange={(event) => props.onChange(event.target.value as ThemeName)} className="theme-picker-select">
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AccountMenu(props: { initials: string; onOpenSection: (section: AccountSection) => void; onLogout: () => void }) {
  return (
    <details className="account-menu">
      <summary className="account-menu-trigger">
        <span className="player-avatar">{props.initials}</span>
      </summary>
      <div className="account-menu-panel">
        <button className="account-menu-item" onClick={() => props.onOpenSection("profile")}>
          Profile
        </button>
        <button className="account-menu-item" onClick={() => props.onOpenSection("account")}>
          Account settings
        </button>
        <button className="account-menu-item" onClick={() => props.onOpenSection("security")}>
          Security
        </button>
        <button className="account-menu-item" onClick={() => props.onOpenSection("preferences")}>
          Preferences
        </button>
        <button className="account-menu-item account-menu-item-danger" onClick={props.onLogout}>
          Sign out
        </button>
      </div>
    </details>
  );
}

function AccountCenter(props: {
  user: NonNullable<AuthState["user"]>;
  activeRun: ActiveRun | null;
  section: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  theme: ThemeName;
  onThemeChange: (next: ThemeName) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (value: boolean) => void;
  selectedStream: QuizStream;
  sessionMode: SessionMode;
  onSelectStream: (next: QuizStream) => void;
  onSessionModeChange: (next: SessionMode) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="account-sidebar rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="account-sidebar-head">
          <div className="player-avatar">{getInitials(props.user.displayName)}</div>
          <div>
            <div className="text-sm font-semibold text-slate-900">{props.user.displayName}</div>
            <div className="text-xs text-slate-500">{props.user.email}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {([
            ["profile", "Profile"],
            ["account", "Account settings"],
            ["security", "Security"],
            ["preferences", "Preferences"]
          ] as Array<[AccountSection, string]>).map(([id, label]) => (
            <button
              key={id}
              className={cx("account-nav-button", props.section === id ? "account-nav-button-active" : "")}
              onClick={() => props.onSectionChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </aside>

      <div className="grid gap-4">
        {props.section === "profile" && (
          <section className="account-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="account-panel-kicker">Profile</div>
            <div className="account-panel-title">Your public player identity</div>
            <div className="account-panel-copy">This is the identity shown on the leaderboard, badges, and social encouragement lanes.</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Display name" value={props.user.displayName} />
              <InfoCard label="Email" value={props.user.email} />
              <InfoCard label="Role" value={props.user.role ?? "user"} />
              <InfoCard label="Avatar badge" value={getInitials(props.user.displayName)} />
            </div>
          </section>
        )}

        {props.section === "account" && (
          <section className="account-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="account-panel-kicker">Account settings</div>
            <div className="account-panel-title">How this account behaves in the app</div>
            <div className="account-panel-copy">These controls are local to this device for now, but they make the menu actually useful instead of being a disguised sign-out button.</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Default quiz lane" value={getStreamLabel(props.selectedStream)} />
              <InfoCard label="Default run mode" value={getModeLabel(props.sessionMode)} />
              <InfoCard label="Feedback identity" value={`${props.user.displayName} (${props.user.email})`} />
              <InfoCard
                label="Active run"
                value={
                  props.activeRun
                    ? `${getModeLabel(props.activeRun.mode)} ${getStreamLabel(props.activeRun.stream)}: ${props.activeRun.correctCount}/${props.activeRun.wrongCount}`
                    : "No run in progress"
                }
              />
              <InfoCard label="Theme family" value={props.theme} />
            </div>
          </section>
        )}

        {props.section === "security" && (
          <section className="account-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="account-panel-kicker">Security</div>
            <div className="account-panel-title">Protect the account and keep progress safe</div>
            <div className="account-panel-copy">Session recovery is now built in. If you sign out during a live question, the app will try to pause the run so you can return later.</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Current session" value="Stored on this browser" />
              <InfoCard label="Run recovery" value={props.activeRun ? "Available after pause or sign out" : "No paused/live run"} />
              <InfoCard label="Recommended" value="Use a unique password and sign out on shared devices" />
              <InfoCard label="Next security upgrade" value="Password reset and email verification would belong here next" />
            </div>
          </section>
        )}

        {props.section === "preferences" && (
          <section className="account-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="account-panel-kicker">Preferences</div>
            <div className="account-panel-title">Tune the arena to your taste</div>
            <div className="account-panel-copy">These settings are live and persist in local storage on this browser.</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="dashboard-select-card">
                <span className="dashboard-select-label">Theme</span>
                <select className="dashboard-select" value={props.theme} onChange={(event) => props.onThemeChange(event.target.value as ThemeName)}>
                  <option value="midnight">Midnight</option>
                  <option value="ember">Ember</option>
                  <option value="nova">Nova</option>
                  <option value="sunset">Sunset</option>
                  <option value="circuit">Circuit</option>
                </select>
                <span className="dashboard-select-help">Swap the whole visual mood of the app.</span>
              </label>

              <label className="dashboard-select-card">
                <span className="dashboard-select-label">Default stream</span>
                <select className="dashboard-select" value={props.selectedStream} onChange={(event) => props.onSelectStream(event.target.value as QuizStream)}>
                  <option value="adaptive">Adaptive</option>
                  <option value="1">Tier 1</option>
                  <option value="2">Tier 2</option>
                  <option value="3">Tier 3</option>
                  <option value="4">Tier 4</option>
                  <option value="5">Tier 5</option>
                </select>
                <span className="dashboard-select-help">Choose the stream the dashboard starts on.</span>
              </label>

              <label className="dashboard-select-card">
                <span className="dashboard-select-label">Default run mode</span>
                <select className="dashboard-select" value={props.sessionMode} onChange={(event) => props.onSessionModeChange(event.target.value as SessionMode)}>
                  <option value="ranked">Timed</option>
                  <option value="practice">Learn</option>
                </select>
                <span className="dashboard-select-help">Learn mode turns the clock off and opens a runnable example after each answer.</span>
              </label>

              <label className="dashboard-select-card account-toggle-card">
                <span className="dashboard-select-label">Motion</span>
                <span className="account-toggle-row">
                  <span className="text-sm text-slate-700">Reduce motion</span>
                  <input type="checkbox" checked={props.reduceMotion} onChange={(event) => props.onReduceMotionChange(event.target.checked)} />
                </span>
                <span className="dashboard-select-help">Tones down animated effects and celebratory motion.</span>
              </label>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function InfoCard(props: { label: string; value: string }) {
  return (
    <div className="account-info-card">
      <div className="dashboard-select-label">{props.label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{props.value}</div>
    </div>
  );
}

function PixelField(props: { reduceMotion: boolean }) {
  const pixels = useMemo(
    () =>
      Array.from({ length: props.reduceMotion ? 12 : 28 }, (_, index) => {
        const colors = ["#ffb25b", "#ff7b52", "#ffdd8f", "#c087ff", "#8f72ff"];
        const color = colors[index % colors.length];
        return {
          id: index,
          color,
          left: Math.random() * 100,
          size: 2 + Math.random() * 4,
          duration: 7 + Math.random() * 8,
          delay: Math.random() * 8,
          drift: -22 + Math.random() * 44,
          opacity: 0.35 + Math.random() * 0.45
        };
      }),
    [props.reduceMotion]
  );

  return (
    <div className="quiz-pixel-field" aria-hidden="true">
      {pixels.map((pixel) => {
        const style: CSSProperties & { "--pixel-drift": string } = {
          left: `${pixel.left}%`,
          width: `${pixel.size}px`,
          height: `${pixel.size}px`,
          animationDuration: `${pixel.duration}s`,
          animationDelay: `${pixel.delay}s`,
          opacity: pixel.opacity,
          background: pixel.color,
          boxShadow: `0 0 10px ${pixel.color}`,
          "--pixel-drift": `${pixel.drift}px`
        };

        return <span key={pixel.id} className="quiz-pixel" style={style} />;
      })}
    </div>
  );
}

function escapeScriptContent(value: string) {
  return value.replace(/<\/script>/gi, "<\\/script>");
}

function buildPlaygroundSrcDoc(code: string) {
  const safeCode = escapeScriptContent(code);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(255, 131, 55, 0.16), transparent 32%),
          linear-gradient(180deg, #140d1d, #0e0915);
        color: #fff4e7;
        font-family: Inter, system-ui, sans-serif;
      }
      #root {
        padding: 18px;
      }
      #playground-error {
        display: none;
        margin: 0 18px 18px;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(132, 28, 47, 0.85);
        color: #ffe7ec;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        white-space: pre-wrap;
      }
      button, input {
        font: inherit;
      }
      button {
        padding: 8px 12px;
        margin-right: 8px;
        border: 0;
        border-radius: 10px;
        background: linear-gradient(180deg, #ff9443, #b04416);
        color: white;
        cursor: pointer;
      }
      input {
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.16);
        background: rgba(255,255,255,0.08);
        color: white;
      }
      pre {
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <div id="playground-error"></div>
    <script>
      const errorNode = document.getElementById("playground-error");
      function showError(message) {
        errorNode.style.display = "block";
        errorNode.textContent = message;
      }
      window.addEventListener("error", (event) => {
        showError(event.error?.stack || event.message || "Unknown runtime error");
      });
      window.addEventListener("unhandledrejection", (event) => {
        showError(String(event.reason ?? "Unhandled promise rejection"));
      });
    </script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="text/babel">
${safeCode}
    </script>
  </body>
</html>`;
}

function LearnPlayground(props: { example: NonNullable<SubmitAnswerResponse["playground"]> }) {
  const [code, setCode] = useState(props.example.code);

  useEffect(() => {
    setCode(props.example.code);
  }, [props.example.code]);

  return (
    <div className="learn-playground">
      <div className="quiz-explanation-eyebrow">Try it live</div>
      <div className="learn-playground-head">
        <div>
          <div className="learn-playground-title">{props.example.title}</div>
          <div className="learn-playground-copy">{props.example.description}</div>
        </div>
        <button type="button" className="learn-playground-reset" onClick={() => setCode(props.example.code)}>
          Reset example
        </button>
      </div>
      <div className="learn-playground-grid">
        <label className="learn-playground-editor">
          <span className="learn-playground-label">Editable code</span>
          <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} />
        </label>
        <div className="learn-playground-preview-shell">
          <span className="learn-playground-label">Preview</span>
          <iframe
            title={props.example.title}
            className="learn-playground-preview"
            sandbox="allow-scripts"
            srcDoc={buildPlaygroundSrcDoc(code)}
          />
        </div>
      </div>
    </div>
  );
}

function QuizStatCard(props: { label: string; value: string; tone: "accent" | "success" | "danger" | "neutral"; prominent?: boolean }) {
  return (
    <div className={cx("quiz-stat-card", `quiz-stat-card-${props.tone}`, props.prominent ? "quiz-stat-card-prominent" : "")}>
      <div className="quiz-stat-label">{props.label}</div>
      <div className="quiz-stat-value">{props.value}</div>
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


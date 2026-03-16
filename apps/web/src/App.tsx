import { useEffect, useMemo, useRef, useState } from "react";
import type { BadgeDef, QuizStream, ServedQuestion, SessionMode, SubmitAnswerResponse } from "@react-quiz-1000/shared";
import { Admin, Leaderboard, Social } from "./components/Panels";
import { BadgeToast } from "./components/BadgeToast";
import { BadgesPanel } from "./components/BadgesPanel";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { Welcome } from "./components/Welcome";
import { Dashboard } from "./components/Dashboard";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { AccountMenu, AccountCenter } from "./components/AccountCenter";
import { AuthCard } from "./components/AuthCard";
import { PixelField, LearnPlayground } from "./components/QuizArena";
import posterLogo from "./assets/arena/nexgen-logo-poster.png";
import { api, cx, API_URL } from "./lib/api";
import { useAuth, useTheme, usePreferredStream, useSessionMode, useArenaEffectsSettings } from "./lib/hooks";
import { toErrorMessage, getInitials, getTopicLabel, getStreamLabel, getStreamDescription, getQuestionTypeLabel, getDifficultyLabel, getModeLabel, getTimerTone, formatCountdown } from "./lib/helpers";
import type { View, AccountSection, ActiveRun } from "./lib/types";
import { createQuizSound } from "./lib/quiz-sound";

function QuizActionGlyph(props: { name: "clear" | "dashboard" | "next" | "pause" | "retry" }) {
  if (props.name === "clear") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 5l10 10M15 5L5 15" />
      </svg>
    );
  }

  if (props.name === "dashboard") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z" />
      </svg>
    );
  }

  if (props.name === "pause") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M7 4v12M13 4v12" />
      </svg>
    );
  }

  if (props.name === "retry") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 10a5 5 0 119 3M5 10V5m0 5h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h10M10 5l5 5-5 5" />
    </svg>
  );
}

export default function App() {
  const [auth, setAuthState, clearAuth] = useAuth();
  const [view, setView] = useState<View>(() => (auth.token ? "dashboard" : "welcome"));
  const [accountSection, setAccountSection] = useState<AccountSection>("profile");
  const [theme, setTheme] = useTheme();
  const [preferredStream, setPreferredStream] = usePreferredStream();
  const [sessionMode, setSessionMode] = useSessionMode();
  const [arenaEffects, setArenaEffects] = useArenaEffectsSettings();
  const [openShellMenu, setOpenShellMenu] = useState<"theme" | "account" | null>(null);
  const [accountOverlayOpen, setAccountOverlayOpen] = useState(false);

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

  const quizSoundRef = useRef(createQuizSound());
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
    setOpenShellMenu(null);
  }, [view, auth.user?.id]);

  useEffect(() => {
    if (auth.user) return;
    setAccountOverlayOpen(false);
  }, [auth.user]);

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

      if (!reduceMotion) {
        if (resp.correct) quizSoundRef.current.playCorrect();
        else quizSoundRef.current.playWrong();
      }

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
    if (auth.token && activeRun && !activeRun.paused && !feedback) {
      try {
        await api<{ ok: true; remainingTimeSec: number }>(`/session/${activeRun.sessionId}/pause`, {
          token: auth.token,
          method: "POST"
        });
      } catch {
        // Best-effort pause; clear local auth either way.
      }
    }

    clearAuth();
    setOpenShellMenu(null);
    setAccountOverlayOpen(false);
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

  const prevTimerToneRef = useRef(timerTone);
  useEffect(() => {
    const prev = prevTimerToneRef.current;
    prevTimerToneRef.current = timerTone;
    if (reduceMotion || !showTimer || feedback) return;
    if (prev !== timerTone) {
      if (timerTone === "warn") quizSoundRef.current.playTimerWarn();
      else if (timerTone === "critical") quizSoundRef.current.playTimerCritical();
    }
  }, [timerTone, reduceMotion, showTimer, feedback]);

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

  const quizHeaderText = served
    ? `${getModeLabel(served.mode)} - ${getStreamLabel(served.stream)} - ${getTopicLabel(served.question.topic)}`
    : activeRun
      ? `${getModeLabel(activeRun.mode)} - ${getStreamLabel(activeRun.stream)} - ${activeRun.paused ? "Paused run" : "Live run"}`
      : `${getModeLabel(sessionMode)} - ${getStreamLabel(preferredStream)} - Ready to play`;
  const immersiveMode = (view === "dashboard" || view === "quiz") && !!auth.user;
  const quizRibbonText = quizHeaderText;

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
              {auth.user ? (
                <div className="shell-control-cluster">
                  <ThemeSwitcher
                    theme={theme}
                    open={openShellMenu === "theme"}
                    onChange={setTheme}
                    onOpenChange={(open) => setOpenShellMenu(open ? "theme" : null)}
                  />
                  <AccountMenu
                    embedded
                    initials={getInitials(auth.user.displayName)}
                    open={openShellMenu === "account"}
                    onOpenChange={(open) => setOpenShellMenu(open ? "account" : null)}
                    onOpenSection={(section) => {
                      setAccountSection(section);
                      setOpenShellMenu(null);
                      setAccountOverlayOpen(true);
                    }}
                    onLogout={() => void handleLogout()}
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <ThemeSwitcher
                    theme={theme}
                    open={openShellMenu === "theme"}
                    onChange={setTheme}
                    onOpenChange={(open) => setOpenShellMenu(open ? "theme" : null)}
                  />
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
            theme={theme}
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
            theme={theme}
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
            effects={arenaEffects}
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

        {view === "leaderboard" && (
          <Leaderboard
            token={auth.token}
            viewerId={auth.user?.id ?? null}
            selectedStream={preferredStream}
            onSelectStream={setPreferredStream}
          />
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
              <PixelField reduceMotion={reduceMotion} theme="midnight" />
              <div className="quiz-brand-hero">
                <div className="quiz-logo-wrap" aria-hidden="true">
                  <img className="quiz-logo-image" src={posterLogo} alt="" />
                </div>
                <div className="quiz-brand-eyebrow">Nexgen React Arena</div>
                <h1 className="quiz-brand-title">React Quest Arena</h1>
                <div className="shell-brand-ribbon quiz-brand-ribbon" title={quizHeaderText} data-raw-ribbon={quizRibbonText}>
                  {quizHeaderText}
                </div>
              </div>

              {served && (
                <div className="quiz-session-strip">
                  <div className="quiz-session-copy">
                    <div className="quiz-kicker">Current challenge</div>
                    <div className="quiz-topic-title">{getTopicLabel(served.question.topic)}</div>
                    <div className="quiz-session-summary">{getStreamDescription(served.stream)}</div>
                    <div className="quiz-overview-meta">
                      <span>{getModeLabel(served.mode)}</span>
                      <span>{getDifficultyLabel(served.question.difficulty)}</span>
                      <span>{getQuestionTypeLabel(served.question.type)}</span>
                      <span>{showTimer ? `${served.timeLimitSec} second round` : "Clock off"}</span>
                    </div>
                  </div>

                  <div className="quiz-session-side">
                    {showTimer ? (
                      <div className={cx("timer-pill", `timer-pill-${timerTone}`)}>
                        <span className="timer-pill-label">Time left</span>
                        <span className="timer-pill-value">{formatCountdown(timeLeftMs)}</span>
                      </div>
                    ) : (
                      <div className="timer-pill timer-pill-practice">
                        <span className="timer-pill-label">Run mode</span>
                        <span className="timer-pill-value">Learn pace</span>
                      </div>
                    )}

                    <div className="quiz-mini-stat-row">
                      <div className="quiz-mini-stat quiz-mini-stat-success">
                        <span className="quiz-mini-stat-label">Correct</span>
                        <span className="quiz-mini-stat-value">{displayCorrect}</span>
                      </div>
                      <div className="quiz-mini-stat quiz-mini-stat-danger">
                        <span className="quiz-mini-stat-label">Wrong</span>
                        <span className="quiz-mini-stat-value">{displayWrong}</span>
                      </div>
                      <div className="quiz-mini-stat quiz-mini-stat-neutral">
                        <span className="quiz-mini-stat-label">Streak</span>
                        <span className="quiz-mini-stat-value">{displayStreak}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {runError && (
                <div className="quiz-alert quiz-alert-danger">
                  <div className="quiz-alert-title">Quiz action failed</div>
                  <div className="quiz-alert-copy">{runError}</div>
                  <div className="quiz-utility-actions quiz-utility-actions-wrap">
                    <button
                      className="quiz-icon-action quiz-icon-action-accent"
                      disabled={!sessionId || isQuestionLoading}
                      onClick={() => {
                        setServed(null);
                        setFeedback(null);
                        setRunError(null);
                        void loadNextQuestion(sessionId ?? undefined).catch(() => undefined);
                      }}
                    >
                      <QuizActionGlyph name="retry" />
                      <span>Retry</span>
                    </button>
                    <button className="quiz-icon-action" onClick={() => setView("dashboard")}>
                      <QuizActionGlyph name="dashboard" />
                      <span>Dashboard</span>
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

                  {!feedback ? (
                    <div className="quiz-action-row">
                      <button className="quiz-action quiz-action-primary" onClick={() => void submitAnswer()} disabled={selected.length === 0}>
                        Lock it in
                      </button>
                      <div className="quiz-utility-actions">
                        <button className="quiz-icon-action" onClick={() => setSelected([])}>
                          <QuizActionGlyph name="clear" />
                          <span>Clear</span>
                        </button>
                        <button className="quiz-icon-action" disabled={isPausing} onClick={() => void pauseSession()}>
                          <QuizActionGlyph name="pause" />
                          <span>{isPausing ? "Pausing" : "Pause"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="quiz-feedback-rail">
                      <div
                        className={cx(
                          "quiz-feedback-banner",
                          feedback.correct ? "quiz-feedback-banner-success" : "quiz-feedback-banner-fail",
                          feedback.mode === "practice" && "quiz-feedback-banner-practice"
                        )}
                      >
                        {feedback.correct ? "Correct." : "Not quite."} Streak {feedback.newStreak}.{" "}
                        {feedback.mode === "practice"
                          ? "Practice run only."
                          : `Rating ${feedback.newRating.toFixed(1)} (${feedback.ratingDelta >= 0 ? "+" : ""}${feedback.ratingDelta.toFixed(1)})`}
                      </div>
                      <div className="quiz-utility-actions">
                        <button
                          className="quiz-icon-action quiz-icon-action-accent"
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
                          <QuizActionGlyph name="next" />
                          <span>Next</span>
                        </button>
                        <button className="quiz-icon-action" onClick={() => setView("dashboard")}>
                          <QuizActionGlyph name="dashboard" />
                          <span>Dashboard</span>
                        </button>
                      </div>
                    </div>
                  )}

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

                </div>
              )}
            </div>
          </div>
        )}

        {view !== "quiz" && (
          <footer className="mt-12 flex flex-wrap items-center justify-center gap-3 text-center text-xs" style={{ color: "var(--text-faint)" }}>
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
        )}
      </main>

      {auth.user && accountOverlayOpen && (
        <AccountCenter
          user={auth.user}
          activeRun={activeRun}
          section={accountSection}
          onSectionChange={setAccountSection}
          onClose={() => setAccountOverlayOpen(false)}
          theme={theme}
          onThemeChange={setTheme}
          reduceMotion={reduceMotion}
          onReduceMotionChange={(value) => {
            setReduceMotion(value);
            localStorage.setItem("rq_reduce_motion", value ? "1" : "0");
          }}
          arenaEffects={arenaEffects}
          onArenaEffectsChange={setArenaEffects}
          selectedStream={preferredStream}
          sessionMode={sessionMode}
          onSelectStream={setPreferredStream}
          onSessionModeChange={setSessionMode}
        />
      )}
    </div>
  );
}


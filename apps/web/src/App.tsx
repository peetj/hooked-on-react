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
import { PixelField, LearnPlayground, QuizStatCard } from "./components/QuizArena";
import { api, cx, API_URL } from "./lib/api";
import { useAuth, useTheme, usePreferredStream, useSessionMode } from "./lib/hooks";
import { toErrorMessage, getInitials, getTopicLabel, getStreamLabel, getStreamDescription, getQuestionTypeLabel, getDifficultyLabel, getModeLabel, getTimerTone, formatCountdown } from "./lib/helpers";
import type { View, AccountSection, ActiveRun } from "./lib/types";
import { createQuizSound } from "./lib/quiz-sound";

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
              <PixelField reduceMotion={reduceMotion} theme={theme} />
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
      </main>
    </div>
  );
}

import { useState } from "react";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import { cx } from "../lib/api";
import type { ThemeName, ActiveRun } from "../lib/types";
import { getModeLabel, getModeDescription, getStreamLabel, getStreamDescription } from "../lib/helpers";
import { ReactQuestArenaDashboard } from "./ReactQuestArenaDashboard";

export function Dashboard(props: {
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
        theme={props.theme}
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

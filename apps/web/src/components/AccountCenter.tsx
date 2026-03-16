import { cx } from "../lib/api";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import type { AuthState, ThemeName, ActiveRun, AccountSection } from "../lib/types";
import { getInitials, getStreamLabel, getModeLabel } from "../lib/helpers";

function InfoCard(props: { label: string; value: string }) {
  return (
    <div className="account-info-card">
      <div className="dashboard-select-label">{props.label}</div>
      <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{props.value}</div>
    </div>
  );
}

export function AccountMenu(props: { initials: string; onOpenSection: (section: AccountSection) => void; onLogout: () => void }) {
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

export function AccountCenter(props: {
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
      <aside className="account-sidebar quest-panel rounded-3xl border p-4 shadow-sm">
        <div className="account-sidebar-head">
          <div className="player-avatar">{getInitials(props.user.displayName)}</div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{props.user.displayName}</div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>{props.user.email}</div>
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
          <section className="account-panel quest-panel rounded-3xl border p-6 shadow-sm">
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
          <section className="account-panel quest-panel rounded-3xl border p-6 shadow-sm">
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
          <section className="account-panel quest-panel rounded-3xl border p-6 shadow-sm">
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
          <section className="account-panel quest-panel rounded-3xl border p-6 shadow-sm">
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
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Reduce motion</span>
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

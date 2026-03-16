import { useEffect, useRef } from "react";
import { cx } from "../lib/api";
import type { QuizStream, SessionMode } from "@react-quiz-1000/shared";
import type { AuthState, ThemeName, ActiveRun, AccountSection, ArenaEffectsPalette, ArenaEffectsSettings } from "../lib/types";
import { getInitials, getStreamLabel, getModeLabel } from "../lib/helpers";

const ENERGY_PALETTES: Array<{ id: ArenaEffectsPalette; label: string; colors: string[] }> = [
  { id: "classic", label: "Classic", colors: ["#f0a500", "#ffd166", "#9060f0"] },
  { id: "ember", label: "Ember", colors: ["#ff6c38", "#ff8f5a", "#ffd3b0"] },
  { id: "nova", label: "Nova", colors: ["#ff66b9", "#ffb8ec", "#d57eff"] },
  { id: "sunset", label: "Sunset", colors: ["#ff835d", "#ffb24f", "#ffd7c0"] },
  { id: "circuit", label: "Circuit", colors: ["#2bc993", "#5ef2cb", "#9dffe0"] }
];

function InfoCard(props: { label: string; value: string }) {
  return (
    <div className="account-info-card">
      <div className="dashboard-select-label">{props.label}</div>
      <div className="mt-2 text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{props.value}</div>
    </div>
  );
}

function RangeCard(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueLabel?: string;
  help: string;
  onChange: (next: number) => void;
}) {
  return (
    <label className="dashboard-select-card account-range-card">
      <span className="dashboard-select-label">{props.label}</span>
      <div className="account-range-head">
        <span className="account-range-caption">{props.help}</span>
        <span className="account-range-value">{props.valueLabel ?? props.value}</span>
      </div>
      <input
        className="account-range-input"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function AccountMenu(props: {
  initials: string;
  onOpenSection: (section: AccountSection) => void;
  onLogout: () => void;
  embedded?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { embedded, initials, onLogout, onOpenChange, onOpenSection, open } = props;
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | PointerEvent) => {
      if (!(event.target instanceof Node) || menuRef.current?.contains(event.target)) return;
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div ref={menuRef} className={cx("account-menu", embedded && "account-menu-embedded", open && "account-menu-open")}>
      <button
        ref={triggerRef}
        type="button"
        className={cx("account-menu-trigger", embedded && "account-menu-trigger-embedded")}
        aria-label="Profile"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className="player-avatar">{initials}</span>
      </button>
      <div className="account-menu-panel" hidden={!open} role="menu">
        <button className="account-menu-item" onClick={() => {
          onOpenChange(false);
          onOpenSection("profile");
        }}>
          Profile
        </button>
        <button className="account-menu-item" onClick={() => {
          onOpenChange(false);
          onOpenSection("account");
        }}>
          Account settings
        </button>
        <button className="account-menu-item" onClick={() => {
          onOpenChange(false);
          onOpenSection("security");
        }}>
          Security
        </button>
        <button className="account-menu-item" onClick={() => {
          onOpenChange(false);
          onOpenSection("preferences");
        }}>
          Preferences
        </button>
        <button className="account-menu-item account-menu-item-danger" onClick={() => {
          onOpenChange(false);
          onLogout();
        }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AccountCenter(props: {
  user: NonNullable<AuthState["user"]>;
  activeRun: ActiveRun | null;
  section: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  onClose: () => void;
  theme: ThemeName;
  onThemeChange: (next: ThemeName) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (value: boolean) => void;
  arenaEffects: ArenaEffectsSettings;
  onArenaEffectsChange: (next: ArenaEffectsSettings) => void;
  selectedStream: QuizStream;
  sessionMode: SessionMode;
  onSelectStream: (next: QuizStream) => void;
  onSessionModeChange: (next: SessionMode) => void;
}) {
  const { onClose } = props;
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const updateEffects = <K extends keyof ArenaEffectsSettings>(key: K, value: ArenaEffectsSettings[K]) => {
    props.onArenaEffectsChange({
      ...props.arenaEffects,
      [key]: value
    });
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="account-overlay" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title">
      <button
        type="button"
        className="account-overlay-backdrop"
        aria-label="Close account settings"
        onClick={onClose}
      />

      <div className="account-dialog">
        <div className="account-dialog-head">
          <div>
            <div className="account-dialog-kicker">Account Center</div>
            <h2 className="account-dialog-title" id="account-dialog-title">Settings and profile</h2>
            <p className="account-dialog-copy">Modern app-style settings, with the section you opened from the profile menu already in focus.</p>
          </div>
          <button ref={closeRef} type="button" className="account-dialog-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="account-dialog-shell">
          <aside className="account-sidebar account-sidebar-overlay">
            <div className="account-sidebar-head">
              <div className="player-avatar">{getInitials(props.user.displayName)}</div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>{props.user.displayName}</div>
                <div className="text-xs" style={{ color: "var(--text-faint)" }}>{props.user.email}</div>
              </div>
            </div>

            <div className="account-nav-stack">
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

          <div className="account-dialog-stage">
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

                  <RangeCard
                    label="Effects throttle"
                    value={props.arenaEffects.intensity}
                    min={0}
                    max={100}
                    step={5}
                    valueLabel={`${props.arenaEffects.intensity}%`}
                    help="Scale the poster glow and motion without losing the overall landing-page look."
                    onChange={(next) => updateEffects("intensity", next)}
                  />

                  <RangeCard
                    label="Grid lines"
                    value={props.arenaEffects.gridLineCount}
                    min={4}
                    max={48}
                    valueLabel={`${props.arenaEffects.gridLineCount}`}
                    help="Lower values keep the background broad. Higher values pack the grid much tighter."
                    onChange={(next) => updateEffects("gridLineCount", next)}
                  />

                  <RangeCard
                    label="Grid color range"
                    value={props.arenaEffects.gridColorRange}
                    min={0}
                    max={100}
                    step={5}
                    valueLabel={`${props.arenaEffects.gridColorRange}%`}
                    help="Push the grid from a soft neutral lattice into a stronger two-tone themed color spread."
                    onChange={(next) => updateEffects("gridColorRange", next)}
                  />

                  <RangeCard
                    label="Effect transparency"
                    value={props.arenaEffects.effectTransparency}
                    min={0}
                    max={100}
                    step={5}
                    valueLabel={`${props.arenaEffects.effectTransparency}%`}
                    help="Control how present the grid and energy effects feel against the main poster artwork."
                    onChange={(next) => updateEffects("effectTransparency", next)}
                  />

                  <RangeCard
                    label="Energy dots"
                    value={props.arenaEffects.energyDotCount}
                    min={0}
                    max={180}
                    valueLabel={`${props.arenaEffects.energyDotCount}`}
                    help="Adjust how many floating dots drift through the poster background."
                    onChange={(next) => updateEffects("energyDotCount", next)}
                  />

                  <div className="dashboard-select-card account-palette-card md:col-span-2">
                    <span className="dashboard-select-label">Energy colors</span>
                    <div className="account-palette-grid">
                      {ENERGY_PALETTES.map((palette) => (
                        <button
                          key={palette.id}
                          type="button"
                          className={cx(
                            "account-palette-button",
                            props.arenaEffects.energyPalette === palette.id && "account-palette-button-active"
                          )}
                          onClick={() => updateEffects("energyPalette", palette.id)}
                        >
                          <span className="account-palette-swatches" aria-hidden="true">
                            {palette.colors.map((color) => (
                              <span key={color} className="account-palette-swatch" style={{ background: color }} />
                            ))}
                          </span>
                          <span>{palette.label}</span>
                        </button>
                      ))}
                    </div>
                    <span className="dashboard-select-help">Swap the floating energy palette without changing the app theme itself.</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

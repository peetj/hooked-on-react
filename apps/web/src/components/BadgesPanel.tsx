import { useEffect, useState } from "react";
import type { BadgeDef } from "../lib/badges";
import { api } from "../lib/api";

export function BadgesPanel(props: { token: string | null }) {
  const [unlocked, setUnlocked] = useState<Array<BadgeDef & { unlockedAt?: string }>>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!props.token) return;
    void api<{ unlocked: Array<BadgeDef & { unlockedAt?: string }> }>("/badges/me", { token: props.token })
      .then((r) => setUnlocked(r.unlocked))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "failed"));
  }, [props.token]);

  return (
    <div className="quest-panel rounded-3xl border p-6 shadow-sm">
      <div className="quest-panel-kicker text-sm font-semibold">Badges</div>
      <div className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>Trophy cabinet</div>
      <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Earned through streaks, consistency, and good dev habits.</div>

      {err && <div className="mt-4 rounded-xl px-3 py-2 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger-text)" }}>{err}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {unlocked.map((b) => (
          <div key={b.id} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface-alt)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl shadow-sm" style={{ background: "var(--surface-glass)" }}>{b.emoji}</div>
              <div className="min-w-0">
                <div className="truncate font-semibold" style={{ color: "var(--text-strong)" }}>{b.name}</div>
                <div className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{b.desc}</div>
                <div className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>{b.rarity}{b.unlockedAt ? ` • ${new Date(b.unlockedAt).toLocaleString()}` : ""}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {unlocked.length === 0 && <div className="mt-4 text-sm" style={{ color: "var(--text-faint)" }}>No badges yet. Start a run and unlock First Blood.</div>}
    </div>
  );
}

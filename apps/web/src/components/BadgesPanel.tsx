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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">Badges</div>
      <div className="text-2xl font-bold text-slate-900">Trophy cabinet</div>
      <div className="mt-1 text-sm text-slate-600">Earned through streaks, consistency, and good dev habits.</div>

      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {unlocked.map((b) => (
          <div key={b.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">{b.emoji}</div>
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{b.name}</div>
                <div className="truncate text-sm text-slate-600">{b.desc}</div>
                <div className="mt-1 text-xs text-slate-500">{b.rarity}{b.unlockedAt ? ` • ${new Date(b.unlockedAt).toLocaleString()}` : ""}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {unlocked.length === 0 && <div className="mt-4 text-sm text-slate-500">No badges yet. Start a run and unlock First Blood.</div>}
    </div>
  );
}

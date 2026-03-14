import { useEffect, useState } from "react";
import type { QuizStream } from "@react-quiz-1000/shared";
import { ENCOURAGEMENT_TEMPLATES } from "../lib/social";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

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

type LeaderboardRow = {
  userId: string;
  displayName: string;
  rating: number;
  totalAnswered: number;
  accuracy: number;
  bestStreak: number;
  avgTimeMs: number;
};

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

type FeedItem = {
  id: string;
  template: string;
  lane: string;
  createdAt: string;
  from: { id: string; displayName: string };
};

type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "mod" | "admin";
  banned: boolean;
  shadowbanned: boolean;
  mutedSocialUntil: string | null;
  createdAt: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function Leaderboard(props: { token: string | null; selectedStream: QuizStream; onSelectStream: (next: QuizStream) => void }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [template, setTemplate] = useState<(typeof ENCOURAGEMENT_TEMPLATES)[number]>(ENCOURAGEMENT_TEMPLATES[0]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [mutual, setMutual] = useState<Set<string>>(new Set());

  async function refreshFollowState() {
    if (!props.token) return;
    try {
      const r = await api<{ following: string[]; followers: string[]; mutual: string[] }>("/follow/me", { token: props.token });
      setFollowing(new Set(r.following));
      setMutual(new Set(r.mutual));
    } catch {
      // ignore (e.g. not logged in)
    }
  }

  useEffect(() => {
    void api<{ rows: LeaderboardRow[] }>(`/leaderboard?limit=50&minAnswered=1&stream=${props.selectedStream}`, { token: props.token })
      .then((r) => setRows(r.rows))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "failed to load"));

    void refreshFollowState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.token, props.selectedStream]);

  async function encourage(toUserId: string, lane: "followers" | "anyone") {
    if (!props.token) return;
    setErr(null);
    setSendingTo(toUserId + ":" + lane);
    try {
      await api<{ ok: true }>("/social/encourage", {
        token: props.token,
        method: "POST",
        body: { toUserId, lane, template }
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "failed to send");
    } finally {
      setSendingTo(null);
    }
  }

  async function follow(toUserId: string) {
    if (!props.token) return;
    setErr(null);
    try {
      await api<{ ok: true }>("/follow/follow", { token: props.token, method: "POST", body: { toUserId } });
      await refreshFollowState();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "failed to follow");
    }
  }

  async function unfollow(toUserId: string) {
    if (!props.token) return;
    setErr(null);
    try {
      await api<{ ok: true }>("/follow/unfollow", { token: props.token, method: "POST", body: { toUserId } });
      await refreshFollowState();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "failed to unfollow");
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-500">Leaderboard</div>
          <div className="text-2xl font-bold text-slate-900">{getStreamLabel(props.selectedStream)} ladder</div>
          <div className="mt-1 text-sm text-slate-600">Each stream keeps its own race, so fixed tiers stay fair.</div>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Leaderboard stream</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              value={props.selectedStream}
              onChange={(e) => props.onSelectStream(e.target.value as QuizStream)}
            >
              <option value="adaptive">Adaptive</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
              <option value="4">Tier 4</option>
              <option value="5">Tier 5</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Encouragement template</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              value={template}
              onChange={(e) => setTemplate(e.target.value as (typeof ENCOURAGEMENT_TEMPLATES)[number])}
            >
              {ENCOURAGEMENT_TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Player</th>
              <th className="py-2 pr-4">Rating</th>
              <th className="py-2 pr-4">Accuracy</th>
              <th className="py-2 pr-4">Best streak</th>
              <th className="py-2 pr-4">Avg time</th>
              <th className="py-2 pr-4">Friend</th>
              <th className="py-2 pr-4">Follow</th>
              <th className="py-2 pr-4">Encourage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.userId} className={cx("border-t border-slate-100", i % 2 ? "bg-slate-50/60" : "")}>
                <td className="py-2 pr-4 font-mono text-slate-600">{i + 1}</td>
                <td className="py-2 pr-4 font-semibold text-slate-900">{r.displayName}</td>
                <td className="py-2 pr-4 font-mono">{r.rating.toFixed(1)}</td>
                <td className="py-2 pr-4">{Math.round(r.accuracy * 100)}%</td>
                <td className="py-2 pr-4">{r.bestStreak}</td>
                <td className="py-2 pr-4">{Math.round(r.avgTimeMs / 1000)}s</td>
                <td className="py-2 pr-4">
                  {mutual.has(r.userId) ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Friends</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">-</span>
                  )}
                </td>
                <td className="py-2 pr-4">
                  {following.has(r.userId) ? (
                    <button
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={!props.token}
                      onClick={() => void unfollow(r.userId)}
                    >
                      Unfollow
                    </button>
                  ) : (
                    <button
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                      disabled={!props.token}
                      onClick={() => void follow(r.userId)}
                    >
                      Follow
                    </button>
                  )}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={!props.token || !mutual.has(r.userId) || sendingTo === r.userId + ":followers"}
                      onClick={() => void encourage(r.userId, "followers")}
                      title={mutual.has(r.userId) ? "" : "Mutual follow required"}
                    >
                      Followers
                    </button>
                    <button
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      disabled={!props.token || sendingTo === r.userId + ":anyone"}
                      onClick={() => void encourage(r.userId, "anyone")}
                    >
                      Anyone
                    </button>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">Anyone lane is throttled hard. Friends lane requires mutual follow.</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Prescriptive social: templates only, positive only. Mods can shadowban cheaters/spammers from appearing here.
      </div>
    </div>
  );
}

export function Social(props: { token: string | null }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!props.token) return;
    void api<{ items: FeedItem[] }>(`/social/feed?limit=30`, { token: props.token })
      .then((r) => setFeed(r.items))
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "failed to load"));
  }, [props.token]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">Social</div>
      <div className="text-2xl font-bold text-slate-900">Encouragement inbox</div>
      <div className="mt-1 text-sm text-slate-600">No comments, no negativity - only preset encouragements.</div>

      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="mt-4 grid gap-2">
        {feed.length === 0 && <div className="text-sm text-slate-500">No encouragement yet. Go earn some.</div>}
        {feed.map((x) => (
          <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">{x.template}</div>
              <div className="text-xs text-slate-500">
                from <span className="font-medium">{x.from.displayName}</span> - {x.lane}
              </div>
            </div>
            <div className="text-xs text-slate-400">{new Date(x.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-slate-500">Tip: use the Leaderboard tab to send encouragements.</div>
    </div>
  );
}

export function Admin(props: { token: string | null }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function search() {
    if (!props.token) return;
    setErr(null);
    try {
      const r = await api<{ users: AdminUserRow[] }>(`/admin/users?q=${encodeURIComponent(q)}&limit=20`, { token: props.token });
      setRows(r.users);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "failed");
    }
  }

  async function patch(userId: string, body: Record<string, unknown>) {
    if (!props.token) return;
    setBusyId(userId);
    setErr(null);
    try {
      await api<{ ok: true }>(`/admin/users/${userId}`, { token: props.token, method: "PATCH", body });
      await search();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">Admin / Moderator</div>
      <div className="text-2xl font-bold text-slate-900">Control room</div>
      <div className="mt-1 text-sm text-slate-600">Promote mods, ban, shadowban, mute social spam.</div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="min-w-[260px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Search by email or display name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => void search()}>
          Search
        </button>
      </div>

      {err && <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Flags</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="py-2 pr-4 font-semibold text-slate-900">{u.displayName}</td>
                <td className="py-2 pr-4 font-mono text-xs">{u.email}</td>
                <td className="py-2 pr-4">{u.role}</td>
                <td className="py-2 pr-4 text-xs text-slate-600">
                  {u.banned ? "BANNED " : ""}
                  {u.shadowbanned ? "SHADOW " : ""}
                  {u.mutedSocialUntil ? "MUTED" : ""}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={!props.token || busyId === u.id}
                      onClick={() => void patch(u.id, { role: u.role === "mod" ? "user" : "mod" })}
                    >
                      {u.role === "mod" ? "Demote mod" : "Make mod"}
                    </button>
                    <button
                      className={cx(
                        "rounded-xl px-3 py-2 text-xs disabled:opacity-50",
                        u.banned ? "bg-rose-600 text-white hover:bg-rose-500" : "border border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      disabled={!props.token || busyId === u.id}
                      onClick={() => void patch(u.id, { banned: !u.banned })}
                    >
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                    <button
                      className={cx(
                        "rounded-xl px-3 py-2 text-xs disabled:opacity-50",
                        u.shadowbanned ? "bg-amber-600 text-white hover:bg-amber-500" : "border border-slate-200 bg-white hover:bg-slate-50"
                      )}
                      disabled={!props.token || busyId === u.id}
                      onClick={() => void patch(u.id, { shadowbanned: !u.shadowbanned })}
                    >
                      {u.shadowbanned ? "Unshadow" : "Shadowban"}
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={!props.token || busyId === u.id}
                      onClick={() => void patch(u.id, { mutedSocialMinutes: 60 })}
                    >
                      Mute 60m
                    </button>
                    <button
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={!props.token || busyId === u.id}
                      onClick={() => void patch(u.id, { mutedSocialMinutes: 0 })}
                    >
                      Unmute
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Note: PATCH actions require <span className="font-mono">role=admin</span>. Mods can still view/search.
      </div>
    </div>
  );
}


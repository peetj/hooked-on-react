import { useEffect } from "react";
import type { BadgeDef } from "../lib/badges";

export function BadgeToast(props: {
  badge: BadgeDef;
  onDone: () => void;
  reduceMotion: boolean;
}) {
  useEffect(() => {
    const t = setTimeout(() => props.onDone(), 2800);
    return () => clearTimeout(t);
  }, [props]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex max-w-md justify-center px-4">
      <div
        className={
          "w-full rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur " +
          (props.reduceMotion ? "" : "animate-[pop_400ms_ease-out]")
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-2xl text-white shadow">
            {props.badge.emoji}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Badge unlocked</div>
            <div className="truncate text-base font-bold text-slate-900">{props.badge.name}</div>
            <div className="truncate text-sm text-slate-600">{props.badge.desc}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pop { 
          0% { transform: translateY(-12px) scale(0.98); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

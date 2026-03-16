import { useEffect, useState } from "react";
import { cx, API_URL } from "../lib/api";

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role?: "user" | "mod" | "admin";
} | null;

export function FeedbackPanel(props: { user: AuthUser; view: string; reduceMotion: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState(props.user?.email ?? "");
  const [name, setName] = useState(props.user?.displayName ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setContactEmail(props.user?.email ?? "");
    setName(props.user?.displayName ?? "");
  }, [props.user?.displayName, props.user?.email]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  async function submitFeedback() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contactEmail,
          name: name.trim() || undefined,
          message,
          page: props.view,
          user: props.user
            ? {
                id: props.user.id,
                email: props.user.email,
                displayName: props.user.displayName
              }
            : undefined
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to send feedback");
      }

      setMessage("");
      setSuccess("Thanks. Your feedback has been sent.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to send feedback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="feedback-panel"
        onClick={() => setIsOpen((open) => !open)}
        className={cx(
          "fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-2xl border border-r-0 border-amber-300 bg-gradient-to-b from-amber-300 via-orange-300 to-rose-300 px-3 py-4 text-[11px] font-black uppercase tracking-[0.35em] text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.18)]",
          props.reduceMotion ? "" : "transition-transform duration-300 hover:-translate-x-1"
        )}
      >
        <span className="block [writing-mode:vertical-rl]">Feedback</span>
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close feedback panel"
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        id="feedback-panel"
        className={cx(
          "fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white/95 shadow-2xl backdrop-blur",
          props.reduceMotion ? "" : "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="border-b border-slate-200 bg-gradient-to-br from-amber-100 via-white to-rose-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">Talk To Us</div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Feedback</h2>
              <p className="mt-2 text-sm text-slate-600">Tell us what is confusing, broken, slow, or unexpectedly good.</p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Your email</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="Optional"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-slate-700">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
                className="min-h-44 rounded-3xl border border-slate-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="What should change?"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Context sent with your note: current page `{props.view}`{props.user ? ` and signed-in user ${props.user.displayName}` : ""}.
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={busy || contactEmail.trim().length === 0 || message.trim().length < 10}
            onClick={() => void submitFeedback()}
          >
            {busy ? "Sending..." : "Send feedback"}
          </button>
        </div>
      </aside>
    </>
  );
}

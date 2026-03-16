import { useEffect, useRef, useState } from "react";
import { cx, API_URL } from "../lib/api";

type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role?: "user" | "mod" | "admin";
} | null;

export function FeedbackPanel(props: { user: AuthUser; view: string; reduceMotion: boolean }) {
  const toggleRef = useRef<HTMLButtonElement | null>(null);
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

    function closePanel() {
      setIsOpen(false);
      window.setTimeout(() => {
        toggleRef.current?.blur();
      }, 0);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closePanel();
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
        ref={toggleRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="feedback-panel"
        onClick={() => setIsOpen((open) => !open)}
        className={cx(
          "feedback-toggle",
          props.reduceMotion ? "" : "feedback-toggle-animated"
        )}
      >
        <span className="feedback-toggle-copy">Feedback</span>
      </button>

      {isOpen && (
        <button
          type="button"
          aria-label="Close feedback panel"
          className="feedback-backdrop"
          onClick={() => {
            setIsOpen(false);
            toggleRef.current?.blur();
          }}
        />
      )}

      <aside
        id="feedback-panel"
        className={cx(
          "feedback-panel",
          props.reduceMotion ? "" : "transition-transform duration-300 ease-out",
          isOpen ? "feedback-panel-open" : "feedback-panel-closed"
        )}
      >
        <div className="feedback-panel-head">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="feedback-panel-kicker">Talk To Us</div>
              <h2 className="feedback-panel-title">Feedback</h2>
              <p className="feedback-panel-copy">Tell us what is confusing, broken, slow, or unexpectedly good.</p>
            </div>
            <button
              type="button"
              className="feedback-close"
              onClick={() => {
                setIsOpen(false);
                toggleRef.current?.blur();
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div className="feedback-panel-body">
          <div className="feedback-form-grid">
            <label className="feedback-field">
              <span className="feedback-field-label">Your email</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="feedback-input"
                placeholder="you@example.com"
              />
            </label>

            <label className="feedback-field">
              <span className="feedback-field-label">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="feedback-input"
                placeholder="Optional"
              />
            </label>

            <label className="feedback-field">
              <span className="feedback-field-label">Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
                className="feedback-input feedback-textarea"
                placeholder="What should change?"
              />
            </label>

            <div className="feedback-context">
              Context sent with your note: current page `{props.view}`{props.user ? ` and signed-in user ${props.user.displayName}` : ""}.
            </div>

            {error && <div className="feedback-message feedback-message-error">{error}</div>}
            {success && <div className="feedback-message feedback-message-success">{success}</div>}
          </div>
        </div>

        <div className="feedback-panel-foot">
          <button
            type="button"
            className="feedback-submit"
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

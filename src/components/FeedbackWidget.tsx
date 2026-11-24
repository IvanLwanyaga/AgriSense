import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { submitFeedback } from "../services/feedbackService";

const CATEGORIES = [
  "General feedback",
  "Screening result",
  "Weather",
  "Help room",
  "Report a problem",
  "Feature idea",
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "queued" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openModal() {
    setStatus("idle");
    setErrorMessage("");
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || !message.trim()) return;
    setStatus("sending");
    setErrorMessage("");
    try {
      const result = await submitFeedback({
        userId: auth.currentUser?.uid ?? null,
        rating: rating || null,
        category,
        message: message.trim(),
        contact: contact.trim() || null,
        appVersion: "1.0",
      });
      setStatus(result === "sent" ? "sent" : "queued");
      setMessage("");
      setContact("");
      setRating(0);
      setCategory(CATEGORIES[0]);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not send feedback.");
    }
  }

  return (
    <>
      <button className="topbar-feedback" type="button" onClick={openModal} aria-label="Send feedback about AgriSense">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
        <span>Feedback</span>
      </button>

      {open && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
            <div className="feedback-modal-head">
              <div>
                <span className="section-kicker">AgriSense pilot</span>
                <h2 id="feedback-title">Help us improve</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close feedback form">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {status === "sent" || status === "queued" ? (
              <div className="feedback-success">
                <span className="feedback-success-icon" aria-hidden="true">✓</span>
                <strong>{status === "queued" ? "Saved on this device" : "Thank you for your feedback"}</strong>
                <p>
                  {status === "queued"
                    ? "You are offline. Your feedback will be sent automatically when your connection returns."
                    : "Your response helps us improve AgriSense for farmers in Uganda."}
                </p>
                <button className="primary-button" type="button" onClick={() => setOpen(false)}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="feedback-form">
                <p className="feedback-intro">
                  Tell us what is working and what we should fix. It takes less than a minute.
                </p>

                <fieldset className="feedback-rating">
                  <legend>How is AgriSense working for you?</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`feedback-star${rating >= value ? " is-selected" : ""}`}
                        onClick={() => setRating(value)}
                        aria-label={`${value} out of 5`}
                        aria-pressed={rating === value}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label>
                  Topic
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  Your feedback
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    required
                    placeholder="What worked well? What was confusing or missing?"
                  />
                </label>

                <label>
                  Contact (optional)
                  <input
                    type="text"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder="Phone or email if we may follow up"
                  />
                </label>

                {status === "error" && <p className="form-error" role="alert">{errorMessage}</p>}

                <div className="feedback-actions">
                  <button className="outline-button" type="button" onClick={() => setOpen(false)}>Cancel</button>
                  <button className="primary-button" type="submit" disabled={status === "sending" || !message.trim()}>
                    {status === "sending" ? "Sending…" : "Send feedback"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
import { useRef, useState } from "react";
import { askAgriSenseAI, type AgriSenseAiContext } from "../services/aiService";
import ListenButton from "./ListenButton";

interface ChatMessage { sender: "farmer" | "ai"; text: string; }

const suggestions = [
  "How can I check my coffee trees for borer damage?",
  "What should I do after a high-risk screening?",
  "How can I protect young coffee branches?",
];

export default function AgriSenseChat({ context }: { context: AgriSenseAiContext }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Hello! I’m your AgriSense farm assistant. Ask me about coffee health, BCTB screening, or your farm monitoring." },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendQuestion(text = question) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setQuestion("");
    setMessages((current) => [...current, { sender: "farmer", text: trimmed }]);
    setLoading(true);
    try {
      const recentConversation = messages.map((message) => ({
        role: message.sender === "farmer" ? "farmer" as const : "assistant" as const,
        text: message.text,
      }));
      const answer = await askAgriSenseAI(trimmed, { ...context, recentConversation });
      setMessages((current) => [...current, { sender: "ai", text: answer }]);
    } catch {
      setMessages((current) => [...current, { sender: "ai", text: "I’m having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section className="agrisense-chat" aria-label="AgriSense AI assistant">
      <header className="assistant-header">
        <div className="assistant-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none"><path d="M16 4c-6.6 0-11 4.2-11 10.1 0 3.8 2.2 6.9 5.7 8.4L9.5 28l6.5-3.4c6.5 0 11.5-4.3 11.5-10.3S22.6 4 16 4Z" stroke="currentColor" strokeWidth="1.8"/><path d="M11 16c2.2-4 6-5.5 10-5-1 4.8-4.2 7.6-9.3 7.8M11.5 19c1.8-2.6 4-4.5 7-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
        </div>
        <div className="assistant-heading"><span className="section-kicker">YOUR FARM ASSISTANT</span><h2>AgriSense AI</h2><p>Practical guidance for healthier coffee farms</p></div>
        <span className="assistant-status"><i /> Ready to help</span>
      </header>

      <div className="assistant-conversation" aria-live="polite" aria-label="Conversation">
        {messages.map((message, index) => (
          <article className={`assistant-message ${message.sender}`} key={`${message.sender}-${index}`}>
            {message.sender === "ai" && <span className="assistant-message-avatar" aria-hidden="true">A</span>}
            <div className="assistant-message-body">
              <span className="assistant-message-name">{message.sender === "ai" ? "AgriSense" : "You"}</span>
              <div className="assistant-message-bubble"><p>{message.text}</p></div>
              {message.sender === "ai" && <ListenButton text={message.text} />}
            </div>
          </article>
        ))}
        {loading && <article className="assistant-message ai"><span className="assistant-message-avatar">A</span><div className="assistant-message-body"><span className="assistant-message-name">AgriSense</span><div className="assistant-message-bubble assistant-typing"><i /><i /><i /><span>Thinking</span></div></div></article>}
      </div>

      {messages.length === 1 && <div className="assistant-suggestions"><span>Try asking</span>{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendQuestion(suggestion)}>{suggestion}<span aria-hidden="true">↗</span></button>)}</div>}

      <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); void sendQuestion(); }}>
        <input ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your coffee farm…" aria-label="Message AgriSense AI" />
        <button type="submit" disabled={loading || !question.trim()} aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-7-8-1Z M12 13l8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Send</span></button>
      </form>
      <p className="assistant-footnote">AI guidance can help inform decisions, but does not replace an extension officer or a field diagnosis.</p>
    </section>
  );
}

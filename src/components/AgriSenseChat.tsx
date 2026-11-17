import { useState } from "react";
import { askAgriSenseAI, type AgriSenseAiContext } from "../services/aiService";
import ListenButton from "./ListenButton";
import { askManualRag } from "../services/mlToolsService";
import LugandaVoiceInput from "./LugandaVoiceInput";
import TwigImageDetector from "./TwigImageDetector";

interface ChatMessage { sender: "farmer" | "ai"; text: string; }

export default function AgriSenseChat({ context }: { context: AgriSenseAiContext }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "ai", text: "Hello. Ask me about your screening result, coffee inspection, or farm monitoring." },
  ]);
  const [manualQuestion, setManualQuestion] = useState("");
  const [manualAnswer, setManualAnswer] = useState("");
  const [manualSources, setManualSources] = useState<string[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  async function askManual(event: React.FormEvent) {
    event.preventDefault();
    if (!manualQuestion.trim() || manualLoading) return;
    setManualLoading(true); setManualError(""); setManualAnswer(""); setManualSources([]);
    try {
      const result = await askManualRag(manualQuestion.trim());
      setManualAnswer(result.answer);
      setManualSources(result.sources || []);
    } catch (error) {
      setManualError(error instanceof Error ? error.message : "Manual search is unavailable.");
    } finally { setManualLoading(false); }
  }

  async function sendQuestion(event?: React.FormEvent) {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setQuestion("");
    setMessages((current) => [...current, { sender: "farmer", text: trimmed }]);
    setLoading(true);
    try {
      const recentConversation = messages
        .map((message) => ({
          role: message.sender === "farmer" ? "farmer" as const : "assistant" as const,
          text: message.text,
        }));
      const answer = await askAgriSenseAI(trimmed, { ...context, recentConversation });
      setMessages((current) => [...current, { sender: "ai", text: answer }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AgriSense AI is temporarily unavailable.";
      setMessages((current) => [...current, { sender: "ai", text: message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel agrisense-chat">
      <div className="panel-header"><div><span className="section-kicker">Conversational support</span><h3>Ask AgriSense AI</h3></div><span className="ai-live-badge">LIVE BACKEND</span></div>
      <p className="chat-disclaimer">AI explains stored screening evidence and provides educational guidance. It does not diagnose BCTB or replace an extension officer.</p>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.sender}`} key={`${message.sender}-${index}`}>
            <strong>{message.sender === "ai" ? "AgriSense AI" : "You"}</strong>
            <p>{message.text}</p>
            {message.sender === "ai" && <ListenButton text={message.text} />}
          </div>
        ))}
        {loading && <div className="chat-message ai"><strong>AgriSense AI</strong><p>Thinking...</p></div>}
      </div>
      <form className="chat-input-row" onSubmit={sendQuestion}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about your screening..." aria-label="Ask AgriSense AI" /><button className="primary-button" type="submit" disabled={loading || !question.trim()}>Send</button></form>
      <section className="panel ml-tool-panel">
        <h3>Search coffee pest manuals</h3>
        <p>Answers use the locally indexed manuals and return “I don't know” when they do not contain the answer.</p>
        <form className="chat-input-row" onSubmit={askManual}>
          <input value={manualQuestion} onChange={(event) => setManualQuestion(event.target.value)} aria-label="Question for coffee manuals" placeholder="Ask a question from the manuals…" />
          <button className="primary-button" type="submit" disabled={manualLoading || !manualQuestion.trim()}>{manualLoading ? "Searching…" : "Search"}</button>
        </form>
        {manualError && <p role="alert">{manualError}</p>}
        {manualAnswer && <div aria-live="polite"><p>{manualAnswer}</p>{manualSources.length > 0 && <small>Sources: {manualSources.join(", ")}</small>}</div>}
      </section>
      <LugandaVoiceInput />
      <TwigImageDetector />
    </section>
  );
}

import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { speakText, stopSpeaking } from "../services/voiceService";

export default function ListenButton({ text }: { text: string }) {
  const { language, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);

  function toggleSpeech() {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const started = speakText(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
    setIsSpeaking(started);
  }

  return (
    <button
      className={`audio-replay-btn ${isSpeaking ? "playing" : ""}`}
      type="button"
      onClick={toggleSpeech}
      disabled={!text.trim()}
      aria-pressed={isSpeaking}
      aria-label={isSpeaking ? "Stop reading aloud" : t.listenToAdvice}
    >
      {isSpeaking ? "⏹ Stop" : `🔊 ${t.listenToAdvice}`}
    </button>
  );
}

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";
import { askAgriSenseAI } from "../services/aiService";
import { speakText, stopSpeaking } from "../services/voiceService";
import { transcribeFieldNote } from "../services/fieldNoteVoiceService";

interface FarmerVoiceAssistantProps {
  currentMoisture?: number;
  rainProbability?: number;
}

export default function FarmerVoiceAssistant({
  currentMoisture = 34,
  rainProbability = 35,
}: FarmerVoiceAssistantProps) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [conversation, setConversation] = useState<
    Array<{ sender: "farmer" | "ai"; text: string; time: string }>
  >([
    {
      sender: "ai",
      text:
        language === "lg"
          ? "Oli otya nnyabo/ssebo! Buuza ekibuuzo kyonna ku nnimiro yo mu ddoboozi oba empandiika."
          : language === "sw"
          ? "Hujambo mkulima! Uliza swali lolote kuhusu shamba lako kwa sauti au maandishi."
          : language === "nyn"
          ? "Oraire ota murimi! Buuza ekibuuzo kyona aha musiri gwawe omuiraka nari obwandiki."
          : "Hello farmer! Ask any question about your crops, soil, or weather using voice or text.",
      time: "Just now",
    },
  ]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      stopSpeaking();
    };
  }, []);

  async function handleStartListening() {
    if (isListening) {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceSupported(false);
      setVoiceError("Audio recording is not supported in this browser. You can type your question instead.");
      return;
    }

    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) recordingChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setIsListening(false);
        setVoiceError("The recording could not be read. Check microphone access and try again.");
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setIsListening(false);
        if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;

        const audio = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType.split(";")[0] || "audio/webm",
        });
        recordingChunksRef.current = [];
        if (!audio.size) {
          setVoiceError("No speech was recorded. Try again and speak near the microphone.");
          return;
        }

        setIsTranscribing(true);
        try {
          const transcript = await transcribeFieldNote(audio, language);
          if (transcript.trim()) await handleProcessQuery(transcript);
          else setVoiceError("No speech was recognized. Try again or type your question.");
        } catch (error) {
          setVoiceError(error instanceof Error ? error.message : "Voice transcription failed. You can type your question instead.");
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start();
      setIsListening(true);
      recordingTimerRef.current = window.setTimeout(() => {
        recordingTimerRef.current = null;
        if (recorder.state === "recording") recorder.stop();
      }, 30_000);
    } catch (error) {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      setIsListening(false);
      setVoiceError(error instanceof Error && error.name === "NotAllowedError"
        ? "Allow microphone access for this site, then try speaking again."
        : "Could not start the microphone. Check that one is connected and try again.");
    }
  }

  async function handleProcessQuery(userQuery: string) {
    if (!userQuery.trim() || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const trimmed = userQuery.trim();
    setConversation((current) => [...current, { sender: "farmer", text: trimmed, time: timeStr }]);
    setQuery("");
    setIsLoading(true);

    try {
      const answerText = await askAgriSenseAI(trimmed, {
        language,
        soilMoisturePercent: currentMoisture,
        rainProbabilityPercent: rainProbability,
        recentConversation: conversation.map((message) => ({
          role: message.sender === "ai" ? "assistant" : "farmer",
          text: message.text,
        })),
      });
      setConversation((current) => [...current, { sender: "ai", text: answerText, time: timeStr }]);
      setIsSpeaking(speakText(
        answerText,
        language,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      ));
    } catch (error) {
      const answerText = error instanceof Error ? error.message : "AgriSense AI is temporarily unavailable.";
      setConversation((current) => [...current, { sender: "ai", text: answerText, time: timeStr }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSpeakAgain(text: string) {
    setIsSpeaking(speakText(
      text,
      language,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    ));
  }

  const sampleQuestions = {
    en: ["Should I irrigate my field today?", "Will it rain within 24 hours?", "How do I protect my coffee from leaf rust?"],
    lg: ["Nfukirire kasooli wange leero?", "Enkuba egenda kutonya leero?", "Nzijanjaaza ntya olukuuku mu mwanyi?"],
    sw: ["Je, nimwagilie mahindi leo?", "Kuna uwezekano wa mvua kunyesha?", "Jinsi ya kulinda kahawa dhidi ya ugonjwa wa kutu?"],
    nyn: ["Nyitirire ebihimba byangye leero?", "Enjura neija kugwa leero?", "Ninzijanjaara nta omwanyi gwangye?"],
  }[language];

  return (
    <>
      {/* Floating Voice Access Button */}
      <button
        className="farmer-voice-fab"
        onClick={() => setIsOpen(true)}
        title={t.speakToAi}
        aria-label={language === "lg" ? "Nyiga wano oyogere mu Luganda" : t.speakToAi}
      >
        <span className="fab-mic-icon">🎙️</span>
        <span className="fab-label">{language === "lg" ? "Nyiga wano oyogere mu Luganda" : t.speakToAi}</span>
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="modal-content voice-assistant-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="voice-header-top">
                <span className="voice-badge">
                  🎙️ AI Field Voice Assistant · {language.toUpperCase()}
                </span>
                {isSpeaking && (
                  <button className="stop-speech-btn" onClick={() => { stopSpeaking(); setIsSpeaking(false); }}>
                    ⏹ Stop speaking
                  </button>
                )}
              </div>
              <h2>{t.speakToAi}</h2>
              <p className="modal-subtitle">
                Accessible voice & text agricultural advisor for smallholders across Uganda.
              </p>
              <button className="modal-close-btn" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </header>

            <div className="voice-chat-container">
              <div className="voice-chat-messages">
                {conversation.map((msg, i) => (
                  <div key={i} className={`chat-bubble-wrap ${msg.sender}`}>
                    <div className="chat-avatar">
                      {msg.sender === "ai" ? "🌱" : "👨‍🌾"}
                    </div>
                    <div className="chat-bubble">
                      <p>{msg.text}</p>
                      <div className="chat-bubble-foot">
                        <small>{msg.time}</small>
                        {msg.sender === "ai" && (
                          <button
                            className="audio-replay-btn"
                            onClick={() => handleSpeakAgain(msg.text)}
                            title="Listen to this advice"
                          >
                            🔊 {t.listenToAdvice}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Quick Questions */}
              <div className="sample-questions-row">
                <small>Quick questions:</small>
                {sampleQuestions.map((sq, i) => (
                  <button
                    key={i}
                    className="sample-q-btn"
                    onClick={() => void handleProcessQuery(sq)}
                    disabled={isLoading}
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>

            <footer className="voice-chat-footer">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleProcessQuery(query);
                }}
                className="voice-input-form"
              >
                <input
                  type="text"
                  placeholder={t.askVoiceQuestion}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="voice-text-input"
                />

                {voiceSupported && (
                  <button
                    type="button"
                    className={`voice-record-btn ${isListening ? "listening" : ""} ${language === "lg" ? "voice-record-primary" : ""}`}
                    onClick={() => { void handleStartListening(); }}
                    title={isListening ? "Recording your voice..." : "Tap and speak"}
                    disabled={isTranscribing || isLoading}
                  >
                    {isListening
                      ? "■ Stop recording"
                      : isTranscribing
                        ? "Transcribing…"
                        : language === "lg"
                          ? "🎙 Nyiga wano oyogere mu Luganda"
                          : "🎙 Speak now"}
                  </button>
                )}

                <button type="submit" className="primary-button send-btn" disabled={!query.trim() || isLoading}>
                  {isLoading ? "Thinking..." : "Send"}
                </button>
              </form>
              {voiceError && <p className="voice-assistant-error" role="alert">{voiceError}</p>}
              {isLoading && <p className="voice-assistant-status" role="status">Thinking...</p>}
              {isListening && <p className="voice-assistant-status" role="status">Recording in {language === "lg" ? "Luganda" : language === "sw" ? "Swahili" : language === "nyn" ? "Runyankole" : "English"}. Tap stop when finished (maximum 30 seconds).</p>}
              {isTranscribing && <p className="voice-assistant-status" role="status">Transcribing your question in the selected language…</p>}
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

import { useRef, useState } from "react";
import { transcribeLuganda } from "../services/mlToolsService";

export default function LugandaVoiceInput() {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const instance = new MediaRecorder(stream);
      recorder.current = instance;
      chunks.current = [];
      instance.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      instance.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setBusy(true);
        try { setText((await transcribeLuganda(new Blob(chunks.current, { type: instance.mimeType }))).text); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Transcription failed."); }
        finally { setBusy(false); }
      };
      instance.start();
      setRecording(true);
    } catch {
      setError("Microphone access is unavailable. Allow microphone access and try again.");
    }
  }

  function stop() { recorder.current?.stop(); setRecording(false); }

  return <section className="panel ml-tool-panel">
    <h3>Luganda voice input</h3>
    <p>Record a short Luganda message. Audio is sent to the configured transcription service.</p>
    <button className="primary-button" type="button" onClick={recording ? stop : start} disabled={busy}>
      {recording ? "Stop recording" : busy ? "Transcribing…" : "Record Luganda"}
    </button>
    {error && <p role="alert">{error}</p>}
    {text && <p className="voice-transcript"><strong>Transcript:</strong> {text}</p>}
  </section>;
}

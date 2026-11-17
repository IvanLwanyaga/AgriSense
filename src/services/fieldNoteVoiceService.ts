import type { SupportedLanguage } from "../context/LanguageContext";
import { authenticatedFetch } from "./authenticatedFetch";

export async function transcribeFieldNote(
  audio: Blob,
  language: SupportedLanguage
): Promise<string> {
  if (!audio.size) throw new Error("No audio was recorded. Try again and speak near the microphone.");
  if (audio.size > 4 * 1024 * 1024) {
    throw new Error("That recording is too long. Keep field notes under 30 seconds and try again.");
  }

  const audioDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve(reader.result)
      : reject(new Error("Could not read the audio recording."));
    reader.onerror = () => reject(new Error("Could not read the audio recording."));
    reader.readAsDataURL(audio);
  });

  let response: Response;
  try {
    response = await authenticatedFetch("/api/transcribeFieldNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioDataUrl, language }),
    });
  } catch (error) {
    throw new Error("Could not reach voice transcription. Check your internet connection and try again.", { cause: error });
  }

  const payload = await response.json().catch(() => ({})) as { transcript?: string; error?: string };
  if (!response.ok || !payload.transcript) {
    throw new Error(payload.error || `Voice transcription failed (HTTP ${response.status}).`);
  }
  return payload.transcript;
}

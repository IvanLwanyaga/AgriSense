
import { authenticatedFetch } from "./authenticatedFetch";

const API_BASE_URL =
  "https://agrisense-auth-api.onrender.com";

async function post<T>(
  path: string,
  payload: unknown
): Promise<T> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}${path}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json().catch(() => ({})) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed (HTTP ${response.status}).`
    );
  }

  return data;
}

// Coffee pest manual search (RAG).
export async function askManualRag(question: string) {
  return post<{ answer: string; sources: string[] }>(
    "/api/askManualRag",
    { question }
  );
}

function fileAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Could not read the selected file."));

    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");

      if (comma < 0) {
        reject(new Error("Could not encode the selected file."));
      } else {
        resolve(result.slice(comma + 1));
      }
    };

    reader.readAsDataURL(file);
  });
}

async function normalizeToWav(audio: Blob): Promise<Blob> {
  const context = new AudioContext();

  try {
    const decoded = await context.decodeAudioData(
      await audio.arrayBuffer()
    );

    const channels = decoded.numberOfChannels;
    const frames = decoded.length;

    const bytes = new ArrayBuffer(44 + frames * 2);
    const view = new DataView(bytes);

    const writeText = (offset: number, value: string) =>
      [...value].forEach((char, index) =>
        view.setUint8(offset + index, char.charCodeAt(0))
      );

    writeText(0, "RIFF");
    view.setUint32(4, 36 + frames * 2, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, decoded.sampleRate, true);
    view.setUint32(28, decoded.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, frames * 2, true);

    for (let frame = 0; frame < frames; frame += 1) {
      let sample = 0;

      for (let channel = 0; channel < channels; channel += 1) {
        sample +=
          decoded.getChannelData(channel)[frame] / channels;
      }

      const clipped = Math.max(-1, Math.min(1, sample));

      view.setInt16(
        44 + frame * 2,
        clipped < 0
          ? clipped * 0x8000
          : clipped * 0x7fff,
        true
      );
    }

    return new Blob([bytes], { type: "audio/wav" });
  } finally {
    await context.close();
  }
}

// Luganda voice transcription.
export async function transcribeLuganda(audio: Blob) {
  if (audio.size > 6 * 1024 * 1024) {
    throw new Error("Keep recordings under 6 MB.");
  }

  const wav = await normalizeToWav(audio);

  if (wav.size > 6 * 1024 * 1024) {
    throw new Error(
      "This recording is too long to send. Record a shorter message."
    );
  }

  return post<{ text: string }>(
    "/api/transcribeLuganda",
    {
      audio_base64: await fileAsBase64(wav),
      filename: "recording.wav",
    }
  );
}

// BCTB twig image screening.
export async function detectTwig(image: File) {
  if (image.size > 6 * 1024 * 1024) {
    throw new Error("Choose an image under 6 MB.");
  }

  return post<{
    detections: Array<{
      box: number[];
      confidence: number;
      class: string;
    }>;
    count: number;
    disclaimer: string;
  }>(
    "/api/detectTwig",
    {
      image_base64: await fileAsBase64(image),
    }
  );
}

import { authenticatedFetch } from "./authenticatedFetch";

export interface AgriSenseAiContext {
  farmName?: string;
  district?: string;
  riskLevel?: string;
  riskExplanation?: string;
  contributingFactors?: string[];
  language?: string;
  soilMoisturePercent?: number;
  rainProbabilityPercent?: number;
  recentConversation?: Array<{ role: "farmer" | "assistant"; text: string }>;
}

export async function askAgriSenseAI(
  question: string,
  context: AgriSenseAiContext = {},
  signal?: AbortSignal,
): Promise<string> {
  let response: Response;
  try {
    response = await authenticatedFetch("/api/askAgriSenseAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof Error && error.message === "Sign in to use this service.") {
      throw error;
    }
    if (error instanceof TypeError) {
      const endpoint = typeof window === "undefined"
        ? "/api/askAgriSenseAI"
        : `${window.location.origin}/api/askAgriSenseAI`;
      throw new Error(
        `Could not reach the AgriSense AI endpoint at ${endpoint}. Check the Hosting rewrite and Functions emulator logs.`,
        { cause: error }
      );
    }
    throw error;
  }

  if (!response.ok) {
    const responseText = await response.text();
    let payload: { answer?: string; error?: string } = {};
    try {
      payload = responseText ? JSON.parse(responseText) as { answer?: string; error?: string } : {};
    } catch {
      payload = {};
    }
    if (response.status === 404) {
      throw new Error(
        "AgriSense AI endpoint was not found. Start the Firebase Functions emulator (npm run serve in the functions folder) or deploy askAgriSenseAI."
      );
    }
    throw new Error(payload.error || `AgriSense AI backend returned HTTP ${response.status}.`);
  }

  const payload = await response.json() as { answer?: unknown; error?: string };
  if (typeof payload.answer !== "string" || !payload.answer.trim()) {
    if (typeof payload.error === "string") {
      throw new Error(payload.error);
    }
    throw new Error("AgriSense AI returned an empty response.");
  }
  return payload.answer.trim();
}

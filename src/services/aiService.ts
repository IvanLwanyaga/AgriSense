
import { authenticatedFetch } from "./authenticatedFetch";

const AI_API_URL =
  "https://agrisense-auth-api.onrender.com/api/askAgriSenseAI";

export interface AgriSenseAiContext {
  farmName?: string;
  district?: string;
  riskLevel?: string;
  riskExplanation?: string;
  contributingFactors?: string[];
  language?: string;
  soilMoisturePercent?: number;
  rainProbabilityPercent?: number;
  recentConversation?: Array<{
    role: "farmer" | "assistant";
    text: string;
  }>;
}

export async function askAgriSenseAI(
  question: string,
  context: AgriSenseAiContext = {},
  signal?: AbortSignal,
): Promise<string> {
  let response: Response;

  try {
    response = await authenticatedFetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, context }),
      signal,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    if (
      error instanceof Error &&
      error.message === "Sign in to use this service."
    ) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to AgriSense AI. Please check your internet connection and try again.",
        { cause: error }
      );
    }

    throw error;
  }

  if (!response.ok) {
    const responseText = await response.text();

    let payload: {
      answer?: string;
      error?: string;
    } = {};

    try {
      payload = responseText
        ? JSON.parse(responseText)
        : {};
    } catch {
      payload = {};
    }

    throw new Error(
      payload.error ||
      `AgriSense AI backend returned HTTP ${response.status}.`
    );
  }

  const payload = await response.json() as {
    answer?: unknown;
    error?: string;
  };

  if (
    typeof payload.answer !== "string" ||
    !payload.answer.trim()
  ) {
    throw new Error(
      payload.error || "AgriSense AI returned an empty response."
    );
  }

  return payload.answer.trim();
}

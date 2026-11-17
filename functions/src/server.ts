
import express, { Request, Response } from "express";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 10000);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const MODEL_API_URL = process.env.RESEARCH_MODEL_API_URL;
const MODEL_API_KEY = process.env.RESEARCH_MODEL_API_KEY;

const ALLOWED_ROLES = ["FARMER", "FARM_MANAGER"];

if (!PROJECT_ID || !SERVICE_ACCOUNT_JSON) {
  throw new Error("Firebase environment configuration is missing.");
}

let serviceAccount: Record<string, unknown>;

try {
  serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);
} catch {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId: PROJECT_ID,
  });
}

const auth = getAuth();
const db = getFirestore();

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ready", service: "agrisense-auth-api" });
});

app.post(
  "/api/predictResearchBctb",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Sign in to use this service." });
        return;
      }

      let decodedToken;

      try {
        decodedToken = await auth.verifyIdToken(
          authorization.substring(7)
        );
      } catch {
        res.status(401).json({
          error: "Your session has expired. Sign in again.",
        });
        return;
      }

      if (!decodedToken.email_verified) {
        res.status(403).json({
          error: "Please verify your email address.",
        });
        return;
      }

      const userSnapshot = await db
        .collection("users")
        .doc(decodedToken.uid)
        .get();

      const profile = userSnapshot.data();

      if (
        !profile ||
        profile.status !== "ACTIVE" ||
        !ALLOWED_ROLES.includes(profile.role)
      ) {
        res.status(403).json({
          error: "Your account is not authorized for this action.",
        });
        return;
      }

      const { modelInputs, includeCounterfactual } = req.body ?? {};

      if (
        !modelInputs ||
        typeof modelInputs !== "object" ||
        Array.isArray(modelInputs)
      ) {
        res.status(400).json({
          error: "A valid modelInputs object is required.",
        });
        return;
      }

      if (!MODEL_API_URL || !MODEL_API_KEY) {
        res.status(503).json({
          error: "The prediction service is not configured.",
        });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      try {
        const upstreamUrl = new URL("/predict", MODEL_API_URL);

        if (includeCounterfactual === false) {
          upstreamUrl.searchParams.set("include_counterfactual", "false");
        }

        const upstream = await fetch(upstreamUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": MODEL_API_KEY,
          },
          body: JSON.stringify({
            model_inputs: modelInputs,
          }),
          signal: controller.signal,
        });

        const responseText = await upstream.text();

        let result: unknown;

        try {
          result = JSON.parse(responseText);
        } catch {
          result = { error: "Invalid response from prediction service." };
        }

        res.status(upstream.status).json(result);
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.error("Prediction API error:", error);

      res.status(503).json({
        error: "The prediction service is temporarily unavailable.",
      });
    }
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AgriSense authentication API listening on port ${PORT}`);
});

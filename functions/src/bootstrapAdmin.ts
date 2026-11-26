import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function readArgument(name: string): string {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || "" : "";
}

async function main() {
  const projectId = readArgument("--project").trim();
  const email = readArgument("--email").trim().toLowerCase();
  const usingEmulators = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST);
  if (!projectId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run admin:bootstrap -- --project <firebase-project-id> --email <existing-auth-email>");
  }
  if (usingEmulators && projectId !== "demo-agrisense-local") {
    throw new Error("Emulator mode is active; use --project demo-agrisense-local.");
  }
  if (!usingEmulators && projectId === "demo-agrisense-local") {
    throw new Error("The local demo project requires Firebase Auth and Firestore emulators to be running.");
  }

  const app = initializeApp({
    projectId,
    ...(usingEmulators ? {} : { credential: applicationDefault() }),
  }, `admin-bootstrap-${Date.now()}`);
  try {
    const auth = getAuth(app);
    const db = getFirestore(app);
    const account = await auth.getUserByEmail(email);
    if (!account.emailVerified) {
      throw new Error("Verify this Firebase Authentication email before granting administrator access.");
    }

    const profileRef = db.collection("users").doc(account.uid);
    const existing = await profileRef.get();
    const profile = existing.data() || {};
    stdout.write(`Account found: ${account.email} (${account.uid})\n`);
    stdout.write(`Target Firebase project: ${projectId}${usingEmulators ? " (local emulator)" : " (cloud)"}\n`);
    const confirmation = `PROMOTE ${email} TO PLATFORM ADMIN IN ${projectId}`;
    const readline = createInterface({ input: stdin, output: stdout });
    let typed = "";
    try {
      typed = await readline.question(`To continue, type exactly:\n${confirmation}\n> `);
    } finally {
      readline.close();
    }
    if (typed.trim() !== confirmation) {
      stdout.write("No changes made.\n");
      return;
    }

    await profileRef.set({
      ...profile,
      uid: account.uid,
      email: account.email || email,
      fullName: typeof profile.fullName === "string" && profile.fullName
        ? profile.fullName
        : account.displayName || email.split("@")[0],
      organizationId: profile.organizationId ?? null,
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      createdAt: profile.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await db.collection("auditLogs").add({
      action: "INITIAL_PLATFORM_ADMIN_BOOTSTRAP",
      targetUid: account.uid,
      targetEmail: account.email || email,
      projectId,
      actor: "trusted_admin_bootstrap_script",
      timestamp: FieldValue.serverTimestamp(),
    });
    stdout.write(`Granted Platform Administrator access to ${account.email} in ${projectId}. Sign out and sign in again to refresh the workspace.\n`);
  } finally {
    await deleteApp(app);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Admin provisioning failed.");
  process.exitCode = 1;
});

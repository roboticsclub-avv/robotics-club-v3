import admin from "firebase-admin";
import { env, validateEnvironment } from "../env";

// Validate environment configurations
validateEnvironment();

/**
 * Checks if the Firebase Admin SDK is fully configured with required credentials.
 * @returns {boolean} True if all required credentials are present.
 */
export function isAdminConfigured() {
  return !!(
    env.firebase.admin.projectId &&
    env.firebase.admin.clientEmail &&
    env.firebase.admin.privateKey
  );
}

/**
 * Creates and normalizes the Firebase Admin configuration.
 * Throws developer-friendly error messages if required variables are missing.
 * @returns {object} The clean credentials certificate object.
 */
export function createFirebaseAdminConfig() {
  const projectId = env.firebase.admin.projectId;
  const clientEmail = env.firebase.admin.clientEmail;
  const rawPrivateKey = env.firebase.admin.privateKey;

  const missing = [];
  if (!projectId) missing.push("FIREBASE_ADMIN_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_ADMIN_CLIENT_EMAIL");
  if (!rawPrivateKey) missing.push("FIREBASE_ADMIN_PRIVATE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `[Firebase Admin Error] Missing credentials: ${missing.join(", ")}. Please configure them in your environment.`
    );
  }

  // Normalize private key safely handling literal/escaped newlines
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

let db;
let auth;

// Get or initialize the Admin App instance
const existingApp = admin.apps.length > 0 ? admin.apps[0] : null;

if (!existingApp) {
  try {
    if (isAdminConfigured()) {
      const config = createFirebaseAdminConfig();
      admin.initializeApp({
        credential: admin.credential.cert(config),
      });
      console.log("[FIREBASE ADMIN] Initialized with certificates.");
    } else {
      if (env.isProduction) {
        // Fallback must NEVER activate in production. Hard fail.
        throw new Error(
          "[Firebase Admin Error] Fallback mode is disabled in production. Full credentials are required."
        );
      } else {
        // Highly visible warning in development fallback mode
        console.warn(
          `\n=========================================\n` +
          `[Firebase Admin Warning]\n` +
          `Admin SDK running in fallback mode.\n` +
          `Required credentials for admin tasks are missing.\n` +
          `=========================================\n`
        );
        admin.initializeApp({
          projectId: env.firebase.client.projectId || "mock-project-id-for-dev",
        });
      }
    }
  } catch (error) {
    console.error(`[FIREBASE ADMIN INITIALIZATION FAILED] ${error.message}`);
    throw error;
  }
}

db = admin.firestore();
auth = admin.auth();

export { db, auth };

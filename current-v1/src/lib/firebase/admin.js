import admin from "firebase-admin";
import { env, validateEnvironment } from "../env";

// Validate environment configurations
validateEnvironment();

const credential = {
  projectId: env.firebase.admin.projectId,
  clientEmail: env.firebase.admin.clientEmail,
  // Parse literal line breaks back into actual newlines
  privateKey: env.firebase.admin.privateKey
    ? env.firebase.admin.privateKey.replace(/\\n/g, "\n")
    : undefined,
};

let db;
let auth;

if (!admin.apps.length) {
  try {
    if (credential.projectId && credential.clientEmail && credential.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(credential),
      });
      console.log("[FIREBASE ADMIN] Initialized with certificates.");
    } else {
      // Fallback initialization if environment variables are not fully configured yet during builds
      admin.initializeApp({
        projectId: env.firebase.client.projectId,
      });
      console.log("[FIREBASE ADMIN] Initialized with project ID fallback.");
    }
  } catch (error) {
    console.error("[FIREBASE ADMIN] Initialization error:", error);
  }
}

db = admin.firestore();
auth = admin.auth();

export { db, auth };

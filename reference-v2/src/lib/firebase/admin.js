import admin from "firebase-admin";

const credential = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // Parse literal line breaks back into actual newlines
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
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
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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

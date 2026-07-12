import { initializeApp, getApps, getApp } from "firebase/app";
import { env, validateEnvironment } from "../env";

// Validate environment configurations
validateEnvironment();

const firebaseConfig = {
  apiKey: env.firebase.client.apiKey || "mock-api-key-for-build-purposes",
  authDomain: env.firebase.client.authDomain || "mock-auth-domain-for-build",
  projectId: env.firebase.client.projectId || "mock-project-id-for-build",
  storageBucket: env.firebase.client.storageBucket || "mock-storage-bucket-for-build",
  messagingSenderId: env.firebase.client.messagingSenderId || "mock-sender-id-for-build",
  appId: env.firebase.client.appId || "mock-app-id-for-build",
};

// Initialize Firebase client instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export default app;

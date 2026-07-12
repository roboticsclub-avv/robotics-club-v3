/**
 * Robotics Club Website 3.0 - Environment Configuration & Validation Layer
 * This file serves as the single source of truth for all environment variables,
 * preventing direct scattered process.env lookups.
 */

export const env = {
  firebase: {
    client: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    admin: {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    },
  },
  emailjs: {
    publicKey: process.env.EMAILJS_PUBLIC_KEY || process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
    serviceId: process.env.EMAILJS_SERVICE_ID || process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
    templateId: process.env.EMAILJS_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_ACCEPTANCE_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_REJECTION_TEMPLATE_ID,
    acceptanceTemplateId: process.env.NEXT_PUBLIC_EMAILJS_ACCEPTANCE_TEMPLATE_ID,
    rejectionTemplateId: process.env.NEXT_PUBLIC_EMAILJS_REJECTION_TEMPLATE_ID,
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

let validationDone = false;

/**
 * Validates environment variables according to environment rules.
 * Runs in development (warning) or production (hard error).
 */
export function validateEnvironment() {
  if (validationDone) return env;

  const isServer = typeof window === "undefined";
  const isProduction = env.isProduction;

  const missingClient = [];
  const requiredClient = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  for (const key of requiredClient) {
    if (!process.env[key]) {
      missingClient.push(key);
    }
  }

  const missingAdmin = [];
  const requiredAdmin = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ];

  const missingEmail = [];
  const requiredEmail = [
    "EMAILJS_PUBLIC_KEY",
    "EMAILJS_SERVICE_ID",
    "EMAILJS_TEMPLATE_ID",
  ];

  // Only perform Server validations if executing in a Node.js context
  if (isServer) {
    for (const key of requiredAdmin) {
      if (!process.env[key]) {
        missingAdmin.push(key);
      }
    }

    for (const key of requiredEmail) {
      if (key === "EMAILJS_TEMPLATE_ID") {
        // Accept template ID if either general, prefixed general, or both templates exist
        const hasTemplate =
          process.env.EMAILJS_TEMPLATE_ID ||
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ||
          (process.env.NEXT_PUBLIC_EMAILJS_ACCEPTANCE_TEMPLATE_ID &&
            process.env.NEXT_PUBLIC_EMAILJS_REJECTION_TEMPLATE_ID);
        if (!hasTemplate) {
          missingEmail.push(key);
        }
      } else {
        const prefixedKey = `NEXT_PUBLIC_${key}`;
        if (!process.env[key] && !process.env[prefixedKey]) {
          missingEmail.push(key);
        }
      }
    }
  }

  const allMissingRequired = [...missingClient];
  if (isServer) {
    allMissingRequired.push(...missingAdmin, ...missingEmail);
  }

  if (allMissingRequired.length > 0) {
    const summary = `
=========================================
ENVIRONMENT VALIDATION DIAGNOSTICS
=========================================
Status: ${isProduction ? "FAILED (Production Hard Failure)" : "WARNING (Development)"}
Context: ${isServer ? "Server-side" : "Client-side"}
Environment: ${process.env.NODE_ENV || "development"}

Missing Required Variables:
${allMissingRequired.map((key) => ` - [MISSING] ${key}`).join("\n")}

Optional Variables:
 - NEXT_PUBLIC_BASE_PATH: ${process.env.NEXT_PUBLIC_BASE_PATH ? "Configured" : "Not configured (Using default: '')"}
=========================================
`;

    if (isProduction) {
      throw new Error(`[CRITICAL ERROR] Missing required environment variables:\n${summary}`);
    } else {
      console.warn(summary);
    }
  } else {
    if (!isProduction) {
      console.log(
        `[ENV VALIDATION] PASS - Environment configuration checks succeeded on the ${isServer ? "Server" : "Client"}.`
      );
    }
  }

  validationDone = true;
  return env;
}

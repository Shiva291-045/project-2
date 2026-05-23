import admin from "firebase-admin";
import MockFirestore from "../utils/mockFirestore.js";

let auth = null;
let db = null;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

try {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
  } else if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    // Only initialize standard admin if we have some firebase environment
    admin.initializeApp();
  }

  if (admin.apps.length) {
    auth = admin.auth();
    db = admin.firestore();
    console.log("✓ Firebase Admin initialized for server");
  }
} catch (error) {
  console.warn(
    "Firebase Admin initialization failed. Falling back to local/mock services.",
    error.message
  );
}

// Fallback to mock services if initialization failed or was skipped
if (!db || !auth) {
  console.log("⚠️ Using Mock local file-backed Firestore database");
  db = new MockFirestore();
  auth = {
    verifyIdToken: async (token) => {
      if (token && token.startsWith("demo_token_")) {
        const uid = token.replace("demo_token_", "");
        return {
          uid,
          name: "Demo User",
          email: "demo@example.com",
          email_verified: true,
        };
      }
      // If we got a real token but are in local mock mode, allow it as general demo
      return {
        uid: "demo_user",
        name: "Demo User",
        email: "demo@example.com",
        email_verified: true,
      };
    }
  };
}

export { auth, db };

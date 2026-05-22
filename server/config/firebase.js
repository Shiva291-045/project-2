import admin from "firebase-admin";

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
  } else if (!admin.apps.length) {
    admin.initializeApp();
  }

  if (admin.apps.length) {
    auth = admin.auth();
    db = admin.firestore();
    console.log("✓ Firebase Admin initialized for server");
  }
} catch (error) {
  console.warn(
    "Firebase Admin initialization failed. Server will run, but Firebase admin features may be unavailable.",
    error.message
  );
}

export { auth, db };

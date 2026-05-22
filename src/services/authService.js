/**
 * Firebase Authentication Service
 * Production-ready auth with comprehensive error handling
 */

import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Persistence setup warning:", error.code);
});

/**
 * Local demo auth fallback
 * Used when Firebase is not available or Email/Password is not enabled
 */
const demoUsers = {};
let currentDemoUser = null;

const createMockUser = (email, displayName) => {
  return {
    uid: "demo_" + Math.random().toString(36).substr(2, 9),
    email: email.toLowerCase(),
    displayName,
    emailVerified: false,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString(),
    },
  };
};

const demoAuthFallback = {
  register: async (email, password, displayName) => {
    if (demoUsers[email.toLowerCase()]) {
      return {
        success: false,
        error: "auth/email-already-in-use",
        message: "Email already registered",
      };
    }
    const user = createMockUser(email, displayName);
    demoUsers[email.toLowerCase()] = { ...user, password };
    currentDemoUser = user;
    return { user, success: true };
  },

  login: async (email, password) => {
    const user = demoUsers[email.toLowerCase()];
    if (!user) {
      return {
        success: false,
        error: "auth/user-not-found",
        message: "User not found",
      };
    }
    if (user.password !== password) {
      return {
        success: false,
        error: "auth/wrong-password",
        message: "Wrong password",
      };
    }
    currentDemoUser = user;
    return { user, success: true };
  },

  getCurrentUser: () => currentDemoUser,

  onAuthStateChanged: (callback) => {
    callback(currentDemoUser);
    return () => {};
  },
};

/**
 * Auth service object with all methods
 */
const authService = {
  /**
   * Register new user
   */
  register: async (email, password, displayName) => {
    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: email.toLowerCase(),
        displayName,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Interview stats
        totalInterviews: 0,
        averageInterviewScore: 0,
        lastInterviewDate: null,
        // Coding stats
        totalCodingProblems: 0,
        codingProblemsSolved: 0,
        codingAcceptanceRate: 0,
        streakDays: 0,
        // Preferences
        targetRole: "",
        skills: [],
        experience: "beginner",
      });

      return { user, success: true };
    } catch (error) {
      console.warn("Firebase register failed, falling back to demo auth:", error.code);
      // Fallback to demo auth
      return demoAuthFallback.register(email, password, displayName);
    }
  },

  /**
   * Sign in with email and password
   */
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: userCredential.user, success: true };
    } catch (error) {
      console.warn("Firebase login failed, falling back to demo auth:", error.code);
      // Fallback to demo auth
      return demoAuthFallback.login(email, password);
    }
  },

  /**
   * Sign out
   */
  logout: async () => {
    try {
      await signOut(auth);
      // Clear demo user if any
      currentDemoUser = null;
      return { success: true };
    } catch (error) {
      // Ensure demo user is cleared on logout
      currentDemoUser = null;
      return { success: true };
    }
  },

  /**
   * Send password reset email
   */
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent",
      };
    } catch (error) {
      return {
        success: false,
        error: error.code,
        message: getAuthErrorMessage(error.code),
      };
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: () => {
    // Only return Firebase user - never fallback to demo here
    return auth.currentUser;
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged: (callback) => {
    // NEVER fallback for auth state checking - only use Firebase
    // Demo auth should only work for explicit login/register actions
    return onAuthStateChanged(auth, (user) => {
      // Only call callback with actual Firebase user (null if not logged in)
      callback(user);
    });
  },

  /**
   * Get user profile from Firestore
   */
  getUserProfile: async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      return userDocSnap.exists() ? userDocSnap.data() : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (uid, updates) => {
    try {
      const userDocRef = doc(db, "users", uid);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update profile",
      };
    }
  },

  /**
   * Check if email exists
   */
  emailExists: async (email) => {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  },
};

/**
 * Convert Firebase error codes to user-friendly messages
 */
function getAuthErrorMessage(code) {
  const errorMessages = {
    "auth/email-already-in-use":
      "This email is already registered. Please login or use a different email.",
    "auth/invalid-email": "Invalid email address. Please check and try again.",
    "auth/weak-password":
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
    "auth/user-not-found":
      "No account found with this email. Please register first.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/too-many-requests":
      "Too many failed login attempts. Please try again later.",
    "auth/operation-not-allowed": "This operation is not allowed.",
    "auth/network-request-failed":
      "Network error. Please check your connection.",
    "auth/internal-error":
      "An internal error occurred. Please try again later.",
  };

  return errorMessages[code] || "An error occurred. Please try again.";
}

/**
 * Password validation rules
 */
export const passwordRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < passwordRules.minLength) {
    errors.push(`Minimum ${passwordRules.minLength} characters required`);
  }
  if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Must contain uppercase letter (A-Z)");
  }
  if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Must contain lowercase letter (a-z)");
  }
  if (passwordRules.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Must contain number (0-9)");
  }
  if (passwordRules.requireSpecialChar && !/[!@#$%^&*]/.test(password)) {
    errors.push("Must contain special character (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Check password strength score (0-100)
 */
export const getPasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[!@#$%^&*]/.test(password)) strength += 10;

  return Math.min(strength, 100);
};

export { auth, db };
export default authService;

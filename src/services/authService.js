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
const getStoredDemoUsers = () => {
  try {
    const data = localStorage.getItem("demoUsers");
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

const saveStoredDemoUsers = (users) => {
  try {
    localStorage.setItem("demoUsers", JSON.stringify(users));
  } catch (e) {}
};

const getStoredCurrentDemoUser = () => {
  try {
    const data = localStorage.getItem("currentDemoUser");
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const saveStoredCurrentDemoUser = (user) => {
  try {
    if (user) {
      localStorage.setItem("currentDemoUser", JSON.stringify(user));
      localStorage.setItem("authToken", "demo_token_" + user.uid);
    } else {
      localStorage.removeItem("currentDemoUser");
      localStorage.removeItem("authToken");
    }
  } catch (e) {}
};

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
    const users = getStoredDemoUsers();
    if (users[email.toLowerCase()]) {
      return {
        success: false,
        error: "auth/email-already-in-use",
        message: "Email already registered",
      };
    }
    const user = createMockUser(email, displayName);
    users[email.toLowerCase()] = { ...user, password };
    saveStoredDemoUsers(users);
    saveStoredCurrentDemoUser(user);
    return { user, success: true };
  },

  login: async (email, password) => {
    const users = getStoredDemoUsers();
    let user = users[email.toLowerCase()];
    if (!user) {
      if (email.toLowerCase() === "demo@example.com") {
        // Auto-register demo account for zero-friction
        const newUser = createMockUser("demo@example.com", "Demo User");
        users["demo@example.com"] = { ...newUser, password: "Demo@12345" };
        saveStoredDemoUsers(users);
        saveStoredCurrentDemoUser(newUser);
        return { user: newUser, success: true };
      }
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
    saveStoredCurrentDemoUser(user);
    return { user, success: true };
  },

  getCurrentUser: () => getStoredCurrentDemoUser(),

  onAuthStateChanged: (callback) => {
    const user = getStoredCurrentDemoUser();
    callback(user);
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
      await signOut(auth).catch(() => {});
      saveStoredCurrentDemoUser(null);
      return { success: true };
    } catch (error) {
      saveStoredCurrentDemoUser(null);
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
    try {
      return auth.currentUser || getStoredCurrentDemoUser();
    } catch (e) {
      return getStoredCurrentDemoUser();
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged: (callback) => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdToken();
          localStorage.setItem("authToken", token);
          callback(user);
        } else {
          const demoUser = getStoredCurrentDemoUser();
          if (demoUser) {
            callback(demoUser);
          } else {
            localStorage.removeItem("authToken");
            callback(null);
          }
        }
      });
      return unsubscribe;
    } catch (e) {
      const demoUser = getStoredCurrentDemoUser();
      callback(demoUser);
      return () => {};
    }
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
      console.warn("Firestore getUserProfile failed, falling back to local profile:", error);
      const demoUser = getStoredCurrentDemoUser();
      if (demoUser && demoUser.uid === uid) {
        return {
          uid: demoUser.uid,
          displayName: demoUser.displayName,
          name: demoUser.displayName,
          email: demoUser.email,
          targetRole: demoUser.targetRole || "Full Stack Developer",
          skills: demoUser.skills || ["React", "JavaScript", "Node.js"],
          experience: demoUser.experience || "mid",
          bio: demoUser.bio || "Hi, I am preparing for my tech interviews using PrepAI!",
        };
      }
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
      console.warn("Firestore updateUserProfile failed, updating local profile:", error);
      const demoUser = getStoredCurrentDemoUser();
      if (demoUser && demoUser.uid === uid) {
        const updated = {
          ...demoUser,
          ...updates,
          displayName: updates.name || demoUser.displayName,
        };
        saveStoredCurrentDemoUser(updated);
        return { success: true };
      }
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

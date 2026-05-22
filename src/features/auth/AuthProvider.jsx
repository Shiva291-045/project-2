import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { auth, db } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user profile
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.warn("Could not fetch user profile:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, name, targetRole) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in Firestore
      try {
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          name,
          email,
          targetRole,
          skills: [],
          bio: "",
          streak: 0,
          xp: 0,
          strongTopics: [],
          weakTopics: [],
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.warn("Could not create user profile in Firestore:", firestoreError);
      }

      setUser(result.user);
      toast.success("Account created successfully!");
      return result.user;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      toast.success("Logged in successfully!");
      return result.user;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.message || "Logout failed");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (user) {
        await setDoc(doc(db, "users", user.uid), updates, { merge: true });
        setUserProfile((prev) => ({ ...prev, ...updates }));
        toast.success("Profile updated!");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Profile update failed");
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

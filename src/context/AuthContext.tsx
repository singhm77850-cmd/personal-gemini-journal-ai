import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Record user profile document in Firestore isolated user collection
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userRef,
            {
              email: currentUser.email,
              lastLoginAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('User doc initialization note:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUp = async (email: string, pass: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (cred.user) {
        const userRef = doc(db, 'users', cred.user.uid);
        await setDoc(userRef, {
          email: cred.user.email,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      const msg = mapAuthError(err.code || err.message);
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOutUser,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function mapAuthError(codeOrMsg: string): string {
  if (codeOrMsg.includes('auth/invalid-email')) return 'Please provide a valid email address.';
  if (codeOrMsg.includes('auth/user-not-found') || codeOrMsg.includes('auth/invalid-credential'))
    return 'Invalid email or password. Please verify your credentials.';
  if (codeOrMsg.includes('auth/wrong-password')) return 'Incorrect password.';
  if (codeOrMsg.includes('auth/email-already-in-use'))
    return 'An account with this email already exists. Try signing in instead.';
  if (codeOrMsg.includes('auth/weak-password'))
    return 'Password is too weak. Please use at least 6 characters.';
  if (codeOrMsg.includes('auth/too-many-requests'))
    return 'Access temporarily locked due to many failed attempts. Please try again in a few minutes.';
  if (codeOrMsg.includes('auth/network-request-failed'))
    return 'Network connection failed. Please check your connectivity and try again.';
  return codeOrMsg || 'An authentication error occurred.';
}

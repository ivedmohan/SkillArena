"use client";
import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { getAuthInstance } from "../lib/firebase";

export default function FirebaseAuthProvider({ children }) {
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const auth = getAuthInstance();
    
    // Automatically sign in the user anonymously when the app loads
    signInAnonymously(auth)
      .then(() => {
        setAuthInitialized(true);
      })
      .catch((error) => {
        console.error("Firebase Anonymous Auth failed:", error);
        // Error or not, we render children to prevent blocking the UI natively,
        // though writes will fail without auth.
        setAuthInitialized(true); 
      });
  }, []);

  return <>{authInitialized ? children : null}</>;
}

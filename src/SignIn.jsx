import React from "react";
import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "./firebase"; // Import the initialized Firebase app

function SignIn() {
  const auth = getAuth(app); // Get the Firebase Auth instance
  const provider = new GoogleAuthProvider(); // Create a new Google Auth provider

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      // User signed in successfully
      console.log("User signed in with Google!");
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Sign In to Quantum Clays</h1>
      <Button
        variant="contained"
        startIcon={<GoogleIcon />}
        onClick={signInWithGoogle}
        sx={{
          backgroundColor: "#4285F4",
          "&:hover": { backgroundColor: "#357ae8" },
        }}
      >
        Sign In with Google
      </Button>
    </div>
  );
}

export default SignIn;

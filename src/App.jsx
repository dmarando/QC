import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase"; // Import the initialized Firebase app
import SignIn from "./SignIn"; // Import our new SignIn component

function App() {
  const [user, setUser] = useState(null); // State to hold user authentication info
  const auth = getAuth(app); // Get the Firebase Auth instance

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update user state based on auth change
      console.log("Auth state changed. Current user:", currentUser);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]); // Dependency array includes 'auth' to ensure listener is correctly set up

  // Log Firebase app initialization status (from previous step, good for initial verification)
  useEffect(() => {
    console.log("Firebase app initialized:", app);
  }, []);

  return (
    <div className="App">
      {user ? (
        // User is signed in
        <div>
          <h1>Welcome, {user.displayName}!</h1>
          <p>You are logged in to Quantum Clays.</p>
          {/* In future steps, this will be our main Dashboard and navigation */}
          <button onClick={() => auth.signOut()}>Sign Out</button>
        </div>
      ) : (
        // User is not signed in
        <SignIn />
      )}
    </div>
  );
}

export default App;

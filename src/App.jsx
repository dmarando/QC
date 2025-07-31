import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "./firebase"; // Import the initialized Firebase app
import SignIn from "./SignIn"; // Import our SignIn component
import AppNavigation from "./AppNavigation"; // Import our new AppNavigation component

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
  }, [auth]);

  // Log Firebase app initialization status (from previous step, good for initial verification)
  useEffect(() => {
    console.log("Firebase app initialized:", app);
  }, []);

  return (
    <div className="App">
      {user ? (
        // User is signed in, show the navigation
        <AppNavigation />
      ) : (
        // User is not signed in, show the sign-in component
        <SignIn />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
import SignIn from './SignIn';
import AppNavigation from './AppNavigation'; // We'll modify this to only contain the AppBar and Tabs

// Import all main components that will be rendered by routes
import Dashboard from './Dashboard';
import SessionLogForm from './SessionLogForm';
import SessionHistory from './SessionHistory';
import SessionDetail from './SessionDetail';

// Import routing components
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Auth state changed. Current user:", currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    console.log("Firebase app initialized:", app);
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        {user ? (
          // User is signed in
          <> {/* Use a fragment to group AppNavigation and Routes */}
            <AppNavigation /> {/* AppNavigation will always be visible */}
            <Routes>
              {/* Define specific components for each route */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/log-session" element={<SessionLogForm />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/session/:sessionId" element={<SessionDetail />} /> {/* Dynamic route for details */}
              {/* Fallback for any unmatched paths (optional, but good for redirecting) */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        ) : (
          // User is not signed in
          <SignIn />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
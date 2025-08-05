import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from './firebase';
import SignIn from './SignIn';
import AppNavigation from './AppNavigation';

import Dashboard from './Dashboard';
import SessionLogForm from './SessionLogForm';
import SessionHistory from './SessionHistory';
import SessionDetail from './SessionDetail';
import SessionEditForm from './SessionEditForm';

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
          <>
            <AppNavigation />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/log-session" element={<SessionLogForm />} />
              <Route path="/history" element={<SessionHistory />} />
              <Route path="/session/:sessionId" element={<SessionDetail />} />
              <Route path="/session/edit/:sessionId" element={<SessionEditForm />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        ) : (
          <SignIn />
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
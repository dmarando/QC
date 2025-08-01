import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { Box, Typography, Paper, List, ListItemText, Divider, CircularProgress, Alert } from '@mui/material'; // Added CircularProgress and Alert
import ListItemButton from '@mui/material/ListItemButton';
import { Link } from 'react-router-dom';

// NEW: Import Firestore and Auth
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from './firebase'; // Ensure db is imported

function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth(app); // Get Firebase Auth instance

  useEffect(() => {
    if (!auth.currentUser) {
      setError("Please sign in to view your session history.");
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    // Create a query to fetch sessions for the current user, ordered by timestamp
    const sessionsCollectionRef = collection(db, `users/${userId}/sessions`);
    const q = query(sessionsCollectionRef, orderBy('timestamp', 'desc')); // Most recent first

    // Set up a real-time listener for sessions
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(fetchedSessions);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching sessions:", err);
      setError("Failed to load session history. Please try again.");
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [auth.currentUser, db]); // Re-run effect if user or db instance changes

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading sessions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Session History
      </Typography>
      <Paper sx={{ p: 3 }}>
        {sessions.length === 0 ? (
          <Typography variant="body1">No sessions logged yet. Log your first session!</Typography>
        ) : (
          <List>
            {sessions.map((session, index) => (
              <React.Fragment key={session.id}>
                <ListItemButton
                  component={Link}
                  to={`/session/${session.id}`}
                  alignItems="flex-start"
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6">
                        {session.date} - {session.location} ({session.type})
                        {session.eventName && ` - ${session.eventName}`}
                      </Typography>
                    }
                    secondary={
                      <Typography component="span" variant="body2" color="text.secondary">
                        <Box>
                          <Typography component="span" variant="body2" color="text.primary">
                            Score: {session.totalScore || 'N/A'} {/* Use totalScore from saved data */}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Time: {session.time} | Weather: {session.weather}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Equipment: {session.gunUsed || 'N/A'}, {session.chokeUsed || 'N/A'}, {session.ammunitionUsed || 'N/A'} {/* Use saved equipment names */}
                          </Typography>
                        </Box>
                      </Typography>
                    }
                  />
                </ListItemButton>
                {index < sessions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}

export default SessionHistory;
import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import { useParams, Link } from 'react-router-dom'; // Keep useParams and Link
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material'; // Added CircularProgress and Alert

// NEW: Import Firestore and Auth
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from './firebase'; // Ensure db is imported

// NO LONGER NEEDED: const mockSessions = [...]; // Mock data is removed

function SessionDetail() {
  const { sessionId } = useParams(); // Get the sessionId from the URL
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth(app); // Get Firebase Auth instance

  useEffect(() => {
    const fetchSession = async () => {
      if (!auth.currentUser) {
        setError("Please sign in to view session details.");
        setLoading(false);
        return;
      }
      if (!sessionId) {
        setError("No session ID provided.");
        setLoading(false);
        return;
      }

      const userId = auth.currentUser.uid;
      try {
        const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId); // Reference to the specific session document
        const sessionDocSnap = await getDoc(sessionDocRef); // Fetch the document

        if (sessionDocSnap.exists()) {
          setSession({ id: sessionDocSnap.id, ...sessionDocSnap.data() });
          console.log("Fetched session details:", sessionDocSnap.data());
        } else {
          setError("Session not found in database.");
          console.warn("No such session document!");
        }
      } catch (err) {
        console.error("Error fetching session details:", err);
        setError("Failed to load session details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true); // Start loading when effect runs
    setError(null);    // Clear previous errors
    fetchSession();
  }, [sessionId, auth.currentUser, db]); // Re-run effect if sessionId, user, or db changes

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading session details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to="/history" variant="contained" sx={{ mt: 2 }}>
          Back to Session History
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Session Details
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {session.date} - {session.location} ({session.registeredEvent ? 'Registered Event' : 'Practice'})
          {session.eventName && ` - ${session.eventName}`}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Time:</strong> {session.time}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Weather:</strong> {session.weather}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Gun Used:</strong> {session.gunUsed || 'N/A'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Choke Used:</strong> {session.chokeUsed || 'N/A'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Ammunition Used:</strong> {session.ammunitionUsed || 'N/A'}
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Scores:</Typography>
        {Object.entries(session.scores).map(([discipline, rounds]) => (
          rounds.length > 0 && (
            <Typography key={discipline} variant="body1">
              <strong>{discipline}:</strong> {rounds.map(r => r.value !== null ? r.value : (r.didNotShoot ? 'DNS' : 'N/A')).join(', ')}
              {` (Total: ${rounds.reduce((sum, r) => sum + (r.value || 0), 0)}/${rounds.length * 25})`} {/* Calculated total */}
            </Typography>
          )
        ))}

        {session.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Notes:</Typography>
            <Typography variant="body1">{session.notes}</Typography>
          </Box>
        )}

        {session.fileAttachmentURL && (
            <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Attached Score Sheet:</Typography>
                <Button 
                    variant="outlined" 
                    href={session.fileAttachmentURL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                >
                    View Attached File
                </Button>
            </Box>
        )}

        <Button component={Link} to="/history" variant="contained" sx={{ mt: 3 }}>
          Back to Session History
        </Button>
      </Paper>
    </Box>
  );
}

export default SessionDetail;
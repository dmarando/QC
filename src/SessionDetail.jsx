import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';

import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app, db, storage } from './firebase';

// Define getMaxScore function directly in this file
const getMaxScore = (discipline) => {
  if (discipline === 'Doubles') {
    return 50;
  }
  return 25;
};

function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const auth = getAuth(app);

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
        const sessionDocRef = doc(db, `users/${userId}/sessions`, sessionId);
        const sessionDocSnap = await getDoc(sessionDocRef);

        if (sessionDocSnap.exists()) {
          setSession({ id: sessionDocSnap.id, ...sessionDocSnap.data() });
        } else {
          setError("Session not found in database.");
        }
      } catch (err) {
        console.error("Error fetching session details:", err);
        setError("Failed to load session details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    setDeleteMessage(null);
    fetchSession();
  }, [sessionId, auth.currentUser, db]);

  const handleDeleteSession = async () => {
    if (!auth.currentUser || !session) {
      setDeleteMessage({ type: 'error', message: 'Authentication required or session not loaded.' });
      return;
    }

    if (window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      try {
        setDeleteMessage({ type: 'info', message: 'Deleting session...' });
        const userId = auth.currentUser.uid;
        const sessionDocRef = doc(db, `users/${userId}/sessions`, session.id);

        if (session.fileAttachmentURL) {
          try {
            const fileRef = ref(storage, session.fileAttachmentURL);
            await deleteObject(fileRef);
            console.log("File deleted from Storage:", session.fileAttachmentURL);
          } catch (fileErr) {
            console.warn("Could not delete file from storage (might not exist or permission issue):", fileErr.message);
          }
        }

        await deleteDoc(sessionDocRef);
        console.log("Session deleted from Firestore:", session.id);
        setDeleteMessage({ type: 'success', message: 'Session deleted successfully!' });
        navigate('/history');
      } catch (error) {
        console.error("Error deleting session:", error);
        setDeleteMessage({ type: 'error', message: `Failed to delete session: ${error.message}` });
      }
    }
  };


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
              {` (Total: ${rounds.reduce((sum, r) => sum + (r.value || 0), 0)}/${rounds.length * getMaxScore(discipline)})`}
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
        
        {deleteMessage && (
          <Alert severity={deleteMessage.type} sx={{ mt: 2 }}>
            {deleteMessage.message}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button component={Link} to="/history" variant="contained">
              Back to Session History
            </Button>
            <Button 
                component={Link} 
                to={`/session/edit/${session.id}`} 
                variant="outlined" 
                color="primary"
            >
                Edit Session
            </Button>
            <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteSession}
            >
                Delete Session
            </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default SessionDetail;
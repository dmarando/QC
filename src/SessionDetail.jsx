import React from 'react';
import { useParams } from 'react-router-dom'; // To get parameters from the URL
import { Box, Typography, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom'; // For navigation back

// Mock session data (same as in SessionHistory, for lookup)
const mockSessions = [
  {
    id: 's1',
    date: '2025-07-28',
    time: '14:30',
    location: 'Pine Hill Gun Club',
    type: 'Practice',
    totalScore: '92/100',
    weather: 'Sunny at 80°F',
    gun: 'Beretta 692',
    choke: 'Full',
    ammo: 'Winchester AA',
    notes: 'Good practice session, worked on follow-through. Wind was light.',
    scores: { // More detailed mock scores
      Singles: [{ value: 23 }, { value: 24 }],
      Handicaps: [],
      Doubles: [],
    }
  },
  {
    id: 's2',
    date: '2025-07-25',
    time: '10:00',
    location: 'Albany Rod & Gun Club',
    type: 'Registered Event',
    eventName: 'Summer Classic', // Example Event Name
    totalScore: '95/100',
    weather: 'Partly Cloudy at 75°F',
    gun: 'Perazzi MX8',
    choke: 'Improved Modified',
    ammo: 'Federal Top Gun',
    notes: 'First registered event of the season. Felt good about focus.',
    scores: {
      Singles: [{ value: 24 }, { value: 23 }, { value: 25 }, { value: 23 }],
      Handicaps: [{ value: 22 }, { value: 21 }, { value: 24 }, { value: 23 }],
      Doubles: [],
    }
  },
  {
    id: 's3',
    date: '2025-07-20',
    time: '16:00',
    location: 'Capital Area Trap Range',
    type: 'Practice',
    totalScore: '88/100',
    weather: 'Windy at 70°F',
    gun: 'Browning Citori',
    choke: 'Light Full',
    ammo: 'Remington STS',
    notes: 'Wind was tricky. Need more practice in these conditions.',
    scores: {
      Singles: [{ value: 22 }],
      Handicaps: [{ value: 21 }],
      Doubles: [{ value: 18 }],
    }
  },
];

function SessionDetail() {
  const { sessionId } = useParams(); // Get the sessionId from the URL

  // Find the session in mock data (will fetch from Firestore later)
  const session = mockSessions.find(s => s.id === sessionId);

  if (!session) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Session not found!
        </Typography>
        <Button component={Link} to="/history" variant="contained">
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
          {session.date} - {session.location} ({session.type})
          {session.eventName && ` - ${session.eventName}`}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Time:</strong> {session.time}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Weather:</strong> {session.weather}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Gun Used:</strong> {session.gun}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Choke Used:</strong> {session.choke}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Ammunition Used:</strong> {session.ammo}
        </Typography>
        
        <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>Scores:</Typography>
        {Object.entries(session.scores).map(([discipline, rounds]) => (
          rounds.length > 0 && (
            <Typography key={discipline} variant="body1">
              <strong>{discipline}:</strong> {rounds.map(r => r.value !== null ? r.value : 'DNS').join(', ')} (Total: {rounds.reduce((sum, r) => sum + (r.value || 0), 0)})
            </Typography>
          )
        ))}

        {session.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>Notes:</Typography>
            <Typography variant="body1">{session.notes}</Typography>
          </Box>
        )}

        {/* Future: Display file attachment link if available */}

        <Button component={Link} to="/history" variant="contained" sx={{ mt: 3 }}>
          Back to Session History
        </Button>
      </Paper>
    </Box>
  );
}

export default SessionDetail;
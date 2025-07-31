import React from 'react';
import { Box, Typography, Paper, List, ListItemText, Divider } from '@mui/material'; // Removed ListItem
import ListItemButton from '@mui/material/ListItemButton'; // NEW: Import ListItemButton
import { Link } from 'react-router-dom';

// Mock session data (same as in SessionDetail for now)
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
    scores: {
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
    eventName: 'Summer Classic',
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

function SessionHistory() {
  const sortedSessions = [...mockSessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Session History
      </Typography>
      <Paper sx={{ p: 3 }}>
        {sortedSessions.length === 0 ? (
          <Typography variant="body1">No sessions logged yet. Log your first session!</Typography>
        ) : (
          <List>
            {sortedSessions.map((session, index) => (
              <React.Fragment key={session.id}>
                <ListItemButton // Changed from ListItem
                  component={Link}
                  to={`/session/${session.id}`}
                  alignItems="flex-start" // This prop might not be needed on ListItemButton, but keeping for now
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
                            Score: {session.totalScore}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Time: {session.time} | Weather: {session.weather}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            Equipment: {session.gun}, {session.choke}, {session.ammo}
                          </Typography>
                        </Box>
                      </Typography>
                    }
                  />
                </ListItemButton>
                {index < sortedSessions.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}

export default SessionHistory;
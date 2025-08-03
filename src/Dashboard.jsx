import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from './firebase';

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth(app);

  const [overallAverage, setOverallAverage] = useState('--%');
  const [totalTargets, setTotalTargets] = useState('--');
  const [totalSessions, setTotalSessions] = useState('--');
  const [bestScore, setBestScore] = useState('--/100');

  const [totalRegisteredTargets, setTotalRegisteredTargets] = useState('--');
  const [totalPracticeTargets, setTotalPracticeTargets] = useState('--');

  // NEW: State for Discipline-specific KPIs
  const [singlesRegAvg, setSinglesRegAvg] = useState('--%');
  const [singlesRegTargets, setSinglesRegTargets] = useState('--');
  const [handicapsRegAvg, setHandicapsRegAvg] = useState('--%');
  const [handicapsRegTargets, setHandicapsRegTargets] = useState('--');
  const [doublesRegAvg, setDoublesRegAvg] = useState('--%');
  const [doublesRegTargets, setDoublesRegTargets] = useState('--');

  const [singlesPracAvg, setSinglesPracAvg] = useState('--%');
  const [singlesPracTargets, setSinglesPracTargets] = useState('--');
  const [handicapsPracAvg, setHandicapsPracAvg] = useState('--%');
  const [handicapsPracTargets, setHandicapsPracTargets] = useState('--');
  const [doublesPracAvg, setDoublesPracAvg] = useState('--%');
  const [doublesPracTargets, setDoublesPracTargets] = useState('--');

  useEffect(() => {
    if (!auth.currentUser) {
      setError("Please sign in to view your dashboard data.");
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const sessionsCollectionRef = collection(db, `users/${userId}/sessions`);
    const q = query(sessionsCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(fetchedSessions);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching dashboard sessions:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, db]);

  useEffect(() => {
    if (sessions.length > 0) {
      let totalScoreSum = 0;
      let totalPossibleTargets = 0;
      let highestScore = 0;

      let registeredTargetsHit = 0;
      let practiceTargetsHit = 0;

      // Discipline specific accumulators
      const disciplineStats = {
        Singles: { regHits: 0, regPossible: 0, pracHits: 0, pracPossible: 0 },
        Handicaps: { regHits: 0, regPossible: 0, pracHits: 0, pracPossible: 0 },
        Doubles: { regHits: 0, regPossible: 0, pracHits: 0, pracPossible: 0 },
      };

      sessions.forEach(session => {
        let sessionScore = 0;
        let sessionPossible = 0;

        for (const discipline in session.scores) {
          if (session.scores[discipline] && Array.isArray(session.scores[discipline])) {
            session.scores[discipline].forEach(round => {
              const roundScore = round.value !== null && round.value !== undefined ? round.value : 0;
              const roundPossible = 25; // Each round is 25 targets

              sessionScore += roundScore;
              sessionPossible += roundPossible;

              if (session.registeredEvent) {
                disciplineStats[discipline].regHits += roundScore;
                disciplineStats[discipline].regPossible += roundPossible;
              } else {
                disciplineStats[discipline].pracHits += roundScore;
                disciplineStats[discipline].pracPossible += roundPossible;
              }
            });
          }
        }

        totalScoreSum += sessionScore;
        totalPossibleTargets += sessionPossible;

        if (session.registeredEvent) {
          registeredTargetsHit += sessionScore;
        } else {
          practiceTargetsHit += sessionScore;
        }

        if (session.registeredEvent && sessionPossible >= 100) {
            if (sessionScore > highestScore) {
                highestScore = sessionScore;
            }
        }
      });

      const avg = totalPossibleTargets > 0 ? ((totalScoreSum / totalPossibleTargets) * 100).toFixed(1) : '--';
      
      setOverallAverage(`${avg}%`);
      setTotalTargets(totalScoreSum);
      setTotalSessions(sessions.length);
      setBestScore(highestScore > 0 ? `${highestScore}/100` : '--/100');

      setTotalRegisteredTargets(registeredTargetsHit);
      setTotalPracticeTargets(practiceTargetsHit);

      // NEW: Calculate and set discipline-specific KPIs
      const calculateAvg = (hits, possible) => possible > 0 ? ((hits / possible) * 100).toFixed(1) : '--';

      setSinglesRegAvg(`${calculateAvg(disciplineStats.Singles.regHits, disciplineStats.Singles.regPossible)}%`);
      setSinglesRegTargets(disciplineStats.Singles.regHits);
      setHandicapsRegAvg(`${calculateAvg(disciplineStats.Handicaps.regHits, disciplineStats.Handicaps.regPossible)}%`);
      setHandicapsRegTargets(disciplineStats.Handicaps.regHits);
      setDoublesRegAvg(`${calculateAvg(disciplineStats.Doubles.regHits, disciplineStats.Doubles.regPossible)}%`);
      setDoublesRegTargets(disciplineStats.Doubles.regHits);

      setSinglesPracAvg(`${calculateAvg(disciplineStats.Singles.pracHits, disciplineStats.Singles.pracPossible)}%`);
      setSinglesPracTargets(disciplineStats.Singles.pracHits);
      setHandicapsPracAvg(`${calculateAvg(disciplineStats.Handicaps.pracHits, disciplineStats.Handicaps.pracPossible)}%`);
      setHandicapsPracTargets(disciplineStats.Handicaps.pracHits);
      setDoublesPracAvg(`${calculateAvg(disciplineStats.Doubles.pracHits, disciplineStats.Doubles.pracPossible)}%`);
      setDoublesPracTargets(disciplineStats.Doubles.pracHits);

    } else {
      setOverallAverage('--%');
      setTotalTargets('--');
      setTotalSessions('--');
      setBestScore('--/100');
      
      setTotalRegisteredTargets('--');
      setTotalPracticeTargets('--');

      // NEW: Reset discipline-specific KPIs
      setSinglesRegAvg('--%'); setSinglesRegTargets('--');
      setHandicapsRegAvg('--%'); setHandicapsRegTargets('--');
      setDoublesRegAvg('--%'); setDoublesRegTargets('--');
      setSinglesPracAvg('--%'); setSinglesPracTargets('--');
      setHandicapsPracAvg('--%'); setHandicapsPracTargets('--');
      setDoublesPracAvg('--%'); setDoublesPracTargets('--');
    }
  }, [sessions]);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading dashboard data...</Typography>
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
        Your Trapshooting Overview
      </Typography>

      {/* Overall KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Overall Average</Typography>
            <Typography variant="h3">{overallAverage}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Targets</Typography>
            <Typography variant="h3">{totalTargets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Total Sessions</Typography>
            <Typography variant="h3">{totalSessions}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Best Score</Typography>
            <Typography variant="h3">{bestScore}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Registered vs. Practice KPIs */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Breakdown by Target Type
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Registered Targets (Total)</Typography>
            <Typography variant="h3">{totalRegisteredTargets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Practice Targets (Total)</Typography>
            <Typography variant="h3">{totalPracticeTargets}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Registered Performance by Discipline */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Registered Performance by Discipline
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Singles Avg (Reg.)</Typography>
            <Typography variant="h3">{singlesRegAvg}</Typography>
            <Typography variant="caption">Targets: {singlesRegTargets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Handicaps Avg (Reg.)</Typography>
            <Typography variant="h3">{handicapsRegAvg}</Typography>
            <Typography variant="caption">Targets: {handicapsRegTargets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Doubles Avg (Reg.)</Typography>
            <Typography variant="h3">{doublesRegAvg}</Typography>
            <Typography variant="caption">Targets: {doublesRegTargets}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Practice Performance by Discipline */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Practice Performance by Discipline
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Singles Avg (Prac.)</Typography>
            <Typography variant="h3">{singlesPracAvg}</Typography>
            <Typography variant="caption">Targets: {singlesPracTargets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Handicaps Avg (Prac.)</Typography>
            <Typography variant="h3">{handicapsPracAvg}</Typography>
            <Typography variant="caption">Targets: {handicapsPracTargets}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Doubles Avg (Prac.)</Typography>
            <Typography variant="h3">{doublesPracAvg}</Typography>
            <Typography variant="caption">Targets: {doublesPracTargets}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Chart Section - Now separated for Registered and Practice (Placeholders) */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Performance Over Time
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Registered Targets: Score Over Time (Chart Placeholder)
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed grey' }}>
              <Typography variant="body1">Registered Chart Here</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Practice Targets: Score Over Time (Chart Placeholder)
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed grey' }}>
              <Typography variant="body1">Practice Chart Here</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
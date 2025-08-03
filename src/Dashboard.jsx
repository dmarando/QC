'use client'; // This directive must be at the very top on its own line

import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert } from '@mui/material';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app, db } from './firebase';

// NOTE: PerformanceChart import is TEMPORARILY REMOVED to get Dashboard working
// import PerformanceChart from './PerformanceChart'; // This line is GONE for now


// Helper function to get max score for a discipline
const getMaxScore = (discipline) => {
  if (discipline === 'Doubles') {
    return 50;
  }
  return 25;
};

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = getAuth(app);

  const [overallAverage, setOverallAverage] = useState('--%');
  const [totalTargets, setTotalTargets] = useState('--');
  const [totalSessions, setTotalSessions] = useState('--');
  const [bestScore, setBestScore] = useState('--/100');
  const [bestScoreNumeric, setBestScoreNumeric] = useState(0); 

  const [bestScoreEventName, setBestScoreEventName] = useState('--');
  const [bestScoreLocation, setBestScoreLocation] = useState('--');
  const [bestScoreDate, setBestScoreDate] = useState('--');
  const [bestScoreDiscipline, setBestScoreDiscipline] = useState('--');


  const [totalRegisteredTargets, setTotalRegisteredTargets] = useState('--');
  const [totalPracticeTargets, setTotalPracticeTargets] = useState('--');

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

  // Chart data states (will be populated once PerformanceChart is re-integrated)
  const [registeredChartData, setRegisteredChartData] = useState({ labels: [], data: [] });
  const [practiceChartData, setPracticeChartData] = useState({ labels: [], data: [] });


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
      let totalScoreSumAll = 0;
      let totalPossibleTargetsAll = 0;
      let highest100TargetScore = 0;
      let bestScoreDetails = { eventName: '--', location: '--', date: '--', discipline: '--' };

      let registeredTargetsHit = 0;
      let practiceTargetsHit = 0;

      const disciplineStats = {
        Singles: { regHits: 0, regPossible: 0, pracHits: 0, pracPossible: 0 },
        Handicaps: { regHits: 0, regPossible: 0, pracHits: 0, pracPossible: 0 },
        Doubles: { regHits: 0, regPossible: 0, pracHits: 0, pracPossible: 0 },
      };

      // Chart data preparation variables (will be used once charts are active)
      const registeredScoresOverTime = [];
      const registeredDates = [];
      const practiceScoresOverTime = [];
      const practiceDates = [];

      // Process sessions for KPIs and Chart Data (Iterate oldest to newest for chart display)
      const sortedForChart = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date));

      sortedForChart.forEach(session => {
        let sessionScoreTotal = 0;
        let sessionPossibleTotal = 0;

        for (const discipline of Object.keys(session.scores)) {
          if (session.scores[discipline] && Array.isArray(session.scores[discipline])) {
            session.scores[discipline].forEach(round => {
              const roundScore = round.value !== null && round.value !== undefined ? round.value : 0;
              const roundPossible = getMaxScore(discipline);

              sessionScoreTotal += roundScore;
              sessionPossibleTotal += roundPossible;

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

        totalScoreSumAll += sessionScoreTotal;
        totalPossibleTargetsAll += sessionPossibleTotal;

        if (session.registeredEvent) {
          registeredTargetsHit += sessionScoreTotal;
          // Add to registered chart data if it's a 100-target event or overall performance percentage
          if (sessionPossibleTotal > 0) { // Only add if targets were actually shot
              registeredDates.push(session.date);
              registeredScoresOverTime.push(((sessionScoreTotal / sessionPossibleTotal) * 100).toFixed(1)); // Percentage for chart
          }
        } else {
          practiceTargetsHit += sessionScoreTotal;
          // Add to practice chart data
          if (sessionPossibleTotal > 0) { // Only add if targets were actually shot
              practiceDates.push(session.date);
              practiceScoresOverTime.push(((sessionScoreTotal / sessionPossibleTotal) * 100).toFixed(1)); // Percentage for chart
          }
        }

        if (session.registeredEvent) {
            for (const discipline of ['Singles', 'Handicaps', 'Doubles']) {
                if (disciplineStats[discipline].regPossible === 100) {
                    if (disciplineStats[discipline].regHits > highest100TargetScore) {
                        highest100TargetScore = disciplineStats[discipline].regHits;
                        bestScoreDetails = {
                            eventName: session.eventName || 'N/A',
                            location: session.location || 'N/A',
                            date: session.date || 'N/A',
                            discipline: discipline,
                        };
                    }
                }
            }
        }
      });

      const avg = totalPossibleTargetsAll > 0 ? ((totalScoreSumAll / totalPossibleTargetsAll) * 100).toFixed(1) : '--';
      
      setOverallAverage(`${avg}%`);
      setTotalTargets(totalScoreSumAll);
      setTotalSessions(sessions.length);
      setBestScore(highest100TargetScore > 0 ? `${highest100TargetScore}/100` : '--/100');
      setBestScoreNumeric(highest100TargetScore); 
      setBestScoreEventName(bestScoreDetails.eventName);
      setBestScoreLocation(bestScoreDetails.location);
      setBestScoreDate(bestScoreDetails.date);
      setBestScoreDiscipline(bestScoreDetails.discipline);


      setTotalRegisteredTargets(registeredTargetsHit);
      setTotalPracticeTargets(practiceTargetsHit);

      const calculateAvg = (hits, possible) => possible > 0 ? ((hits / possible) * 100).toFixed(1) : '--';

      setSinglesRegAvg(`${calculateAvg(disciplineStats.Singles.regHits, disciplineStats.Singles.regPossible)}%`);
      setSinglesRegTargets(disciplineStats.Singles.regPossible);
      setHandicapsRegAvg(`${calculateAvg(disciplineStats.Handicaps.regHits, disciplineStats.Handicaps.regPossible)}%`);
      setHandicapsRegTargets(disciplineStats.Handicaps.regPossible);
      setDoublesRegAvg(`${calculateAvg(disciplineStats.Doubles.regHits, disciplineStats.Doubles.regPossible)}%`);
      setDoublesRegTargets(disciplineStats.Doubles.regPossible);

      setSinglesPracAvg(`${calculateAvg(disciplineStats.Singles.pracHits, disciplineStats.Singles.pracPossible)}%`);
      setSinglesPracTargets(disciplineStats.Singles.pracPossible);
      setHandicapsPracAvg(`${calculateAvg(disciplineStats.Handicaps.pracHits, disciplineStats.Handicaps.pracPossible)}%`);
      setHandicapsPracTargets(disciplineStats.Handicaps.pracPossible);
      setDoublesPracAvg(`${calculateAvg(disciplineStats.Doubles.pracHits, disciplineStats.Doubles.pracPossible)}%`);
      setDoublesPracTargets(disciplineStats.Doubles.pracPossible);

      setRegisteredChartData({ labels: registeredDates, data: registeredScoresOverTime });
      setPracticeChartData({ labels: practiceDates, data: practiceScoresOverTime });

    } else {
      setOverallAverage('--%');
      setTotalTargets('--');
      setTotalSessions('--');
      setBestScore('--/100');
      setBestScoreNumeric(0);
      setBestScoreEventName('--');
      setBestScoreLocation('--');
      setBestScoreDate('--');
      setBestScoreDiscipline('--'); 
      
      setTotalRegisteredTargets('--');
      setTotalPracticeTargets('--');

      setSinglesRegAvg('--%'); setSinglesRegTargets('--');
      setHandicapsRegAvg('--%'); setHandicapsRegTargets('--');
      setDoublesRegAvg('--%'); setDoublesRegTargets('--');
      setSinglesPracAvg('--%'); setSinglesPracTargets('--');
      setHandicapsPracAvg('--%'); setHandicapsPracTargets('--');
      setDoublesPracAvg('--%'); setDoublesPracTargets('--');

      setRegisteredChartData({ labels: [], data: [] });
      setPracticeChartData({ labels: [], data: [] });
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
            {bestScoreNumeric > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Discipline: {bestScoreDiscipline}
              </Typography>
            )}
            {bestScoreNumeric > 0 && (
              <Typography variant="caption" display="block">
                Event: {bestScoreEventName}
              </Typography>
            )}
            {bestScoreNumeric > 0 && (
              <Typography variant="caption" display="block">
                Location: {bestScoreLocation} on {bestScoreDate}
              </Typography>
            )}
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

      {/* Chart Section - Now with actual charts */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Performance Over Time
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            {/* NO PerformanceChart component used directly here for now */}
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
            {/* NO PerformanceChart component used directly here for now */}
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
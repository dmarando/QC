import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";

function Dashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Trapshooting Overview
      </Typography>

      {/* Overall KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Overall Average</Typography>
            <Typography variant="h3">--%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Total Targets</Typography>
            <Typography variant="h3">--</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Total Sessions</Typography>
            <Typography variant="h3">--</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Best Score</Typography>
            <Typography variant="h3">--/100</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Registered vs. Practice KPIs */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Breakdown by Target Type
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Registered Targets (Total)</Typography>
            <Typography variant="h3">--</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Practice Targets (Total)</Typography>
            <Typography variant="h3">--</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Registered Performance by Discipline */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Registered Performance by Discipline
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Singles Avg (Reg.)</Typography>
            <Typography variant="h3">--%</Typography>
            <Typography variant="caption">Targets: --</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Handicaps Avg (Reg.)</Typography>
            <Typography variant="h3">--%</Typography>
            <Typography variant="caption">Targets: --</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Doubles Avg (Reg.)</Typography>
            <Typography variant="h3">--%</Typography>
            <Typography variant="caption">Targets: --</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Practice Performance by Discipline */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Practice Performance by Discipline
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Singles Avg (Prac.)</Typography>
            <Typography variant="h3">--%</Typography>
            <Typography variant="caption">Targets: --</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Handicaps Avg (Prac.)</Typography>
            <Typography variant="h3">--%</Typography>
            <Typography variant="caption">Targets: --</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6">Doubles Avg (Prac.)</Typography>
            <Typography variant="h3">--%</Typography>
            <Typography variant="caption">Targets: --</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Chart Section - Now separated for Registered and Practice */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Performance Over Time
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Registered Targets: Score Over Time (Chart Placeholder)
            </Typography>
            <Box
              sx={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed grey",
              }}
            >
              <Typography variant="body1">Registered Chart Here</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Practice Targets: Score Over Time (Chart Placeholder)
            </Typography>
            <Box
              sx={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px dashed grey",
              }}
            >
              <Typography variant="body1">Practice Chart Here</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

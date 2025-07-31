import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box"; // For layout
import Dashboard from "./Dashboard"; // Import our Dashboard component
import SessionLogForm from "./SessionLogForm"; // Import our new SessionLogForm component

function AppNavigation() {
  const [value, setValue] = useState(0); // State to manage which tab is active (0 = Dashboard)

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quantum Clays
          </Typography>
          <Tabs
            value={value}
            onChange={handleChange}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Dashboard" />
            <Tab label="Log Session" />
            <Tab label="Session History" />
            {/* Future tabs will go here */}
          </Tabs>
        </Toolbar>
      </AppBar>
      {/* Conditionally render content based on selected tab */}
      {value === 0 && <Dashboard />} {/* Dashboard content */}
      {value === 1 && <SessionLogForm />} {/* Log Session form */}
      {value === 2 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h4">
            Session History Content Goes Here
          </Typography>
        </Box>
      )}{" "}
      {/* Session History placeholder */}
    </Box>
  );
}

export default AppNavigation;

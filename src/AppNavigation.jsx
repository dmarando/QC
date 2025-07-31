import React, { useState, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

// Import hooks from react-router-dom
import { useLocation, useNavigate } from 'react-router-dom';

// Mapping tab indices to paths
const pathnames = ['/', '/log-session', '/history'];

function AppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const [value, setValue] = useState(0); // Default to Dashboard tab

  useEffect(() => {
    const currentPath = location.pathname;
    const newIndex = pathnames.indexOf(currentPath);

    if (newIndex !== -1) {
      // If current path matches a tab, activate that tab
      setValue(newIndex);
    } else if (currentPath.startsWith('/session/')) {
      // If on a session detail page, keep Session History tab active
      setValue(2); // Index for Session History tab
    } else {
      // Fallback to Dashboard if path is unrecognized and not a detail page
      setValue(0);
    }
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(pathnames[newValue]); // Navigate to the corresponding path
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quantum Clays
          </Typography>
          <Tabs value={value} onChange={handleChange} textColor="inherit" indicatorColor="secondary">
            <Tab label="Dashboard" value={0} />
            <Tab label="Log Session" value={1} />
            <Tab label="Session History" value={2} />
          </Tabs>
        </Toolbar>
      </AppBar>
      {/* Content is now rendered directly by App.jsx based on routes */}
    </Box>
  );
}

export default AppNavigation;
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
  IconButton,
  CircularProgress,
  LinearProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// NO LONGER NEEDED: import { GoogleMap, StandaloneSearchBox, LoadScript } from '@react-google-maps/api'; // This line is GONE

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app, storage } from './firebase';

// Google Maps API Key is now in index.html, not needed here
const VISUAL_CROSSING_API_KEY = '9FFM2WGU7BA9ZGSCT2Z36M9TD'; // Your Visual Crossing API Key

// We'll eventually populate these from Firestore
const mockGuns = [
  { id: 'gun1', name: 'Beretta 692' },
  { id: 'gun2', name: 'Browning Citori' },
  { id: 'gun3', name: 'Perazzi MX8' },
];

const mockChokes = [
  { id: 'choke1', name: 'Improved Modified' },
  { id: 'choke2', name: 'Light Full' },
  { id: 'choke3', name: 'Full' },
];

const mockAmmo = [
  { id: 'ammo1', name: 'Federal Top Gun' },
  { id: 'ammo2', name: 'Winchester AA' },
  { id: 'ammo3', name: 'Remington STS' },
];

const disciplines = ['Singles', 'Handicaps', 'Doubles'];

function SessionLogForm() {
  const auth = getAuth(app);

  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '',
    gunUsed: '',
    chokeUsed: '',
    ammunitionUsed: '',
    weather: '',
    registeredEvent: false,
    scores: {
      Singles: [{ value: null, didNotShoot: false }],
      Handicaps: [],
      Doubles: [],
    },
    notes: '',
    fileAttachment: null,
    fileAttachmentURL: '',
  });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const locationInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSessionData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSessionData((prevData) => ({ ...prevData, fileAttachment: file }));
      setUploadError(null);
      setUploadSuccess(false);
      setUploadProgress(0);
    }
  };

  const handleScoreChange = (discipline, roundIndex, e) => {
    const { value } = e.target;
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline][roundIndex] = {
        ...newScores[discipline][roundIndex],
        value: value === '' ? null : parseInt(value, 10),
      };
      return { ...prevData, scores: newScores };
    });
  };

  const handleDidNotShootChange = (discipline, roundIndex, e) => {
    const { checked } = e.target;
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline][roundIndex] = {
        ...newScores[discipline][roundIndex],
        didNotShoot: checked,
        value: checked ? null : newScores[discipline][roundIndex].value,
      };
      return { ...prevData, scores: newScores };
    });
  };

  const addPracticeRound = (discipline) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline] = [...newScores[discipline], { value: null, didNotShoot: false }];
      return { ...prevData, scores: newScores };
    });
  };

  const removePracticeRound = (discipline, roundIndex) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline] = newScores[discipline].filter((_, i) => i !== roundIndex);
      return { ...prevData, scores: newScores };
    });
  };

  const addPracticeDiscipline = (disciplineToAdd) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      if (!newScores[disciplineToAdd] || newScores[disciplineToAdd].length === 0) {
        newScores[disciplineToAdd] = [{ value: null, didNotShoot: false }];
      }
      return { ...prevData, scores: newScores };
    });
  };

  const removePracticeDiscipline = (disciplineToRemove) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      delete newScores[disciplineToRemove];
      return { ...prevData, scores: newScores };
    });
  };

  useEffect(() => {
    if (sessionData.registeredEvent) {
      setSessionData(prevData => ({
        ...prevData,
        scores: {
          Singles: [{ value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }],
          Handicaps: [{ value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }],
          Doubles: [{ value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }],
        }
      }));
    } else {
      setSessionData(prevData => ({
        ...prevData,
        scores: {
          Singles: [{ value: null, didNotShoot: false }],
          Handicaps: [],
          Doubles: [],
        }
      }));
    }
  }, [sessionData.registeredEvent]);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places && locationInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['establishment', 'geocode'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setSessionData((prevData) => ({
            ...prevData,
            location: place.formatted_address,
          }));
          console.log("Selected location (via Autocomplete):", place.formatted_address);
        }
      });
    }
  }, [locationInputRef.current]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (sessionData.location && sessionData.date && sessionData.time && VISUAL_CROSSING_API_KEY && VISUAL_CROSSING_API_KEY !== 'YOUR_VISUAL_CROSSING_API_KEY') {
        setWeatherLoading(true);
        setSessionData(prevData => ({ ...prevData, weather: 'Fetching weather...' }));
        try {
          const queryLocation = encodeURIComponent(sessionData.location);
          const queryDateTime = `${sessionData.date}T${sessionData.time}:00`;
          
          const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${queryLocation}/${queryDateTime}/${queryDateTime}?unitGroup=us&include=hours&key=${VISUAL_CROSSING_API_KEY}&contentType=json`;

          console.log("Fetching weather from:", url);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
          }
          const data = await response.json();
          console.log("Weather data:", data);

          if (data.days && data.days.length > 0 && data.days[0].hours && data.days[0].hours.length > 0) {
            const targetHour = parseInt(sessionData.time.substring(0,2), 10);
            const nearestHourData = data.days[0].hours.reduce((prev, curr) => {
                const currHour = parseInt(curr.datetime.substring(0,2), 10);
                return (Math.abs(currHour - targetHour) < Math.abs(parseInt(prev.datetime.substring(0,2), 10) - targetHour) ? curr : prev);
            });

            const weatherSummary = `${nearestHourData.conditions} at ${nearestHourData.temp}°F. Wind: ${nearestHourData.windspeed} mph. Precip: ${nearestHourData.precipprob}%`;
            setSessionData(prevData => ({ ...prevData, weather: weatherSummary }));
          } else {
            setSessionData(prevData => ({ ...prevData, weather: 'Weather data not found for this time/location.' }));
          }
        } catch (error) {
          console.error("Failed to fetch weather data:", error);
          setSessionData(prevData => ({ ...prevData, weather: `Error fetching weather: ${error.message}` }));
        } finally {
          setWeatherLoading(false);
        }
      } else if (!sessionData.location || !sessionData.date || !sessionData.time) {
        setSessionData(prevData => ({ ...prevData, weather: '' }));
      }
    };

    const debounceFetch = setTimeout(() => {
        fetchWeather();
    }, 1000);

    return () => clearTimeout(debounceFetch);
  }, [sessionData.location, sessionData.date, sessionData.time, VISUAL_CROSSING_API_KEY]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(false);

    let uploadedFileUrl = '';
    if (sessionData.fileAttachment && auth.currentUser) {
      setUploadProgress(0);
      try {
        const file = sessionData.fileAttachment;
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/scoresheets/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error("File upload error:", error);
            setUploadError(`File upload failed: ${error.message}`);
            setUploadProgress(0);
          },
          async () => {
            uploadedFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setSessionData(prevData => ({ ...prevData, fileAttachmentURL: uploadedFileUrl }));
            setUploadSuccess(true);
            console.log("File available at:", uploadedFileUrl);
          }
        );
      } catch (error) {
        console.error("Could not start upload:", error);
        setUploadError(`Could not start upload: ${error.message}`);
        setUploadProgress(0);
      }
    } else if (sessionData.fileAttachment && !auth.currentUser) {
      setUploadError("Please sign in to upload files.");
    } else {
      console.log("No file to upload. Session Data Submitted:", sessionData);
    }

    console.log("Final Session Data for Submission:", sessionData);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Log New Session
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Date and Time on the same row */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                name="date"
                value={sessionData.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                name="time"
                value={sessionData.time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Location with Autocomplete */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={sessionData.location}
                onChange={handleChange}
                placeholder="Enter location (e.g., Pine Hill Gun Club)"
                inputRef={locationInputRef}
              />
            </Grid>

            {/* Gun Used Dropdown */}
            <Grid item xs={12} sm={4} sx={{ minWidth: { xs: 'auto', sm: '180px' } }}>
              <TextField
                select
                fullWidth
                label="Gun Used"
                name="gunUsed"
                value={sessionData.gunUsed}
                onChange={handleChange}
                displayEmpty
                renderValue={(selected) => {
                  if (selected === '') {
                    return <em>Select a gun</em>;
                  }
                  return selected;
                }}
                sx={{ '& .MuiInputLabel-root': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
              >
                <MenuItem value="" disabled>
                  <em>Select a gun</em>
                </MenuItem>
                {mockGuns.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Choke Used Dropdown */}
            <Grid item xs={12} sm={4} sx={{ minWidth: { xs: 'auto', sm: '180px' } }}>
              <TextField
                select
                fullWidth
                label="Choke Used"
                name="chokeUsed"
                value={sessionData.chokeUsed}
                onChange={handleChange}
                displayEmpty
                renderValue={(selected) => {
                  if (selected === '') {
                    return <em>Select a choke</em>;
                  }
                  return selected;
                }}
                sx={{ '& .MuiInputLabel-root': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
              >
                 <MenuItem value="" disabled>
                  <em>Select a choke</em>
                </MenuItem>
                {mockChokes.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Ammunition Used Dropdown */}
            <Grid item xs={12} sm={4} sx={{ minWidth: { xs: 'auto', sm: '180px' } }}>
              <TextField
                select
                fullWidth
                label="Ammunition Used"
                name="ammunitionUsed"
                value={sessionData.ammunitionUsed}
                onChange={handleChange}
                displayEmpty
                renderValue={(selected) => {
                  if (selected === '') {
                    return <em>Select ammo</em>;
                  }
                  return selected;
                }}
                sx={{ '& .MuiInputLabel-root': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
              >
                 <MenuItem value="" disabled>
                  <em>Select ammo</em>
                </MenuItem>
                {mockAmmo.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Weather Field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weather"
                name="weather"
                value={sessionData.weather}
                onChange={handleChange}
                placeholder="Auto-fetched weather will go here"
                disabled
                InputProps={{
                  endAdornment: weatherLoading ? <CircularProgress size={20} /> : null,
                }}
              />
            </Grid>

            {/* File Upload */}
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ height: '56px' }}
              >
                Upload Score Sheet (PDF/JPG)
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg"
                />
              </Button>
              {sessionData.fileAttachment && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File selected: {sessionData.fileAttachment.name}
                </Typography>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary">{`${Math.round(uploadProgress)}%`}</Typography>
                </Box>
              )}
              {uploadError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {uploadError}
                </Alert>
              )}
              {uploadSuccess && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  File uploaded successfully!
                </Alert>
              )}
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={sessionData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Any additional notes about the session..."
              />
            </Grid>

            {/* Registered Event Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sessionData.registeredEvent}
                    onChange={handleChange}
                    name="registeredEvent"
                  />
                }
                label="Registered Event"
              />
            </Grid>

            {/* Dynamic Score Entry Logic */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, border: '1px solid lightgrey' }}>
                <Typography variant="h6" gutterBottom>Score Entry</Typography>

                {sessionData.registeredEvent ? (
                  // Registered Event Mode
                  <Grid container spacing={2}>
                    {disciplines.map((discipline) => (
                      <Grid item xs={12} key={discipline}>
                        <Typography variant="subtitle1" gutterBottom>{discipline}</Typography>
                        <Grid container spacing={1} alignItems="center">
                          {[0, 1, 2, 3].map((roundIndex) => (
                            <Grid item xs={3} key={`${discipline}-${roundIndex}`}>
                              <TextField
                                fullWidth
                                label={`Round ${roundIndex + 1}`}
                                type="number"
                                inputProps={{ min: 0, max: 25 }}
                                value={sessionData.scores[discipline][roundIndex]?.value ?? ''}
                                onChange={(e) => handleScoreChange(discipline, roundIndex, e)}
                                disabled={sessionData.scores[discipline][roundIndex]?.didNotShoot}
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={sessionData.scores[discipline][roundIndex]?.didNotShoot ?? false}
                                    onChange={(e) => handleDidNotShootChange(discipline, roundIndex, e)}
                                  />
                                }
                                label="Did not shoot"
                                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  // Practice Mode
                  <Box>
                    {disciplines.filter(d => sessionData.scores[d] && sessionData.scores[d].length > 0 || d === 'Singles').map((discipline) => (
                      <Box key={discipline} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                          {discipline} Scores
                          {discipline !== 'Singles' && (
                            <IconButton edge="end" aria-label="remove discipline" onClick={() => removePracticeDiscipline(discipline)} size="small" sx={{ ml: 1 }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Typography>
                        <Grid container spacing={1} alignItems="center">
                          {sessionData.scores[discipline] && sessionData.scores[discipline].map((score, roundIndex) => (
                            <Grid item xs={3} key={`${discipline}-practice-${roundIndex}`}>
                              <TextField
                                fullWidth
                                label={`Round ${roundIndex + 1}`}
                                type="number"
                                inputProps={{ min: 0, max: 25 }}
                                value={score.value ?? ''}
                                onChange={(e) => handleScoreChange(discipline, roundIndex, e)}
                              />
                              <IconButton aria-label="remove round" onClick={() => removePracticeRound(discipline, roundIndex)} size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Grid>
                          ))}
                          <Grid item xs={12} sx={{ mt: 1 }}>
                            <Button
                              variant="outlined"
                              onClick={() => addPracticeRound(discipline)}
                              startIcon={<AddIcon />}
                            >
                              Add Round
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                    <Button
                      variant="text"
                      onClick={() => {
                        const availableDisciplines = disciplines.filter(d => !sessionData.scores[d] || sessionData.scores[d].length === 0);
                        if (availableDisciplines.length > 0) {
                          addPracticeDiscipline(availableDisciplines[0]);
                        }
                      }}
                      sx={{ mt: 2 }}
                    >
                      Add Discipline
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Log Session
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default SessionLogForm;
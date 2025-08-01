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

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { app, storage, db } from './firebase'; // Ensure db is imported
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore'; // NEW: Import getDocs, query, orderBy

const Maps_API_KEY = 'AIzaSyASuiq7EPqMUAQjwdH6KeFPmKb86b9v_c4';
const VISUAL_CROSSING_API_KEY = '9FFM2WGU7BA9ZGSCT2Z36M9TD';

// NO LONGER NEEDED: mockGuns, mockChokes, mockAmmo are removed
const disciplines = ['Singles', 'Handicaps', 'Doubles'];

const initialSessionData = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  location: '',
  eventName: '',
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
};

function SessionLogForm() {
  const auth = getAuth(app);

  const [sessionData, setSessionData] = useState(initialSessionData);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formSubmitMessage, setFormSubmitMessage] = useState(null);

  // NEW: State for master lists
  const [guns, setGuns] = useState([]);
  const [chokes, setChokes] = useState([]);
  const [ammoOptions, setAmmoOptions] = useState([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);
  const [masterDataError, setMasterDataError] = useState(null);
  
  const locationInputRef = useRef(null);

  // NEW: useEffect to fetch master data from Firestore
  useEffect(() => {
    const fetchMasterData = async () => {
      setMasterDataLoading(true);
      setMasterDataError(null);
      try {
        const fetchCollection = async (collectionName) => {
          const q = query(collection(db, collectionName), orderBy('name')); // Order by name for dropdown
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        const [fetchedGuns, fetchedChokes, fetchedAmmo] = await Promise.all([
          fetchCollection('shotgunOptions'),
          fetchCollection('chokeOptions'),
          fetchCollection('ammoOptions'),
        ]);

        setGuns(fetchedGuns);
        setChokes(fetchedChokes);
        setAmmoOptions(fetchedAmmo);
        console.log("Master data fetched:", { fetchedGuns, fetchedChokes, fetchedAmmo });

      } catch (err) {
        console.error("Error fetching master data:", err);
        setMasterDataError("Failed to load equipment options.");
      } finally {
        setMasterDataLoading(false);
      }
    };
    fetchMasterData();
  }, [db]); // Run once on component mount, or if db instance changes


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
        eventName: prevData.eventName,
        scores: {
          Singles: [{ value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }],
          Handicaps: [{ value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }],
          Doubles: [{ value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }, { value: null, didNotShoot: false }],
        }
      }));
    } else {
      setSessionData(prevData => ({
        ...prevData,
        eventName: '',
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
    setFormSubmitMessage(null);

    if (!auth.currentUser) {
      setFormSubmitMessage({ type: 'error', message: 'Please sign in to log a session.' });
      return;
    }

    let finalSessionData = { ...sessionData };
    let uploadedFileUrl = '';

    if (sessionData.fileAttachment) {
      setUploadProgress(0);
      try {
        const file = sessionData.fileAttachment;
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/scoresheets/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
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
              reject(error);
            },
            async () => {
              uploadedFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setSessionData(prevData => ({ ...prevData, fileAttachmentURL: uploadedFileUrl }));
              setUploadSuccess(true);
              console.log("File available at:", uploadedFileUrl);
              resolve();
            }
          );
        });
        finalSessionData.fileAttachmentURL = uploadedFileUrl;
      } catch (error) {
        setFormSubmitMessage({ type: 'error', message: `Error uploading file: ${error.message}` });
        return;
      }
    }

    try {
      const { fileAttachment, ...dataToSave } = finalSessionData;

      const sessionWithMetadata = {
        ...dataToSave,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        scores: Object.entries(dataToSave.scores).reduce((acc, [discipline, rounds]) => {
          acc[discipline] = rounds.map(r => ({
            value: r.value !== null ? r.value : null,
            didNotShoot: r.didNotShoot
          }));
          return acc;
        }, {}),
      };

      const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/sessions`), sessionWithMetadata);
      console.log("Session saved with ID:", docRef.id);
      setFormSubmitMessage({ type: 'success', message: 'Session logged successfully!' });
      setSessionData(initialSessionData); // Reset form
      setUploadProgress(0);
      setUploadSuccess(false);
    } catch (error) {
      console.error("Error saving session to Firestore:", error);
      setFormSubmitMessage({ type: 'error', message: `Error logging session: ${error.message}` });
    }
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

            {/* Event Name - Conditionally rendered for Registered Event */}
            {sessionData.registeredEvent && (
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Event Name"
                        name="eventName"
                        value={sessionData.eventName}
                        onChange={handleChange}
                        placeholder="Enter registered event name (e.g., State Championship)"
                        sx={{ mb: 3 }}
                    />
                </Grid>
            )}

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
                {guns.map((option) => ( // Use 'guns' fetched from Firestore
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
                {chokes.map((option) => ( // Use 'chokes' fetched from Firestore
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
                {ammoOptions.map((option) => ( // Use 'ammoOptions' fetched from Firestore
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
        {masterDataLoading && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ ml: 1 }}>Loading equipment options...</Typography>
          </Box>
        )}
        {masterDataError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {masterDataError}
          </Alert>
        )}
        {formSubmitMessage && (
          <Alert severity={formSubmitMessage.type} sx={{ mt: 2 }}>
            {formSubmitMessage.message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

export default SessionLogForm;
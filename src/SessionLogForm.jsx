import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { app, storage, db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';

const Maps_API_KEY = 'AIzaSyASuiq7EPqMUAQjwdH6KeFPmKb86b9v_c4';
const VISUAL_CROSSING_API_KEY = '9FFM2WGU7BA9ZGSCT2Z36M9TD';

const disciplines = ['Singles', 'Handicaps', 'Doubles'];

const getMaxScore = (discipline, isBig50) => {
  if (isBig50) {
    if (discipline === 'Doubles') {
      return 50;
    }
    return 25;
  }
  
  if (discipline === 'Doubles') {
    return 50;
  }

  return 25;
};

const getRequiredRounds = (discipline, isChampionship, isBig50) => {
  if (isBig50) {
    switch (discipline) {
      case 'Singles':
        return 2;
      case 'Handicaps':
        return 2;
      case 'Doubles':
        return 1;
      default:
        return 1;
    }
  }
  
  switch (discipline) {
    case 'Singles':
      return isChampionship ? 8 : 4;
    case 'Handicaps':
      return 4;
    case 'Doubles':
      return 2;
    default:
      return 1;
  }
};


const initialSessionData = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  location: '',
  fullAddress: '',
  eventName: '',
  gunUsed: '',
  chokeUsed: '',
  ammunitionUsed: '',
  weather: '',
  registeredEvent: false,
  isChampionshipEvent: false,
  isBig50Event: false,
  scores: {},
  notes: '',
  fileAttachment: null,
  fileAttachmentURL: '',
};

function SessionLogForm() {
  const auth = getAuth(app);
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(initialSessionData);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formSubmitMessage, setFormSubmitMessage] = useState(null);

  const [guns, setGuns] = useState([]);
  const [chokes, setChokes] = useState([]);
  const [ammoOptions, setAmmoOptions] = useState([]);
  const [eventOptions, setEventOptions] = useState([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);
  const [masterDataError, setMasterDataError] = useState(null);
  const [isCustomEvent, setIsCustomEvent] = useState(false);

  const locationInputRef = useRef(null);

  useEffect(() => {
    const fetchMasterData = async () => {
      setMasterDataLoading(true);
      setMasterDataError(null);
      try {
        const fetchCollection = async (collectionName) => {
          const q = query(collection(db, collectionName), orderBy('name'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        const [fetchedGuns, fetchedChokes, fetchedAmmo, fetchedEvents] = await Promise.all([
          fetchCollection('shotgunOptions'),
          fetchCollection('chokeOptions'),
          fetchCollection('ammoOptions'),
          fetchCollection('eventOptions'),
        ]);

        setGuns(fetchedGuns);
        setChokes(fetchedChokes);
        setAmmoOptions(fetchedAmmo);
        setEventOptions(fetchedEvents);

      } catch (err) {
        setMasterDataError("Failed to load equipment options.");
      } finally {
        setMasterDataLoading(false);
      }
    };
    fetchMasterData();
  }, [db]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'isChampionshipEvent' && checked) {
        setSessionData(prevData => ({ ...prevData, [name]: checked, isBig50Event: false }));
    } else if (name === 'isBig50Event' && checked) {
        setSessionData(prevData => ({ ...prevData, [name]: checked, isChampionshipEvent: false }));
    } else {
        setSessionData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }
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
    const maxScore = getMaxScore(discipline, sessionData.isBig50Event);
    let scoreValue = value === '' ? null : parseInt(value, 10);
    if (scoreValue !== null && (scoreValue < 0 || scoreValue > maxScore)) {
      scoreValue = scoreValue < 0 ? 0 : maxScore;
    }

    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline][roundIndex] = {
        ...newScores[discipline][roundIndex],
        value: scoreValue,
      };
      return { ...prevData, scores: newScores };
    });
  };

  const handleDisciplineDidNotShootChange = (discipline, checked) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline] = newScores[discipline].map(round => ({
        ...round,
        didNotShoot: checked,
        value: checked ? null : round.value
      }));
      return { ...prevData, scores: newScores };
    });
  };
  
  const addDisciplineFromSelect = (disciplineToAdd) => {
    if (disciplineToAdd) {
      setSessionData((prevData) => {
        if (prevData.scores[disciplineToAdd]) {
          return prevData;
        }

        const newScores = { ...prevData.scores };
        
        const numRounds = getRequiredRounds(
          disciplineToAdd, 
          prevData.isChampionshipEvent, 
          prevData.isBig50Event
        );
        
        newScores[disciplineToAdd] = Array(numRounds).fill(null).map(() => ({ value: null, didNotShoot: false }));
        
        return { ...prevData, scores: newScores };
      });
    }
  };

  const removeDiscipline = (disciplineToRemove) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      delete newScores[disciplineToRemove];
      return { ...prevData, scores: newScores };
    });
  };

  // =================================================================
  // START: NEW FUNCTIONS FOR PRACTICE MODE
  // =================================================================
  const addPracticeRound = (discipline) => {
    setSessionData(prevData => {
      const newScores = { ...prevData.scores };
      if (newScores[discipline]) {
        newScores[discipline].push({ value: null, didNotShoot: false });
      } else {
        // If discipline doesn't exist, create it with one round
        newScores[discipline] = [{ value: null, didNotShoot: false }];
      }
      return { ...prevData, scores: newScores };
    });
  };

  const removePracticeRound = (discipline, roundIndex) => {
    setSessionData(prevData => {
      const newScores = { ...prevData.scores };
      if (newScores[discipline] && newScores[discipline][roundIndex]) {
        newScores[discipline].splice(roundIndex, 1);
        // If that was the last round, remove the discipline itself
        if (newScores[discipline].length === 0) {
          delete newScores[discipline];
        }
      }
      return { ...prevData, scores: newScores };
    });
  };
  // =================================================================
  // END: NEW FUNCTIONS FOR PRACTICE MODE
  // =================================================================


  useEffect(() => {
    if (sessionData.registeredEvent) {
      setSessionData(prevData => ({
        ...prevData,
        scores: {},
        isChampionshipEvent: false,
        isBig50Event: false,
      }));
    } else {
      setSessionData(prevData => ({
        ...prevData,
        eventName: '',
        isChampionshipEvent: false,
        isBig50Event: false,
        scores: {},
      }));
    }
  }, [sessionData.registeredEvent]);


  useEffect(() => {
    if (!sessionData.registeredEvent) return;

    setSessionData(prevData => {
      const newScores = { ...prevData.scores };
      let hasChanged = false;

      for (const discipline in newScores) {
        if (Object.prototype.hasOwnProperty.call(newScores, discipline)) {
          const currentRounds = newScores[discipline];
          
          const requiredRounds = getRequiredRounds(
            discipline, 
            prevData.isChampionshipEvent, 
            prevData.isBig50Event
          );

          if (currentRounds.length !== requiredRounds) {
            hasChanged = true;
            const updatedRounds = Array(requiredRounds).fill(null).map((_, i) => {
              return currentRounds[i] || { value: null, didNotShoot: false };
            });
            newScores[discipline] = updatedRounds;
          }
        }
      }

      if (hasChanged) {
        return { ...prevData, scores: newScores };
      }

      return prevData;
    });
  }, [sessionData.isChampionshipEvent, sessionData.isBig50Event, sessionData.registeredEvent]);


  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places && locationInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['establishment', 'geocode'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place) {
          const displayLocation = place.name || place.formatted_address || '';
          setSessionData((prevData) => ({
            ...prevData,
            location: displayLocation,
            fullAddress: place.formatted_address,
          }));
        }
      });
    }
  }, [locationInputRef.current]);

  useEffect(() => {
    const fetchWeather = async () => {
      const locationForWeather = sessionData.fullAddress || sessionData.location;

      if (locationForWeather && sessionData.date && sessionData.time && VISUAL_CROSSING_API_KEY && VISUAL_CROSSING_API_KEY !== 'YOUR_VISUAL_CROSSING_API_KEY') {
        setWeatherLoading(true);
        setSessionData(prevData => ({ ...prevData, weather: 'Fetching weather...' }));
        try {
          const queryLocation = encodeURIComponent(locationForWeather);
          const queryDateTime = `${sessionData.date}T${sessionData.time}:00`;
          
          const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${queryLocation}/${queryDateTime}/${queryDateTime}?unitGroup=us&include=hours&key=${VISUAL_CROSSING_API_KEY}&contentType=json`;

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
          }
          const data = await response.json();

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
          setSessionData(prevData => ({ ...prevData, weather: `Error fetching weather: ${error.message}` }));
        } finally {
          setWeatherLoading(false);
        }
      } else if (!locationForWeather || !sessionData.date || !sessionData.time) {
        setSessionData(prevData => ({ ...prevData, weather: '' }));
      }
    };

    const debounceFetch = setTimeout(() => {
        fetchWeather();
    }, 1000);

    return () => clearTimeout(debounceFetch);
  }, [sessionData.location, sessionData.date, sessionData.time, sessionData.fullAddress, VISUAL_CROSSING_API_KEY]);


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
            },
            (error) => {
              setUploadError(`File upload failed: ${error.message}`);
              setUploadProgress(0);
              reject(error);
            },
            async () => {
              uploadedFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setSessionData(prevData => ({ ...prevData, fileAttachmentURL: uploadedFileUrl }));
              setUploadSuccess(true);
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
          if (rounds && rounds.length > 0) { 
            acc[discipline] = rounds.map(r => ({
              value: r.didNotShoot ? null : (r.value !== null ? r.value : null),
              didNotShoot: r.didNotShoot
            }));
          }
          return acc;
        }, {}),
      };

      await addDoc(collection(db, `users/${auth.currentUser.uid}/sessions`), sessionWithMetadata);
      setFormSubmitMessage({ type: 'success', message: 'Session logged successfully!' });
      setSessionData(initialSessionData);
      setUploadProgress(0);
      setUploadSuccess(false);
      navigate('/history');
    } catch (error) {
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
            {/* Championship and Big 50 Event Toggles (only for Registered Events) */}
            {sessionData.registeredEvent && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sessionData.isChampionshipEvent}
                        onChange={handleChange}
                        name="isChampionshipEvent"
                        disabled={sessionData.isBig50Event}
                      />
                    }
                    label="Championship Event (Singles 200 Targets)"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sessionData.isBig50Event}
                        onChange={handleChange}
                        name="isBig50Event"
                        disabled={sessionData.isChampionshipEvent}
                      />
                    }
                    label="Big 50 Event"
                  />
                </Grid>
              </>
            )}

            {/* Event Name - Conditionally rendered for Registered Event */}
            {sessionData.registeredEvent && (
                <Grid item xs={12} sx={{ minWidth: { xs: 'auto', sm: '250px' } }}>
                    {isCustomEvent ? (
                        <TextField
                            fullWidth
                            label="Enter Custom Event Name"
                            name="eventName"
                            value={sessionData.eventName}
                            onChange={handleChange}
                            InputProps={{
                                endAdornment: (
                                    <Button onClick={() => setIsCustomEvent(false)}>
                                        Use Dropdown
                                    </Button>
                                )
                            }}
                        />
                    ) : (
                        <TextField
                            select
                            fullWidth
                            label="Event Name"
                            name="eventName"
                            value={sessionData.eventName}
                            onChange={(e) => {
                                if (e.target.value === 'custom') {
                                    setIsCustomEvent(true);
                                    setSessionData(prevData => ({ ...prevData, eventName: '' }));
                                } else {
                                    handleChange(e);
                                }
                            }}
                            displayEmpty
                            renderValue={(selected) => {
                                if (selected === '') {
                                    return <em>Select an event or enter a new one</em>;
                                }
                                return selected;
                            }}
                        >
                            <MenuItem value="" disabled>
                                <em>Select an event or enter a new one</em>
                            </MenuItem>
                            {masterDataLoading ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                                </MenuItem>
                            ) : (
                                eventOptions.map((option) => (
                                    <MenuItem key={option.id} value={option.name}>
                                        {option.name}
                                    </MenuItem>
                                ))
                            )}
                            <MenuItem value="custom">
                                <strong>Enter Custom Event...</strong>
                            </MenuItem>
                        </TextField>
                    )}
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
                {masterDataLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                  </MenuItem>
                ) : (
                  guns.map((option) => (
                    <MenuItem key={option.id} value={option.name}>
                      {option.name}
                    </MenuItem>
                  ))
                )}
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
                {masterDataLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                  </MenuItem>
                ) : (
                  chokes.map((option) => (
                    <MenuItem key={option.id} value={option.name}>
                      {option.name}
                    </MenuItem>
                  ))
                )}
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
                {masterDataLoading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Loading...
                  </MenuItem>
                ) : (
                  ammoOptions.map((option) => (
                    <MenuItem key={option.id} value={option.name}>
                      {option.name}
                    </MenuItem>
                  ))
                )}
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
              {sessionData.fileAttachmentURL && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Current File: <a href={sessionData.fileAttachmentURL} target="_blank" rel="noopener noreferrer">View</a>
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
            
            {/* Dynamic Score Entry Logic */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, border: '1px solid lightgrey' }}>
                <Typography variant="h6" gutterBottom>Score Entry</Typography>
                {sessionData.registeredEvent ? (
                  // =================================================================
                  // Registered Event Mode
                  // =================================================================
                    <Box>
                        {/* Dropdown for Add Discipline */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TextField
                                select
                                fullWidth
                                label="Add Discipline"
                                value=""
                                onChange={(e) => addDisciplineFromSelect(e.target.value)}
                                sx={{ mr: 1, flexGrow: 1 }}
                                disabled={Object.keys(sessionData.scores).length >= disciplines.length}
                            >
                                <MenuItem value="" disabled>Select to add</MenuItem>
                                {disciplines
                                  .filter(d => !sessionData.scores[d])
                                  .map(d => (
                                    <MenuItem key={d} value={d}>{d}</MenuItem>
                                  ))}
                            </TextField>
                        </Box>
                        
                        <Grid container spacing={2}>
                          {Object.keys(sessionData.scores).map((discipline) => (
                              <Grid item xs={12} key={discipline}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>{discipline}</Typography>
                                      <IconButton edge="end" aria-label="remove discipline" onClick={() => removeDiscipline(discipline)} size="small" sx={{ ml: 1 }}>
                                          <DeleteIcon fontSize="small" />
                                      </IconButton>
                                      <FormControlLabel
                                          control={
                                              <Checkbox
                                                  checked={sessionData.scores[discipline]?.[0]?.didNotShoot ?? false}
                                                  onChange={(e) => handleDisciplineDidNotShootChange(discipline, e.target.checked)}
                                              />
                                          }
                                          label="Did not shoot"
                                          sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' }, ml: 'auto' }}
                                      />
                                  </Box>
                                  <Grid container spacing={1} alignItems="center">
                                      {sessionData.scores[discipline].map((round, roundIndex) => (
                                          <Grid item xs={6} sm={3} key={`${discipline}-${roundIndex}`}>
                                              <TextField
                                                  fullWidth
                                                  label={`Round ${roundIndex + 1}`}
                                                  type="number"
                                                  inputProps={{ min: 0, max: getMaxScore(discipline, sessionData.isBig50Event) }}
                                                  value={round.value ?? ''}
                                                  onChange={(e) => handleScoreChange(discipline, roundIndex, e)}
                                                  disabled={round.didNotShoot}
                                              />
                                          </Grid>
                                      ))}
                                  </Grid>
                              </Grid>
                          ))}
                        </Grid>
                    </Box>
                ) : (
                  // =================================================================
                  // START: RESTORED PRACTICE MODE
                  // =================================================================
                  <Box>
                    {/* Message for when no disciplines are added yet */}
                    {Object.keys(sessionData.scores).length === 0 ? (
                        <Box sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
                            <Typography variant="body1" color="text.secondary">No disciplines added. Use the "Add Discipline" dropdown below.</Typography>
                        </Box>
                    ) : (
                      // Display added disciplines and their rounds
                      Object.keys(sessionData.scores).map((discipline) => (
                        <Box key={discipline} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle1">{discipline} Scores</Typography>
                                <IconButton edge="end" aria-label="remove discipline" onClick={() => removeDiscipline(discipline)} size="small" sx={{ ml: 1 }}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Grid container spacing={1} alignItems="center">
                              {sessionData.scores[discipline].map((score, roundIndex) => (
                                <Grid item xs={10} sm={5} md={3} key={`${discipline}-practice-${roundIndex}`} sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                      fullWidth
                                      label={`Round ${roundIndex + 1}`}
                                      type="number"
                                      inputProps={{ min: 0, max: getMaxScore(discipline, false) }} // isBig50 is always false for practice
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
                      ))
                    )}
                    
                    {/* Dropdown to add a new discipline */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #ddd' }}>
                      <Typography variant="body2" sx={{mb: 1}}>Add a discipline to your practice session:</Typography>
                      <TextField
                          select
                          label="Add Discipline"
                          value=""
                          onChange={(e) => addPracticeRound(e.target.value)}
                          sx={{ minWidth: 200 }}
                          size="small"
                          disabled={Object.keys(sessionData.scores).length >= disciplines.length}
                      >
                          <MenuItem value="" disabled>Select to add</MenuItem>
                          {disciplines.filter(d => !sessionData.scores[d]).map(d => (
                              <MenuItem key={d} value={d}>{d}</MenuItem>
                          ))}
                      </TextField>
                    </Box>
                  </Box>
                  // =================================================================
                  // END: RESTORED PRACTICE MODE
                  // =================================================================
                )}
              </Paper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={weatherLoading || uploadProgress > 0}>
                Log Session
              </Button>
            </Grid>
          </Grid>
        </form>
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
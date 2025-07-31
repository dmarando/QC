import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

// We'll eventually populate these from Firestore
const mockGuns = [
  { id: "gun1", name: "Beretta 692" },
  { id: "gun2", name: "Browning Citori" },
  { id: "gun3", name: "Perazzi MX8" },
];

const mockChokes = [
  { id: "choke1", name: "Improved Modified" },
  { id: "choke2", name: "Light Full" },
  { id: "choke3", name: "Full" },
];

const mockAmmo = [
  { id: "ammo1", name: "Federal Top Gun" },
  { id: "ammo2", name: "Winchester AA" },
  { id: "ammo3", name: "Remington STS" },
];

const disciplines = ["Singles", "Handicaps", "Doubles"];

function SessionLogForm() {
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split("T")[0],
    location: "",
    gunUsed: "",
    chokeUsed: "",
    ammunitionUsed: "",
    weather: "",
    registeredEvent: false, // Default to practice mode
    scores: {
      Singles: [{ value: null, didNotShoot: false }], // For practice mode, start with one round
      Handicaps: [],
      Doubles: [],
    },
    notes: "",
    fileAttachment: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSessionData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleScoreChange = (discipline, roundIndex, e) => {
    const { value } = e.target;
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline][roundIndex] = {
        ...newScores[discipline][roundIndex],
        value: value === "" ? null : parseInt(value, 10),
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
        value: checked ? null : newScores[discipline][roundIndex].value, // Clear score if 'did not shoot'
      };
      return { ...prevData, scores: newScores };
    });
  };

  const addPracticeRound = (discipline) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline] = [
        ...newScores[discipline],
        { value: null, didNotShoot: false },
      ];
      return { ...prevData, scores: newScores };
    });
  };

  const removePracticeRound = (discipline, roundIndex) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      newScores[discipline] = newScores[discipline].filter(
        (_, i) => i !== roundIndex
      );
      return { ...prevData, scores: newScores };
    });
  };

  const addPracticeDiscipline = (disciplineToAdd) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      if (
        !newScores[disciplineToAdd] ||
        newScores[disciplineToAdd].length === 0
      ) {
        newScores[disciplineToAdd] = [{ value: null, didNotShoot: false }];
      }
      return { ...prevData, scores: newScores };
    });
  };

  const removePracticeDiscipline = (disciplineToRemove) => {
    setSessionData((prevData) => {
      const newScores = { ...prevData.scores };
      delete newScores[disciplineToRemove]; // Remove the discipline entirely
      return { ...prevData, scores: newScores };
    });
  };

  // Effect to reset scores when switching between registered/practice modes
  useEffect(() => {
    if (sessionData.registeredEvent) {
      setSessionData((prevData) => ({
        ...prevData,
        scores: {
          Singles: [
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
          ],
          Handicaps: [
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
          ],
          Doubles: [
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
            { value: null, didNotShoot: false },
          ],
        },
      }));
    } else {
      setSessionData((prevData) => ({
        ...prevData,
        scores: {
          Singles: [{ value: null, didNotShoot: false }],
          Handicaps: [], // Start empty for practice
          Doubles: [], // Start empty for practice
        },
      }));
    }
  }, [sessionData.registeredEvent]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Session Data Submitted:", sessionData);
    // Future: Save to Firestore
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Log New Session
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Date */}
            <Grid item xs={12} sm={6}>
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

            {/* Location */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={sessionData.location}
                onChange={handleChange}
                placeholder="Enter location (e.g., Pine Hill Gun Club)"
                // Future: Autocomplete powered by Google Maps Places API
              />
            </Grid>

            {/* Gun Used Dropdown */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Gun Used"
                name="gunUsed"
                value={sessionData.gunUsed}
                onChange={handleChange}
              >
                {mockGuns.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Choke Used Dropdown */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Choke Used"
                name="chokeUsed"
                value={sessionData.chokeUsed}
                onChange={handleChange}
              >
                {mockChokes.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Ammunition Used Dropdown */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Ammunition Used"
                name="ammunitionUsed"
                value={sessionData.ammunitionUsed}
                onChange={handleChange}
              >
                {mockAmmo.map((option) => (
                  <MenuItem key={option.id} value={option.name}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Weather (Placeholder) */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weather"
                name="weather"
                value={sessionData.weather}
                onChange={handleChange}
                placeholder="Auto-fetched weather will go here"
                disabled // Will be auto-fetched
              />
            </Grid>

            {/* File Upload (Placeholder) */}
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ height: "56px" }} // Match TextField height
              >
                Upload Score Sheet (PDF/JPG)
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setSessionData({
                      ...sessionData,
                      fileAttachment: e.target.files[0],
                    })
                  }
                  accept=".pdf,.jpg,.jpeg" //
                />
              </Button>
              {sessionData.fileAttachment && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  File selected: {sessionData.fileAttachment.name}
                </Typography>
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
              <Paper sx={{ p: 2, border: "1px solid lightgrey" }}>
                <Typography variant="h6" gutterBottom>
                  Score Entry
                </Typography>

                {sessionData.registeredEvent ? (
                  // Registered Event Mode
                  <Grid container spacing={2}>
                    {disciplines.map((discipline) => (
                      <Grid item xs={12} key={discipline}>
                        <Typography variant="subtitle1" gutterBottom>
                          {discipline}
                        </Typography>
                        <Grid container spacing={1} alignItems="center">
                          {[0, 1, 2, 3].map((roundIndex) => (
                            <Grid
                              item
                              xs={3}
                              key={`${discipline}-${roundIndex}`}
                            >
                              <TextField
                                fullWidth
                                label={`Round ${roundIndex + 1}`}
                                type="number"
                                inputProps={{ min: 0, max: 25 }}
                                value={
                                  sessionData.scores[discipline][roundIndex]
                                    ?.value ?? ""
                                }
                                onChange={(e) =>
                                  handleScoreChange(discipline, roundIndex, e)
                                }
                                disabled={
                                  sessionData.scores[discipline][roundIndex]
                                    ?.didNotShoot
                                }
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={
                                      sessionData.scores[discipline][roundIndex]
                                        ?.didNotShoot ?? false
                                    }
                                    onChange={(e) =>
                                      handleDidNotShootChange(
                                        discipline,
                                        roundIndex,
                                        e
                                      )
                                    }
                                  />
                                }
                                label="Did not shoot"
                                sx={{
                                  "& .MuiFormControlLabel-label": {
                                    fontSize: "0.75rem",
                                  },
                                }}
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
                    {disciplines
                      .filter(
                        (d) =>
                          (sessionData.scores[d] &&
                            sessionData.scores[d].length > 0) ||
                          d === "Singles"
                      )
                      .map(
                        (
                          discipline // Ensure Singles is always present initially
                        ) => (
                          <Box key={discipline} sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ mt: 2, mb: 1 }}
                            >
                              {discipline} Scores
                              {discipline !== "Singles" && ( // Allow removing added disciplines
                                <IconButton
                                  edge="end"
                                  aria-label="remove discipline"
                                  onClick={() =>
                                    removePracticeDiscipline(discipline)
                                  }
                                  size="small"
                                  sx={{ ml: 1 }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Typography>
                            <Grid container spacing={1} alignItems="center">
                              {sessionData.scores[discipline] &&
                                sessionData.scores[discipline].map(
                                  (score, roundIndex) => (
                                    <Grid
                                      item
                                      xs={3}
                                      key={`${discipline}-practice-${roundIndex}`}
                                    >
                                      <TextField
                                        fullWidth
                                        label={`Round ${roundIndex + 1}`}
                                        type="number"
                                        inputProps={{ min: 0, max: 25 }}
                                        value={score.value ?? ""}
                                        onChange={(e) =>
                                          handleScoreChange(
                                            discipline,
                                            roundIndex,
                                            e
                                          )
                                        }
                                      />
                                      <IconButton
                                        aria-label="remove round"
                                        onClick={() =>
                                          removePracticeRound(
                                            discipline,
                                            roundIndex
                                          )
                                        }
                                        size="small"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Grid>
                                  )
                                )}
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
                        )
                      )}
                    <Button
                      variant="text"
                      onClick={() => {
                        const availableDisciplines = disciplines.filter(
                          (d) =>
                            !sessionData.scores[d] ||
                            sessionData.scores[d].length === 0
                        );
                        if (availableDisciplines.length > 0) {
                          addPracticeDiscipline(availableDisciplines[0]); // Add the first available discipline
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

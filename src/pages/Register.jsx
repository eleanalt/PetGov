import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthShell from "../components/auth/AuthShell";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const EDUCATION_LEVELS = ["Πτυχίο", "Μεταπτυχιακό", "Διδακτορικό", "Άλλο"];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

export default function Register() {
  const navigate = useNavigate();

  // step 1/2
  const [step, setStep] = useState(1);

  // mockup έχει 2 τύπους
  const [role, setRole] = useState("owner"); // "owner" or "vet"
  const [submitted, setSubmitted] = useState(false);

  // common
  const [fullName, setFullName] = useState("");
  const [afm, setAfm] = useState(""); // ΑΦΜ για όλους
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // vet
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [educationLevel, setEducationLevel] = useState("Πτυχίο");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const vetMode = role === "vet";

  const requiredErrors = useMemo(() => {
    const errs = {};
    if (step !== 2) return errs;

    if (!fullName.trim()) errs.fullName = "Υποχρεωτικό";

    // ΑΦΜ ΥΠΟΧΡΕΩΤΙΚΟ ΓΙΑ ΟΛΟΥΣ
    if (!afm.trim()) errs.afm = "Υποχρεωτικό";
    else if (!/^\d{9}$/.test(afm.trim())) errs.afm = "9 ψηφία";

    if (!email.trim()) errs.email = "Υποχρεωτικό";
    else if (!isValidEmail(email)) errs.email = "Μη έγκυρο email";

    if (!phone.trim()) errs.phone = "Υποχρεωτικό";

    if (!password.trim()) errs.password = "Υποχρεωτικό";
    else if (password.trim().length < 4) errs.password = "Τουλάχιστον 4 χαρακτήρες";

    if (vetMode) {
      if (!clinicName.trim()) errs.clinicName = "Υποχρεωτικό";
      if (!clinicAddress.trim()) errs.clinicAddress = "Υποχρεωτικό";
    }

    return errs;
  }, [step, fullName, afm, email, phone, password, vetMode, clinicName, clinicAddress]);

  const canContinue = step === 1;

  const goNext = () => {
    setError("");
    setSubmitted(false);
    setStep(2);
  };

  const goPrev = () => {
    setError("");
    setSubmitted(false);
    setStep(1);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);

  
    if (Object.keys(requiredErrors).length > 0) {
      setError("Συμπλήρωσε τα υποχρεωτικά πεδία.");
      return;
    }

    setLoading(true);
    try {
      const existing = await axios.get(`${API_BASE}/users`, {
        params: { email: email.trim() },
      });

      if (Array.isArray(existing.data) && existing.data.length > 0) {
        setError("Υπάρχει ήδη λογαριασμός με αυτό το email.");
        return;
      }

      const payload = {
        role,
        fullName: fullName.trim(),
        afm: afm.trim(), // για όλους
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
      };

      if (vetMode) {
        payload.clinicName = clinicName.trim();
        payload.clinicAddress = clinicAddress.trim();
        payload.educationLevel = educationLevel;
        if (experienceYears !== "") payload.experienceYears = Number(experienceYears);
      }

      await axios.post(`${API_BASE}/users`, payload);

      navigate("/login");
    } catch {
      setError("Κάτι πήγε στραβά. Βεβαιώσου ότι τρέχει ο JSON Server στο 3001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="register">
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Βήμα {step} από 2
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {step === 1 ? (
        <>
          <Typography fontWeight={800} sx={{ mb: 1 }}>
            Τύπος χρήστη:
          </Typography>

          <RadioGroup value={role} onChange={(e) => setRole(e.target.value)}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 2,
                py: 1.5,
                mb: 1,
              }}
            >
              <FormControlLabel
                value="owner"
                control={<Radio />}
                label={
                  <Box>
                    <Typography fontWeight={800}>Χρήστης</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ιδιοκτήτες κατοικιδίων & απλός χρήστης
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 2,
                py: 1.5,
              }}
            >
              <FormControlLabel
                value="vet"
                control={<Radio />}
                label={
                  <Box>
                    <Typography fontWeight={800}>Κτηνίατρος</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Επαγγελματίας κτηνίατρος
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </RadioGroup>

          <Button
            fullWidth
            variant="contained"
            onClick={goNext}
            disabled={!canContinue}
            sx={{ mt: 2, py: 1.2, textTransform: "none", fontWeight: 800 }}
          >
            Συνέχεια
          </Button>
        </>
      ) : (
        <Box component="form" onSubmit={onSubmit}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>
            {vetMode ? "Κτηνίατρος" : "Χρήστης/Ιδιοκτήτης"}
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
          </Typography>

          <TextField
            label="*Ονοματεπώνυμο"
            fullWidth
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={submitted && Boolean(requiredErrors.fullName)}
            helperText={submitted ? requiredErrors.fullName ?? " " : " "}
            sx={{ mb: 1 }}
          />

          <TextField
            label="*Α.Φ.Μ."
            fullWidth
            value={afm}
            onChange={(e) => setAfm(e.target.value)}
            error={submitted && Boolean(requiredErrors.afm)}
            helperText={submitted ? requiredErrors.afm ?? " " : " "}
            sx={{ mb: 1 }}
          />

          <TextField
            label="*Email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={submitted && Boolean(requiredErrors.email)}
            helperText={submitted ? requiredErrors.email ?? " " : " "}
            sx={{ mb: 1 }}
          />

          {vetMode && (
            <>
              <TextField
                label="*Επωνυμία Κτηνιατρείου"
                fullWidth
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                error={submitted && Boolean(requiredErrors.clinicName)}
                helperText={submitted ? requiredErrors.clinicName ?? " " : " "}
                sx={{ mb: 1 }}
              />

              <TextField
                label="*Διεύθυνση Κτηνιατρείου"
                fullWidth
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                error={submitted && Boolean(requiredErrors.clinicAddress)}
                helperText={submitted ? requiredErrors.clinicAddress ?? " " : " "}
                sx={{ mb: 1 }}
              />

              <TextField
                label="Χρόνια Εμπειρίας"
                fullWidth
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                sx={{ mb: 1 }}
              />

              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id="edu-label">Επίπεδο Σπουδών</InputLabel>
                <Select
                  labelId="edu-label"
                  label="Επίπεδο Σπουδών"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                >
                  {EDUCATION_LEVELS.map((x) => (
                    <MenuItem key={x} value={x}>
                      {x}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}

          <TextField
            label="*Τηλέφωνο Επικοινωνίας"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={submitted && Boolean(requiredErrors.phone)}
            helperText={submitted ? requiredErrors.phone ?? " " : " "}
            sx={{ mb: 1 }}
          />

          <TextField
            label="*Κωδικός Πρόσβασης"
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={submitted && Boolean(requiredErrors.password)}
            helperText={submitted ? requiredErrors.password ?? " " : " "}
            sx={{ mb: 1.5 }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              type="button"
              variant="outlined"
              onClick={goPrev}
              sx={{ flex: 1, py: 1.1, textTransform: "none", fontWeight: 800 }}
            >
              Πίσω
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              color="success"
              sx={{ flex: 1, py: 1.1, textTransform: "none", fontWeight: 800 }}
            >
              {loading ? "..." : "Ολοκλήρωση"}
            </Button>
          </Stack>
        </Box>
      )}
    </AuthShell>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import Rating from "@mui/material/Rating";


import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Tooltip from "@mui/material/Tooltip";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";

const steps = ["Στοιχεία Ιδιοκτήτη", "Στοιχεία Ζώου", "Επιβεβαίωση"];
const SERVICES = ["Εμβόλιο", "Τακτικός Έλεγχος", "Στείρωση", "Καταγραφή Ζώου"];

const SERVICE_DURATION_MINUTES = {
  Εμβόλιο: 40,
  "Τακτικός Έλεγχος": 30,
  Στείρωση: 90,
  "Καταγραφή Ζώου": 20,
};
const DEFAULT_DURATION = 30;

const SLOT_GRANULARITY = 10;

function dateKeyFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function timeHHMMFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(total) {
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const m = String(total % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  // [start, end)
  return aStart < bEnd && bStart < aEnd;
}

/** slots για ΕΝΑ block διαθεσιμότητας */
function buildSlotsForBlock(dateStr, availabilityBlock, takenIntervals, selectedDurationMin) {
  if (!dateStr) return [];
  if (!availabilityBlock) return [];
  if (availabilityBlock.status && availabilityBlock.status !== "open") return [];
  if (!selectedDurationMin) return [];

  const start = availabilityBlock.startTime || "10:00";
  const end = availabilityBlock.endTime || "14:00";

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  const lastPossibleStart = endMin - selectedDurationMin;
  if (lastPossibleStart < startMin) return [];

  const out = [];
  for (let t = startMin; t <= lastPossibleStart; t += SLOT_GRANULARITY) {
    const candidateStart = t;
    const candidateEnd = t + selectedDurationMin;

    const conflict = (takenIntervals || []).some((iv) =>
      overlaps(candidateStart, candidateEnd, iv.startMin, iv.endMin)
    );

    if (!conflict) out.push(minutesToHHMM(candidateStart));
  }

  return out;
}

/** Union slots για ΠΟΛΛΑ blocks της ίδιας ημέρας */
function buildSlotsForDay(dateStr, dayBlocks, takenIntervals, selectedDurationMin) {
  if (!dateStr) return [];
  if (!Array.isArray(dayBlocks) || dayBlocks.length === 0) return [];
  if (!selectedDurationMin) return [];

  const set = new Set();
  dayBlocks.forEach((b) => {
    const slots = buildSlotsForBlock(dateStr, b, takenIntervals, selectedDurationMin);
    slots.forEach((s) => set.add(s));
  });

  return Array.from(set).sort((a, b) => toMinutes(a) - toMinutes(b));
}

function ymdFromDateObj(d) {
  if (!d || Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function OwnerAppointmentWizard() {
  const navigate = useNavigate();
  const { vetId } = useParams();
  const { user } = useAuth();
  const location = useLocation();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [vet, setVet] = useState(null);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [pets, setPets] = useState([]);
  const [vetAppointments, setVetAppointments] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    petId: "", 
    service: location.state?.service || "",
    date: location.state?.date || "",
    time: location.state?.time || "",
    notes: "",
  });

  const [attemptNext1, setAttemptNext1] = useState(false);
  const [attemptNext2, setAttemptNext2] = useState(false);

  const [ownerProfile, setOwnerProfile] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      setOwnerLoading(true);
      try {
        const res = await api.get(`/users/${user.id}`);
        setOwnerProfile(res?.data || null);
      } catch (e) {
        console.error(e);
        setOwnerProfile(null);
      } finally {
        setOwnerLoading(false);
      }
    })();
  }, [user?.id]);

  const autofillOwner = () => {
    const src = ownerProfile || user || {};

    // προσπάθησε να βρεις όνομα/email/phone από ό,τι υπάρχει
    const fullName =
      src.fullName ||
      src.name ||
      [src.firstName, src.lastName].filter(Boolean).join(" ") ||
      "";

    const email = src.email || "";
    const phone = src.phone || src.mobile || src.contactPhone || "";

    setForm((f) => ({
      ...f,
      contactName: f.contactName || fullName,
      contactEmail: f.contactEmail || email,
      contactPhone: f.contactPhone || phone,
    }));
  };

  // (προαιρετικό) auto-autofill μόλις ανοίξει η σελίδα αν είναι άδεια
  useEffect(() => {
    if (!user?.id) return;
    if (form.contactName || form.contactEmail || form.contactPhone) return;

    // όταν έρθει ownerProfile, γέμισε αυτόματα
    const src = ownerProfile || user || {};
    const hasAny =
      (src.fullName || src.name || src.firstName || src.lastName) ||
      src.email ||
      src.phone ||
      src.mobile;

    if (hasAny) autofillOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerProfile, user?.id]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const selectedDuration = useMemo(() => {
    return SERVICE_DURATION_MINUTES[form.service] || DEFAULT_DURATION;
  }, [form.service]);

  useEffect(() => {
    (async () => {
      try {
        const uRes = await api.get(`/users/${vetId}`);
        setVet(uRes.data || null);
      } catch (e) {
        console.error(e);
        setVet(null);
      }
    })();
  }, [vetId]);

  useEffect(() => {
    (async () => {
      try {
        const aRes = await api.get("/vetAvailability", { params: { vetId: String(vetId) } });
        setAvailabilityList(Array.isArray(aRes.data) ? aRes.data : []);
      } catch (e) {
        console.error(e);
        setAvailabilityList([]);
      }
    })();
  }, [vetId]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const pRes = await api.get("/pets", { params: { ownerId: String(user.id) } });
      setPets(Array.isArray(pRes.data) ? pRes.data : []);
    })();
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      if (!vetId) return;
      try {
        const aRes = await api.get("/appointments", { params: { vetId: String(vetId) } });
        setVetAppointments(Array.isArray(aRes.data) ? aRes.data : []);
      } catch (e) {
        console.error(e);
        setVetAppointments([]);
      }
    })();
  }, [vetId]);

  useEffect(() => {
    (async () => {
      try {
        const rRes = await api.get("/reviews");
        setReviews(Array.isArray(rRes.data) ? rRes.data : []);
      } catch (e) {
        setReviews([]);
      }
    })();
  }, []);

  const vetRating = useMemo(() => {
    const list = (reviews || []).filter((r) => String(r.vetId) === String(vetId));
    let sum = 0;
    let count = 0;
    list.forEach((r) => {
      const stars = Number(r.stars ?? r.rating ?? 0);
      if (stars > 0) {
        sum += stars;
        count += 1;
      }
    });
    return { avg: count ? sum / count : 0, count };
  }, [reviews, vetId]);

  const availabilityByDate = useMemo(() => {
    const m = new Map();
    (availabilityList || [])
      .filter((x) => (x.status ? x.status === "open" : true))
      .filter((x) => String(x.date || "") >= today)
      .forEach((x) => {
        const key = String(x.date || "");
        if (!key) return;
        if (!m.has(key)) m.set(key, []);
        m.get(key).push(x);
      });
    return m;
  }, [availabilityList, today]);

  const takenIntervalsByDate = useMemo(() => {
    const m = new Map();

    (vetAppointments || [])
      .filter((a) => a && (a.status === "pending" || a.status === "confirmed"))
      .forEach((a) => {
        const day = dateKeyFromISO(a.datetime);
        if (!day) return;

        const startHHMM = timeHHMMFromISO(a.datetime);
        if (!startHHMM) return;

        const startMin = toMinutes(startHHMM);
        const dur = Number(a.durationMin) || SERVICE_DURATION_MINUTES[a.service] || DEFAULT_DURATION;
        const endMin = startMin + dur;

        if (!m.has(day)) m.set(day, []);
        m.get(day).push({ startMin, endMin });
      });

    return m;
  }, [vetAppointments]);

  const enabledDatesSet = useMemo(() => {
    const set = new Set();
    if (!form.service) return set;

    for (const [dateStr, blocks] of availabilityByDate.entries()) {
      const taken = takenIntervalsByDate.get(dateStr) || [];
      const slotsForDay = buildSlotsForDay(dateStr, blocks, taken, selectedDuration);
      if (slotsForDay.length > 0) set.add(dateStr);
    }
    return set;
  }, [availabilityByDate, takenIntervalsByDate, form.service, selectedDuration]);

  const maxEnabledDate = useMemo(() => {
    const arr = Array.from(enabledDatesSet).sort();
    return arr.length ? arr[arr.length - 1] : "";
  }, [enabledDatesSet]);

  const dayBlocks = useMemo(() => {
    if (!form.date) return [];
    return availabilityByDate.get(String(form.date)) || [];
  }, [availabilityByDate, form.date]);

  const slots = useMemo(() => {
    if (!form.date || !form.service) return [];
    const taken = takenIntervalsByDate.get(String(form.date)) || [];
    return buildSlotsForDay(form.date, dayBlocks, taken, selectedDuration);
  }, [form.date, form.service, dayBlocks, takenIntervalsByDate, selectedDuration]);

  useEffect(() => {
    if (!form.service) {
      setForm((f) => ({ ...f, date: "", time: "" }));
      return;
    }
    if (form.date && !enabledDatesSet.has(String(form.date))) {
      setForm((f) => ({ ...f, date: "", time: "" }));
    }
  }, [form.service, enabledDatesSet, form.date]);

  
  useEffect(() => {
    setForm((f) => ({ ...f, time: "" }));
    
  }, [form.date]);

  const step1Valid = useMemo(
    () => form.contactName.trim() && form.contactPhone.trim() && form.contactEmail.trim(),
    [form.contactName, form.contactPhone, form.contactEmail]
  );

  
  const step2Valid = useMemo(() => form.service && form.date && form.time, [form.service, form.date, form.time]);

  const nameErr = attemptNext1 && !form.contactName.trim();
  const emailErr = attemptNext1 && !form.contactEmail.trim();
  const phoneErr = attemptNext1 && !form.contactPhone.trim();

  const serviceErr = attemptNext2 && !form.service;
  const dateErr = attemptNext2 && !form.date;
  const timeErr = attemptNext2 && !form.time;

  const isStillFree = async (dateStr, timeStr, durationMin) => {
    const aRes = await api.get("/appointments", { params: { vetId: String(vetId) } });
    const arr = Array.isArray(aRes.data) ? aRes.data : [];

    const candidateStart = toMinutes(timeStr);
    const candidateEnd = candidateStart + durationMin;

    return !arr.some((a) => {
      if (!(a.status === "pending" || a.status === "confirmed")) return false;

      const day = dateKeyFromISO(a.datetime);
      if (day !== dateStr) return false;

      const s = toMinutes(timeHHMMFromISO(a.datetime));
      const d = Number(a.durationMin) || SERVICE_DURATION_MINUTES[a.service] || DEFAULT_DURATION;
      const e = s + d;

      return overlaps(candidateStart, candidateEnd, s, e);
    });
  };

  const submit = async () => {
    setMsg({ type: "", text: "" });
    if (!user?.id) return;

    if (!step1Valid || !step2Valid) {
      setMsg({ type: "error", text: "Συμπλήρωσε τα υποχρεωτικά πεδία." });
      return;
    }

    if (!enabledDatesSet.has(String(form.date))) {
      setMsg({ type: "error", text: "Η ημερομηνία δεν είναι διαθέσιμη. Διάλεξε άλλη." });
      return;
    }
    if (!slots.includes(form.time)) {
      setMsg({ type: "error", text: "Η ώρα δεν είναι διαθέσιμη. Διάλεξε άλλη." });
      return;
    }

    setSaving(true);
    try {
      const ok = await isStillFree(form.date, form.time, selectedDuration);
      if (!ok) {
        setMsg({ type: "error", text: "Η ώρα μόλις κλείστηκε. Διάλεξε άλλη." });
        const aRes = await api.get("/appointments", { params: { vetId: String(vetId) } });
        setVetAppointments(Array.isArray(aRes.data) ? aRes.data : []);
        setSaving(false);
        return;
      }

      const dt = new Date(`${form.date}T${form.time}:00`);

      const payload = {
        ownerId: String(user.id),
        petId: form.petId ? String(form.petId) : "",
        vetId: String(vetId),
        service: form.service,
        durationMin: selectedDuration,
        datetime: dt.toISOString(),
        status: "pending",
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        notes: form.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cancelledAt: "",
        cancelledBy: "",
        completedAt: "",
      };

      await api.post("/appointments", payload);
      setMsg({ type: "success", text: "Το ραντεβού υποβλήθηκε (Εκκρεμές)." });
      navigate("/owner/appointments", { replace: true });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία υποβολής ραντεβού." });
    } finally {
      setSaving(false);
    }
  };

  const renderDay = (day, _selectedDays, pickersDayProps) => {
    const ymd = ymdFromDateObj(day);
    const isEnabled = !!ymd && enabledDatesSet.has(ymd);

    const disabled = pickersDayProps.disabled || !isEnabled;
    const label = disabled && form.service ? "Δεν υπάρχει διαθέσιμο slot" : "";

    return (
      <Tooltip key={pickersDayProps.key} title={label} arrow disableHoverListener={!label}>
        <span>
          <PickersDay
            {...pickersDayProps}
            disabled={disabled}
            sx={{
              ...(pickersDayProps.sx || {}),
              ...(disabled ? { opacity: 0.35, filter: "grayscale(1)" } : {}),
            }}
          />
        </span>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ textTransform: "none", mb: 2 }}>
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 1 }}>
              Ραντεβού Με Κτηνίατρο
            </Typography>

            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Rating value={vetRating.avg} precision={0.5} readOnly />
              <Typography color="text.secondary">({vetRating.count})</Typography>
            </Stack>

            <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {msg.text && (
              <Alert severity={msg.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
                {msg.text}
              </Alert>
            )}

            {/* STEP 1 */}
            {step === 0 && (
              <Box sx={{ maxWidth: 520, mx: "auto" }}>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  Στοιχεία Ιδιοκτήτη
                </Typography>

                <Stack spacing={2}>
                        <Button
        variant="outlined"
        onClick={autofillOwner}
        disabled={ownerLoading}
        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
      >
        {ownerLoading ? "Φόρτωση στοιχείων..." : "AutoFill από προφίλ"}
      </Button>

                  <TextField
                    label="* Ονοματεπώνυμο"
                    value={form.contactName}
                    onChange={setField("contactName")}
                    fullWidth
                    error={nameErr}
                    helperText={nameErr ? "Υποχρεωτικό πεδίο" : ""}
                  />
                  <TextField
                    label="* Email"
                    value={form.contactEmail}
                    onChange={setField("contactEmail")}
                    fullWidth
                    error={emailErr}
                    helperText={emailErr ? "Υποχρεωτικό πεδίο" : ""}
                  />
                  <TextField
                    label="* Τηλέφωνο"
                    value={form.contactPhone}
                    onChange={setField("contactPhone")}
                    fullWidth
                    error={phoneErr}
                    helperText={phoneErr ? "Υποχρεωτικό πεδίο" : ""}
                  />

                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Box />
                    <Button
                      variant="contained"
                      onClick={() => {
                        setAttemptNext1(true);
                        if (step1Valid) setStep(1);
                      }}
                      sx={{ textTransform: "none", borderRadius: 2, bgcolor: "success.main" }}
                    >
                      Συνέχεια
                    </Button>
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    Τα πεδία με αστερίσκο * είναι υποχρεωτικά
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <Box sx={{ maxWidth: 520, mx: "auto" }}>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  Στοιχεία Κατοικιδίου & Επιλογή ώρας
                </Typography>

                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="pet-label">Αριθμός Microchip (προαιρετικό)</InputLabel>
                    <Select
                      labelId="pet-label"
                      label="Αριθμός Microchip (προαιρετικό)"
                      value={form.petId}
                      onChange={setField("petId")}
                    >
                      <MenuItem value="">— Χωρίς microchip —</MenuItem>

                      {pets.length === 0 ? (
                        <MenuItem value="" disabled>
                          Δεν υπάρχουν κατοικίδια
                        </MenuItem>
                      ) : (
                        pets.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.microchip} — {p.name || "—"}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth error={serviceErr}>
                    <InputLabel id="svc-label">* Υπηρεσία</InputLabel>
                    <Select
                      labelId="svc-label"
                      label="* Υπηρεσία"
                      value={form.service}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          service: e.target.value,
                          date: "",
                          time: "",
                        }))
                      }
                    >
                      {SERVICES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                    {serviceErr && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        Υποχρεωτικό πεδίο
                      </Typography>
                    )}
                  </FormControl>

                  {!form.service && (
                    <Alert severity="info">Διάλεξε πρώτα υπηρεσία για να εμφανιστούν μόνο οι διαθέσιμες ημερομηνίες.</Alert>
                  )}

                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="* Ημερομηνία"
                      value={form.date ? new Date(`${form.date}T00:00:00`) : null}
                      onChange={(newValue) => {
                        const ymd = ymdFromDateObj(newValue);
                        setForm((f) => ({ ...f, date: ymd, time: "" }));
                      }}
                      disablePast
                      minDate={new Date(`${today}T00:00:00`)}
                      maxDate={maxEnabledDate ? new Date(`${maxEnabledDate}T00:00:00`) : undefined}
                      disabled={!form.service || enabledDatesSet.size === 0}
                      shouldDisableDate={(dateObj) => {
                        if (!form.service) return true;
                        const ymd = ymdFromDateObj(dateObj);
                        if (!ymd) return true;
                        return !enabledDatesSet.has(ymd);
                      }}
                      slots={{
                        day: (props) => renderDay(props.day, null, props),
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: dateErr,
                          helperText: dateErr ? "Υποχρεωτικό πεδίο" : "",
                        },
                      }}
                    />
                  </LocalizationProvider>

                  {form.service && enabledDatesSet.size > 0 ? (
                    <Typography variant="caption" color="text.secondary">
                      Διαθέσιμες ημερομηνίες: <b>{enabledDatesSet.size}</b>
                    </Typography>
                  ) : form.service ? (
                    <Alert severity="warning">Δεν υπάρχουν διαθέσιμες ημερομηνίες για αυτή την υπηρεσία.</Alert>
                  ) : null}

                  <FormControl fullWidth error={timeErr}>
                    <InputLabel id="time-label">* Επιλογή Ώρας</InputLabel>
                    <Select
                      labelId="time-label"
                      label="* Επιλογή Ώρας"
                      value={form.time}
                      onChange={setField("time")}
                      disabled={!form.date || !form.service || slots.length === 0}
                    >
                      {!form.date ? (
                        <MenuItem value="" disabled>
                          Διάλεξε ημερομηνία
                        </MenuItem>
                      ) : slots.length === 0 ? (
                        <MenuItem value="" disabled>
                          Δεν υπάρχουν διαθέσιμες ώρες
                        </MenuItem>
                      ) : (
                        slots.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {timeErr && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        Υποχρεωτικό πεδίο
                      </Typography>
                    )}
                  </FormControl>

                  <TextField
                    label="Σημειώσεις (προαιρετικό)"
                    value={form.notes}
                    onChange={setField("notes")}
                    fullWidth
                    multiline
                    minRows={3}
                  />

                  <Stack direction="row" justifyContent="space-between">
                    <Button variant="outlined" onClick={() => setStep(0)} sx={{ textTransform: "none", borderRadius: 2 }}>
                      Επιστροφή στο προηγούμενο βήμα
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => {
                        setAttemptNext2(true);
                        if (step2Valid) setStep(2);
                      }}
                      sx={{ textTransform: "none", borderRadius: 2, bgcolor: "success.main" }}
                    >
                      Συνέχεια
                    </Button>
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    Τα πεδία με αστερίσκο * είναι υποχρεωτικά
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <Box sx={{ maxWidth: 520, mx: "auto" }}>
                <Typography fontWeight={900} sx={{ mb: 2 }}>
                  Επιβεβαίωση
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Preview label="Ονοματεπώνυμο" value={form.contactName} />

                <Preview
                  label="Microchip"
                  value={
                    form.petId ? pets.find((p) => String(p.id) === String(form.petId))?.microchip || "—" : "—"
                  }
                />

                <Preview label="Τηλέφωνο" value={form.contactPhone} />
                <Preview label="Email" value={form.contactEmail} />
                <Preview label="Ημερομηνία Ραντεβού" value={`${form.date} & ${form.time}`} />
                <Preview label="Υπηρεσία" value={`${form.service} (${selectedDuration}’)`} />
                <Preview label="Κτηνίατρος" value={vet?.fullName || "—"} />

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setStep(1)}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                    disabled={saving}
                  >
                    Επιστροφή στο προηγούμενο βήμα
                  </Button>

                  <Button
                    variant="contained"
                    onClick={submit}
                    disabled={saving}
                    sx={{ textTransform: "none", borderRadius: 2, bgcolor: "#6f8f3a" }}
                  >
                    Υποβολή Ραντεβού
                  </Button>
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                  Η κατάσταση αρχικά θα είναι “Εκκρεμές”. Ο/η κτηνίατρος μπορεί να την επιβεβαιώσει ή να την ακυρώσει.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

function Preview({ label, value }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.6 }}>
      <Typography sx={{ width: 190, fontWeight: 800 }}>{label}</Typography>
      <Typography>{value || "—"}</Typography>
    </Stack>
  );
}

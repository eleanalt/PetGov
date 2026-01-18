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

const steps = ["Στοιχεία Ιδιοκτήτη", "Στοιχεία Ζώου", "Επιβεβαίωση"];
const SERVICES = ["Εμβόλιο", "Τακτικός Έλεγχος", "Στείρωση", "Καταγραφή Ζώου"];

const SERVICE_DURATION_MINUTES = {
  "Εμβόλιο": 40,
  "Τακτικός Έλεγχος": 30,
  "Στείρωση": 90,
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

function buildSlotsForDay(dateStr, dayAvailability, takenIntervals, selectedDurationMin) {
  if (!dateStr) return [];
  if (!dayAvailability) return [];
  if (dayAvailability.status && dayAvailability.status !== "open") return [];
  if (!selectedDurationMin) return [];

  const start = dayAvailability.startTime || "10:00";
  const end = dayAvailability.endTime || "14:00";

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

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // yyyy-mm-dd
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // διάρκεια βάσει υπηρεσίας
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

  const maxAvailableDate = useMemo(() => {
    const openDates = availabilityList
      .filter((x) => (x.status ? x.status === "open" : true))
      .map((x) => String(x.date))
      .filter(Boolean)
      .sort(); // yyyy-mm-dd
    return openDates.length ? openDates[openDates.length - 1] : "";
  }, [availabilityList]);

  const dayAvailability = useMemo(() => {
    if (!form.date) return null;
    return (
      availabilityList.find(
        (x) => String(x.date) === String(form.date) && (x.status ? x.status === "open" : true)
      ) || null
    );
  }, [availabilityList, form.date]);

  const takenIntervals = useMemo(() => {
    const arr = [];
    if (!form.date) return arr;

    (vetAppointments || [])
      .filter((a) => a && (a.status === "pending" || a.status === "confirmed"))
      .forEach((a) => {
        if (dateKeyFromISO(a.datetime) !== form.date) return;

        const startHHMM = timeHHMMFromISO(a.datetime);
        if (!startHHMM) return;

        const startMin = toMinutes(startHHMM);
        const dur = Number(a.durationMin) || SERVICE_DURATION_MINUTES[a.service] || DEFAULT_DURATION;
        const endMin = startMin + dur;

        arr.push({ startMin, endMin });
      });

    return arr;
  }, [vetAppointments, form.date]);

  const slots = useMemo(() => {
    if (!form.date || !form.service) return [];
    return buildSlotsForDay(form.date, dayAvailability, takenIntervals, selectedDuration);
  }, [form.date, form.service, dayAvailability, takenIntervals, selectedDuration]);

  useEffect(() => {
    if (!form.date) return;
    if (form.date < today) setForm((f) => ({ ...f, date: today, time: "" }));
  }, [form.date]);

  const step1Valid = useMemo(
    () => form.contactName.trim() && form.contactPhone.trim() && form.contactEmail.trim(),
    [form.contactName, form.contactPhone, form.contactEmail]
  );

  const step2Valid = useMemo(
    () => form.petId && form.service && form.date && form.time,
    [form.petId, form.service, form.date, form.time]
  );

  const isStillFree = async (dateStr, timeStr, durationMin) => {
    const aRes = await api.get("/appointments", { params: { vetId: String(vetId) } });
    const arr = Array.isArray(aRes.data) ? aRes.data : [];

    const candidateStart = toMinutes(timeStr);
    const candidateEnd = candidateStart + durationMin;

    return !arr.some((a) => {
      if (!(a.status === "pending" || a.status === "confirmed")) return false;
      if (dateKeyFromISO(a.datetime) !== dateStr) return false;

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

    if (!dayAvailability) {
      setMsg({ type: "error", text: "Δεν υπάρχει διαθεσιμότητα για αυτή την ημερομηνία." });
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
        petId: String(form.petId),
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

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 1 }}>
              Ραντεβού Με Κτηνίατρο
            </Typography>

            {/* ⭐ Rating του κτηνιάτρου (αν υπάρχει) */}
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
                  <TextField
                    label="* Ονοματεπώνυμο"
                    value={form.contactName}
                    onChange={setField("contactName")}
                    fullWidth
                  />
                  <TextField
                    label="* Email"
                    value={form.contactEmail}
                    onChange={setField("contactEmail")}
                    fullWidth
                  />
                  <TextField
                    label="* Τηλέφωνο"
                    value={form.contactPhone}
                    onChange={setField("contactPhone")}
                    fullWidth
                  />

                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Box />
                    <Button
                      variant="contained"
                      onClick={() => setStep(1)}
                      disabled={!step1Valid}
                      sx={{ textTransform: "none", borderRadius: 2, bgcolor: "grey.700" }}
                    >
                      Επόμενο βήμα
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
                    <InputLabel id="pet-label">* Αριθμός Microchip</InputLabel>
                    <Select
                      labelId="pet-label"
                      label="* Αριθμός Microchip"
                      value={form.petId}
                      onChange={setField("petId")}
                    >
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

                  <FormControl fullWidth>
                    <InputLabel id="svc-label">* Υπηρεσία</InputLabel>
                    <Select
                      labelId="svc-label"
                      label="* Υπηρεσία"
                      value={form.service}
                      onChange={(e) => setForm((f) => ({ ...f, service: e.target.value, time: "" }))}
                    >
                      {SERVICES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="* Ημερομηνία"
                    type="date"
                    value={form.date}
                    onChange={(e) => {
                      const v = e.target.value; // yyyy-mm-dd
                      if (v && v < today) {
                        setForm((f) => ({ ...f, date: today, time: "" }));
                        return;
                      }
                      if (v && maxAvailableDate && v > maxAvailableDate) {
                        setForm((f) => ({ ...f, date: maxAvailableDate, time: "" }));
                        return;
                      }
                      setForm((f) => ({ ...f, date: v, time: "" }));
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: today,
                      ...(maxAvailableDate ? { max: maxAvailableDate } : {}),
                    }}
                    fullWidth
                  />

                  {form.date && !dayAvailability && (
                    <Alert severity="warning">
                      Δεν υπάρχει διαθεσιμότητα για {form.date}. Διάλεξε άλλη ημερομηνία.
                    </Alert>
                  )}

                  {!form.service && (
                    <Alert severity="info">Διάλεξε πρώτα υπηρεσία για να υπολογιστεί η διάρκεια.</Alert>
                  )}

                  <FormControl fullWidth>
                    <InputLabel id="time-label">* Επιλογή Ώρας</InputLabel>
                    <Select
                      labelId="time-label"
                      label="* Επιλογή Ώρας"
                      value={form.time}
                      onChange={setField("time")}
                      disabled={!form.date || !form.service || !dayAvailability || slots.length === 0}
                    >
                      {!form.date ? (
                        <MenuItem value="" disabled>
                          Διάλεξε ημερομηνία
                        </MenuItem>
                      ) : !form.service ? (
                        <MenuItem value="" disabled>
                          Διάλεξε υπηρεσία
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
                    <Button
                      variant="outlined"
                      onClick={() => setStep(0)}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Επιστροφή στο προηγούμενο βήμα
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => setStep(2)}
                      disabled={!step2Valid}
                      sx={{ textTransform: "none", borderRadius: 2, bgcolor: "grey.700" }}
                    >
                      Επόμενο βήμα
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
                  value={pets.find((p) => String(p.id) === String(form.petId))?.microchip || "—"}
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

import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const steps = [
  "Συμπλήρωση στοιχείων",
  "Στοιχεία απώλειας",
  "Προσωρινή αποθήκευση",
  "Οριστική υποβολή",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STATUS_OPTIONS = [
  { value: "submitted", label: "ΑΝΟΙΧΤΗ" },
  { value: "found", label: "ΒΡΕΘΗΚΕ" },
  { value: "cancelled", label: "Ακυρωμένη" },
];

function statusLabel(v) {
  const m = STATUS_OPTIONS.find((x) => x.value === v);
  return m?.label || v || "—";
}

export default function OwnerLostWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lostId } = useParams();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [photoMeta, setPhotoMeta] = useState(null); // { name, size, type }

  const [pets, setPets] = useState([]);

  const [lockedAll, setLockedAll] = useState(false);
  const [submittedLocked, setSubmittedLocked] = useState(false);

  const [form, setForm] = useState({
    petId: "",
    microchip: "",
    petName: "",
    species: "",
    sex: "",
    photoBase64: "", 

    lostArea: "",
    lostDate: "",
    details: "",

    status: "draft",
  });

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [touched, setTouched] = useState({
    petId: false,
    lostArea: false,
    lostDate: false,
  });

  const isStep1Valid = useMemo(
    () => Boolean(form.petId && form.microchip),
    [form.petId, form.microchip]
  );
  const isStep2Valid = useMemo(
    () => Boolean(form.lostArea && form.lostDate && form.lostDate <= todayStr),
    [form.lostArea, form.lostDate, todayStr]
  );

  const finalized =
    form.status === "submitted" || form.status === "found" || form.status === "cancelled";

  const errors = useMemo(() => {
    const e = {};

    if (touched.petId && !form.petId) e.petId = "Επίλεξε κατοικίδιο (microchip).";

    if (touched.lostArea && !form.lostArea?.trim()) e.lostArea = "Συμπλήρωσε περιοχή απώλειας.";

    if (touched.lostDate) {
      if (!form.lostDate) e.lostDate = "Συμπλήρωσε ημερομηνία απώλειας.";
      else if (form.lostDate > todayStr) e.lostDate = "Η ημερομηνία δεν μπορεί να είναι μελλοντική.";
    }

    return e;
  }, [form.petId, form.lostArea, form.lostDate, touched, todayStr]);

  const touch = (keys) =>
    setTouched((t) => keys.reduce((acc, k) => ({ ...acc, [k]: true }), t));

  const validateStep = (s) => {
    if (s === 0) {
      touch(["petId"]);
      return Boolean(form.petId && form.microchip);
    }
    if (s === 1) {
      touch(["lostArea", "lostDate"]);
      return Boolean(form.lostArea && form.lostDate && form.lostDate <= todayStr);
    }
    return true;
  };

  const goStep = (next) => {
    if (finalized) return;

    // αν πάμε μπροστά, validate το τρέχον step
    if (next > step) {
      const ok = validateStep(step);
      if (!ok) return;
    }

    setStep(next);
  };

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const res = await api.get("/pets", { params: { ownerId: String(user.id) } });
      setPets(Array.isArray(res.data) ? res.data : []);
    })();
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      if (!lostId) return;

      try {
        const res = await api.get(`/lostPets/${lostId}`);
        const d = res.data;

        if (String(d.ownerId) !== String(user?.id)) {
          setMsg({ type: "error", text: "Δεν έχεις πρόσβαση σε αυτή τη δήλωση." });
          return;
        }

        const st = d.status || "draft";

        const existingPhoto =
          d.photoBase64 ?? (Array.isArray(d.photos) ? d.photos[0] : "") ?? "";

        setForm({
          petId: d.petId ?? "",
          microchip: d.microchip ?? "",
          petName: d.petName ?? "",
          species: d.species ?? "",
          sex: d.sex ?? "",
          photoBase64: existingPhoto,

          lostArea: d.lostArea ?? d.area ?? "",
          lostDate: d.lostDate ?? "",
          details: d.details ?? "",

          status: st,
        });

        // reset validation state
        setTouched({ petId: false, lostArea: false, lostDate: false });

        // αν υπάρχει ήδη φωτο, δεν ξέρουμε name/size → αφήνουμε meta null
        setPhotoMeta(null);

        if (st === "found" || st === "cancelled") {
          setLockedAll(true);
          setSubmittedLocked(true);
          setStep(3);
          return;
        }

        if (st === "submitted") {
          setSubmittedLocked(true);
          setLockedAll(false);
          setStep(3);
          return;
        }

        // draft
        setSubmittedLocked(false);
        setLockedAll(false);
        setStep(2);
      } catch (e) {
        console.error(e);
        setMsg({ type: "error", text: "Δεν βρέθηκε δήλωση." });
      }
    })();
  }, [lostId, user?.id]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSelectPet = (e) => {
    const petId = e.target.value;
    const p = pets.find((x) => String(x.id) === String(petId));
    if (!p) return;

    setForm((f) => ({
      ...f,
      petId: String(p.id),
      microchip: p.microchip || "",
      petName: p.name || "",
      species: p.species || "",
      sex: p.sex || "",
    }));
  };

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    
    const MAX = 2 * 1024 * 1024;
    if (file.size > MAX) {
      setMsg({ type: "error", text: "Η φωτογραφία είναι πολύ μεγάλη (max 2MB)." });
      e.target.value = "";
      return;
    }

    const b64 = await fileToBase64(file);

    setPhotoMeta({ name: file.name, size: file.size, type: file.type });
    setForm((f) => ({ ...f, photoBase64: b64 }));

    e.target.value = "";
  };

  const saveDraft = async () => {
    setMsg({ type: "", text: "" });
    if (!user?.id) return;

    touch(["petId", "lostArea", "lostDate"]);

    if (!isStep1Valid || !isStep2Valid) {
      setMsg({ type: "error", text: "Συμπλήρωσε τα υποχρεωτικά πεδία." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        petId: form.petId,
        microchip: form.microchip,
        petName: form.petName,
        species: form.species,
        sex: form.sex,

        lostArea: form.lostArea,
        lostDate: form.lostDate,
        details: form.details,

        status: "draft",
        ownerId: String(user.id),

        photos: form.photoBase64 ? [form.photoBase64] : [],
        area: form.lostArea,

        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (lostId) {
        await api.patch(`/lostPets/${lostId}`, payload);
        setMsg({ type: "success", text: "Έγινε προσωρινή αποθήκευση." });
      } else {
        const res = await api.post(`/lostPets`, payload);
        const newId = res?.data?.id;
        setMsg({ type: "success", text: "Έγινε προσωρινή αποθήκευση." });
        if (newId) navigate(`/owner/lost/${newId}/edit`, { replace: true });
      }

      setStep(2);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία προσωρινής αποθήκευσης." });
    } finally {
      setSaving(false);
    }
  };

  const submitFinal = async () => {
    setMsg({ type: "", text: "" });
    if (!user?.id) return;

    touch(["petId", "lostArea", "lostDate"]);

    if (!isStep1Valid || !isStep2Valid) {
      setMsg({ type: "error", text: "Συμπλήρωσε τα υποχρεωτικά πεδία." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        petId: form.petId,
        microchip: form.microchip,
        petName: form.petName,
        species: form.species,
        sex: form.sex,

        lostArea: form.lostArea,
        lostDate: form.lostDate,
        details: form.details,

        ownerId: String(user.id),
        status: "submitted",

        photos: form.photoBase64 ? [form.photoBase64] : [],
        area: form.lostArea,

        updatedAt: new Date().toISOString(),
      };

      if (lostId) {
        await api.patch(`/lostPets/${lostId}`, payload);
      } else {
        await api.post(`/lostPets`, { ...payload, createdAt: new Date().toISOString() });
      }

      setSubmittedLocked(true);
      setLockedAll(false);
      setStep(3);
      setMsg({ type: "success", text: "Η δήλωση υποβλήθηκε οριστικά." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία οριστικής υποβολής." });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (newStatus) => {
    if (!lostId) {
      setMsg({ type: "error", text: "Πρέπει πρώτα να αποθηκευτεί η δήλωση." });
      return;
    }
    if (form.status === "found" || form.status === "cancelled") return;

    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      await api.patch(`/lostPets/${lostId}`, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === "found" ? { foundAt: new Date().toISOString() } : {}),
      });

      setForm((f) => ({ ...f, status: newStatus }));

      if (newStatus === "found" || newStatus === "cancelled") {
        setLockedAll(true);
        setSubmittedLocked(true);
        setMsg({ type: "success", text: `Η δήλωση ενημερώθηκε: ${statusLabel(newStatus)}.` });
      } else {
        setMsg({ type: "success", text: "Η κατάσταση ενημερώθηκε." });
      }
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία ενημέρωσης κατάστασης." });
    } finally {
      setSaving(false);
    }
  };

  const fieldsDisabled = lockedAll || submittedLocked;

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/owner/lost")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
              Δήλωση Απώλειας
            </Typography>

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
                <Stack spacing={2}>
                  <TextField
                    select
                    label="* Αριθμός microchip"
                    value={form.petId}
                    onChange={onSelectPet}
                    onBlur={() => setTouched((t) => ({ ...t, petId: true }))}
                    error={Boolean(errors.petId)}
                    helperText={errors.petId || " "}
                    disabled={fieldsDisabled || finalized}
                    fullWidth
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
                  </TextField>

                  <TextField label="* Όνομα" value={form.petName} disabled fullWidth />
                  <TextField label="* Είδος κατοικιδίου" value={form.species} disabled fullWidth />
                  <TextField label="* Φύλο" value={form.sex} disabled fullWidth />

                  <Button
                    component="label"
                    variant="outlined"
                    disabled={fieldsDisabled || finalized}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    Φωτογραφία (προαιρετικό)
                    <input hidden type="file" accept="image/*" onChange={onPickPhoto} />
                  </Button>

                  {form.photoBase64 ? (
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography fontWeight={800} sx={{ mb: 1 }}>
                          Προεπισκόπηση φωτογραφίας
                        </Typography>

                        <Box
                          component="img"
                          src={form.photoBase64}
                          alt="preview"
                          sx={{
                            width: "100%",
                            height: 220,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            display: "block",
                            mb: 1,
                          }}
                        />

                        <Typography variant="body2" color="text.secondary">
                          {photoMeta?.name
                            ? `${photoMeta.name} • ${Math.round(photoMeta.size / 1024)} KB`
                            : "Επιλέχθηκε φωτογραφία"}
                        </Typography>

                        <Button
                          variant="text"
                          color="error"
                          onClick={() => {
                            setForm((f) => ({ ...f, photoBase64: "" }));
                            setPhotoMeta(null);
                          }}
                          sx={{ textTransform: "none", px: 0, mt: 1 }}
                        >
                          Αφαίρεση φωτογραφίας
                        </Button>
                      </CardContent>
                    </Card>
                  ) : null}

                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => goStep(1)}
                    disabled={finalized}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                  >
                    Συνέχεια
                  </Button>
                </Stack>
              </Box>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <Box sx={{ maxWidth: 520, mx: "auto" }}>
                <Stack spacing={2}>
                  <TextField
                    label="* Περιοχή Απώλειας"
                    value={form.lostArea}
                    onChange={setField("lostArea")}
                    onBlur={() => setTouched((t) => ({ ...t, lostArea: true }))}
                    error={Boolean(errors.lostArea)}
                    helperText={errors.lostArea || " "}
                    disabled={fieldsDisabled || finalized}
                    fullWidth
                  />

                  <TextField
                    label="* Ημερομηνία Απώλειας"
                    type="date"
                    value={form.lostDate}
                    onChange={setField("lostDate")}
                    onBlur={() => setTouched((t) => ({ ...t, lostDate: true }))}
                    error={Boolean(errors.lostDate)}
                    helperText={errors.lostDate || " "}
                    disabled={fieldsDisabled || finalized}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: todayStr }}
                    fullWidth
                  />

                  <TextField
                    label="Σημαντικές λεπτομέρειες"
                    value={form.details}
                    onChange={setField("details")}
                    disabled={fieldsDisabled || finalized}
                    multiline
                    minRows={4}
                    fullWidth
                  />

                  <Stack direction="row" justifyContent="space-between">
                    <Button
                      variant="outlined"
                      onClick={() => goStep(0)}
                      disabled={saving || finalized}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Προηγούμενο
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => goStep(2)}
                      color="success"
                      disabled={finalized}
                      sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                    >
                      Συνέχεια
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <Box sx={{ maxWidth: 560, mx: "auto" }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Προεπισκόπηση
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Preview label="Αριθμός Μικροτσίπ" value={form.microchip} />
                <Preview label="Είδος κατοικιδίου" value={form.species || "—"} />
                <Preview label="Φύλο" value={form.sex || "—"} />
                <Preview label="Όνομα" value={form.petName || "—"} />
                <Preview label="Ημερομηνία Απώλειας" value={form.lostDate || "—"} />
                <Preview label="Τοποθεσία" value={form.lostArea || "—"} />
                <Preview label="Λεπτομέρειες" value={form.details || "—"} />

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => goStep(1)}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                    disabled={saving || finalized}
                  >
                    Προηγούμενο
                  </Button>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      onClick={saveDraft}
                      disabled={saving || lockedAll || finalized}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 900,
                        bgcolor: "primary",
                      }}
                    >
                      Προσωρινή Αποθήκευση
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() => goStep(3)}
                      color="success"
                      sx={{ textTransform: "none", borderRadius: 2 }}
                      disabled={saving || finalized}
                    >
                      Συνέχεια
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            {/* STEP 4 */}
            {step === 3 && (
              <Box sx={{ maxWidth: 560, mx: "auto" }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Οριστική υποβολή / Κατάσταση
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Ελέγξτε τα στοιχεία. Μπορείτε να κλείσετε την απώλεια ως “ΒΡΕΘΗΚΕ”.
                </Typography>

                <Preview label="Αριθμός Μικροτσίπ" value={form.microchip} />
                <Preview label="Όνομα" value={form.petName || "—"} />
                <Preview label="Ημερομηνία Απώλειας" value={form.lostDate || "—"} />
                <Preview label="Τοποθεσία" value={form.lostArea || "—"} />

                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Κατάσταση</InputLabel>
                    <Select
                      labelId="status-label"
                      label="Κατάσταση"
                      value={form.status}
                      onChange={(e) => changeStatus(e.target.value)}
                      disabled={
                        saving ||
                        form.status === "found" ||
                        form.status === "cancelled" ||
                        !lostId
                      }
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {(form.status === "found" || form.status === "cancelled") && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Η κατάσταση είναι κλειδωμένη και δεν μπορεί να αλλάξει.
                    </Typography>
                  )}
                </Box>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                  {!finalized ? (
                    <Button
                      variant="outlined"
                      onClick={() => goStep(2)}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                      disabled={saving}
                    >
                      Προηγούμενο
                    </Button>
                  ) : (
                    <Box />
                  )}

                  {form.status !== "submitted" &&
                  form.status !== "found" &&
                  form.status !== "cancelled" ? (
                    <Button
                      variant="contained"
                      onClick={submitFinal}
                      color="success"
                      disabled={saving}
                      sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                    >
                      Οριστική Υποβολή
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => navigate("/owner/lost")}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        fontWeight: 900,
                        bgcolor: "grey.700",
                      }}
                    >
                      Επιστροφή
                    </Button>
                  )}
                </Stack>
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
    <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
      <Typography sx={{ width: 220, fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ color: value === "—" ? "text.secondary" : "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  );
}

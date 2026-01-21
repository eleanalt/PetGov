import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

const steps = [
  "Στοιχεία Επικοινωνίας",
  "Λεπτομέρειες Εύρεσης",
  "Λεπτομέρειες Εμφάνισης",
  "Προεπισκόπηση",
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

export default function FoundReportWizard() {
  const { id } = useParams(); // lostPetId (string)
  const navigate = useNavigate();

  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    reporterName: "",
    reporterPhone: "",
    reporterEmail: "",
    location: "",
    area: "",
    postalCode: "",
    date: "",
    microchip: "",
    details: "",
    photos: [], 
  });


  const [photosMeta, setPhotosMeta] = useState([]); 

  const requiredOk = useMemo(() => {
    if (active === 0)
      return (
        form.reporterName.trim() &&
        form.reporterPhone.trim() &&
        form.reporterEmail.trim()
      );
    if (active === 1)
      return (
        form.location.trim() &&
        form.area.trim() &&
        form.postalCode.trim() &&
        form.date.trim()
      );
    return true;
  }, [active, form]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const next = () => {
    if (!requiredOk) {
      setMsg({ type: "error", text: "Συμπλήρωσε τα υποχρεωτικά πεδία." });
      return;
    }
    setMsg({ type: "", text: "" });
    setActive((a) => Math.min(a + 1, steps.length - 1));
  };

  const back = () => {
    setMsg({ type: "", text: "" });
    setActive((a) => Math.max(a - 1, 0));
  };

 
  const onPickPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_COUNT = 4;
    if (form.photos.length + files.length > MAX_COUNT) {
      setMsg({ type: "error", text: `Μπορείς να ανεβάσεις έως ${MAX_COUNT} φωτογραφίες.` });
      e.target.value = "";
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    const tooBig = files.find((f) => f.size > MAX_SIZE);
    if (tooBig) {
      setMsg({ type: "error", text: "Κάποια φωτογραφία είναι πολύ μεγάλη (max 2MB)." });
      e.target.value = "";
      return;
    }

    setMsg({ type: "", text: "" });

    try {
      const b64List = await Promise.all(files.map(fileToBase64));

      setForm((p) => ({ ...p, photos: [...p.photos, ...b64List] }));
      setPhotosMeta((m) => [
        ...m,
        ...files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      ]);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Αποτυχία φόρτωσης φωτογραφίας." });
    } finally {
      // για να μπορείς να επιλέξεις το ίδιο αρχείο ξανά
      e.target.value = "";
    }
  };

  const removePhoto = (idx) => {
    setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== idx) }));
    setPhotosMeta((m) => m.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setMsg({ type: "", text: "" });
    setSaving(true);

    try {
      await api.post("/foundReports", {
        lostPetId: String(id),

        reporterName: form.reporterName.trim(),
        reporterPhone: form.reporterPhone.trim(),
        reporterEmail: form.reporterEmail.trim(),

        location: `${form.location.trim()}, ${form.area.trim()}, ${form.postalCode.trim()}`,
        date: form.date.trim(),
        details: form.details.trim(),
        microchip: form.microchip.trim(),

        photos: Array.isArray(form.photos) ? form.photos : [],

        status: "pending",
        createdAt: new Date().toISOString(),
      });

      navigate(`/lost/${id}`);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία υποβολής αναφοράς." });
    } finally {
      setSaving(false);
    }
  };

  const showErr = (k) => {
    if (active === 0) {
      if (["reporterName", "reporterPhone", "reporterEmail"].includes(k)) {
        return msg.type === "error" && !form[k].trim();
      }
    }
    if (active === 1) {
      if (["location", "area", "postalCode", "date"].includes(k)) {
        return msg.type === "error" && !form[k].trim();
      }
    }
    return false;
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 3 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/lost/${id}`)}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη
        </Button>

        <Stack spacing={1} sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight={900}>
            Αναφορά Εύρεσης Ζώου
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Συμπληρώστε τη φόρμα για να ενημερώσετε τον ιδιοκτήτη
          </Typography>
        </Stack>

        {msg.text && (
          <Alert severity={msg.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
            {msg.text}
          </Alert>
        )}

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stepper activeStep={active} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((s) => (
                <Step key={s}>
                  <StepLabel>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* STEP 1 */}
            {active === 0 && (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Στοιχεία Επικοινωνίας Εύρεσης</Typography>

                <TextField
                  label="* Ονοματεπώνυμο"
                  value={form.reporterName}
                  onChange={set("reporterName")}
                  error={showErr("reporterName")}
                />
                <TextField
                  label="* Τηλέφωνο επικοινωνίας"
                  value={form.reporterPhone}
                  onChange={set("reporterPhone")}
                  error={showErr("reporterPhone")}
                />
                <TextField
                  label="* Email"
                  value={form.reporterEmail}
                  onChange={set("reporterEmail")}
                  error={showErr("reporterEmail")}
                />

                <Typography variant="caption" color="text.secondary">
                  Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                </Typography>
              </Stack>
            )}

            {/* STEP 2 */}
            {active === 1 && (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Λεπτομέρειες Εύρεσης</Typography>

                <TextField
                  label="* Διεύθυνση Εύρεσης"
                  value={form.location}
                  onChange={set("location")}
                  error={showErr("location")}
                />
                <TextField
                  label="* Περιοχή Εύρεσης"
                  value={form.area}
                  onChange={set("area")}
                  error={showErr("area")}
                />
                <TextField
                  label="* Ταχυδρομικός Κώδικας"
                  value={form.postalCode}
                  onChange={set("postalCode")}
                  error={showErr("postalCode")}
                />

                <TextField
                  label="* Ημερομηνία Εύρεσης"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={set("date")}
                  error={showErr("date")}
                  inputProps={{ max: today }}
                />

                <Typography variant="caption" color="text.secondary">
                  Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                </Typography>
              </Stack>
            )}

            {/* STEP 3 */}
            {active === 2 && (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Λεπτομέρειες Εμφάνισης Ζώου</Typography>

                <TextField
                  label="Αριθμός microchip (αν εντοπιστεί)"
                  value={form.microchip}
                  onChange={set("microchip")}
                />

                <TextField
                  label="Επιπλέον πληροφορίες"
                  multiline
                  minRows={4}
                  value={form.details}
                  onChange={set("details")}
                  placeholder="Περιγράψτε οτιδήποτε επιπλέον (συμπεριφορά, κατάσταση κ.λπ.)"
                />

                <Divider sx={{ my: 1 }} />

                <Stack spacing={1}>
                  <Typography fontWeight={900}>Φωτογραφίες (προαιρετικό)</Typography>

                  <Button
                    component="label"
                    variant="outlined"
                    disabled={saving}
                    sx={{ textTransform: "none", borderRadius: 2, width: "fit-content" }}
                  >
                    Προσθήκη φωτογραφιών
                    <input hidden type="file" accept="image/*" multiple onChange={onPickPhotos} />
                  </Button>

                  <Typography variant="caption" color="text.secondary">
                    Έως 4 φωτογραφίες • max 2MB/φωτο
                  </Typography>

                  {form.photos.length > 0 && (
                    <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 1 }}>
                      {form.photos.map((src, idx) => (
                        <Card
                          key={idx}
                          variant="outlined"
                          sx={{ borderRadius: 2, width: 220, overflow: "hidden" }}
                        >
                          <Box
                            component="img"
                            src={src}
                            alt={`photo-${idx}`}
                            sx={{ width: "100%", height: 140, objectFit: "cover" }}
                          />
                          <CardContent sx={{ py: 1.2 }}>
                            <Typography variant="body2" fontWeight={800} noWrap>
                              {photosMeta[idx]?.name || `Φωτογραφία ${idx + 1}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {photosMeta[idx]?.size
                                ? `${Math.round(photosMeta[idx].size / 1024)} KB`
                                : "—"}
                            </Typography>

                            <Button
                              color="error"
                              variant="text"
                              onClick={() => removePhoto(idx)}
                              sx={{ textTransform: "none", px: 0, mt: 0.5 }}
                            >
                              Αφαίρεση
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )}

            {/* STEP 4 */}
            {active === 3 && (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Προεπισκόπηση Αναφοράς</Typography>
                <Divider />

                <Typography>
                  <b>Ονοματεπώνυμο:</b> {form.reporterName}
                </Typography>
                <Typography>
                  <b>Τηλέφωνο:</b> {form.reporterPhone}
                </Typography>
                <Typography>
                  <b>Email:</b> {form.reporterEmail}
                </Typography>

                <Divider />

                <Typography>
                  <b>Τοποθεσία εύρεσης:</b> {form.location}, {form.area}, {form.postalCode}
                </Typography>
                <Typography>
                  <b>Ημερομηνία εύρεσης:</b> {form.date}
                </Typography>
                <Typography>
                  <b>Microchip:</b> {form.microchip || "—"}
                </Typography>

                <Divider />

                <Typography sx={{ whiteSpace: "pre-line" }}>
                  <b>Επιπλέον πληροφορίες:</b> {form.details || "—"}
                </Typography>

                {form.photos.length > 0 && (
                  <>
                    <Divider />
                    <Typography fontWeight={900}>Φωτογραφίες</Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {form.photos.map((src, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={src}
                          alt={`preview-${idx}`}
                          sx={{
                            width: 220,
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.300",
                          }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Buttons */}
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={active === 0 ? () => navigate(`/lost/${id}`) : back}
                disabled={saving}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                {active === 0 ? "Ακύρωση" : "Επιστροφή στο προηγούμενο βήμα"}
              </Button>

              {active < 3 ? (
                <Button
                  variant="contained"
                  onClick={next}
                  disabled={saving}
                  color="success"
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Συνέχεια
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={submit}
                  disabled={saving}
                  color="success"
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Υποβολή Αναφοράς
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

const steps = ["Στοιχεία Επικοινωνίας", "Λεπτομέρειες Εύρεσης", "Λεπτομέρειες Εμφάνισης", "Προεπισκόπηση"];

export default function FoundReportWizard() {
  const { id } = useParams(); // lostPetId
  const navigate = useNavigate();

  const [active, setActive] = useState(0);

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

  const requiredOk = useMemo(() => {
    if (active === 0) return form.reporterName.trim() && form.reporterPhone.trim() && form.reporterEmail.trim();
    if (active === 1) return form.location.trim() && form.area.trim() && form.postalCode.trim() && form.date.trim();
    return true;
  }, [active, form]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const next = () => setActive((a) => Math.min(a + 1, steps.length - 1));
  const back = () => setActive((a) => Math.max(a - 1, 0));

  const submit = async () => {
    await api.post("/foundReports", {
      lostPetId: Number(id),
      reporterName: form.reporterName.trim(),
      reporterPhone: form.reporterPhone.trim(),
      reporterEmail: form.reporterEmail.trim(),
      location: `${form.location.trim()}, ${form.area.trim()}, ${form.postalCode.trim()}`,
      date: form.date.trim(),
      details: form.details.trim(),
      photos: form.photos,
      microchip: form.microchip.trim(),
    });

    navigate(`/lost/${id}`);
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
                <TextField label="* Ονοματεπώνυμο" value={form.reporterName} onChange={set("reporterName")} />
                <TextField label="* Τηλέφωνο επικοινωνίας" value={form.reporterPhone} onChange={set("reporterPhone")} />
                <TextField label="* Email" value={form.reporterEmail} onChange={set("reporterEmail")} />
                <Typography variant="caption" color="text.secondary">
                  Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                </Typography>
              </Stack>
            )}

            {/* STEP 2 */}
            {active === 1 && (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Λεπτομέρειες Εύρεσης</Typography>
                <TextField label="* Διεύθυνση Εύρεσης" value={form.location} onChange={set("location")} />
                <TextField label="* Περιοχή Εύρεσης" value={form.area} onChange={set("area")} />
                <TextField label="* Ταχυδρομικός Κώδικας" value={form.postalCode} onChange={set("postalCode")} />
                <TextField
                  label="* Ημερομηνία Εύρεσης"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={set("date")}
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
                <Typography variant="caption" color="text.secondary">
                  (Προαιρετικά) Φωτογραφίες: για τώρα κρατάμε placeholder σε photos[].
                </Typography>
              </Stack>
            )}

            {/* STEP 4 */}
            {active === 3 && (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Προεπισκόπηση Αναφοράς</Typography>

                <Divider />

                <Typography><b>Ονοματεπώνυμο:</b> {form.reporterName}</Typography>
                <Typography><b>Τηλέφωνο:</b> {form.reporterPhone}</Typography>
                <Typography><b>Email:</b> {form.reporterEmail}</Typography>

                <Divider />

                <Typography>
                  <b>Τοποθεσία εύρεσης:</b> {form.location}, {form.area}, {form.postalCode}
                </Typography>
                <Typography><b>Ημερομηνία εύρεσης:</b> {form.date}</Typography>
                <Typography><b>Microchip:</b> {form.microchip || "—"}</Typography>

                <Divider />

                <Typography sx={{ whiteSpace: "pre-line" }}>
                  <b>Επιπλέον πληροφορίες:</b> {form.details || "—"}
                </Typography>
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Buttons */}
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={active === 0 ? () => navigate(`/lost/${id}`) : back}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                {active === 0 ? "Ακύρωση" : "Επιστροφή στο προηγούμενο βήμα"}
              </Button>

              {active < 3 ? (
                <Button
                  variant="contained"
                  onClick={next}
                  disabled={!requiredOk}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                >
                  Επόμενο βήμα
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={submit}
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

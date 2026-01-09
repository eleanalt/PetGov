import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const STEPS = ["Συμπλήρωση στοιχείων", "Προσωρινή αποθήκευση", "Οριστική υποβολή"];

const SPECIES = ["Σκύλος", "Γάτα", "Άλλο"];
const SEX = ["Αρσενικό", "Θηλυκό"];
const EVENT = ["Απώλεια", "Εύρεση", "Μεταβίβαση", "Υιοθεσία", "Αναδοχή"];

function PreviewRow({ label, value }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.6 }}>
      <Typography sx={{ width: 220 }} fontWeight={800}>
        {label}
      </Typography>
      <Typography color="text.secondary">{value || "—"}</Typography>
    </Stack>
  );
}

export default function VetRegistrationWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { regId } = useParams();

  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [recordId, setRecordId] = useState(regId || null);
  const [status, setStatus] = useState("draft"); // draft | submitted

  const [form, setForm] = useState({
    microchip: "",
    species: "Σκύλος",
    sex: "Αρσενικό",
    name: "",
    birthDate: "",
    lifeEvent: "Απώλεια"
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    if (!regId) return;
    (async () => {
      try {
        const res = await api.get(`/petRegistrations/${regId}`);
        const data = res.data ?? {};
        setForm({
          microchip: data.microchip ?? "",
          species: data.species ?? "Σκύλος",
          sex: data.sex ?? "Αρσενικό",
          name: data.name ?? "",
          birthDate: data.birthDate ?? "",
          lifeEvent: data.lifeEvent ?? "Απώλεια"
        });
        setStatus(data.status ?? "draft");
        setRecordId(data.id);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [regId]);

  const canSubmit = useMemo(() => form.microchip.trim().length > 0, [form.microchip]);

  const saveDraft = async () => {
    if (!canSubmit) {
      alert("Το πεδίο Microchip είναι υποχρεωτικό.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        status: "draft",
        vetUserId: user?.id ?? null,
        updatedAt: new Date().toISOString()
      };

      if (recordId) {
        await api.patch(`/petRegistrations/${recordId}`, payload);
      } else {
        const created = await api.post("/petRegistrations", { ...payload, createdAt: new Date().toISOString() });
        setRecordId(created.data?.id);
      }

      setStatus("draft");
      setActiveStep(1);
    } catch (e) {
      console.error(e);
      alert("Αποτυχία προσωρινής αποθήκευσης.");
    } finally {
      setSaving(false);
    }
  };

  const finalSubmit = async () => {
    if (!recordId) {
      alert("Κάντε πρώτα προσωρινή αποθήκευση.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/petRegistrations/${recordId}`, {
        ...form,
        status: "submitted",
        submittedAt: new Date().toISOString()
      });
      setStatus("submitted");
      setActiveStep(2);
    } catch (e) {
      console.error(e);
      alert("Αποτυχία οριστικής υποβολής.");
    } finally {
      setSaving(false);
    }
  };

  const readOnly = status === "submitted";

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/vet/registrations")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή
        </Button>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>
              Νέα καταγραφή
            </Typography>

            <Box sx={{ maxWidth: 720, mx: "auto" }}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: "grey.50" }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  {activeStep === 0 && (
                    <>
                      <Stack spacing={2}>
                        <TextField
                          label="*Αριθμός microchip"
                          value={form.microchip}
                          onChange={set("microchip")}
                          disabled={readOnly}
                          placeholder="π.χ. 123456789"
                          fullWidth
                        />

                        <TextField
                          select
                          label="*Είδος κατοικιδίου"
                          value={form.species}
                          onChange={set("species")}
                          disabled={readOnly}
                          fullWidth
                        >
                          {SPECIES.map((x) => (
                            <MenuItem key={x} value={x}>
                              {x}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          label="*Φύλο"
                          value={form.sex}
                          onChange={set("sex")}
                          disabled={readOnly}
                          fullWidth
                        >
                          {SEX.map((x) => (
                            <MenuItem key={x} value={x}>
                              {x}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          label="Όνομα"
                          value={form.name}
                          onChange={set("name")}
                          disabled={readOnly}
                          placeholder="π.χ. Τσίτσι"
                          fullWidth
                        />

                        <TextField
                          label="Ημερομηνία Γέννησης"
                          type="date"
                          value={form.birthDate}
                          onChange={set("birthDate")}
                          disabled={readOnly}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                          select
                          label="*Συμβάν ζωής"
                          value={form.lifeEvent}
                          onChange={set("lifeEvent")}
                          disabled={readOnly}
                          fullWidth
                        >
                          {EVENT.map((x) => (
                            <MenuItem key={x} value={x}>
                              {x}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Stack>

                      <Stack alignItems="center" sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(1)}
                          disabled={!canSubmit}
                          sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, px: 6 }}
                        >
                          Συνέχεια
                        </Button>
                      </Stack>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                      </Typography>
                    </>
                  )}

                  {activeStep === 1 && (
                    <>
                      <Typography fontWeight={900} sx={{ mb: 1 }}>
                        Προεπισκόπηση στοιχείων
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <PreviewRow label="Αριθμός Μικροτσίπ" value={form.microchip} />
                      <PreviewRow label="Είδος κατοικιδίου" value={form.species} />
                      <PreviewRow label="Φύλο" value={form.sex} />
                      <PreviewRow label="Όνομα" value={form.name} />
                      <PreviewRow label="Ημερομηνία Γέννησης" value={form.birthDate} />
                      <PreviewRow label="Συμβάν ζωής" value={form.lifeEvent} />

                      <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="space-between">
                        <Button
                          variant="outlined"
                          onClick={() => setActiveStep(0)}
                          sx={{ textTransform: "none", borderRadius: 2 }}
                        >
                          Προηγούμενο
                        </Button>

                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="contained"
                            onClick={saveDraft}
                            disabled={saving || readOnly}
                            sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                          >
                            Προσωρινή Αποθήκευση
                          </Button>

                          <Button
                            variant="outlined"
                            onClick={() => setActiveStep(2)}
                            sx={{ textTransform: "none", borderRadius: 2 }}
                          >
                            Επόμενο
                          </Button>
                        </Stack>
                      </Stack>

                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                      </Typography>
                    </>
                  )}

                  {activeStep === 2 && (
                    <>
                      <Typography fontWeight={900} sx={{ mb: 1 }}>
                        Οριστική υποβολή
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <PreviewRow label="Αριθμός Μικροτσίπ" value={form.microchip} />
                      <PreviewRow label="Είδος κατοικιδίου" value={form.species} />
                      <PreviewRow label="Φύλο" value={form.sex} />
                      <PreviewRow label="Όνομα" value={form.name} />
                      <PreviewRow label="Ημερομηνία Γέννησης" value={form.birthDate} />
                      <PreviewRow label="Συμβάν ζωής" value={form.lifeEvent} />

                      <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="space-between">
                        <Button
                          variant="outlined"
                          onClick={() => setActiveStep(1)}
                          sx={{ textTransform: "none", borderRadius: 2 }}
                        >
                          Προηγούμενο
                        </Button>

                        <Button
                          variant="contained"
                          onClick={finalSubmit}
                          disabled={saving || readOnly}
                          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900, px: 4 }}
                        >
                          Οριστική Υποβολή
                        </Button>
                      </Stack>

                      {readOnly && (
                        <Typography color="text.secondary" sx={{ mt: 2 }}>
                          Η καταγραφή έχει υποβληθεί οριστικά και δεν μπορεί να επεξεργαστεί.
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

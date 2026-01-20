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
  Breadcrumbs,
  Link as MUILink,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const steps = ["Συμπλήρωση στοιχείων", "Προσωρινή αποθήκευση", "Οριστική υποβολή"];

function onlyDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

function isAdoptionOrFoster(lifeEvent) {
  return lifeEvent === "Υιοθεσία" || lifeEvent === "Αναδοχή" || lifeEvent === "Μεταβίβαση";
}

async function findOwnerByAfm(afm) {
  const clean = onlyDigits(afm);
  if (!clean) return null;

  const res = await api.get("/users", { params: { role: "owner", afm: clean } });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr[0] || null;
}

async function findPetByMicrochip(microchip) {
  const mc = onlyDigits(microchip);
  if (!mc) return null;

  const res = await api.get("/pets", { params: { microchip: mc } });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr[0] || null;
}

export default function VetRegistrationWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { regId } = useParams();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [pageMsg, setPageMsg] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    microchip: "",
    species: "",
    sex: "",
    name: "",
    birthDate: "",
    lifeEvent: "",
    ownerAfm: "",
  });

  // ✅ microchip auto-fill
  const [petLookupLoading, setPetLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const showMsg = (type, text) => setPageMsg({ type, text });
  const clearMsg = () => setPageMsg(null);

  // Load existing registration if editing
  useEffect(() => {
    (async () => {
      if (!regId) return;
      try {
        const res = await api.get(`/petRegistrations/${regId}`);
        if (res?.data) {
          setForm({
            microchip: res.data.microchip ?? "",
            species: res.data.species ?? "",
            sex: res.data.sex ?? "",
            name: res.data.name ?? "",
            birthDate: res.data.birthDate ?? "",
            lifeEvent: res.data.lifeEvent ?? "",
            ownerAfm: res.data.ownerAfm ?? "",
          });

          setStep(res.data.status === "submitted" ? 2 : 1);
        }
      } catch (e) {
        console.error(e);
        showMsg("error", "Δεν βρέθηκε η καταγραφή.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regId]);

  const setField = (key) => (e) => {
    clearMsg();
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  // ✅ Auto-fill από /pets όταν υπάρχει microchip
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (regId) return;

      const mc = onlyDigits(form.microchip);

      if (!mc || mc.length < 4) {
        setAutoFilled(false);
        return;
      }

      setPetLookupLoading(true);
      try {
        const pet = await findPetByMicrochip(mc);
        if (cancelled) return;

        if (pet?.id) {
          setForm((f) => ({
            ...f,
            microchip: mc,
            species: pet.species ?? f.species ?? "",
            sex: pet.sex ?? pet.gender ?? f.sex ?? "",
            name: pet.name ?? f.name ?? "",
            birthDate: pet.birthDate ?? f.birthDate ?? "",
          }));
          setAutoFilled(true);
        } else {
          setAutoFilled(false);
        }
      } catch (e) {
        if (!cancelled) setAutoFilled(false);
      } finally {
        if (!cancelled) setPetLookupLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [form.microchip, regId]);

  const isValid = useMemo(() => {
    if (!onlyDigits(form.microchip)) return false;
    if (!form.species) return false;
    if (!form.sex) return false;
    if (!form.lifeEvent) return false;

    if (isAdoptionOrFoster(form.lifeEvent) && !onlyDigits(form.ownerAfm)) return false;

    return true;
  }, [form]);

  const previewRows = useMemo(() => {
    const rows = [
      { label: "Αριθμός Μικροτσίπ", value: form.microchip || "—" },
      { label: "Είδος κατοικιδίου", value: form.species || "—" },
      { label: "Φύλο", value: form.sex || "—" },
      { label: "Όνομα", value: form.name || "—" },
      { label: "Ημερομηνία Γέννησης", value: form.birthDate || "—" },
      { label: "Συμβάν ζωής", value: form.lifeEvent || "—" },
    ];

    if (isAdoptionOrFoster(form.lifeEvent)) {
      rows.push({ label: "ΑΦΜ Ιδιοκτήτη", value: form.ownerAfm || "—" });
    }

    return rows;
  }, [form]);

  const ensureAuthAndValid = () => {
    if (!onlyDigits(form.microchip)) {
      showMsg("error", "Το μικροτσίπ είναι υποχρεωτικό.");
      return false;
    }
    if (!form.species || !form.sex || !form.lifeEvent) {
      showMsg("error", "Συμπλήρωσε τα υποχρεωτικά πεδία (*).");
      return false;
    }
    if (isAdoptionOrFoster(form.lifeEvent) && !onlyDigits(form.ownerAfm)) {
      showMsg("error", "Για Υιοθεσία/Αναδοχή/Μεταβίβαση το ΑΦΜ ιδιοκτήτη είναι υποχρεωτικό.");
      return false;
    }
    if (!user?.id) {
      showMsg("error", "Δεν βρέθηκε συνδεδεμένος χρήστης.");
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    clearMsg();
    if (!ensureAuthAndValid()) return;

    setSaving(true);
    try {
      let owner = null;
      if (isAdoptionOrFoster(form.lifeEvent)) {
        owner = await findOwnerByAfm(form.ownerAfm);
        if (!owner?.id) {
          showMsg("error", "Δεν βρέθηκε ιδιοκτήτης με αυτό το ΑΦΜ.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...form,
        microchip: onlyDigits(form.microchip),
        ownerAfm: isAdoptionOrFoster(form.lifeEvent) ? onlyDigits(form.ownerAfm) : "",
        ownerId: owner?.id ? String(owner.id) : "",
        vetUserId: String(user.id),
        status: "draft",
        updatedAt: new Date().toISOString(),
      };

      if (regId) {
        await api.patch(`/petRegistrations/${regId}`, payload);
        showMsg("success", "Έγινε προσωρινή αποθήκευση.");
      } else {
        const res = await api.post(`/petRegistrations`, {
          ...payload,
          createdAt: new Date().toISOString(),
        });

        const newId = res?.data?.id;
        showMsg("success", "Έγινε προσωρινή αποθήκευση.");
        if (newId) navigate(`/vet/registrations/${newId}`, { replace: true });
      }

      setStep(1);
    } catch (e) {
      console.error(e);
      showMsg("error", "Αποτυχία προσωρινής αποθήκευσης.");
    } finally {
      setSaving(false);
    }
  };

  const submitFinal = async () => {
    clearMsg();
    if (!ensureAuthAndValid()) return;

    setSaving(true);
    try {
      let owner = null;
      if (isAdoptionOrFoster(form.lifeEvent)) {
        owner = await findOwnerByAfm(form.ownerAfm);
        if (!owner?.id) {
          showMsg("error", "Δεν βρέθηκε ιδιοκτήτης με αυτό το ΑΦΜ.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...form,
        microchip: onlyDigits(form.microchip),
        ownerAfm: isAdoptionOrFoster(form.lifeEvent) ? onlyDigits(form.ownerAfm) : "",
        ownerId: owner?.id ? String(owner.id) : "",
        vetUserId: String(user.id),
        status: "submitted",
        updatedAt: new Date().toISOString(),
      };

      if (regId) {
        await api.patch(`/petRegistrations/${regId}`, payload);
      } else {
        const res = await api.post(`/petRegistrations`, {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        const newId = res?.data?.id;
        if (newId) navigate(`/vet/registrations/${newId}`, { replace: true });
      }

      if (isAdoptionOrFoster(form.lifeEvent) && owner?.id) {
        const microchip = onlyDigits(form.microchip);
        const existingPet = await findPetByMicrochip(microchip);

        if (existingPet?.id) {
          await api.patch(`/pets/${existingPet.id}`, {
            ownerId: String(owner.id),
            microchip,
            name: form.name || existingPet.name || "",
            species: form.species || existingPet.species || "",
            sex: form.sex || existingPet.sex || existingPet.gender || "",
            gender: form.sex || existingPet.gender || existingPet.sex || "",
            birthDate: form.birthDate || existingPet.birthDate || "",
            updatedAt: new Date().toISOString(),
          });
        } else {
          await api.post("/pets", {
            ownerId: String(owner.id),
            microchip,
            name: form.name || "",
            species: form.species || "",
            sex: form.sex || "",
            gender: form.sex || "",
            birthDate: form.birthDate || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setSubmitted(true);
      showMsg("success", "Η καταγραφή υποβλήθηκε οριστικά.");
    } catch (e) {
      console.error(e);
      showMsg("error", "Αποτυχία οριστικής υποβολής.");
    } finally {
      setSaving(false);
    }
  };

  const needsAfm = isAdoptionOrFoster(form.lifeEvent);

  const pageTitle = regId ? "Επεξεργασία καταγραφής" : "Νέα καταγραφή";


  // Success screen after submit
  if (submitted) {
    return (
      <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/vet/registrations")}
            sx={{ textTransform: "none", mb: 2 }}
          >
            Επιστροφή στις καταγραφές
          </Button>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
                Ολοκληρώθηκε
              </Typography>

              {pageMsg && (
                <Alert severity={pageMsg.type} onClose={clearMsg} sx={{ mb: 2 }}>
                  {pageMsg.text}
                </Alert>
              )}

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                    Στοιχεία καταγραφής
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={1.4}>
                    {previewRows.map((r) => (
                      <PreviewRow key={r.label} label={r.label} value={r.value} />
                    ))}
                  </Stack>

                  <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={() => navigate("/vet/registrations")}
                      sx={{ textTransform: "none", borderRadius: 2, px: 4, fontWeight: 900 }}
                    >
                      Επιστροφή στις καταγραφές
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

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

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
              {pageTitle}
            </Typography>

            {pageMsg && (
              <Alert severity={pageMsg.type} onClose={clearMsg} sx={{ mb: 2 }}>
                {pageMsg.text}
              </Alert>
            )}

            <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* STEP 1: Form */}
            {step === 0 && (
              <Box sx={{ maxWidth: 560, mx: "auto" }}>
                <Stack spacing={2}>
                  <TextField
                    label="* Αριθμός Microchip"
                    value={form.microchip}
                    onChange={(e) => {
                      clearMsg();
                      setAutoFilled(false);
                      setForm((f) => ({ ...f, microchip: e.target.value }));
                    }}
                    fullWidth
                    helperText={
                      petLookupLoading
                        ? "Αναζήτηση μικροτσίπ..."
                        : autoFilled
                        ? "Βρέθηκε κατοικίδιο — συμπληρώθηκαν αυτόματα τα στοιχεία."
                        : " "
                    }
                  />

                  <TextField
                    select
                    label="* Είδος κατοικιδίου"
                    value={form.species}
                    onChange={setField("species")}
                    fullWidth
                    disabled={autoFilled}
                  >
                    <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                    <MenuItem value="Γάτα">Γάτα</MenuItem>
                    <MenuItem value="Άλλο">Άλλο</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="* Φύλο"
                    value={form.sex}
                    onChange={setField("sex")}
                    fullWidth
                    disabled={autoFilled}
                  >
                    <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                    <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                  </TextField>

                  <TextField
                    label="Όνομα"
                    value={form.name}
                    onChange={setField("name")}
                    fullWidth
                    disabled={autoFilled}
                  />

                  <TextField
                    label="Ημερομηνία Γέννησης"
                    type="date"
                    value={form.birthDate}
                    onChange={setField("birthDate")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={autoFilled}
                  />

                  {autoFilled && (
                    <Button
                      variant="text"
                      onClick={() => setAutoFilled(false)}
                      sx={{ textTransform: "none", alignSelf: "flex-start" }}
                    >
                      Επεξεργασία στοιχείων
                    </Button>
                  )}

                  <TextField
                    select
                    label="* Συμβάν ζωής"
                    value={form.lifeEvent}
                    onChange={setField("lifeEvent")}
                    fullWidth
                  >
                    <MenuItem value="Απώλεια">Απώλεια</MenuItem>
                    <MenuItem value="Εύρεση">Εύρεση</MenuItem>
                    <MenuItem value="Μεταβίβαση">Μεταβίβαση</MenuItem>
                    <MenuItem value="Υιοθεσία">Υιοθεσία</MenuItem>
                    <MenuItem value="Αναδοχή">Αναδοχή</MenuItem>
                  </TextField>

                  {needsAfm && (
                    <TextField
                      label="* ΑΦΜ Ιδιοκτήτη"
                      value={form.ownerAfm}
                      onChange={setField("ownerAfm")}
                      fullWidth
                      helperText="Απαιτείται για Υιοθεσία/Αναδοχή/Μεταβίβαση"
                    />
                  )}

                  <Stack direction="row" justifyContent="center" spacing={2} sx={{ pt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        clearMsg();
                        if (!ensureAuthAndValid()) return;
                        setStep(1);
                      }}
                      sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, px: 4 }}
                      disabled={!isValid}
                    >
                      Συνέχεια
                    </Button>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                    Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                  </Typography>
                </Stack>
              </Box>
            )}

            {/* STEP 2: Preview + Draft */}
            {step === 1 && (
              <Box sx={{ maxWidth: 640, mx: "auto" }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                      Προεπισκόπηση στοιχείων
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Stack spacing={1.4}>
                      {previewRows.map((r) => (
                        <PreviewRow key={r.label} label={r.label} value={r.value} />
                      ))}
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          clearMsg();
                          setStep(0);
                        }}
                        sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
                        disabled={saving}
                      >
                        Προηγούμενο
                      </Button>

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          onClick={saveDraft}
                          sx={{ textTransform: "none", borderRadius: 2, px: 3, fontWeight: 900 }}
                          disabled={saving}
                        >
                          Προσωρινή Αποθήκευση
                        </Button>

                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => {
                            clearMsg();
                            setStep(2);
                          }}
                          sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
                          disabled={saving}
                        >
                          Επόμενο
                        </Button>
                      </Stack>
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 1.5 }}
                    >
                      Τα πεδία με αστερίσκο (*) είναι υποχρεωτικά
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <Box sx={{ maxWidth: 640, mx: "auto" }}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                      Οριστική υποβολή
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Ελέγξτε τα στοιχεία και προχωρήστε σε οριστική υποβολή.
                    </Typography>

                    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                      <CardContent>
                        <Typography fontWeight={900} sx={{ mb: 1.5 }}>
                          Στοιχεία καταγραφής
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={1.4}>
                          {previewRows.map((r) => (
                            <PreviewRow key={r.label} label={r.label} value={r.value} />
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Stack direction="row" justifyContent="space-between">
                      <Button
                        variant="outlined"
                        onClick={() => {
                          clearMsg();
                          setStep(1);
                        }}
                        sx={{ textTransform: "none", borderRadius: 2, px: 3 }}
                        disabled={saving}
                      >
                        Προηγούμενο
                      </Button>

                      <Button
                        variant="contained"
                        onClick={submitFinal}
                        color="success"
                        sx={{ textTransform: "none", borderRadius: 2, px: 4, fontWeight: 900 }}
                        disabled={saving}
                      >
                        Οριστική Υποβολή
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

function PreviewRow({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography sx={{ width: 220, fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ color: value === "—" ? "text.secondary" : "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  );
}

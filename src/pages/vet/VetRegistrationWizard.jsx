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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
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

async function findOpenLostByPetId(petId) {
  if (!petId) return null;
  const res = await api.get("/lostPets", {
    params: { petId: String(petId), status: "submitted" },
  });
  const arr = Array.isArray(res.data) ? res.data : [];
  return arr[0] || null;
}


function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
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

    lossPhoto: null,
    lossArea: "",
    lossDetails: "",
  });

  const [petLookupLoading, setPetLookupLoading] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const showMsg = (type, text) => setPageMsg({ type, text });
  const clearMsg = () => setPageMsg(null);

  const markTouched = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  const setField = (key) => (e) => {
    clearMsg();
    const value = e.target.value;

    setForm((f) => {
      const next = { ...f, [key]: value };

      // αν αλλάξει από Απώλεια σε κάτι άλλο, καθάρισε τα loss fields
      if (key === "lifeEvent" && value !== "Απώλεια") {
        next.lossPhoto = null;
        next.lossArea = "";
        next.lossDetails = "";
      }

      return next;
    });
  };

  const needsAfm = isAdoptionOrFoster(form.lifeEvent);
  const isLoss = form.lifeEvent === "Απώλεια";
  const pageTitle = regId ? "Επεξεργασία καταγραφής" : "Νέα καταγραφή";

  function validateForm(f) {
    const e = {};
    const req = (k, msg = "Υποχρεωτικό πεδίο") => {
      if (!String(f[k] || "").trim()) e[k] = msg;
    };

    req("microchip");
    req("species");
    req("sex");
    req("name");
    req("birthDate");
    req("lifeEvent");

    if (isAdoptionOrFoster(f.lifeEvent)) {
      if (!onlyDigits(f.ownerAfm)) e.ownerAfm = "Υποχρεωτικό πεδίο";
    }

    if (f.lifeEvent === "Απώλεια") {
      if (!f.lossPhoto) e.lossPhoto = "Υποχρεωτική φωτογραφία για δήλωση απώλειας";
      if (!String(f.lossArea || "").trim()) e.lossArea = "Υποχρεωτική περιοχή απώλειας";
    }

    // microchip μόνο αριθμοί
    if (String(f.microchip || "").trim() && !onlyDigits(f.microchip)) {
      e.microchip = "Το microchip πρέπει να είναι μόνο αριθμοί";
    }

    return e;
  }

  const shouldShowError = (key) => Boolean(errors?.[key]) && (touched?.[key] || submitAttempted);

  // Load existing registration if editing
  useEffect(() => {
    (async () => {
      if (!regId) return;
      try {
        const res = await api.get(`/petRegistrations/${regId}`);
        if (res?.data) {
          const next = {
            microchip: res.data.microchip ?? "",
            species: res.data.species ?? "",
            sex: res.data.sex ?? "",
            name: res.data.name ?? "",
            birthDate: res.data.birthDate ?? "",
            lifeEvent: res.data.lifeEvent ?? "",
            ownerAfm: res.data.ownerAfm ?? "",

            lossPhoto: null,
            lossArea: res.data.lossArea ?? "",
            lossDetails: res.data.lossDetails ?? "",
          };
          setForm(next);
          setErrors(validateForm(next));
          setStep(res.data.status === "submitted" ? 2 : 1);
        }
      } catch (e) {
        console.error(e);
        showMsg("error", "Δεν βρέθηκε η καταγραφή.");
      }
    })();
  }, [regId]);

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
          const next = {
            ...form,
            microchip: mc,
            species: pet.species ?? form.species ?? "",
            sex: pet.sex ?? pet.gender ?? form.sex ?? "",
            name: pet.name ?? form.name ?? "",
            birthDate: pet.birthDate ?? form.birthDate ?? "",
          };
          setForm(next);
          setErrors(validateForm(next));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.microchip, regId]);

  const previewRows = useMemo(() => {
    const rows = [
      { label: "Αριθμός Μικροτσίπ", value: form.microchip || "—" },
      { label: "Είδος κατοικιδίου", value: form.species || "—" },
      { label: "Φύλο", value: form.sex || "—" },
      { label: "Όνομα", value: form.name || "—" },
      { label: "Ημερομηνία Γέννησης", value: form.birthDate || "—" },
      { label: "Συμβάν ζωής", value: form.lifeEvent || "—" },
    ];

    if (needsAfm) rows.push({ label: "ΑΦΜ Ιδιοκτήτη", value: form.ownerAfm || "—" });

    if (isLoss) {
      rows.push({ label: "Περιοχή απώλειας", value: form.lossArea || "—" });
      rows.push({ label: "Λεπτομέρειες", value: form.lossDetails || "—" });
      rows.push({ label: "Φωτογραφία", value: form.lossPhoto?.name || "—" });
    }

    return rows;
  }, [form, needsAfm, isLoss]);

  const ensureAuthAndValid = () => {
    if (!user?.id) {
      showMsg("error", "Δεν βρέθηκε συνδεδεμένος χρήστης.");
      return false;
    }

    const e = validateForm(form);
    setErrors(e);
    setSubmitAttempted(true);

    setTouched((t) => ({
      ...t,
      microchip: true,
      species: true,
      sex: true,
      name: true,
      birthDate: true,
      lifeEvent: true,
      ownerAfm: true,
      lossPhoto: true,
      lossArea: true,
      lossDetails: true,
    }));

    if (Object.keys(e).length > 0) {
      showMsg("error", "Συμπλήρωσε όλα τα υποχρεωτικά πεδία.");
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
      if (needsAfm) {
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
        ownerAfm: needsAfm ? onlyDigits(form.ownerAfm) : "",
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
      if (needsAfm) {
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
        ownerAfm: needsAfm ? onlyDigits(form.ownerAfm) : "",
        ownerId: owner?.id ? String(owner.id) : "",
        vetUserId: String(user.id),
        status: "submitted",
        updatedAt: new Date().toISOString(),
      };

      // 1) submit registration
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

      // 2) Υιοθεσία/Αναδοχή/Μεταβίβαση -> ενημέρωσε /pets owner
      if (needsAfm && owner?.id) {
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

      try {
        const microchip = onlyDigits(form.microchip);
        const pet = await findPetByMicrochip(microchip);

        if (pet?.id) {
          const petId = String(pet.id);
          const ownerIdFromPet = pet.ownerId ? String(pet.ownerId) : "";

          const snapshot = {
            petId,
            ownerId: ownerIdFromPet,
            microchip: pet.microchip || microchip,
            petName: pet.name || form.name || "",
            species: pet.species || form.species || "",
            sex: pet.sex || pet.gender || form.sex || "",
          };

          let lossPhotoDataUrl = "";
          if (form.lifeEvent === "Απώλεια" && form.lossPhoto) {
            lossPhotoDataUrl = await fileToDataUrl(form.lossPhoto);
          }

          if (form.lifeEvent === "Απώλεια") {
            const existingLost = await findOpenLostByPetId(petId);

            const patchPayload = {
              ...snapshot,
              status: "submitted",
              lostDate: existingLost?.lostDate || new Date().toISOString().slice(0, 10),
              area: form.lossArea,
              details: form.lossDetails || "",
              photos: lossPhotoDataUrl
                ? [lossPhotoDataUrl]
                : (existingLost?.photos || []),
              updatedAt: new Date().toISOString(),
            };

            if (existingLost?.id) {
              await api.patch(`/lostPets/${existingLost.id}`, patchPayload);
            } else {
              await api.post("/lostPets", {
                ...patchPayload,
                createdAt: new Date().toISOString(),
              });
            }
          }

          if (form.lifeEvent === "Εύρεση") {
            const existingLost = await findOpenLostByPetId(petId);
            if (existingLost?.id) {
              await api.patch(`/lostPets/${existingLost.id}`, {
                ...snapshot,
                status: "found",
                foundAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch (e) {
        console.error("lostPets sync failed", e);
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
                      setErrors((prev) => ({ ...prev, microchip: undefined }));
                    }}
                    onBlur={markTouched("microchip")}
                    fullWidth
                    error={shouldShowError("microchip")}
                    helperText={
                      shouldShowError("microchip")
                        ? errors.microchip
                        : petLookupLoading
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
                    onBlur={markTouched("species")}
                    fullWidth
                    disabled={autoFilled}
                    error={shouldShowError("species")}
                    helperText={shouldShowError("species") ? errors.species : " "}
                  >
                    <MenuItem value="Σκύλος">Σκύλος</MenuItem>
                    <MenuItem value="Γάτα">Γάτα</MenuItem>
                    <MenuItem value="Κουνέλι">Κουνέλι</MenuItem>
                  </TextField>

                  <TextField
                    select
                    label="* Φύλο"
                    value={form.sex}
                    onChange={setField("sex")}
                    onBlur={markTouched("sex")}
                    fullWidth
                    disabled={autoFilled}
                    error={shouldShowError("sex")}
                    helperText={shouldShowError("sex") ? errors.sex : " "}
                  >
                    <MenuItem value="Αρσενικό">Αρσενικό</MenuItem>
                    <MenuItem value="Θηλυκό">Θηλυκό</MenuItem>
                  </TextField>

                  <TextField
                    label="* Όνομα"
                    value={form.name}
                    onChange={setField("name")}
                    onBlur={markTouched("name")}
                    fullWidth
                    disabled={autoFilled}
                    error={shouldShowError("name")}
                    helperText={shouldShowError("name") ? errors.name : " "}
                  />

                  <TextField
                    label="* Ημερομηνία Γέννησης"
                    type="date"
                    value={form.birthDate}
                    onChange={setField("birthDate")}
                    onBlur={markTouched("birthDate")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    disabled={autoFilled}
                    error={shouldShowError("birthDate")}
                    helperText={shouldShowError("birthDate") ? errors.birthDate : " "}
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
                    onBlur={markTouched("lifeEvent")}
                    fullWidth
                    error={shouldShowError("lifeEvent")}
                    helperText={shouldShowError("lifeEvent") ? errors.lifeEvent : " "}
                  >
                    <MenuItem value="Απώλεια">Απώλεια</MenuItem>
                    <MenuItem value="Εύρεση">Εύρεση</MenuItem>
                    <MenuItem value="Μεταβίβαση">Μεταβίβαση</MenuItem>
                    <MenuItem value="Υιοθεσία">Υιοθεσία</MenuItem>
                    <MenuItem value="Αναδοχή">Αναδοχή</MenuItem>
                  </TextField>

                  {isLoss && (
                    <>
                      <Box>
                        <Button
                          component="label"
                          variant="outlined"
                          fullWidth
                          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                          color={shouldShowError("lossPhoto") ? "error" : "primary"}
                        >
                          {form.lossPhoto ? `Επιλεγμένη φωτο: ${form.lossPhoto.name}` : "* Ανέβασμα φωτογραφίας"}
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            onBlur={markTouched("lossPhoto")}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setForm((f) => ({ ...f, lossPhoto: file }));
                              setErrors((prev) => ({ ...prev, lossPhoto: undefined }));
                            }}
                          />
                        </Button>

                        {shouldShowError("lossPhoto") ? (
                          <Typography variant="caption" color="error">
                            {errors.lossPhoto}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Υποχρεωτικό για δήλωση απώλειας
                          </Typography>
                        )}

                        {form.lossPhoto && (
                          <Box
                            component="img"
                            alt="preview"
                            src={URL.createObjectURL(form.lossPhoto)}
                            sx={{
                              mt: 1,
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                        )}
                      </Box>

                      <TextField
                        label="* Περιοχή απώλειας"
                        value={form.lossArea}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, lossArea: e.target.value }));
                          setErrors((prev) => ({ ...prev, lossArea: undefined }));
                        }}
                        onBlur={markTouched("lossArea")}
                        fullWidth
                        error={shouldShowError("lossArea")}
                        helperText={shouldShowError("lossArea") ? errors.lossArea : " "}
                      />

                      <TextField
                        label="Λεπτομέρειες (προαιρετικό)"
                        value={form.lossDetails}
                        onChange={(e) => setForm((f) => ({ ...f, lossDetails: e.target.value }))}
                        onBlur={markTouched("lossDetails")}
                        fullWidth
                        multiline
                        minRows={3}
                        helperText=" "
                      />
                    </>
                  )}

                  {needsAfm && (
                    <TextField
                      label="* ΑΦΜ Ιδιοκτήτη"
                      value={form.ownerAfm}
                      onChange={setField("ownerAfm")}
                      onBlur={markTouched("ownerAfm")}
                      fullWidth
                      error={shouldShowError("ownerAfm")}
                      helperText={
                        shouldShowError("ownerAfm")
                          ? errors.ownerAfm
                          : "Απαιτείται για Υιοθεσία/Αναδοχή/Μεταβίβαση"
                      }
                    />
                  )}

                  <Stack direction="row" justifyContent="center" spacing={2} sx={{ pt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        clearMsg();
                        setSubmitAttempted(true);

                        const e = validateForm(form);
                        setErrors(e);

                        setTouched((t) => ({
                          ...t,
                          microchip: true,
                          species: true,
                          sex: true,
                          name: true,
                          birthDate: true,
                          lifeEvent: true,
                          ownerAfm: true,
                          lossPhoto: true,
                          lossArea: true,
                          lossDetails: true,
                        }));

                        if (Object.keys(e).length > 0) {
                          showMsg("error", "Συμπλήρωσε όλα τα υποχρεωτικά πεδία.");
                          return;
                        }

                        setStep(1);
                      }}
                      sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, px: 4 }}
                      disabled={saving}
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

            {/* STEP 2 */}
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

                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
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

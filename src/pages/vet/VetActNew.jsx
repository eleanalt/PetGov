import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Breadcrumbs,
  Link as MLink,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const ACT_TYPES = ["Εμβολιασμός", "Στείρωση", "Χειρουργείο", "Εξέταση", "Άλλο"];

export default function VetActNew() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { user } = useAuth();

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "",
    date: "",
    notes: "",
  });

  const [snack, setSnack] = useState({ open: false, severity: "success", text: "" });
  const show = (severity, text) => setSnack({ open: true, severity, text });

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get(`/pets/${petId}`);
        setPet(p.data ?? null);

        if (p.data?.ownerId) {
          const o = await api.get(`/users/${p.data.ownerId}`);
          setOwner(o.data ?? null);
        }
      } catch (e) {
        console.error(e);
        setPet(null);
      }
    })();
  }, [petId]);

  const canSave = useMemo(() => {
    return !!pet && !!user?.id && form.type.trim() && form.date.trim();
  }, [pet, user?.id, form.type, form.date]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSave = async () => {
    if (!canSave) {
      show("error", "Συμπλήρωσε τουλάχιστον Πράξη και Ημερομηνία.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/medicalActs", {
        petId: String(pet.id),
        vetId: String(user.id),
        date: form.date,
        type: form.type,
        notes: form.notes,
        createdAt: new Date().toISOString(),
      });

      show("success", "Η ιατρική πράξη καταχωρήθηκε.");
      // πήγαινε στο ιστορικό μετά από λίγο
      setTimeout(() => navigate(`/vet/acts/history/${pet.id}`), 600);
    } catch (e) {
      console.error(e);
      show("error", "Αποτυχία καταχώρησης.");
    } finally {
      setSaving(false);
    }
  };

  if (!pet) {
    return (
      <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="error">Δεν βρέθηκε κατοικίδιο.</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ color: "text.secondary" }}>
            <MLink component={RouterLink} to="/" underline="hover" color="inherit">
              Αρχική
            </MLink>
            <MLink component={RouterLink} to="/vet/acts" underline="hover" color="inherit">
              Ιατρικές Πράξεις
            </MLink>
            <Typography color="text.primary">Νέα Ιατρική Πράξη</Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή
          </Button>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 3 }}>
                Νέα Ιατρική Πράξη
              </Typography>

              <Box sx={{ maxWidth: 820, mx: "auto", bgcolor: "grey.50", borderRadius: 3, p: 2, mb: 3 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800}>Microchip</Typography>
                    <Typography>{pet.microchip || "—"}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800}>Κατοικίδιο</Typography>
                    <Typography>{pet.name || "—"}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800}>Ιδιοκτήτης</Typography>
                    <Typography>{owner?.fullName || "—"}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ maxWidth: 820, mx: "auto" }}>
                <Stack spacing={2}>
                  <TextField select label="Πράξη *" value={form.type} onChange={setField("type")} fullWidth>
                    {ACT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Ημερομηνία *"
                    type="date"
                    value={form.date}
                    onChange={setField("date")}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="Σημειώσεις"
                    value={form.notes}
                    onChange={setField("notes")}
                    fullWidth
                    multiline
                    minRows={3}
                  />

                  <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/vet/acts/history/${pet.id}`)}
                      sx={{ textTransform: "none", borderRadius: 2, px: 4 }}
                      disabled={saving}
                    >
                      Ακύρωση
                    </Button>

                    <Button
                      variant="contained"
                      onClick={onSave}
                      sx={{ textTransform: "none", borderRadius: 2, px: 5, fontWeight: 900, bgcolor: "grey.700" }}
                      disabled={!canSave || saving}
                    >
                      Προσθήκη
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

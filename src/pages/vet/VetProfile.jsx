import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

function PhotoPlaceholder() {
  return (
    <Box
      sx={{
        width: 220,
        height: 140,
        bgcolor: "grey.300",
        borderRadius: 2,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.25) 49%, rgba(0,0,0,0.25) 51%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.25) 49%, rgba(0,0,0,0.25) 51%, transparent 52%)"
        }}
      />
    </Box>
  );
}

export default function VetProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    afm: "",
    phone: "",
    gender: "",
    education: "",
    experienceYears: "",
    clinicName: "",
    clinicAddress: ""
  });

  useEffect(() => {
    (async () => {
      try {
        // preferred: /vetProfiles/me
        const me = await api.get("/vetProfiles/me");
        setForm((prev) => ({ ...prev, ...(me.data ?? {}) }));
      } catch {
        // fallback: /vetProfiles?userId=
        try {
          const res = await api.get(`/vetProfiles?userId=${user?.id}`);
          const existing = Array.isArray(res.data) ? res.data[0] : null;
          if (existing) setForm((prev) => ({ ...prev, ...existing }));
        } catch {
          // ignore (θα μείνει άδειο)
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const onSave = async () => {
    // minimal save strategy: upsert by userId
    const payload = { ...form, userId: user?.id };

    try {
      // try me endpoint
      await api.put("/vetProfiles/me", payload);
      navigate("/vet");
      return;
    } catch {
      // fallback: find then patch/post
    }

    try {
      const res = await api.get(`/vetProfiles?userId=${user?.id}`);
      const existing = Array.isArray(res.data) ? res.data[0] : null;

      if (existing?.id) {
        await api.patch(`/vetProfiles/${existing.id}`, payload);
      } else {
        await api.post("/vetProfiles", payload);
      }
      navigate("/vet");
    } catch (e) {
      console.error(e);
      alert("Αποτυχία αποθήκευσης προφίλ.");
    }
  };

  if (loading) return null;

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
          Επεξεργασία Προφίλ
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.5} alignItems="flex-start">
                  <PhotoPlaceholder />
                  <Button variant="outlined" sx={{ textTransform: "none", borderRadius: 2 }}>
                    Αλλαγή εικόνας
                  </Button>
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Ονοματεπώνυμο" value={form.fullName} onChange={set("fullName")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Email" value={form.email} onChange={set("email")} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="ΑΦΜ" value={form.afm} onChange={set("afm")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Τηλέφωνο" value={form.phone} onChange={set("phone")} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Φύλο" value={form.gender} onChange={set("gender")} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Επίπεδο σπουδών"
                      value={form.education}
                      onChange={set("education")}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Εμπειρία (έτη)"
                      value={form.experienceYears}
                      onChange={set("experienceYears")}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Επωνυμία Ιατρείου"
                      value={form.clinicName}
                      onChange={set("clinicName")}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Διεύθυνση Ιατρείου"
                      value={form.clinicAddress}
                      onChange={set("clinicAddress")}
                    />
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/vet")}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    Ακύρωση
                  </Button>
                  <Button
                    variant="contained"
                    onClick={onSave}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                  >
                    Ολοκλήρωση επεξεργασίας
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function fmtDate(v) {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toLocaleString("el-GR");
  } catch {
    return String(v);
  }
}

export default function VetRegistrationDrafts() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const vetUserId = user?.id;

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      // json-server: φίλτρα με query params
      const params = { status: "draft" };
      if (vetUserId) params.vetUserId = vetUserId;

      const res = await api.get("/petRegistrations", { params });
      setItems(res.data ?? []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vetUserId]);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });
  }, [items]);

  const onDelete = async (id) => {
    const ok = window.confirm("Θέλεις σίγουρα να διαγράψεις την εκκρεμή καταγραφή;");
    if (!ok) return;

    try {
      await api.delete(`/petRegistrations/${id}`);
      await fetchDrafts();
    } catch (e) {
      console.error(e);
      alert("Αποτυχία διαγραφής.");
    }
  };

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
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h4" fontWeight={900}>
                  Καταγραφές σε Εκκρεμότητα
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Εδώ εμφανίζονται όλες οι καταγραφές που έχουν αποθηκευτεί ως πρόχειρο (draft).
                </Typography>
              </Box>

              <Button
                variant="contained"
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                onClick={() => navigate("/vet/registrations/new")}
              >
                Νέα καταγραφή
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
              <Typography color="text.secondary">Φόρτωση...</Typography>
            ) : sorted.length === 0 ? (
              <Typography color="text.secondary">
                Δεν υπάρχουν εκκρεμείς καταγραφές.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {sorted.map((x) => (
                  <Card key={x.id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography fontWeight={900}>
                              Μικροτσίπ: {x.microchip || "—"}
                            </Typography>
                            <Chip size="small" label="Εκκρεμεί" />
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            Είδος: {x.species || "—"} • Φύλο: {x.sex || "—"} • Όνομα: {x.name || "—"}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Συμβάν: {x.eventType || x.lifeEvent || "—"} • Τελευταία ενημέρωση:{" "}
                            {fmtDate(x.updatedAt || x.createdAt)}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                            <Button
                              startIcon={<EditIcon />}
                              variant="contained"
                              sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
                              onClick={() => navigate(`/vet/registrations/${x.id}`)}
                            >
                              Συνέχεια
                            </Button>

                            <IconButton
                              aria-label="delete"
                              onClick={() => onDelete(x.id)}
                              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

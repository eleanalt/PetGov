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
  Breadcrumbs,
  Link as MLink,
  Avatar, 
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Rating from "@mui/material/Rating";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

function avg(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((s, x) => s + (Number(x) || 0), 0) / arr.length;
}

export default function OwnerVetDetails() {
  const navigate = useNavigate();
  const { vetId } = useParams();

  const [vet, setVet] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!vetId) return;
      setLoading(true);
      try {
        const [vRes, rRes, uRes] = await Promise.all([
          api.get(`/users/${vetId}`),
          api.get("/reviews", { params: { vetId: String(vetId) } }).catch(() => api.get("/reviews")),
          api.get("/users"),
        ]);

        setVet(vRes.data || null);

        const allReviews = Array.isArray(rRes.data) ? rRes.data : [];
        const mine = allReviews.filter((r) => String(r?.vetId) === String(vetId));
        setReviews(mine);

        setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      } catch (e) {
        console.error(e);
        setVet(null);
        setReviews([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [vetId]);

  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(String(u.id), u));
    return m;
  }, [users]);

  const reviewsSorted = useMemo(() => {
    return [...(reviews || [])].sort((a, b) => {
      const da = new Date(a?.createdAt || a?.date || 0).getTime();
      const db = new Date(b?.createdAt || b?.date || 0).getTime();
      return db - da;
    });
  }, [reviews]);

  const avgRating = useMemo(() => avg(reviewsSorted.map((r) => Number(r.rating || 0))), [reviewsSorted]);
  const count = reviewsSorted.length;

  const initials = useMemo(() => {
    const name = (vet?.fullName || "Κ").trim();
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("");
  }, [vet?.fullName]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
      
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
          Ραντεβού Με Κτηνίατρο
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent>
            {loading ? (
              <Typography color="text.secondary">Φόρτωση...</Typography>
            ) : (
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
             
                <Box
                  sx={{
                    width: { xs: "100%", md: 360 },
                    height: 220,
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: "grey.200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {vet?.avatarDataUrl ? (
                    <Box
                      component="img"
                      src={vet.avatarDataUrl}
                      alt={vet?.fullName || "Κτηνίατρος"}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 96,
                        height: 96,
                        fontSize: 34,
                        fontWeight: 900,
                        bgcolor: "grey.300",
                        color: "text.primary",
                      }}
                    >
                      {initials}
                    </Avatar>
                  )}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={900}>
                    {vet?.fullName || "—"}
                  </Typography>

                  <Typography sx={{ mt: 1 }}>
                    <b>Ώρες λειτουργίας:</b> Δευτέρα - Παρασκευή / 09:00 - 18:00
                  </Typography>

                  <Typography>
                    <b>Περιοχή:</b> {vet?.clinicAddress || "—"}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography>
                    <b>Ειδικότητα:</b> {vet?.specialty || "—"}
                  </Typography>
                  <Typography>
                    <b>Εμπειρία:</b> {vet?.experienceYears != null ? `${vet.experienceYears} χρόνια` : "—"}
                  </Typography>
                  <Typography>
                    <b>Σπουδές:</b> {vet?.educationLevel || "—"}
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1 }}>
                    <Typography fontWeight={900}>Αξιολογήσεις:</Typography>
                    <Rating value={avgRating} precision={0.5} readOnly />
                    <Typography color="text.secondary">({count})</Typography>

                    <Box sx={{ flex: 1 }} />

                    <Button
                      variant="contained"
                      onClick={() => navigate(`/owner/appointments/new/${vetId}`)}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        bgcolor: "success.main",
                        px: 3,
                        "&:hover": { bgcolor: "success.dark" },
                      }}
                    >
                      Κλείσε ραντεβού
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              Κριτικές
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {reviewsSorted.length === 0 ? (
              <Typography color="text.secondary">Δεν υπάρχουν κριτικές ακόμα.</Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                {reviewsSorted.map((r) => {
                  const author = userById.get(String(r.ownerId));
                  const authorName = author?.fullName || author?.name || "Ανώνυμος";
                  const dateStr = r.createdAt
                    ? String(r.createdAt).slice(0, 10)
                    : r.date
                    ? String(r.date).slice(0, 10)
                    : "—";

                  return (
                    <Box
                      key={r.id}
                      sx={{
                        bgcolor: "grey.50",
                        borderRadius: 2,
                        p: 2,
                        border: "1px solid",
                        borderColor: "grey.200",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography fontWeight={900}>{authorName}</Typography>
                          <Rating value={Number(r.rating || 0)} readOnly />
                        </Box>
                        <Typography color="text.secondary">{dateStr}</Typography>
                      </Stack>

                      <Typography sx={{ mt: 1 }}>{r.text || r.comment || "—"}</Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

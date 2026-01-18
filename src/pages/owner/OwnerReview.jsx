import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

export default function OwnerReview() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [appointment, setAppointment] = useState(null);
  const [existing, setExisting] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const canSubmit = useMemo(() => rating >= 1 && comment.trim(), [rating, comment]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const aRes = await api.get(`/appointments/${appointmentId}`);
        const a = aRes.data || null;
        setAppointment(a);

        const rRes = await api.get("/reviews", { params: { appointmentId: String(appointmentId) } });
        const arr = Array.isArray(rRes.data) ? rRes.data : [];
        const r = arr[0] || null;
        setExisting(r);

        if (r) {
          setRating(Number(r.rating || 0));
          setComment(r.comment || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId]);

  const submit = async () => {
    setMsg({ type: "", text: "" });
    if (!user?.id) return;

    if (!appointment) {
      setMsg({ type: "error", text: "Δεν βρέθηκε ραντεβού." });
      return;
    }
    if (appointment.status !== "completed") {
      setMsg({ type: "error", text: "Η αξιολόγηση επιτρέπεται μόνο όταν το ραντεβού έχει πραγματοποιηθεί." });
      return;
    }
    if (!canSubmit) {
      setMsg({ type: "error", text: "Συμπλήρωσε βαθμολογία και σχόλιο." });
      return;
    }

    const payload = {
      vetId: String(appointment.vetId),
      ownerId: String(user.id),
      appointmentId: String(appointment.id),
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    if (existing?.id) {
      await api.patch(`/reviews/${existing.id}`, {
        rating: payload.rating,
        comment: payload.comment,
      });
      setMsg({ type: "success", text: "Η αξιολόγηση ενημερώθηκε." });
    } else {
      await api.post("/reviews", payload);
      setMsg({ type: "success", text: "Η αξιολόγηση υποβλήθηκε." });
    }

    navigate("/owner/appointments", { replace: true });
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή
        </Button>

        <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
          Αξιολόγηση Κτηνίατρου
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "grey.200" }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            {msg.text && (
              <Alert severity={msg.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
                {msg.text}
              </Alert>
            )}

            {loading ? (
              <Typography color="text.secondary">Φόρτωση...</Typography>
            ) : (
              <Stack spacing={2}>
                <Typography fontWeight={900}>Πείτε μας την γνώμη σας:</Typography>
                <TextField
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Πολύ ευχάριστη εμπειρία"
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ bgcolor: "white", borderRadius: 2 }}
                />

                <Typography fontWeight={900}>
                  Με πόσα αστεράκια θα αξιολογούσατε τον κτηνίατρο:
                </Typography>

                <Stack direction="row" justifyContent="center">
                  <Rating value={rating} onChange={(_e, v) => setRating(v || 0)} size="large" />
                </Stack>

                <Stack direction="row" justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={submit}
                    disabled={!canSubmit}
                    sx={{ textTransform: "none", borderRadius: 999, bgcolor: "grey.700", px: 4 }}
                  >
                    Υποβολή Αξιολόγησης
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

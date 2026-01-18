import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link as MLink,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const ACT_TYPES = ["Εμβολιασμός", "Κλινική Εξέταση", "Στείρωση", "Χειρουργείο", "Άλλο"];

export default function VetActDurations() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        const res = await api.get("/vetActDurations", { params: { vetId: String(user.id) } });
        const data = Array.isArray(res.data) ? res.data : [];

        const byType = new Map(data.map((d) => [d.actType, d]));
        const merged = ACT_TYPES.map((t) => byType.get(t) ?? { id: null, vetId: String(user.id), actType: t, minutes: defaultMinutes(t) });
        setRows(merged);
      } catch (e) {
        console.error(e);
        setRows(ACT_TYPES.map((t) => ({ id: null, vetId: String(user.id), actType: t, minutes: defaultMinutes(t) })));
      }
    })();
  }, [user?.id]);

  const canSave = useMemo(() => rows.every((r) => Number(r.minutes) >= 5), [rows]);

  const setMinutes = (actType) => (e) => {
    const v = e.target.value;
    setRows((prev) => prev.map((r) => (r.actType === actType ? { ...r, minutes: v } : r)));
  };

  const saveAll = async () => {
    setMsg({ type: "", text: "" });
    if (!user?.id) return;
    if (!canSave) {
      setMsg({ type: "error", text: "Βάλε τουλάχιστον 5 λεπτά για κάθε πράξη." });
      return;
    }

    setSaving(true);
    try {
      const updated = await Promise.all(
        rows.map(async (r) => {
          const payload = { vetId: String(user.id), actType: r.actType, minutes: Number(r.minutes) };
          if (r.id) {
            await api.patch(`/vetActDurations/${r.id}`, payload);
            return r;
          } else {
            const res = await api.post(`/vetActDurations`, payload);
            return res.data;
          }
        })
      );

      const byType = new Map(updated.map((u) => [u.actType, u]));
      setRows(ACT_TYPES.map((t) => byType.get(t)));
      setMsg({ type: "success", text: "Οι διάρκειες αποθηκεύτηκαν." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία αποθήκευσης." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Breadcrumbs sx={{ color: "text.secondary" }}>
            <MLink component={RouterLink} to="/" underline="hover" color="inherit">
              Αρχική
            </MLink>
            <MLink component={RouterLink} to="/vet/appointments" underline="hover" color="inherit">
              Ραντεβού
            </MLink>
            <MLink component={RouterLink} to="/vet/availability" underline="hover" color="inherit">
              Διαθεσιμότητα
            </MLink>
            <Typography color="text.primary">Διάρκειες Πράξεων</Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/vet/availability/edit")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στην Επεξεργασία Διαθεσιμότητας
          </Button>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center" }}>
                  Διάρκειες Ιατρικών Πράξεων
                </Typography>
                <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                  Ρύθμισε πόσα λεπτά διαρκεί κάθε τύπος πράξης. Αυτές οι διάρκειες θα χρησιμοποιηθούν όταν ο ιδιοκτήτης κλείνει ραντεβού.
                </Typography>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {msg.text && (
                <Alert severity={msg.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
                  {msg.text}
                </Alert>
              )}

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Πράξη</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 220 }}>Διάρκεια (λεπτά)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.actType}>
                      <TableCell>{r.actType}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={r.minutes}
                          onChange={setMinutes(r.actType)}
                          inputProps={{ min: 5, step: 5 }}
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={saveAll}
                  disabled={saving || !canSave}
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900, px: 6 }}
                >
                  Αποθήκευση
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

function defaultMinutes(type) {
  if (type === "Εμβολιασμός") return 20;
  if (type === "Κλινική Εξέταση") return 30;
  if (type === "Στείρωση") return 60;
  if (type === "Χειρουργείο") return 90;
  return 30;
}

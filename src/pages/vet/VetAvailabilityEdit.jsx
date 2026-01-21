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
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

/** helpers */
function timeToMin(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Δημιουργεί ISO datetime από date(yyyy-mm-dd) + time(HH:mm) σε local timezone
 * και επιστρέφει toISOString() (UTC) για αποθήκευση
 */
function toIsoFromLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
}

function isPastIso(iso) {
  if (!iso) return false;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return false;
  return dt.getTime() < Date.now();
}

function fmtDate(yyyy_mm_dd) {
  if (!yyyy_mm_dd) return "—";
  const [y, m, d] = String(yyyy_mm_dd).split("-");
  if (!y || !m || !d) return String(yyyy_mm_dd);
  return `${d}/${m}/${y}`;
}

export default function VetAvailabilityEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blocks, setBlocks] = useState([]);
  const [durations, setDurations] = useState([]); // from DB
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "10:00",
    endTime: "14:00",
  });

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadBlocks = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get("/vetAvailability", { params: { vetId: String(user.id) } });
      const arr = Array.isArray(res.data) ? res.data : [];

      const futureOnly = arr.filter((b) => {
        const endAt =
          b.endAt ||
          (b.date && b.endTime ? toIsoFromLocal(b.date, b.endTime) : "");
        return endAt ? !isPastIso(endAt) : true;
      });

      setBlocks(futureOnly);
    } catch (e) {
      console.error(e);
      setBlocks([]);
    }
  };

  const loadDurations = async () => {
    if (!user?.id) return;
    try {
      const res = await api.get("/vetActDurations", { params: { vetId: String(user.id) } });
      setDurations(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setDurations([]);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [user?.id]);

  useEffect(() => {
    loadDurations();
  }, [user?.id]);

  useEffect(() => {
    const t = setInterval(() => {
      loadBlocks();
    }, 60 * 1000);
    return () => clearInterval(t);
  }, [user?.id]);

  const sorted = useMemo(() => {
    return [...blocks].sort((a, b) =>
      (`${a.date} ${a.startTime}`).localeCompare(`${b.date} ${b.startTime}`)
    );
  }, [blocks]);

  const minActMinutes = useMemo(() => {
    if (!durations.length) return 0;
    return Math.min(...durations.map((d) => Number(d.minutes) || 0).filter(Boolean));
  }, [durations]);

  const addBlock = async () => {
    setMsg({ type: "", text: "" });
    if (!user?.id) return;

    const { date, startTime, endTime } = form;

    if (!date || !startTime || !endTime) {
      setMsg({ type: "error", text: "Συμπλήρωσε ημερομηνία και ώρες." });
      return;
    }

    if (date < today) {
      setMsg({ type: "error", text: "Δεν μπορείς να δηλώσεις block σε παρελθοντική ημερομηνία." });
      return;
    }

    if (timeToMin(endTime) <= timeToMin(startTime)) {
      setMsg({ type: "error", text: "Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης." });
      return;
    }

    const startAt = toIsoFromLocal(date, startTime);
    const endAt = toIsoFromLocal(date, endTime);

    if (!startAt || !endAt) {
      setMsg({ type: "error", text: "Λάθος μορφή ημερομηνίας/ώρας." });
      return;
    }

    if (isPastIso(startAt)) {
      setMsg({ type: "error", text: "Η ώρα έναρξης είναι στο παρελθόν. Διάλεξε μελλοντική ώρα." });
      return;
    }

    if (minActMinutes > 0 && timeToMin(endTime) - timeToMin(startTime) < minActMinutes) {
      setMsg({
        type: "error",
        text: `Το block πρέπει να είναι τουλάχιστον ${minActMinutes} λεπτά (με βάση τις διάρκειες πράξεων).`,
      });
      return;
    }

    const overlaps = (blocks || []).some((b) => {
      if (String(b.vetId) !== String(user.id)) return false;
      if (String(b.date) !== String(date)) return false;

      const aStart = timeToMin(startTime);
      const aEnd = timeToMin(endTime);

      const bStart = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);

      // overlap: [aStart,aEnd) with [bStart,bEnd)
      return aStart < bEnd && bStart < aEnd;
    });

    if (overlaps) {
      setMsg({ type: "error", text: "Αυτό το block επικαλύπτεται με άλλο block διαθεσιμότητας." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vetId: String(user.id),
        date,
        startTime,
        endTime,
     
        startAt,
        endAt,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await api.post("/vetAvailability", payload);

      setMsg({ type: "success", text: "Η διαθεσιμότητα προστέθηκε." });
      await loadBlocks();
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία προσθήκης διαθεσιμότητας." });
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (id) => {
    setMsg({ type: "", text: "" });
    setSaving(true);
    try {
      await api.delete(`/vetAvailability/${id}`);
      setBlocks((prev) => prev.filter((x) => x.id !== id));
      setMsg({ type: "success", text: "Η διαθεσιμότητα διαγράφηκε." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία διαγραφής." });
    } finally {
      setSaving(false);
    }
  };

  const cleanupPastBlocks = async () => {
    if (!user?.id) return;
    setMsg({ type: "", text: "" });
    setSaving(true);
    try {
      const res = await api.get("/vetAvailability", { params: { vetId: String(user.id) } });
      const arr = Array.isArray(res.data) ? res.data : [];

      const past = arr.filter((b) => {
        const endAt =
          b.endAt ||
          (b.date && b.endTime ? toIsoFromLocal(b.date, b.endTime) : "");
        return endAt ? isPastIso(endAt) : false;
      });

      await Promise.all(past.map((b) => api.delete(`/vetAvailability/${b.id}`)));

      setMsg({ type: "success", text: "Καθαρίστηκαν τα παλιά blocks." });
      await loadBlocks();
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία καθαρισμού παλιών blocks." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
         

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/vet/availability")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στη Διαθεσιμότητα
          </Button>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center" }}>
                  Επεξεργασία Διαθεσιμότητας
                </Typography>
                <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                  Δήλωσε blocks μόνο σε <b>μελλοντικές</b> ημερομηνίες/ώρες. Όσα blocks έχουν περάσει δεν εμφανίζονται.
                </Typography>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* durations + button */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/vet/availability/durations")}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Ρύθμιση διάρκειας πράξεων
                </Button>
              </Box>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", mb: 2 }}>
                {durations.length === 0 ? (
                  <Chip label="Δεν έχουν οριστεί διάρκειες πράξεων" variant="outlined" />
                ) : (
                  durations.map((d) => (
                    <Chip key={d.id ?? d.actType} label={`${d.actType}: ${d.minutes}’`} />
                  ))
                )}
              </Box>

              {msg.text && (
                <Alert severity={msg.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
                  {msg.text}
                </Alert>
              )}

              {/* Form */}
              <Box sx={{ maxWidth: 720, mx: "auto" }}>
                <Stack spacing={2}>
                  <TextField
                    type="date"
                    label="Ημερομηνία"
                    value={form.date}
                    onChange={setField("date")}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: today }} 
                    fullWidth
                  />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      type="time"
                      label="Ώρα έναρξης"
                      value={form.startTime}
                      onChange={setField("startTime")}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                    <TextField
                      type="time"
                      label="Ώρα λήξης"
                      value={form.endTime}
                      onChange={setField("endTime")}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={addBlock}
                    disabled={saving}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900, py: 1.3 }}
                  >
                    Προσθήκη block διαθεσιμότητας
                  </Button>

                  <Button
                    variant="text"
                    onClick={cleanupPastBlocks}
                    disabled={saving}
                    sx={{ textTransform: "none", width: "fit-content", mx: "auto" }}
                  >
                    Καθαρισμός παλιών blocks
                  </Button>

                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                    Παράδειγμα: Αν βάλεις 10:00–14:00, τότε για “Κλινική Εξέταση (30’)” θα μπορούν να εμφανιστούν start times όπως 10:00, 10:30, 11:00 κ.ο.κ.
                  </Typography>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Table */}
              <Typography fontWeight={900} sx={{ mb: 1 }}>
                Τα blocks διαθεσιμότητάς μου (μελλοντικά)
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Ημερομηνία</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Από</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Έως</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Διάρκεια</TableCell>
                    <TableCell sx={{ fontWeight: 900 }} align="right">
                      Ενέργεια
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                        Δεν υπάρχουν blocks διαθεσιμότητας.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((b) => {
                      const dur = timeToMin(b.endTime) - timeToMin(b.startTime);
                      return (
                        <TableRow key={b.id}>
                          <TableCell>{fmtDate(b.date)}</TableCell>
                          <TableCell>{b.startTime}</TableCell>
                          <TableCell>{b.endTime}</TableCell>
                          <TableCell>{dur}’</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="text"
                              color="error"
                              onClick={() => removeBlock(b.id)}
                              disabled={saving}
                              sx={{ textTransform: "none", fontWeight: 900 }}
                            >
                              Διαγραφή
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

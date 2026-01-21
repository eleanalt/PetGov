import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  InputAdornment,
} from "@mui/material";
import Rating from "@mui/material/Rating";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

const SERVICES = ["", "Εμβόλιο", "Τακτικός Έλεγχος", "Στείρωση", "Καταγραφή Ζώου"];

const SERVICE_DURATION_MINUTES = {
  "Εμβόλιο": 40,
  "Τακτικός Έλεγχος": 30,
  "Στείρωση": 90,
  "Καταγραφή Ζώου": 20,
};
const DEFAULT_DURATION = 30;

function avg(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((s, x) => s + (Number(x) || 0), 0) / arr.length;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm || "").split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  // [start,end)
  return aStart < bEnd && bStart < aEnd;
}

function dateKeyFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function timeHHMMFromISO(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}

export default function OwnerVetSearch() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [vets, setVets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState([]); 
  const [appointments, setAppointments] = useState([]); 
const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [filters, setFilters] = useState({
    area: "",
    service: "",
    date: "", // YYYY-MM-DD
    time: "", // HH:MM
  });

  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [uRes, rRes, aRes, apRes] = await Promise.all([
          api.get("/users", { params: { role: "vet" } }),
          api.get("/reviews"),
          api.get("/vetAvailability"),
          api.get("/appointments"),
        ]);

        setVets(Array.isArray(uRes.data) ? uRes.data : []);
        setReviews(Array.isArray(rRes.data) ? rRes.data : []);
        setAvailability(Array.isArray(aRes.data) ? aRes.data : []);
        setAppointments(Array.isArray(apRes.data) ? apRes.data : []);
      } catch (e) {
        console.error(e);
        setVets([]);
        setReviews([]);
        setAvailability([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ratingByVetId = useMemo(() => {
    const m = new Map();
    for (const r of reviews) {
      const vid = String(r?.vetId ?? "");
      if (!vid) continue;
      if (!m.has(vid)) m.set(vid, []);
      m.get(vid).push(r);
    }
    return m;
  }, [reviews]);

 
  const availabilityByVetDate = useMemo(() => {
    const m = new Map(); 
    (availability || [])
      .filter((b) => (b.status ? b.status === "open" : true))
      .forEach((b) => {
        const vid = String(b.vetId ?? "");
        const date = String(b.date ?? "");
        if (!vid || !date) return;
        const key = `${vid}|${date}`;
        if (!m.has(key)) m.set(key, []);
        m.get(key).push(b);
      });
    return m;
  }, [availability]);

  const takenByVetDate = useMemo(() => {
    const m = new Map(); // key -> [{startMin,endMin}]
    (appointments || [])
      .filter((a) => a && (a.status === "pending" || a.status === "confirmed"))
      .forEach((a) => {
        const vid = String(a.vetId ?? "");
        if (!vid) return;

        const day = dateKeyFromISO(a.datetime);
        if (!day) return;

        const startHHMM = timeHHMMFromISO(a.datetime);
        const startMin = toMinutes(startHHMM);
        if (!Number.isFinite(startMin)) return;

        const dur =
          Number(a.durationMin) ||
          SERVICE_DURATION_MINUTES[a.service] ||
          DEFAULT_DURATION;

        const endMin = startMin + dur;

        const key = `${vid}|${day}`;
        if (!m.has(key)) m.set(key, []);
        m.get(key).push({ startMin, endMin });
      });

    return m;
  }, [appointments]);

  const selectedDuration = useMemo(() => {
    return SERVICE_DURATION_MINUTES[filters.service] || DEFAULT_DURATION;
  }, [filters.service]);

  const vetMatchesDateTime = (vetId, date, time) => {
    const dateStr = String(date || "");
    if (!dateStr) return true; // no date filter

    const key = `${String(vetId)}|${dateStr}`;
    const blocks = availabilityByVetDate.get(key) || [];
    if (blocks.length === 0) return false;

    if (!time) return true;

    const t0 = toMinutes(time);
    if (!Number.isFinite(t0)) return true;

    const t1 = t0 + selectedDuration;

    // must be inside at least one availability block
    const insideSomeBlock = blocks.some((b) => {
      const s = toMinutes(b.startTime || "00:00");
      const e = toMinutes(b.endTime || "00:00");
      if (!Number.isFinite(s) || !Number.isFinite(e)) return false;
      return t0 >= s && t1 <= e;
    });

    if (!insideSomeBlock) return false;

    // and must not overlap existing appointments
    const taken = takenByVetDate.get(key) || [];
    const conflicts = taken.some((iv) => overlaps(t0, t1, iv.startMin, iv.endMin));

    return !conflicts;
  };

  const filteredVets = useMemo(() => {
    const area = filters.area.trim().toLowerCase();
    const service = filters.service.trim();
    const date = filters.date;
    const time = filters.time;

    return (vets || []).filter((v) => {
      const address = String(v?.clinicAddress || "").toLowerCase();
      const okArea = !area || address.includes(area);

      // (προαιρετικό) service filter: αν δεν έχεις capabilities στη βάση, δεν φιλτράρει.
      // Αν αργότερα βάλεις π.χ. v.services = ["Εμβόλιο", ...], τότε άλλαξε το okService.
      const okService = !service || true;

      // αν υπάρχει ώρα αλλά ΔΕΝ υπάρχει ημερομηνία -> δεν έχει νόημα, άρα μην φιλτράρεις με ώρα
      const okDateTime = time && !date ? true : vetMatchesDateTime(v.id, date, time);

      return okArea && okService && okDateTime;
    });
  }, [vets, filters.area, filters.service, filters.date, filters.time, availabilityByVetDate, takenByVetDate, selectedDuration]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
          Ραντεβού Με Κτηνίατρο
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <TextField
                value={filters.area}
                onChange={setF("area")}
                placeholder="π.χ. Αθήνα"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ opacity: 0.6 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth>
                <InputLabel id="svc">Υπηρεσία (προαιρετικό)</InputLabel>
                <Select
                  labelId="svc"
                  label="Υπηρεσία (προαιρετικό)"
                  value={filters.service}
                  onChange={setF("service")}
                >
                  {SERVICES.map((s) => (
                    <MenuItem key={s || "all"} value={s}>
                      {s || "Όλες"}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
  label="Ημερομηνία"
  type="date"
  value={filters.date}
  onChange={setF("date")}
  InputLabelProps={{ shrink: true }}
  inputProps={{ min: today }}  
  fullWidth
/>


              <TextField
                label="Ώρα"
                type="time"
                value={filters.time}
                onChange={setF("time")}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Button
                variant="contained"
                sx={{ textTransform: "none", borderRadius: 4, px: 4, bgcolor: "grey.800", "&:hover": { bgcolor: "grey.900" } }}
                onClick={() => {}}
              >
                Αναζήτηση
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {loading ? (
              <Typography color="text.secondary">Φόρτωση...</Typography>
            ) : filteredVets.length === 0 ? (
              <Typography color="text.secondary">Δεν βρέθηκαν κτηνίατροι.</Typography>
            ) : (
              <Stack spacing={2}>
                {filteredVets.map((v) => {
                  const list = ratingByVetId.get(String(v.id)) || [];
                  const avgRating = avg(list.map((x) => Number(x.rating || 0)));
                  const count = list.length;

                  return (
                    <Box
                      key={v.id}
                      sx={{
                        bgcolor: "grey.100",
                        borderRadius: 3,
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography fontWeight={900}>{v.fullName || "—"}</Typography>
                        <Typography color="text.secondary">
                          {v.clinicName || "—"} • {v.clinicAddress || "—"}
                        </Typography>
                        <Typography color="text.secondary">
                          {v.educationLevel || "—"} • {v.experienceYears ?? "—"} χρόνια εμπειρίας
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Rating value={avgRating} precision={0.5} readOnly />
                          <Typography color="text.secondary">({count})</Typography>
                        </Stack>

                        <Button
                          variant="contained"
                          onClick={() => navigate(`/owner/appointments/vet/${v.id}`)}
                          sx={{
                            textTransform: "none",
                            borderRadius: 999,
                            bgcolor: "success.main",
                            "&:hover": { bgcolor: "success.dark" },
                          }}
                        >
                          Προβολή
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

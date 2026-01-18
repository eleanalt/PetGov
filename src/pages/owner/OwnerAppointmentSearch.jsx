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
} from "@mui/material";
import Rating from "@mui/material/Rating";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

const SERVICES = ["", "Εμβόλιο", "Τακτικός Έλεγχος", "Στείρωση", "Καταγραφή Ζώου"];

function avg(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((s, x) => s + (Number(x) || 0), 0) / arr.length;
}

export default function OwnerVetSearch() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [vets, setVets] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [filters, setFilters] = useState({
    area: "",
    service: "",
    date: "",
    time: "",
  });

  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {

        const [uRes, rRes] = await Promise.all([
          api.get("/users", { params: { role: "vet" } }),
          api.get("/reviews"),
        ]);

        setVets(Array.isArray(uRes.data) ? uRes.data : []);
        setReviews(Array.isArray(rRes.data) ? rRes.data : []);
      } catch (e) {
        console.error(e);
        setVets([]);
        setReviews([]);
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

  const filteredVets = useMemo(() => {
    const area = filters.area.trim().toLowerCase();
    const service = filters.service.trim();

    return (vets || []).filter((v) => {
      const address = String(v?.clinicAddress || "").toLowerCase();
      const okArea = !area || address.includes(area);

      const okService = !service || true;

      return okArea && okService;
    });
  }, [vets, filters.area, filters.service]);

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
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} /> }}
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
                sx={{ textTransform: "none", borderRadius: 2, bgcolor: "grey.700", px: 3 }}
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
                          <Typography color="text.secondary">
                            ({count})
                          </Typography>
                        </Stack>

                        <Button
                          variant="contained"
                          onClick={() => navigate(`/owner/appointments/vet/${v.id}`)}
                          sx={{
                            textTransform: "none",
                            borderRadius: 999,
                            bgcolor: "grey.700",
                            "&:hover": { bgcolor: "grey.800" },
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

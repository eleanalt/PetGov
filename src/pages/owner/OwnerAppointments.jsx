import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import VetBreadcrumbs from "../../components/OwnerBreadcrumbs";

const STATUS_META = {
  pending: { label: "Εκκρεμές", color: "default" },
  confirmed: { label: "Επιβεβαιωμένο", color: "success" },
  cancelled: { label: "Ακυρωμένο", color: "default" },
  rejected: { label: "Απορρίφθηκε", color: "default" },
  completed: { label: "Πραγματοποιήθηκε", color: "info" },
};

function fmtDate(dateStr) {
  if (!dateStr) return "—";

  const [y, m, d] = String(dateStr).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function fmtApptWhen(a) {
  if (a?.date && a?.time) return `${fmtDate(a.date)} ${a.time}`;
  if (a?.date) return `${fmtDate(a.date)}`;

  if (a?.datetime) {
    const dt = new Date(a.datetime);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const hh = String(dt.getHours()).padStart(2, "0");
    const mi = String(dt.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  }

  return "—";
}

export default function OwnerAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [vetsById, setVetsById] = useState({});
  const [petsById, setPetsById] = useState({});

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [aRes, vRes, pRes] = await Promise.all([
  api.get("/appointments", {
    params: { ownerId: String(user.id), _sort: "updatedAt", _order: "desc" },
  }),
  api.get("/users", { params: { role: "vet" } }),
  api.get("/pets", { params: { ownerId: String(user.id) } }),
]);

const vets = Array.isArray(vRes.data) ? vRes.data : [];
setVetsById(Object.fromEntries(vets.map((v) => [String(v.id), v])));
      const pets = Array.isArray(pRes.data) ? pRes.data : [];
      setVetsById(Object.fromEntries(vets.map((v) => [String(v.id), v])));
      setPetsById(Object.fromEntries(pets.map((p) => [String(p.id), p])));

      setAppointments(Array.isArray(aRes.data) ? aRes.data : []);
    } catch (e) {
      console.error(e);
      setAppointments([]);
      setVetsById({});
      setPetsById({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const canCancel = (a) => a?.status === "pending" || a?.status === "confirmed";
  const canReview = (a) => a?.status === "completed";

  const cancelAppointment = async (a) => {
    if (!a?.id) return;
    if (!canCancel(a)) return;

    try {
      const now = new Date().toISOString();
      await api.patch(`/appointments/${a.id}`, {
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: "owner",
        updatedAt: now,
      });
      await load();
    } catch (e) {
      console.error(e);
      alert("Αποτυχία ακύρωσης. Δοκίμασε ξανά.");
    }
  };

  const grouped = useMemo(() => {
    const list = Array.isArray(appointments) ? appointments : [];
    const upcoming = list.filter((a) => a.status === "pending" || a.status === "confirmed");
    const history = list.filter(
      (a) => a.status === "cancelled" || a.status === "completed" || a.status === "rejected"
    );
    return { upcoming, history };
  }, [appointments]);

  const serviceLabel = (a) => a?.actType || a?.service || "—";

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={900}>
            Τα ραντεβού μου
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/owner/appointments/new")}
            sx={{ textTransform: "none", borderRadius: 2, bgcolor: "grey.700" }}
          >
            Νέο Ραντεβού
          </Button>
        </Stack>

        {/* Ενεργά */}
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              Ενεργά ραντεβού
            </Typography>

            <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>Ημερομηνία</b></TableCell>
                    <TableCell><b>Υπηρεσία</b></TableCell>
                    <TableCell><b>Κατοικίδιο</b></TableCell>
                    <TableCell><b>Κτηνίατρος</b></TableCell>
                    <TableCell><b>Κατάσταση</b></TableCell>
                    <TableCell><b>Ενέργειες</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6}>Φόρτωση...</TableCell></TableRow>
                  ) : grouped.upcoming.length === 0 ? (
                    <TableRow><TableCell colSpan={6}>Δεν υπάρχουν ενεργά ραντεβού.</TableCell></TableRow>
                  ) : (
                    grouped.upcoming.map((a) => {
                      const st = STATUS_META[a.status] || STATUS_META.pending;
                      const vet = vetsById[String(a.vetId)];
                      const pet = petsById[String(a.petId)];
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{fmtApptWhen(a)}</TableCell>
                          <TableCell>{serviceLabel(a)}</TableCell>
                          <TableCell>{pet?.name || "—"}</TableCell>
                          <TableCell>{vet?.fullName || "—"}</TableCell>
                          <TableCell>
                            <Chip size="small" label={st.label} color={st.color} />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                onClick={() => navigate(`/owner/appointments/vet/${a.vetId}`)}
                                sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2 }}
                                endIcon={<ArrowForwardIcon />}
                              >
                                Προβολή
                              </Button>
                              <Button
                                disabled={!canCancel(a)}
                                onClick={() => cancelAppointment(a)}
                                sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2 }}
                              >
                                Ακύρωση
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>

        {/* Ιστορικό */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              Ιστορικό
            </Typography>

            <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>Ημερομηνία</b></TableCell>
                    <TableCell><b>Υπηρεσία</b></TableCell>
                    <TableCell><b>Κατοικίδιο</b></TableCell>
                    <TableCell><b>Κτηνίατρος</b></TableCell>
                    <TableCell><b>Κατάσταση</b></TableCell>
                    <TableCell><b>Ενέργειες</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6}>Φόρτωση...</TableCell></TableRow>
                  ) : grouped.history.length === 0 ? (
                    <TableRow><TableCell colSpan={6}>Δεν υπάρχει ιστορικό.</TableCell></TableRow>
                  ) : (
                    grouped.history.map((a) => {
                      const st = STATUS_META[a.status] || STATUS_META.pending;
                      const vet = vetsById[String(a.vetId)];
                      const pet = petsById[String(a.petId)];
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{fmtApptWhen(a)}</TableCell>
                          <TableCell>{serviceLabel(a)}</TableCell>
                          <TableCell>{pet?.name || "—"}</TableCell>
                          <TableCell>{vet?.fullName || "—"}</TableCell>
                          <TableCell>
                            <Chip size="small" label={st.label} color={st.color} />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                onClick={() => navigate(`/owner/appointments/vet/${a.vetId}`)}
                                sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2 }}
                              >
                                Προβολή
                              </Button>
                              <Button
                                disabled={!canReview(a)}
                                onClick={() => navigate(`/owner/appointments/review/${a.id}`)}
                                sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2 }}
                              >
                                Αφήστε μια κριτική
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import VetBreadcrumbs from "../../components/OwnerBreadcrumbs";

const STATUS_META = {
  pending: { label: "Εκκρεμές", color: "warning" },
  confirmed: { label: "Επιβεβαιωμένο", color: "success" },
  cancelled: { label: "Ακυρωμένο", color: "error" },
  rejected: { label: "Απορρίφθηκε", color: "error" },
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


function getApptDateObj(a) {
  if (!a) return null;

  if (a.datetime) {
    const dt = new Date(a.datetime);
    return isNaN(dt.getTime()) ? null : dt;
  }

  if (a.date && a.time) {
    const dt = new Date(`${a.date}T${a.time}:00`);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // Αν έχει μόνο date -> τέλος ημέρας
  if (a.date) {
    const dt = new Date(`${a.date}T23:59:59`);
    return isNaN(dt.getTime()) ? null : dt;
  }

  return null;
}

export default function OwnerAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [vetsById, setVetsById] = useState({});
  const [petsById, setPetsById] = useState({});

 
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

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
      const pets = Array.isArray(pRes.data) ? pRes.data : [];
      const appts = Array.isArray(aRes.data) ? aRes.data : [];

      setVetsById(Object.fromEntries(vets.map((v) => [String(v.id), v])));
      setPetsById(Object.fromEntries(pets.map((p) => [String(p.id), p])));

      
      const now = new Date();
      const nowIso = new Date().toISOString();

      const toCancel = appts.filter((a) => {
        if (a?.status !== "pending") return false;
        const dt = getApptDateObj(a);
        if (!dt) return false;
        return dt.getTime() < now.getTime();
      });

      const toComplete = appts.filter((a) => {
        if (a?.status !== "confirmed") return false;
        const dt = getApptDateObj(a);
        if (!dt) return false;
        return dt.getTime() < now.getTime();
      });

      if (toCancel.length || toComplete.length) {
        await Promise.all([
          ...toCancel.map((a) =>
            api.patch(`/appointments/${a.id}`, {
              status: "cancelled",
              cancelledAt: nowIso,
              cancelledBy: "system",
              updatedAt: nowIso,
            })
          ),
          ...toComplete.map((a) =>
            api.patch(`/appointments/${a.id}`, {
              status: "completed",
              completedAt: nowIso,
              updatedAt: nowIso,
            })
          ),
        ]);

        const cancelIds = new Set(toCancel.map((x) => String(x.id)));
        const completeIds = new Set(toComplete.map((x) => String(x.id)));

        const patched = appts.map((a) => {
          const id = String(a.id);
          if (cancelIds.has(id)) {
            return {
              ...a,
              status: "cancelled",
              cancelledAt: nowIso,
              cancelledBy: "system",
              updatedAt: nowIso,
            };
          }
          if (completeIds.has(id)) {
            return { ...a, status: "completed", completedAt: nowIso, updatedAt: nowIso };
          }
          return a;
        });

        setAppointments(patched);
      } else {
        setAppointments(appts);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const canCancel = (a) => a?.status === "pending" || a?.status === "confirmed";
  const canReview = (a) => a?.status === "completed";

  const askCancelAppointment = (a) => {
    if (!a?.id) return;
    if (!canCancel(a)) return;
    setCancelTarget(a);
    setCancelDialogOpen(true);
  };

 
  const confirmCancelAppointment = async () => {
    const a = cancelTarget;
    if (!a?.id) return;
    if (!canCancel(a)) return;

    setCancelling(true);
    try {
      const now = new Date().toISOString();
      await api.patch(`/appointments/${a.id}`, {
        status: "cancelled",
        cancelledAt: now,
        cancelledBy: "owner",
        updatedAt: now,
      });
      setCancelDialogOpen(false);
      setCancelTarget(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Αποτυχία ακύρωσης. Δοκίμασε ξανά.");
    } finally {
      setCancelling(false);
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
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Νέο Ραντεβού
          </Button>
        </Stack>

    
        <Dialog
          open={cancelDialogOpen}
          onClose={() => {
            if (cancelling) return;
            setCancelDialogOpen(false);
            setCancelTarget(null);
          }}
        >
          <DialogTitle>Ακύρωση ραντεβού</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Σίγουρα θέλετε να ακυρώσετε το ραντεβού
              {cancelTarget ? ` (${fmtApptWhen(cancelTarget)})` : ""};
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                if (cancelling) return;
                setCancelDialogOpen(false);
                setCancelTarget(null);
              }}
              sx={{ textTransform: "none" }}
              disabled={cancelling}
            >
              Όχι
            </Button>
            <Button
              onClick={confirmCancelAppointment}
              variant="contained"
              color="error"
              sx={{ textTransform: "none" }}
              disabled={cancelling}
            >
              Ναι, ακύρωση
            </Button>
          </DialogActions>
        </Dialog>

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
                    <TableCell>
                      <b>Ημερομηνία</b>
                    </TableCell>
                    <TableCell>
                      <b>Υπηρεσία</b>
                    </TableCell>
                    <TableCell>
                      <b>Κατοικίδιο</b>
                    </TableCell>
                    <TableCell>
                      <b>Κτηνίατρος</b>
                    </TableCell>
                    <TableCell>
                      <b>Κατάσταση</b>
                    </TableCell>
                    <TableCell>
                      <b>Ενέργειες</b>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>Φόρτωση...</TableCell>
                    </TableRow>
                  ) : grouped.upcoming.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>Δεν υπάρχουν ενεργά ραντεβού.</TableCell>
                    </TableRow>
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
                                onClick={() => askCancelAppointment(a)}
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
                    <TableCell>
                      <b>Ημερομηνία</b>
                    </TableCell>
                    <TableCell>
                      <b>Υπηρεσία</b>
                    </TableCell>
                    <TableCell>
                      <b>Κατοικίδιο</b>
                    </TableCell>
                    <TableCell>
                      <b>Κτηνίατρος</b>
                    </TableCell>
                    <TableCell>
                      <b>Κατάσταση</b>
                    </TableCell>
                    <TableCell>
                      <b>Ενέργειες</b>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6}>Φόρτωση...</TableCell>
                    </TableRow>
                  ) : grouped.history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>Δεν υπάρχει ιστορικό.</TableCell>
                    </TableRow>
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

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Breadcrumbs,
  Link as MLink,
  Tabs,
  Tab,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function a11yProps(index) {
  return { id: `appt-tab-${index}`, "aria-controls": `appt-tabpanel-${index}` };
}

const STATUS_LABEL = {
  pending: { label: "Εκκρεμές", color: "default" },
  confirmed: { label: "Επιβεβαιωμένο", color: "success" },
  completed: { label: "Πραγματοποιήθηκε", color: "info" },
  cancelled: { label: "Ακυρωμένο", color: "default" },
  rejected: { label: "Απορρίφθηκε", color: "default" },
};

function StatusChip({ status }) {
  const st = STATUS_LABEL[status] || { label: status || "—", color: "default" };
  return <Chip label={st.label} color={st.color} size="small" sx={{ textTransform: "none" }} />;
}

export default function VetAppointments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const vetId = user?.id;

  const refresh = async () => {
    if (!vetId) return;
    setLoading(true);
    try {
      let apRes;
      try {
        apRes = await api.get("/appointments", { params: { vetId: String(vetId) } });
      } catch {
        apRes = await api.get("/appointments");
      }

      const [petsRes, usersRes] = await Promise.all([api.get("/pets"), api.get("/users")]);

      const all = Array.isArray(apRes.data) ? apRes.data : [];
      const mine = all.filter((a) => String(a.vetId) === String(vetId));

      setAppointments(mine);
      setPets(Array.isArray(petsRes.data) ? petsRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    } catch (e) {
      console.error(e);
      setAppointments([]);
      setPets([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [vetId]);

  const petById = useMemo(() => {
    const m = new Map();
    pets.forEach((p) => m.set(String(p.id), p));
    return m;
  }, [pets]);

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(String(u.id), u));
    return m;
  }, [users]);

  const rows = useMemo(() => {
    const pending = appointments.filter((a) => a.status === "pending");
    const confirmed = appointments.filter((a) => a.status === "confirmed");
    const completed = appointments.filter((a) => a.status === "completed");
    const cancelled = appointments.filter((a) => a.status === "cancelled" || a.status === "rejected");
    return { pending, confirmed, completed, cancelled };
  }, [appointments]);

  const openDetails = (appt) => {
    setSelectedAppt(appt);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedAppt(null);
  };

  const isLocked = (status) => status === "cancelled" || status === "rejected" || status === "completed";

  const patchStatus = async (appt, status) => {
    if (!appt?.id) return;

    // αν ήδη κλειδωμένο -> stop
    if (isLocked(appt.status)) return;

    // κανόνες transitions
    if (appt.status === "pending" && !["confirmed", "rejected"].includes(status)) return;
    if (appt.status === "confirmed" && !["completed", "cancelled"].includes(status)) return;

    try {
      const now = new Date().toISOString();

      const extra =
        status === "cancelled"
          ? { cancelledAt: now, cancelledBy: "vet" }
          : status === "rejected"
          ? { cancelledAt: now, cancelledBy: "vet" }
          : status === "completed"
          ? { completedAt: now }
          : {};

      await api.patch(`/appointments/${appt.id}`, {
        status,
        updatedAt: now,
        ...extra,
      });

      await refresh();
    } catch (e) {
      console.error(e);
      alert("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
    }
  };

  const Header = (
    <>
      <Breadcrumbs aria-label="breadcrumb" sx={{ color: "text.secondary" }}>
        <MLink component={RouterLink} to="/" underline="hover" color="inherit">
          Αρχική
        </MLink>
        <Typography color="text.primary">Ραντεβού</Typography>
      </Breadcrumbs>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none", width: "fit-content" }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Button
          variant="contained"
          onClick={() => navigate("/vet/availability")}
          sx={{
            textTransform: "none",
            borderRadius: 999,
            fontWeight: 900,
            px: 3,
            bgcolor: "grey.700",
            "&:hover": { bgcolor: "grey.800" },
          }}
        >
          Ορισμός Διαθεσιμότητας
        </Button>
      </Stack>

      <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mt: 1 }}>
        Διαχείριση Ραντεβού
      </Typography>
    </>
  );

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2.5}>
          {Header}

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Card
              variant="outlined"
              sx={{
                width: "min(820px, 100%)",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {/* Tabs pill-style */}
                <Box
                  sx={{
                    bgcolor: "grey.200",
                    borderRadius: 999,
                    p: 0.5,
                    width: "fit-content",
                    mx: "auto",
                  }}
                >
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons={false}
                    TabIndicatorProps={{ style: { display: "none" } }}
                    sx={{
                      minHeight: 44,
                      "& .MuiTab-root": {
                        minHeight: 44,
                        textTransform: "none",
                        borderRadius: 999,
                        px: 3,
                        fontWeight: 800,
                        color: "text.primary",
                      },
                      "& .MuiTab-root.Mui-selected": {
                        bgcolor: "common.white",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <Tab label="Αιτήματα" {...a11yProps(0)} />
                    <Tab label="Επιβεβαιωμένα" {...a11yProps(1)} />
                    <Tab label="Ολοκληρωμένα" {...a11yProps(2)} />
                    <Tab label="Ακυρώσεις" {...a11yProps(3)} />
                  </Tabs>
                </Box>

                <Divider sx={{ my: 2.5 }} />

                {/* TAB 1: Αιτήματα */}
                {tab === 0 && (
                  <Stack spacing={2}>
                    {!loading && rows.pending.length === 0 && (
                      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                        Δεν υπάρχουν αιτήματα προς το παρόν.
                      </Typography>
                    )}

                    {rows.pending.map((a, idx) => {
                      const pet = petById.get(String(a.petId));
                      const owner = userById.get(String(a.ownerId));

                      return (
                        <Box
                          key={a.id}
                          sx={{
                            bgcolor: "grey.100",
                            borderRadius: 3,
                            p: 2,
                          }}
                        >
                          <Typography fontWeight={800} sx={{ mb: 0.5 }}>
                            {idx + 1}.
                          </Typography>

                          <Typography>
                            <b>Ζώο:</b> {pet?.name ?? "—"} ({pet?.species ?? "—"})
                          </Typography>
                          <Typography>
                            <b>Ιδιοκτήτης:</b> {owner?.fullName ?? "—"}
                          </Typography>
                          <Typography>
                            <b>Ημερομηνία:</b> {a.date ?? "—"} {a.time ? `(${a.time})` : ""}
                          </Typography>
                          <Typography>
                            <b>Πράξη:</b> {a.actType ?? "—"}
                          </Typography>

                          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
                            <Button
                              variant="contained"
                              onClick={() => patchStatus(a, "confirmed")}
                              sx={{
                                textTransform: "none",
                                borderRadius: 999,
                                px: 3,
                                bgcolor: "grey.700",
                                "&:hover": { bgcolor: "grey.800" },
                              }}
                            >
                              Επιβεβαίωση
                            </Button>

                            <Button
                              variant="contained"
                              onClick={() => patchStatus(a, "rejected")}
                              sx={{
                                textTransform: "none",
                                borderRadius: 999,
                                px: 3,
                                bgcolor: "grey.300",
                                color: "error.main",
                                "&:hover": { bgcolor: "grey.400" },
                              }}
                            >
                              Απόρριψη
                            </Button>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}

                {/* TAB 2: Επιβεβαιωμένα */}
                {tab === 1 && (
                  <Box>
                    {rows.confirmed.length === 0 ? (
                      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                        Δεν υπάρχουν επιβεβαιωμένα ραντεβού.
                      </Typography>
                    ) : (
                      <Box sx={{ px: { xs: 0, md: 1 } }}>
                        <Stack
                          direction="row"
                          sx={{
                            fontWeight: 900,
                            color: "text.secondary",
                            px: 1,
                            mb: 1,
                          }}
                        >
                          <Box sx={{ width: 56 }}>#</Box>
                          <Box sx={{ flex: 1 }}>Κωδικός Ραντεβού</Box>
                          <Box sx={{ width: 140 }}>Ημερομηνία</Box>
                          <Box sx={{ width: 220, textAlign: "right" }} />
                        </Stack>

                        <Divider sx={{ mb: 1.5 }} />

                        <Stack spacing={1.2}>
                          {rows.confirmed.map((a, i) => (
                            <Stack
                              key={a.id}
                              direction="row"
                              alignItems="center"
                              sx={{
                                bgcolor: "grey.50",
                                borderRadius: 2,
                                px: 1,
                                py: 1.2,
                              }}
                            >
                              <Box sx={{ width: 56, fontWeight: 800 }}>{i + 1}.</Box>
                              <Box sx={{ flex: 1, fontWeight: 700 }}>#{a.id}</Box>
                              <Box sx={{ width: 140 }}>{a.date ?? "—"}</Box>

                              <Box sx={{ width: 220, textAlign: "right" }}>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button
                                    variant="text"
                                    onClick={() => openDetails(a)}
                                    sx={{ textTransform: "none" }}
                                  >
                                    Προβολή
                                  </Button>

                                  <Button
                                    variant="contained"
                                    onClick={() => patchStatus(a, "completed")}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: 999,
                                      px: 2,
                                      bgcolor: "grey.700",
                                      "&:hover": { bgcolor: "grey.800" },
                                    }}
                                  >
                                    Πραγματοποιήθηκε
                                  </Button>

                                  <Button
                                    variant="contained"
                                    onClick={() => patchStatus(a, "cancelled")}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: 999,
                                      px: 2,
                                      bgcolor: "grey.300",
                                      color: "error.main",
                                      "&:hover": { bgcolor: "grey.400" },
                                    }}
                                  >
                                    Ακύρωση
                                  </Button>
                                </Stack>
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}

                {/* TAB 3: Ολοκληρωμένα */}
                {tab === 2 && (
                  <Box>
                    {rows.completed.length === 0 ? (
                      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                        Δεν υπάρχουν ολοκληρωμένα ραντεβού.
                      </Typography>
                    ) : (
                      <Box sx={{ px: { xs: 0, md: 1 } }}>
                        <Stack
                          direction="row"
                          sx={{
                            fontWeight: 900,
                            color: "text.secondary",
                            px: 1,
                            mb: 1,
                          }}
                        >
                          <Box sx={{ width: 56 }}>#</Box>
                          <Box sx={{ width: 180 }}>Κωδικός</Box>
                          <Box sx={{ flex: 1 }}>Ημερομηνία</Box>
                          <Box sx={{ width: 190, textAlign: "right" }} />
                        </Stack>

                        <Divider sx={{ mb: 1.5 }} />

                        <Stack spacing={1.2}>
                          {rows.completed.map((a, i) => (
                            <Stack
                              key={a.id}
                              direction="row"
                              alignItems="center"
                              sx={{
                                bgcolor: "grey.50",
                                borderRadius: 2,
                                px: 1,
                                py: 1.2,
                              }}
                            >
                              <Box sx={{ width: 56, fontWeight: 800 }}>{i + 1}.</Box>
                              <Box sx={{ width: 180, fontWeight: 700 }}>#{a.id}</Box>
                              <Box sx={{ flex: 1 }}>{a.date ?? "—"}</Box>
                              <Box sx={{ width: 190, textAlign: "right" }}>
                                <Button
                                  variant="text"
                                  onClick={() => openDetails(a)}
                                  sx={{ textTransform: "none" }}
                                >
                                  Προβολή λεπτομερειών
                                </Button>
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}

                {/* TAB 4: Ακυρώσεις (cancelled + rejected) */}
                {tab === 3 && (
                  <Box>
                    {rows.cancelled.length === 0 ? (
                      <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                        Δεν υπάρχουν ακυρώσεις.
                      </Typography>
                    ) : (
                      <Box sx={{ px: { xs: 0, md: 1 } }}>
                        <Stack
                          direction="row"
                          sx={{
                            fontWeight: 900,
                            color: "text.secondary",
                            px: 1,
                            mb: 1,
                          }}
                        >
                          <Box sx={{ width: 56 }}>#</Box>
                          <Box sx={{ width: 180 }}>Κωδικός</Box>
                          <Box sx={{ flex: 1 }}>Ημερομηνία Ακύρωσης</Box>
                          <Box sx={{ width: 190, textAlign: "right" }} />
                        </Stack>

                        <Divider sx={{ mb: 1.5 }} />

                        <Stack spacing={1.2}>
                          {rows.cancelled.map((a, i) => (
                            <Stack
                              key={a.id}
                              direction="row"
                              alignItems="center"
                              sx={{
                                bgcolor: "grey.50",
                                borderRadius: 2,
                                px: 1,
                                py: 1.2,
                              }}
                            >
                              <Box sx={{ width: 56, fontWeight: 800 }}>{i + 1}.</Box>
                              <Box sx={{ width: 180, fontWeight: 700 }}>#{a.id}</Box>
                              <Box sx={{ flex: 1 }}>{a.cancelledAt ?? a.updatedAt ?? a.date ?? "—"}</Box>
                              <Box sx={{ width: 190, textAlign: "right" }}>
                                <Button
                                  variant="text"
                                  onClick={() => openDetails(a)}
                                  sx={{ textTransform: "none" }}
                                >
                                  Προβολή λεπτομερειών
                                </Button>
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Container>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Λεπτομέρειες Ραντεβού</DialogTitle>
        <DialogContent dividers>
          {selectedAppt ? (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={900}>Κωδικός:</Typography>
                <Typography>#{selectedAppt.id}</Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={900}>Κατάσταση:</Typography>
                <StatusChip status={selectedAppt.status} />
              </Stack>

              <Divider sx={{ my: 1 }} />

              {(() => {
                const pet = petById.get(String(selectedAppt.petId));
                const owner = userById.get(String(selectedAppt.ownerId));
                return (
                  <>
                    <Typography>
                      <b>Ζώο:</b> {pet?.name ?? "—"} ({pet?.species ?? "—"}) — microchip:{" "}
                      {pet?.microchip ?? "—"}
                    </Typography>
                    <Typography>
                      <b>Ιδιοκτήτης:</b> {owner?.fullName ?? "—"}{" "}
                      {owner?.phone ? `(${owner.phone})` : ""}
                    </Typography>
                    <Typography>
                      <b>Ημερομηνία/Ώρα:</b> {selectedAppt.date ?? "—"}{" "}
                      {selectedAppt.time ? `(${selectedAppt.time})` : ""}
                    </Typography>
                    <Typography>
                      <b>Πράξη:</b> {selectedAppt.actType ?? "—"}
                    </Typography>

                    {selectedAppt.cancelledBy && (
                      <Typography color="text.secondary">
                        <b>Ακυρώθηκε από:</b> {selectedAppt.cancelledBy}
                      </Typography>
                    )}
                    {selectedAppt.cancelledAt && (
                      <Typography color="text.secondary">
                        <b>Ημ/νία ακύρωσης:</b> {selectedAppt.cancelledAt}
                      </Typography>
                    )}
                    {selectedAppt.completedAt && (
                      <Typography color="text.secondary">
                        <b>Ολοκληρώθηκε:</b> {selectedAppt.completedAt}
                      </Typography>
                    )}
                  </>
                );
              })()}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails} sx={{ textTransform: "none" }}>
            Κλείσιμο
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

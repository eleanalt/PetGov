import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Breadcrumbs,
  Link as MLink,
  Chip,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const STATUS_LABEL = {
  draft: { label: "Πρόχειρη", color: "default" },
  submitted: { label: "ΑΝΟΙΧΤΗ", color: "success" },
  found: { label: "ΒΡΕΘΗΚΕ", color: "success" },
  cancelled: { label: "Ακυρωμένη", color: "default" },
};

export default function OwnerLost() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lost, setLost] = useState([]);
  const [foundReports, setFoundReports] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      const l = await api.get("/lostPets", {
        params: { ownerId: String(user.id), _sort: "createdAt", _order: "desc" },
      });
      const lostArr = Array.isArray(l.data) ? l.data : [];
      setLost(lostArr);

      const fr = await api.get("/foundReports", {
        params: { _sort: "createdAt", _order: "desc" },
      });
      const reportsArr = Array.isArray(fr.data) ? fr.data : [];

      // κράτα μόνο αναφορές που αφορούν δικά σου lostPets
      const myLostIds = new Set(lostArr.map((x) => String(x.id)));
      const onlyMine = reportsArr.filter((r) => myLostIds.has(String(r.lostPetId)));

      setFoundReports(onlyMine);
    })();
  }, [user?.id]);

  const latest = useMemo(() => lost.slice(0, 5), [lost]);
  const latestReports = useMemo(() => foundReports.slice(0, 5), [foundReports]);

  // helper: υπάρχει report για αυτό το lostPetId;
  const hasReportForLost = (lostId) =>
    foundReports.some((r) => String(r.lostPetId) === String(lostId) && r.status !== "rejected");

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Breadcrumbs sx={{ color: "text.secondary" }}>
            <MLink component={RouterLink} to="/" underline="hover" color="inherit">
              Αρχική
            </MLink>
            <Typography color="text.primary">Απώλεια/Εύρεση</Typography>
          </Breadcrumbs>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 3, flex: 1, bgcolor: "grey.200" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={900}>
                  Δήλωση Απώλειας
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Δηλώστε την απώλεια του κατοικιδίου σας. Μπορείτε να αποθηκεύσετε προσωρινά τη δήλωση και να την υποβάλετε όταν είστε έτοιμοι.
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/owner/lost/new")}
                    sx={{ textTransform: "none", borderRadius: 2, px: 4, bgcolor: "grey.700" }}
                  >
                    Νέα Δήλωση Απώλειας
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 3, flex: 1, bgcolor: "grey.200" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={900}>
                  Δηλώσεις Εύρεσης
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Δείτε τις δηλώσεις εύρεσης που αφορούν τα δικά σας χαμένα κατοικίδια.
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/owner/found")}
                    sx={{ textTransform: "none", borderRadius: 2, px: 4, bgcolor: "grey.700" }}
                  >
                    Προβολή Δηλώσεων Εύρεσης
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Stack>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={900}>
                  Ιστορικό Δηλώσεων
                </Typography>
                <Button
                  onClick={() => navigate("/owner/lost/history")}
                  sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2, px: 2 }}
                >
                  Προβολή πλήρους ιστορικού
                </Button>
              </Stack>

              <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Κατοικίδιο</b></TableCell>
                      <TableCell><b>Τύπος Δήλωσης</b></TableCell>
                      <TableCell><b>Ημερομηνία</b></TableCell>
                      <TableCell><b>Κατάσταση</b></TableCell>
                      <TableCell><b>Ενέργειες</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {latest.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>Δεν υπάρχουν δηλώσεις.</TableCell>
                      </TableRow>
                    ) : (
                      latest.map((x) => {
                        const st = STATUS_LABEL[x.status] ?? STATUS_LABEL.draft;
                        const canViewFound = hasReportForLost(x.id);

                        return (
                          <TableRow key={x.id}>
                            <TableCell>{x.petName || "—"}</TableCell>
                            <TableCell>Απώλεια</TableCell>
                            <TableCell>{x.lostDate || x.createdAt || "—"}</TableCell>
                            <TableCell>
                              <Chip label={st.label} color={st.color} size="small" />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  onClick={() => navigate(`/owner/lost/${x.id}`)}
                                  sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2, px: 2 }}
                                >
                                  Προβολή Δήλωσης
                                </Button>

                                {/* ΠΡΟΒΟΛΗ αναφοράς εύρεσης (όχι δημιουργία) */}
                                {x.status === "submitted" && canViewFound && (
                                  <Button
                                    onClick={() => navigate(`/owner/found/view?lostId=${x.id}`)}
                                    sx={{ textTransform: "none", bgcolor: "#c8d7a0", borderRadius: 2, px: 2 }}
                                  >
                                    Δήλωση εύρεσης
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>

              <Typography variant="h6" fontWeight={900} sx={{ mt: 3, mb: 1 }}>
                Αναφορές Εύρεσης (για τα δικά σας κατοικίδια)
              </Typography>

              <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Ονοματεπώνυμο</b></TableCell>
                      <TableCell><b>Τοποθεσία</b></TableCell>
                      <TableCell><b>Ημερομηνία</b></TableCell>
                      <TableCell><b>Τηλέφωνο</b></TableCell>
                      <TableCell><b>Προβολή</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {latestReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>Δεν υπάρχουν αναφορές εύρεσης.</TableCell>
                      </TableRow>
                    ) : (
                      latestReports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.reporterName || "—"}</TableCell>
                          <TableCell>{r.location || "—"}</TableCell>
                          <TableCell>{r.date || r.createdAt || "—"}</TableCell>
                          <TableCell>{r.reporterPhone || "—"}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => navigate(`/owner/found/${r.id}`)}
                              sx={{ minWidth: 44, bgcolor: "grey.300", borderRadius: 2 }}
                            >
                              <ArrowForwardIcon />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

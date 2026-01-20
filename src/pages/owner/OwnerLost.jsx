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
  Chip,
  Divider,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const STATUS_LABEL = {
  draft: { label: "Πρόχειρη", color: "default" },
  submitted: { label: "ΑΝΟΙΧΤΗ", color: "warning" },
  found: { label: "ΒΡΕΘΗΚΕ", color: "success" },
  cancelled: { label: "Ακυρωμένη", color: "error" },
};

// βοηθάει για “πιο πρόσφατο”
function sortByCreatedAtDesc(a, b) {
  return String(b?.createdAt || b?.date || "").localeCompare(String(a?.createdAt || a?.date || ""));
}

// ✅ 0544 -> 544
function normId(x) {
  const s = String(x ?? "");
  const t = s.replace(/^0+/, "");
  return t === "" ? "0" : t;
}

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

      // ✅ κρατά μόνο αναφορές που αφορούν δικά σου lostPets (με normId)
      const myLostIds = new Set(lostArr.map((x) => normId(x.id)));
      const onlyMine = reportsArr.filter((r) => myLostIds.has(normId(r.lostPetId)));

      setFoundReports(onlyMine);
    })();
  }, [user?.id]);

  const latestLost = useMemo(() => lost.slice(0, 5), [lost]);

  /**
   * ✅ Map: lostPetId -> πιο πρόσφατη αναφορά (μη-rejected)
   * (με normId για να “κολλάει” πάντα)
   */
  const latestReportByLostId = useMemo(() => {
    const m = new Map();
    (foundReports || [])
      .filter((r) => r && r.status !== "rejected")
      .sort(sortByCreatedAtDesc)
      .forEach((r) => {
        const k = normId(r.lostPetId);
        if (!m.has(k)) m.set(k, r);
      });
    return m;
  }, [foundReports]);

  /**
   * ✅ Κάτω table: ΟΛΕΣ οι αναφορές (μη-rejected)
   */
  const allReportsForTable = useMemo(() => {
    return (foundReports || [])
      .filter((r) => r && r.status !== "rejected")
      .sort(sortByCreatedAtDesc);
  }, [foundReports]);

  /**
   * ✅ Set με IDs “πιο πρόσφατων” αναφορών
   */
  const latestReportIdSet = useMemo(() => {
    const s = new Set();
    for (const r of latestReportByLostId.values()) {
      if (r?.id != null) s.add(String(r.id));
    }
    return s;
  }, [latestReportByLostId]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          {/* Δήλωση Απώλειας */}
          <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "grey.200" }}>
            <CardContent sx={{ py: 3 }}>
              <Stack spacing={1} alignItems="center" textAlign="center">
                <Typography variant="h6" fontWeight={900}>
                  Δήλωση Απώλειας
                </Typography>

                <Typography color="text.secondary" sx={{ maxWidth: 820 }}>
                  Δηλώστε την απώλεια του κατοικιδίου σας. Μπορείτε να αποθηκεύσετε προσωρινά
                  τη δήλωση και να την υποβάλετε όταν είστε έτοιμοι.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => navigate("/owner/lost/new")}
                  sx={{
                    mt: 1.5,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 4,
                    bgcolor: "primary",
                    fontWeight: 900,
                  }}
                >
                  Νέα Δήλωση Απώλειας
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Ιστορικό Δηλώσεων */}
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
                      <TableCell><b>Πιο πρόσφατη αναφορά εύρεσης</b></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {latestLost.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>Δεν υπάρχουν δηλώσεις.</TableCell>
                      </TableRow>
                    ) : (
                      latestLost.map((x) => {
                        const st = STATUS_LABEL[x.status] ?? STATUS_LABEL.draft;
                        const latestReport = latestReportByLostId.get(normId(x.id));

                        return (
                          <TableRow key={x.id}>
                            <TableCell>{x.petName || "—"}</TableCell>
                            <TableCell>Απώλεια</TableCell>
                            <TableCell>{x.lostDate || x.createdAt || "—"}</TableCell>
                            <TableCell>
                              <Chip label={st.label} color={st.color} size="small" />
                            </TableCell>

                            <TableCell>
                              <Button
                                onClick={() => navigate(`/owner/lost/${x.id}`)}
                                sx={{
                                  textTransform: "none",
                                  bgcolor: "grey.300",
                                  borderRadius: 2,
                                  px: 2,
                                  fontWeight: 800,
                                }}
                              >
                                Προβολή Δήλωσης
                              </Button>
                            </TableCell>

                            <TableCell>
                              {latestReport ? (
                                <Button
                                  onClick={() => navigate(`/owner/found/${latestReport.id}`)}
                                  sx={{
                                    textTransform: "none",
                                    bgcolor: "#dfe9c2",
                                    borderRadius: 2,
                                    px: 2,
                                    fontWeight: 900,
                                    "&:hover": { bgcolor: "#d2e0ac" },
                                  }}
                                >
                                  Προβολή αναφοράς
                                </Button>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  —
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Αναφορές Εύρεσης */}
              <Typography variant="h6" fontWeight={900} sx={{ mb: 1 }}>
                Αναφορές Εύρεσης
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
                    {allReportsForTable.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>Δεν υπάρχουν αναφορές εύρεσης.</TableCell>
                      </TableRow>
                    ) : (
                      allReportsForTable.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <span>{r.reporterName || "—"}</span>
                              {latestReportIdSet.has(String(r.id)) && (
                                <Chip size="small" label="Πιο πρόσφατη" color="success" />
                              )}
                            </Stack>
                          </TableCell>
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

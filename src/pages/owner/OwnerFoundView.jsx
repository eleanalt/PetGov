import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";

export default function OwnerFoundView() {
  const navigate = useNavigate();
  const { id } = useParams(); // /owner/found/:id
  const [params] = useSearchParams();
  const lostIdFromQuery = params.get("lostId") || ""; // /owner/found/view?lostId=...

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [report, setReport] = useState(null);
  const [lost, setLost] = useState(null);

  const reportStatus = String(report?.status || "");
  const isResolved = reportStatus === "confirmed" || reportStatus === "rejected";

  useEffect(() => {
    (async () => {
      setMsg({ type: "", text: "" });
      setLoading(true);

      try {
        let fr = null;

        // A) /owner/found/:id
        if (id) {
          const r = await api.get(`/foundReports/${id}`);
          fr = r.data || null;
        }
        // B) /owner/found/view?lostId=...
        else if (lostIdFromQuery) {
          const r = await api.get("/foundReports", { params: { lostPetId: String(lostIdFromQuery) } });
          const arr = Array.isArray(r.data) ? r.data : [];

          // κράτα τα μη-rejected, και πάρε το πιο πρόσφατο
          const filtered = arr.filter((x) => x.status !== "rejected");
          const sorted = [...filtered].sort((a, b) =>
            String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
          );
          fr = sorted[0] || null;
        } else {
          setMsg({ type: "error", text: "Λείπει το id ή lostId από το URL." });
          setReport(null);
          setLost(null);
          return;
        }

        if (!fr) {
          setMsg({ type: "error", text: "Η δήλωση εύρεσης δεν βρέθηκε." });
          setReport(null);
          setLost(null);
          return;
        }

        setReport(fr);

        // φόρτωσε lostPet
        const lostId = fr.lostPetId || lostIdFromQuery;
        if (lostId) {
          const lp = await api.get(`/lostPets/${lostId}`);
          setLost(lp.data || null);
        } else {
          setLost(null);
        }
      } catch (e) {
        console.error(e);
        setMsg({ type: "error", text: "Αποτυχία φόρτωσης δήλωσης εύρεσης." });
        setReport(null);
        setLost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, lostIdFromQuery]);

  const canAct = useMemo(() => {
    if (!report || !lost) return false;
    if (isResolved) return false;
    if (String(lost.status) === "found") return false;
    return true;
  }, [report, lost, isResolved]);

  const confirmFound = async () => {
    if (!report || !lost?.id) return;
    setActing(true);
    setMsg({ type: "", text: "" });

    try {
      await api.patch(`/lostPets/${lost.id}`, {
        status: "found",
        foundAt: new Date().toISOString(),
      });

      await api.patch(`/foundReports/${report.id}`, {
        status: "confirmed",
        verifiedAt: new Date().toISOString(),
      });

      setLost((x) => ({ ...(x || {}), status: "found" }));
      setReport((x) => ({ ...(x || {}), status: "confirmed" }));
      setMsg({ type: "success", text: "Επιβεβαιώθηκε η εύρεση. Η δήλωση απώλειας έγινε: ΒΡΕΘΗΚΕ." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία επιβεβαίωσης εύρεσης." });
    } finally {
      setActing(false);
    }
  };

  const rejectReport = async () => {
    if (!report?.id) return;
    setActing(true);
    setMsg({ type: "", text: "" });

    try {
      await api.patch(`/foundReports/${report.id}`, {
        status: "rejected",
        rejectedAt: new Date().toISOString(),
      });

      setReport((x) => ({ ...(x || {}), status: "rejected" }));
      setMsg({ type: "success", text: "Η αναφορά απορρίφθηκε ως άκυρη." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία απόρριψης αναφοράς." });
    } finally {
      setActing(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/owner/lost")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
              Προβολή Αναφοράς Εύρεσης
            </Typography>

            {msg.text && (
              <Alert severity={msg.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
                {msg.text}
              </Alert>
            )}

            {loading ? (
              <Typography color="text.secondary">Φόρτωση...</Typography>
            ) : !report ? (
              <Typography color="text.secondary">Δεν υπάρχουν διαθέσιμα στοιχεία.</Typography>
            ) : (
              <Box sx={{ maxWidth: 760, mx: "auto" }}>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Στοιχεία ζώου
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Preview label="Microchip" value={report.microchip || lost?.microchip || "—"} />
                <Preview label="Όνομα" value={lost?.petName || lost?.name || "—"} />
                <Preview label="Τοποθεσία απώλειας" value={lost?.lostArea || "—"} />
                <Preview label="Ημερομηνία απώλειας" value={lost?.lostDate || "—"} />

                <Typography fontWeight={900} sx={{ mt: 3, mb: 1 }}>
                  Στοιχεία επικοινωνίας ευρετή
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Preview label="Ονοματεπώνυμο" value={report.reporterName || "—"} />
                <Preview label="Τηλέφωνο" value={report.reporterPhone || "—"} />
                <Preview label="Email" value={report.reporterEmail || "—"} />

                <Typography fontWeight={900} sx={{ mt: 3, mb: 1 }}>
                  Λεπτομέρειες αναφοράς
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Preview label="Τοποθεσία εύρεσης" value={report.location || "—"} />
                <Preview label="Ημερομηνία εύρεσης" value={report.date || "—"} />
                <Preview label="Περιγραφή" value={report.details || "—"} />

                {Array.isArray(report.photos) && report.photos.length > 0 && (
                  <>
                    <Typography fontWeight={900} sx={{ mt: 3, mb: 1 }}>
                      Φωτογραφίες
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      {report.photos.map((src, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={src}
                          alt={`photo-${idx}`}
                          sx={{
                            width: 220,
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "grey.300",
                          }}
                        />
                      ))}
                    </Stack>
                  </>
                )}

                {/* Κουμπιά κάτω όπως στο figma */}
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={confirmFound}
                    disabled={!canAct || acting}
                    sx={{ textTransform: "none", borderRadius: 999, px: 3, bgcolor: "#4f7f3a" }}
                  >
                    Επιβεβαίωση Εύρεσης
                  </Button>

                  <Button
                    variant="contained"
                    onClick={rejectReport}
                    disabled={!report || isResolved || acting}
                    sx={{ textTransform: "none", borderRadius: 999, px: 3, bgcolor: "#d64545" }}
                  >
                    Απόρριψη Αναφοράς
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

function Preview({ label, value }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.6 }}>
      <Typography sx={{ width: 260, fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ color: value === "—" ? "text.secondary" : "text.primary" }}>
        {value}
      </Typography>
    </Stack>
  );
}

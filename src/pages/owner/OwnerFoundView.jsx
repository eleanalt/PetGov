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

// ✅ 0544 -> 544
function normId(x) {
  const s = String(x ?? "");
  const t = s.replace(/^0+/, "");
  return t === "" ? "0" : t;
}

function unique(arr) {
  return Array.from(new Set(arr.filter(Boolean).map(String)));
}

export default function OwnerFoundView() {
  const navigate = useNavigate();
  const { id } = useParams(); // /owner/found/:id
  const [params] = useSearchParams();
  const lostIdFromQuery = params.get("lostId") || "";

  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [report, setReport] = useState(null);
  const [lost, setLost] = useState(null);

  const reportStatus = String(report?.status || "");
  const isResolved = reportStatus === "confirmed" || reportStatus === "rejected";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMsg({ type: "", text: "" });
      setLoading(true);

      try {
        let fr = null;

        // A) /owner/found/:id
        if (id) {
          const r = await api.get(`/foundReports/${id}`);
          fr = r?.data || null;
        }
        // B) /owner/found/view?lostId=...
        else if (lostIdFromQuery) {
          // ✅ Φέρε ΟΛΕΣ και φίλτραρε χειροκίνητα με normId για να πιάσει 544 vs 0544
          const r = await api.get("/foundReports");
          const arr = Array.isArray(r.data) ? r.data : [];

          const wanted = normId(lostIdFromQuery);
          const filtered = arr
            .filter((x) => normId(x?.lostPetId) === wanted)
            .filter((x) => String(x?.status || "") !== "rejected");

          const sorted = [...filtered].sort((a, b) =>
            String(b?.createdAt || b?.date || "").localeCompare(
              String(a?.createdAt || a?.date || "")
            )
          );

          fr = sorted[0] || null;
        } else {
          if (!cancelled) {
            setMsg({ type: "error", text: "Λείπει το id ή lostId από το URL." });
            setReport(null);
            setLost(null);
          }
          return;
        }

        if (!fr) {
          if (!cancelled) {
            setMsg({ type: "error", text: "Η δήλωση εύρεσης δεν βρέθηκε." });
            setReport(null);
            setLost(null);
          }
          return;
        }

        if (cancelled) return;
        setReport(fr);

        // ✅ φόρτωσε lostPet με fallback ids (544 / 0544 / padStart)
        const rawLostId = fr.lostPetId || lostIdFromQuery;

        if (!rawLostId) {
          if (!cancelled) setLost(null);
          return;
        }

        const candidates = unique([
          String(rawLostId),
          normId(rawLostId),
          String(rawLostId).padStart(4, "0"),
          String(rawLostId).padStart(3, "0"),
        ]);

        let loaded = null;
        for (const lid of candidates) {
          try {
            const lp = await api.get(`/lostPets/${lid}`);
            loaded = lp?.data || null;
            if (loaded) break;
          } catch {
            // try next
          }
        }

        if (!cancelled) {
          setLost(loaded);
          if (!loaded) {
            // δεν κόβουμε τη σελίδα, απλά ενημερώνουμε
            setMsg({
              type: "error",
              text:
                "Βρέθηκε η αναφορά εύρεσης, αλλά δεν βρέθηκε η αντίστοιχη δήλωση απώλειας (lostPetId mismatch π.χ. 544 vs 0544).",
            });
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setMsg({ type: "error", text: "Αποτυχία φόρτωσης δήλωσης εύρεσης." });
          setReport(null);
          setLost(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
        updatedAt: new Date().toISOString(),
      });

      await api.patch(`/foundReports/${report.id}`, {
        status: "confirmed",
        verifiedAt: new Date().toISOString(),
      });

      setLost((x) => ({ ...(x || {}), status: "found" }));
      setReport((x) => ({ ...(x || {}), status: "confirmed" }));
      setMsg({
        type: "success",
        text: "Επιβεβαιώθηκε η εύρεση. Η δήλωση απώλειας έγινε: ΒΡΕΘΗΚΕ.",
      });
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
                <Preview label="Τοποθεσία απώλειας" value={lost?.lostArea || lost?.area || "—"} />
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

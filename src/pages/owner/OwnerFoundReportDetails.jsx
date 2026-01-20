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
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function statusChip(status) {
  const s = String(status || "").toLowerCase();

  if (s === "approved" || s === "confirmed" || s === "accepted") {
    return <Chip size="small" label="Επιβεβαιώθηκε" color="success" />;
  }
  if (s === "rejected" || s === "declined") {
    return <Chip size="small" label="Απορρίφθηκε" color="error" />;
  }
  if (s === "pending" || s === "open" || s === "") {
    return <Chip size="small" label="Σε αναμονή" color="warning" />;
  }
  return <Chip size="small" label={status || "—"} variant="outlined" />;
}

function fmtDate(isoOrDate) {
  if (!isoOrDate) return "—";
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function FieldRow({ label, value }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ py: 1 }}>
      <Typography sx={{ width: { sm: 240 }, fontWeight: 900 }}>{label}</Typography>
      <Typography sx={{ color: value ? "text.primary" : "text.secondary" }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

function SectionCard({ title, rows }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography fontWeight={900} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={0.5}>
          {rows.map((r) => (
            <React.Fragment key={r.label}>
              <FieldRow label={r.label} value={r.value} />
              <Divider />
            </React.Fragment>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ✅ για mismatch 544 vs 0544 κλπ
function normId(x) {
  const s = String(x ?? "");
  const trimmed = s.replace(/^0+/, "");
  return trimmed === "" ? "0" : trimmed;
}

export default function OwnerFoundReportDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [report, setReport] = useState(null);
  const [lostPet, setLostPet] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!id) return;

      setLoading(true);
      setMsg(null);

      try {
        const rRes = await api.get(`/foundReports/${id}`);
        const r = rRes?.data;

        if (!r?.id) {
          if (!cancelled) {
            setReport(null);
            setLostPet(null);
            setMsg({ type: "error", text: "Δεν βρέθηκε η αναφορά εύρεσης." });
          }
          return;
        }

        // (προαιρετικό) access check: αν έχεις reporterId στη βάση, χρησιμοποίησέ το
        // Στο JSON σου δεν υπάρχει reporterId, οπότε το αφήνουμε εκτός.

        // ✅ φέρνουμε όλα τα lostPets για να βρούμε σωστά το id (λόγω leading zeros)
        const lRes = await api.get("/lostPets");
        const lostPets = Array.isArray(lRes.data) ? lRes.data : [];

        const lp =
          lostPets.find((p) => String(p.id) === String(r.lostPetId)) ||
          lostPets.find((p) => normId(p.id) === normId(r.lostPetId)) ||
          (r.microchip
            ? lostPets.find((p) => String(p.microchip || "") === String(r.microchip))
            : null);

        if (!cancelled) {
          setReport(r);
          setLostPet(lp || null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setReport(null);
          setLostPet(null);
          setMsg({ type: "error", text: "Αποτυχία φόρτωσης της αναφοράς." });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const animalRows = useMemo(() => {
    if (!report) return [];

    return [
      { label: "Όνομα ζώου", value: lostPet?.petName || "—" },
      { label: "Είδος", value: lostPet?.species || "—" },
      { label: "Microchip", value: lostPet?.microchip || report.microchip || "—" },
      { label: "Φύλο", value: lostPet?.sex || "—" },
      // Στη βάση σου δεν υπάρχει birthDate, οπότε το αφήνουμε κενό
      { label: "Ημερομηνία γέννησης", value: lostPet?.birthDate ? fmtDate(lostPet.birthDate) : "—" },
    ];
  }, [report, lostPet]);

  const myRows = useMemo(() => {
    if (!report) return [];

    return [
      { label: "Ημερομηνία αναφοράς", value: fmtDate(report.date || report.createdAt) },
      { label: "Τοποθεσία", value: report.location || "—" },
      { label: "Λεπτομέρειες", value: report.details || "—" },
      { label: "Ονοματεπώνυμο", value: report.reporterName || "—" },
      { label: "Τηλέφωνο", value: report.reporterPhone || "—" },
      { label: "Email", value: report.reporterEmail || "—" },
    ];
  }, [report]);

  if (loading) {
    return (
      <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
        <Container maxWidth="lg">
          <Typography>Φόρτωση...</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/owner/found-reports")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στις Αναφορές Εύρεσης
          </Button>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={900}>
                  Προβολή Αναφοράς Εύρεσης
                </Typography>
                {statusChip(report?.status)}
              </Stack>

              {msg && (
                <Alert severity={msg.type} sx={{ mt: 2 }}>
                  {msg.text}
                </Alert>
              )}

              {!report ? (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Δεν υπάρχουν δεδομένα για προβολή.
                </Typography>
              ) : (
                <>
                  <Divider sx={{ my: 2 }} />

                  <SectionCard title="Στοιχεία ζώου" rows={animalRows} />

                  <Box sx={{ mt: 2 }}>
                    <SectionCard title="Στοιχεία που δήλωσα εγώ" rows={myRows} />
                  </Box>

                  <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => window.print()}
                      sx={{ textTransform: "none", borderRadius: 2, px: 6 }}
                    >
                      Εκτύπωση
                    </Button>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

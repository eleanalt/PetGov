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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
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


function normId(x) {
  const s = String(x ?? "");
  const trimmed = s.replace(/^0+/, "");
  return trimmed === "" ? "0" : trimmed;
}

export default function OwnerMyFoundReports() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [foundReports, setFoundReports] = useState([]);
  const [lostPets, setLostPets] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      setLoading(true);
      setMsg({ type: "", text: "" });

      try {
        const [rRes, lRes] = await Promise.all([api.get("/foundReports"), api.get("/lostPets")]);

        setFoundReports(Array.isArray(rRes.data) ? rRes.data : []);
        setLostPets(Array.isArray(lRes.data) ? lRes.data : []);
      } catch (e) {
        console.error(e);
        setMsg({ type: "error", text: "Αποτυχία φόρτωσης αναφορών εύρεσης." });
        setFoundReports([]);
        setLostPets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const lostPetById = useMemo(() => {
    const m = new Map();
    lostPets.forEach((p) => m.set(String(p.id), p));
    return m;
  }, [lostPets]);

  const lostPetByNormId = useMemo(() => {
    const m = new Map();
    lostPets.forEach((p) => m.set(normId(p.id), p));
    return m;
  }, [lostPets]);

  const lostPetByMicrochip = useMemo(() => {
    const m = new Map();
    lostPets.forEach((p) => {
      if (p.microchip) m.set(String(p.microchip), p);
    });
    return m;
  }, [lostPets]);

  const findLostPetForReport = (r) => {
    if (!r) return null;

    // 1) exact id
    if (r.lostPetId != null) {
      const exact = lostPetById.get(String(r.lostPetId));
      if (exact) return exact;

      // 2) normalized id
      const norm = lostPetByNormId.get(normId(r.lostPetId));
      if (norm) return norm;
    }

    // 3) fallback by microchip
    if (r.microchip) {
      const byMc = lostPetByMicrochip.get(String(r.microchip));
      if (byMc) return byMc;
    }

    return null;
  };

  const sorted = useMemo(() => {
    return [...(foundReports || [])].sort((a, b) =>
      String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || ""))
    );
  }, [foundReports]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/owner/lost")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στις Απώλειες/Ευρέσεις
          </Button>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Typography variant="h5" fontWeight={900} sx={{ mb: 0.5 }}>
                Οι Αναφορές Εύρεσης μου
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Εδώ βλέπεις τις αναφορές εύρεσης που έχεις υποβάλει εσύ για άλλα ζώα και την κατάστασή τους.
              </Typography>

              {msg.text && (
                <Alert severity={msg.type} sx={{ mb: 2 }}>
                  {msg.text}
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Ημερομηνία</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Ζώο</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Τοποθεσία</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Κατάσταση</TableCell>
                    <TableCell sx={{ fontWeight: 900 }} align="right">
                      Ενέργειες
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {!loading && sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                        Δεν έχεις υποβάλει αναφορές εύρεσης.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((r) => {
                      const lostPet = findLostPetForReport(r);

                      const petName = lostPet?.petName || "—";
                      const species = lostPet?.species || "—";
                      const microchip = lostPet?.microchip || r.microchip || "—";

                      const location =
                        r.location || lostPet?.area || lostPet?.lostArea || "—";

                      return (
                        <TableRow key={r.id}>
                          <TableCell>{fmtDate(r.date || r.createdAt)}</TableCell>

                          <TableCell>
                            <Typography fontWeight={800}>
                              {petName} ({species})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              microchip: {microchip}
                            </Typography>
                          </TableCell>

                          <TableCell>{location}</TableCell>

                          <TableCell>{statusChip(r.status)}</TableCell>

                          <TableCell align="right">
                            <Button
                              variant="text"
                              onClick={() => navigate(`/owner/found-reports/${r.id}`)}
                              sx={{ textTransform: "none", fontWeight: 900 }}
                            >
                              Προβολή
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

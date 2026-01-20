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

export default function OwnerMyFoundReports() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [foundReports, setFoundReports] = useState([]);
  const [pets, setPets] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      setLoading(true);
      setMsg({ type: "", text: "" });

      try {
        // ⬇️ άλλαξε το endpoint αν στο δικό σου backend λέγεται αλλιώς
        const [rRes, pRes] = await Promise.all([
          api.get("/foundReports", { params: { reporterId: String(user.id) } }),
          api.get("/pets", { params: { ownerId: String(user.id) } }),
        ]);

        setFoundReports(Array.isArray(rRes.data) ? rRes.data : []);
        setPets(Array.isArray(pRes.data) ? pRes.data : []);
      } catch (e) {
        console.error(e);
        setMsg({ type: "error", text: "Αποτυχία φόρτωσης αναφορών εύρεσης." });
        setFoundReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const petById = useMemo(() => {
    const m = new Map();
    (pets || []).forEach((p) => m.set(String(p.id), p));
    return m;
  }, [pets]);

  const sorted = useMemo(() => {
    return [...(foundReports || [])].sort((a, b) =>
      String(b.createdAt || b.date || "").localeCompare(String(a.createdAt || a.date || ""))
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
                <Alert severity={msg.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
                  {msg.text}
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Ημερομηνία</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Ζώο/Στοιχεία</TableCell>
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
                      const pet = r.petId ? petById.get(String(r.petId)) : null;

                      return (
                        <TableRow key={r.id}>
                          <TableCell>
                            {fmtDate(r.createdAt || r.date)}
                          </TableCell>

                          <TableCell>
                            <Typography fontWeight={800}>
                              {pet?.name ? `${pet.name} (${pet.species || "—"})` : (r.petName || r.species || "—")}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              microchip: {pet?.microchip || r.microchip || "—"}
                            </Typography>
                          </TableCell>

                          <TableCell>{r.location || r.area || "—"}</TableCell>

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

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                * Αν δεν έχεις σελίδα λεπτομερειών, πες μου και σου φτιάχνω και το `/owner/found-reports/:id`.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

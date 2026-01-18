import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Breadcrumbs,
  Link as MLink,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

export default function OwnerHealthBook() {
  const navigate = useNavigate();
  const { petId } = useParams();

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [vet, setVet] = useState(null);
  const [acts, setActs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get(`/pets/${petId}`);
        setPet(p.data ?? null);

        if (p.data?.ownerId) {
          const o = await api.get(`/users/${p.data.ownerId}`);
          setOwner(o.data ?? null);
        }

        const a = await api.get(`/medicalActs`, {
          params: { petId: String(petId), _sort: "date", _order: "desc" },
        });
        const list = Array.isArray(a.data) ? a.data : [];
        setActs(list);
        const firstVetId = list?.[0]?.vetId;
        if (firstVetId) {
          const v = await api.get(`/users/${firstVetId}`);
          setVet(v.data ?? null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [petId]);

  const clinicLabel = useMemo(() => {
    if (!vet) return "—";
    return vet.clinicName ? `${vet.clinicName} (${vet.fullName})` : vet.fullName;
  }, [vet]);

  if (!pet) {
    return (
      <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
        <Container maxWidth="lg">
          <Typography>Δεν βρέθηκε κατοικίδιο.</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Breadcrumbs aria-label="breadcrumb" sx={{ color: "text.secondary", mb: 2 }}>
          <MLink component={RouterLink} to="/" underline="hover" color="inherit">
            Αρχική
          </MLink>
          <MLink component={RouterLink} to="/owner/pets" underline="hover" color="inherit">
            Τα κατοικίδιά μου
          </MLink>
          <Typography color="text.primary">Βιβλιάριο υγείας</Typography>
        </Breadcrumbs>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
          Βιβλιάριο Υγείας
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Box sx={{ display: { xs: "block", md: "flex" }, gap: 3 }}>
              {/* Left: pet details */}
              <Box
                sx={{
                  flex: 1,
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Στοιχεία Κατοικιδίου:
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  <Typography>
                    <b>Όνομα:</b> {pet.name || "—"}
                  </Typography>
                  <Typography>
                    <b>Microchip:</b> {pet.microchip || "—"}
                  </Typography>
                  <Typography>
                    <b>Ημερομηνία Γέννησης:</b> {pet.birthDate || "—"}
                  </Typography>
                  <Typography>
                    <b>Φύλο:</b> {pet.sex || "—"}
                  </Typography>
                  <Typography>
                    <b>Ράτσα:</b> {pet.breed || "—"}
                  </Typography>
                  <Typography>
                    <b>Χρώμα:</b> {pet.color || "—"}
                  </Typography>
                  <Typography sx={{ gridColumn: "1 / -1" }}>
                    <b>Ιδιοκτήτης:</b> {owner?.fullName || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Right: photo (read-only) */}
              <Box
                sx={{
                  width: { xs: "100%", md: 360 },
                  height: 180,
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "grey.300",
                  border: "1px solid rgba(0,0,0,0.12)",
                  position: "relative",
                }}
              >
                {pet.photoDataUrl ? (
                  <img
                    src={pet.photoDataUrl}
                    alt="Pet"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 52%)",
                    }}
                  />
                )}
              </Box>
            </Box>

            <Typography fontWeight={900} sx={{ mt: 3, mb: 1 }}>
              Ιατρικές Πράξεις
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Ημερομηνία</b>
                    </TableCell>
                    <TableCell>
                      <b>Πράξη</b>
                    </TableCell>
                    <TableCell>
                      <b>Κλινική / Κτηνίατρος</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {acts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>Δεν υπάρχουν πράξεις.</TableCell>
                    </TableRow>
                  ) : (
                    acts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date || "—"}</TableCell>
                        <TableCell>{a.type || "—"}</TableCell>
                        <TableCell>{clinicLabel}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => window.print()}
                sx={{ textTransform: "none", borderRadius: 2, px: 6, bgcolor: "grey.700" }}
              >
                Εκτύπωση
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Breadcrumbs,
  Link as MLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

export default function VetActsHistory() {
  const navigate = useNavigate();
  const { petId } = useParams();

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [acts, setActs] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 5;

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
        setActs(Array.isArray(a.data) ? a.data : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [petId]);

  const totalPages = Math.max(1, Math.ceil(acts.length / pageSize));

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return acts.slice(start, start + pageSize);
  }, [acts, page]);

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
          <MLink component={RouterLink} to="/vet/acts" underline="hover" color="inherit">
            Ιατρικές Πράξεις
          </MLink>
          <Typography color="text.primary">Ιστορικό</Typography>
        </Breadcrumbs>

        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ textTransform: "none", mb: 2 }}>
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
          Ιστορικό Πράξεων
        </Typography>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Box sx={{ bgcolor: "grey.50", borderRadius: 3, p: 2, maxWidth: 520, mx: "auto", mb: 3 }}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={800}>Κατοικίδιο:</Typography>
                  <Typography fontWeight={800}>Αριθμός Μικροτσίπ:</Typography>
                  <Typography fontWeight={800}>Ημ. Γέννησης:</Typography>
                  <Typography fontWeight={800}>Ιδιοκτήτης:</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography>{pet.name || "—"}</Typography>
                  <Typography>{pet.microchip || "—"}</Typography>
                  <Typography>{pet.birthDate || "—"}</Typography>
                  <Typography>{owner?.fullName || "—"}</Typography>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ bgcolor: "grey.200", borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>Ημερομηνία</b></TableCell>
                    <TableCell><b>Πράξη</b></TableCell>
                    <TableCell><b>Σημειώσεις</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>Δεν υπάρχουν πράξεις.</TableCell>
                    </TableRow>
                  ) : (
                    pageItems.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date || "—"}</TableCell>
                        <TableCell>{a.type || "—"}</TableCell>
                        <TableCell>{a.notes || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
              <Button
                variant="text"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {"<"}
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "contained" : "text"}
                  onClick={() => setPage(p)}
                  sx={{ minWidth: 40 }}
                >
                  {p}
                </Button>
              ))}

              <Button
                variant="text"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {">"}
              </Button>
            </Stack>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => navigate(`/vet/acts/new/${pet.id}`)}
                sx={{ textTransform: "none", borderRadius: 2, px: 6, bgcolor: "grey.700" }}
              >
                Νέα Πράξη
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

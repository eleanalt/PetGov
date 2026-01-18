import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Breadcrumbs,
  Link as MLink,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function VetActs() {
  const navigate = useNavigate();

  const [microchip, setMicrochip] = useState("");
  const [loading, setLoading] = useState(false);

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);

  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const canSearch = useMemo(() => microchip.trim().length > 0, [microchip]);

  const onSearch = async () => {
    setError("");
    setSearched(true);
    setPet(null);
    setOwner(null);

    if (!canSearch) {
      setError("Γράψτε αριθμό microchip για αναζήτηση.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/pets", { params: { microchip: microchip.trim() } });
      const found = Array.isArray(res.data) ? res.data[0] : null;

      if (!found) {
        setError("Δεν βρέθηκε κατοικίδιο με αυτό το microchip.");
        return;
      }

      setPet(found);

      if (found.ownerId) {
        const ownerRes = await api.get(`/users/${found.ownerId}`);
        setOwner(ownerRes.data ?? null);
      }
    } catch (e) {
      console.error(e);
      setError("Κάτι πήγε στραβά στην αναζήτηση.");
    } finally {
      setLoading(false);
    }
  };

  const onNewAct = async () => {
    setError("");
    if (pet?.id) {
      navigate(`/vet/acts/new/${pet.id}`);
      return;
    }

    if (!canSearch) {
      setError("Γράψτε αριθμό microchip για να δημιουργήσετε νέα πράξη.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/pets", { params: { microchip: microchip.trim() } });
      const found = Array.isArray(res.data) ? res.data[0] : null;

      if (!found) {
        setError("Δεν βρέθηκε κατοικίδιο με αυτό το microchip.");
        return;
      }

      navigate(`/vet/acts/new/${found.id}`);
    } catch (e) {
      console.error(e);
      setError("Κάτι πήγε στραβά.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ color: "text.secondary" }}>
            <MLink component={RouterLink} to="/" underline="hover" color="inherit">
              Αρχική
            </MLink>
            <Typography color="text.primary">Ιατρικές Πράξεις</Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στην προηγούμενη σελίδα
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mt: 1 }}>
            Ιατρικές Πράξεις
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <TextField
              value={microchip}
              onChange={(e) => {
                setMicrochip(e.target.value);
                setError("");
                setSearched(false);
                setPet(null);
                setOwner(null);
              }}
              placeholder="Αναζήτηση με αριθμό μικροτσιπ..."
              sx={{ width: "min(720px, 100%)" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Buttons */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={onSearch}
                disabled={loading}
                sx={{ textTransform: "none", fontWeight: 900, px: 5, borderRadius: 2 }}
              >
                Αναζήτηση
              </Button>

              <Button
                variant="contained"
                onClick={onNewAct}
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 900,
                  px: 5,
                  borderRadius: 2,
                  bgcolor: "grey.700",
                  "&:hover": { bgcolor: "grey.800" },
                }}
              >
                Νέα Πράξη
              </Button>
            </Stack>
          </Box>

          {/* Messages */}
          {error && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Alert severity="info" sx={{ width: "min(720px, 100%)" }}>
                {error}
              </Alert>
            </Box>
          )}

          {!loading && searched && !pet && !error && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Alert severity="info" sx={{ width: "min(720px, 100%)" }}>
                Δεν βρέθηκε κατοικίδιο με αυτό το microchip.
              </Alert>
            </Box>
          )}

          {/* Card when pet exists */}
          {pet && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Card variant="outlined" sx={{ width: "min(720px, 100%)", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
                    Ιατρικές Πράξεις
                  </Typography>

                  <Box
                    sx={{
                      bgcolor: "grey.50",
                      borderRadius: 3,
                      p: 2,
                      maxWidth: 440,
                      mx: "auto",
                    }}
                  >
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={800}>Όνομα:</Typography>
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

                  <Divider sx={{ my: 3 }} />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/vet/acts/healthbook/${pet.id}`)}
                      sx={{ textTransform: "none", borderRadius: 2, px: 4, bgcolor: "grey.700" }}
                    >
                      Προβολή Βιβλιαρίου
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => navigate(`/vet/acts/history/${pet.id}`)}
                      sx={{ textTransform: "none", borderRadius: 2, px: 4, bgcolor: "grey.700" }}
                    >
                      Προβολή Ιστορικού
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
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

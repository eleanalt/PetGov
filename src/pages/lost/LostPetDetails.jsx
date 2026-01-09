import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

/** Photo */
function PetPhoto({ src, alt }) {
  return (
    <Box
      component="img"
      src={src || "/dog.jpg"}
      alt={alt || "pet"}
      sx={{
        height: 190,
        width: "100%",
        objectFit: "cover",
        borderRadius: 3,
        display: "block",
        bgcolor: "grey.200",
        border: "1px solid",
        borderColor: "grey.400",
      }}
      onError={(e) => {
        e.currentTarget.src = "/dog.jpg";
      }}
    />
  );
}

function LostPetCard({ lost, pet, onOpen }) {
  const imgSrc =
    Array.isArray(lost?.photos) && lost.photos.length > 0 ? lost.photos[0] : "/dog.jpg";

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 5,
        height: "100%",
        borderColor: "grey.700",
        boxShadow: "none",
        bgcolor: "white",
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <PetPhoto src={imgSrc} alt={pet?.name} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            {pet?.name ?? "—"}
          </Typography>

          <Chip
            size="small"
            label={pet?.species ?? "—"}
            sx={{
              bgcolor: "grey.200",
              border: "1px solid",
              borderColor: "grey.400",
              fontWeight: 700,
              borderRadius: 999,
            }}
          />
        </Stack>

        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
          {pet?.color ?? "—"}
        </Typography>

        <Stack spacing={1.2} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlaceOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2">{lost?.area ?? "—"}</Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
            <Typography variant="body2">
              Ημερομηνία απώλειας: {lost?.lostDate ?? "—"}
            </Typography>
          </Stack>

          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {lost?.details || "—"}
          </Typography>

          <Divider sx={{ my: 0.5, borderColor: "grey.400" }} />

          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Microchip: {pet?.microchip ?? "—"}
          </Typography>
        </Stack>

        <Button
          onClick={onOpen}
          variant="contained"
          sx={{
            mt: "auto",
            alignSelf: "center",
            minWidth: 220,
            px: 3,
            py: 1,
            textTransform: "none",
            borderRadius: 999,
            fontWeight: 800,
            bgcolor: "grey.500",
            color: "common.white",
            boxShadow: "none",
            "&:hover": { bgcolor: "grey.600", boxShadow: "none" },
          }}
        >
          Προβολή λεπτομερειών
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LostPets() {
  const navigate = useNavigate();

  const [lostPets, setLostPets] = useState([]);
  const [petsById, setPetsById] = useState({});

  // filters
  const [q, setQ] = useState("");
  const [species, setSpecies] = useState("all");
  const [area, setArea] = useState("all");

  // pagination
  const pageSize = 6; // 6 κάρτες/σελίδα => 3 σειρές * 2 κάρτες
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const [lostRes, petsRes] = await Promise.all([api.get("/lostPets"), api.get("/pets")]);

        const lost = lostRes.data ?? [];
        const pets = petsRes.data ?? [];
        const map = Object.fromEntries(pets.map((p) => [p.id, p]));

        setLostPets(lost);
        setPetsById(map);
      } catch (err) {
        console.error("Failed to load lost pets:", err);
        setLostPets([]);
        setPetsById({});
      }
    })();
  }, []);

  const allSpecies = useMemo(() => {
    const set = new Set(
      Object.values(petsById)
        .map((p) => p.species)
        .filter(Boolean)
    );
    return ["all", ...Array.from(set)];
  }, [petsById]);

  const allAreas = useMemo(() => {
    const set = new Set(lostPets.map((l) => l.area).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [lostPets]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return lostPets.filter((l) => {
      const pet = petsById[l.petId];
      if (!pet) return false;

      if (species !== "all" && pet.species !== species) return false;
      if (area !== "all" && l.area !== area) return false;

      if (!query) return true;

      const hay = [pet.name, pet.microchip, pet.color, pet.species, l.area, l.details]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [lostPets, petsById, q, species, area]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  // όταν αλλάζουν φίλτρα, γύρνα σελίδα 1
  useEffect(() => setPage(1), [q, species, area]);

  // clamp σελίδα
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // κοινό πλάτος για να “κάθεται” όπως το mock
  const contentMaxWidth = 1100;

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {/* Breadcrumb + back (σε μία γραμμή όπως στο screenshot) */}
        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto", mb: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Αρχική→Απολεσθέντα ζώα
            </Typography>

            <Button
              onClick={() => navigate("/")}
              startIcon={<ArrowBackIosNewIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                color: "text.primary",
                fontWeight: 700,
                px: 0,
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              Επιστροφή στην αρχική σελίδα
            </Button>
          </Stack>
        </Box>

        {/* Hero */}
        <Box sx={{ maxWidth: contentMaxWidth, mx: "auto" }}>
          <Box
            sx={{
              bgcolor: "grey.300",
              border: "1px solid",
              borderColor: "grey.400",
              py: 5,
              mb: 3,
            }}
          >
            <Stack spacing={1} sx={{ textAlign: "center" }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 900, letterSpacing: -0.5, color: "text.primary" }}
              >
                Απολεσθέντα Κατοικίδια
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Αναζητήστε και βοηθήστε στην επιστροφή των απολεσθέντων
                <br />
                κατοικιδίων στις οικογένειές τους
              </Typography>
            </Stack>
          </Box>

          {/* Filters bar */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.25,
              borderRadius: 999,
              borderColor: "grey.400",
              bgcolor: "common.white",
              mb: 1.5,
            }}
          >
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Αναζήτηση (Όνομα, Microchip, Ράτσα)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: 999 },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Select
                  fullWidth
                  size="small"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  sx={{ borderRadius: 999 }}
                >
                  {allSpecies.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s === "all" ? "Όλα τα είδη" : s}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={12} md={3}>
                <Select
                  fullWidth
                  size="small"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  sx={{ borderRadius: 999 }}
                >
                  {allAreas.map((a) => (
                    <MenuItem key={a} value={a}>
                      {a === "all" ? "Όλες οι περιοχές" : a}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </Paper>

          {/* Count line (διορθωμένο) */}
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Βρέθηκαν {filtered.length} απολεσθέντα κατοικίδια
          </Typography>

          {/* ✅ Cards grid: ΠΑΝΤΑ 2 κάρτες ανά σειρά σε desktop/tablet */}
          <Grid container spacing={3} justifyContent="flex-start" alignItems="stretch">
            {pageItems.map((l) => (
              <Grid
                key={l.id}
                item
                xs={12}
                sm={6}
                md={6}
                lg={6}
                sx={{ display: "flex" }}
              >
                <LostPetCard
                  lost={l}
                  pet={petsById[l.petId]}
                  onOpen={() => navigate(`/lost/${l.id}`)}
                />
              </Grid>
            ))}
          </Grid>

          {/* ✅ Pagination (αρίθμηση) κάτω, όταν υπάρχουν περισσότερα */}
          {totalPages > 1 && (
            <Stack alignItems="center" sx={{ mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_e, p) => setPage(p)}
                shape="rounded"
                siblingCount={1}
                boundaryCount={1}
              />
            </Stack>
          )}
        </Box>
      </Container>
    </Box>
  );
}

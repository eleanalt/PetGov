import React, { useEffect, useMemo, useState } from "react";
import LostBreadcrumbs from "../../components/LostBreadcrumbs";

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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

/**
 * Βάλε την εικόνα που θες στο: /public/dog.jpg
 * (Vite: ό,τι είναι στο public σερβίρεται από "/")
 */
function PetPhoto({ src, alt }) {
  return (
    <Box
      component="img"
      src={src || "/dog.jpg"}
      alt={alt || "pet"}
      sx={{
        height: 170,
        width: "100%",
        objectFit: "cover",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "block",
        bgcolor: "grey.200",
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
        borderRadius: 2,
        height: "100%",
      }}
    >
      <CardContent>
        <PetPhoto src={imgSrc} alt={pet?.name} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight={900}>
            {pet?.name ?? "—"}
          </Typography>
          <Chip size="small" label={pet?.species ?? "—"} />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {pet?.color ?? "—"} • {pet?.sex ?? "—"}
        </Typography>

        <Stack spacing={1} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlaceOutlinedIcon fontSize="small" />
            <Typography variant="body2">{lost.area}</Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthOutlinedIcon fontSize="small" />
            <Typography variant="body2">Ημερομηνία απώλειας: {lost.lostDate}</Typography>
          </Stack>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            {lost.details || "—"}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Microchip: {pet?.microchip ?? "—"}
          </Typography>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          onClick={onOpen}
          sx={{
            mt: 2,
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 2,
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
  const pageSize = 6; // ✅ 6 ανά σελίδα
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const [lostRes, petsRes] = await Promise.all([api.get("/lostPets"), api.get("/pets")]);

      const lost = lostRes.data ?? [];
      const pets = petsRes.data ?? [];
      const map = Object.fromEntries(pets.map((p) => [p.id, p]));

      setLostPets(lost);
      setPetsById(map);
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

  // αν αλλάξουν φίλτρα → πήγαινε στην 1η σελίδα
  useEffect(() => {
    setPage(1);
  }, [q, species, area]);

  // clamp page αν μειωθούν results
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <LostBreadcrumbs />
        {/* Header */}
        <Stack spacing={1} sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight={900}>
            Απολεσθέντα Κατοικίδια
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Αναζητήστε και βοηθήστε στην επιστροφή των απολεσθέντων κατοικιδίων στις οικογένειές τους
          </Typography>
        </Stack>

        {/* ✅ Κοινό πλάτος (ίδιο) για Filters + Cards ώστε να είναι τέλεια ευθυγραμμισμένα */}
        <Box sx={{ maxWidth: 1100, mx: "auto" }}>
          {/* Filters */}
          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Αναζήτηση (Όνομα, Microchip, Ράτσα)"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Select fullWidth value={species} onChange={(e) => setSpecies(e.target.value)}>
                    {allSpecies.map((s) => (
                      <MenuItem key={s} value={s}>
                        {s === "all" ? "Όλα τα είδη" : s}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Select fullWidth value={area} onChange={(e) => setArea(e.target.value)}>
                    {allAreas.map((a) => (
                      <MenuItem key={a} value={a}>
                        {a === "all" ? "Όλες οι περιοχές" : a}
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary">
                Βρέθηκαν {filtered.length} απολεσθέντα κατοικίδια
              </Typography>
            </CardContent>
          </Card>

        {/* Cards */}
<Box sx={{ mt: 1, px: 1 /* +8px για να ακυρώσει το -8px του Grid spacing */ }}>
  <Grid container spacing={2} justifyContent="center">
    {pageItems.map((l) => (
      <Grid
        key={l.id}
        item
        xs={12}
        sm={6}
        md={4} // 3 ανά σειρά σε desktop
        sx={{ display: "flex" }}
      >
        <Box sx={{ width: "100%" }}>
          <LostPetCard
            lost={l}
            pet={petsById[l.petId]}
           onOpen={() =>
  navigate(`/lost/${l.id}`, {
    state: { petName: petsById[l.petId]?.name },
  })
}

          />
        </Box>
      </Grid>
    ))}
  </Grid>
</Box>


          {/* Pagination */}
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_e, p) => setPage(p)}
              shape="rounded"
            />
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

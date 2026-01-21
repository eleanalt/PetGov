import React, { useEffect, useMemo, useState } from "react";
import LostBreadcrumbs from "../../components/LostBreadcrumbs";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PetsIcon from "@mui/icons-material/Pets";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import BadgeIcon from "@mui/icons-material/Badge";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

function statusChipProps(status) {
  const s = (status || "").toLowerCase();
  if (s === "submitted") return { label: "ΑΝΟΙΧΤΗ", color: "primary" };
  if (s === "found") return { label: "ΒΡΕΘΗΚΕ", color: "success" };
  if (s === "cancelled") return { label: "ΑΚΥΡΩΜΕΝΗ", color: "default" };
  return { label: "ΠΡΟΣΧΕΔΙΟ", color: "warning" };
}

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Box sx={{ mt: "2px", color: "text.secondary" }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {label}
        </Typography>
        <Typography fontWeight={800} sx={{ lineHeight: 1.25 }}>
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

function PhotoTile({ src, h = 240, radius = 3 }) {
  const hasSrc = Boolean(src);

  return (
    <Box
      onClick={() => {
        if (hasSrc) window.open(src, "_blank", "noopener,noreferrer");
      }}
      sx={{
        height: h,
        width: "100%",
        borderRadius: radius,
        overflow: "hidden",
        position: "relative",
        bgcolor: "grey.200",
        cursor: hasSrc ? "pointer" : "default",
        boxShadow: hasSrc ? "0 12px 30px rgba(0,0,0,0.10)" : "none",
        border: "1px solid",
        borderColor: "divider",
        transition: "transform .15s ease, box-shadow .15s ease",
        "&:hover": hasSrc
          ? {
              transform: "translateY(-2px)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.14)",
            }
          : undefined,
      }}
    >
      {hasSrc ? (
        <>
          <Box
            component="img"
            src={src}
            alt="pet"
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              position: "absolute",
              right: 10,
              bottom: 10,
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "rgba(0,0,0,0.55)",
              color: "common.white",
              fontSize: 12,
              fontWeight: 700,
              backdropFilter: "blur(6px)",
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 16 }} />
            <span>Μεγέθυνση</span>
          </Stack>
        </>
      ) : (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            fontWeight: 800,
            background:
              "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 10px, transparent 10px, transparent 20px)",
          }}
        >
          Δεν υπάρχει φωτογραφία
        </Box>
      )}
    </Box>
  );
}

function SoftCard({ title, icon, children }) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          {icon ? <Box sx={{ color: "text.secondary" }}>{icon}</Box> : null}
          <Typography fontWeight={900}>{title}</Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default function LostPetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lost, setLost] = useState(null);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const lostRes = await api.get(`/lostPets/${id}`);
        if (!alive) return;
        setLost(lostRes.data);

        const petRes = await api.get(`/pets/${lostRes.data.petId}`);
        if (!alive) return;
        setPet(petRes.data);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const photos = useMemo(() => {
    const arr = Array.isArray(lost?.photos) ? lost.photos : [];
    return {
      p0: arr?.[0] || "",
      p1: arr?.[1] || "",
      p2: arr?.[2] || "",
    };
  }, [lost]);

  if (loading) {
    return (
      <Box sx={{ bgcolor: "grey.50", minHeight: "calc(100vh - 76px)", py: 8 }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography color="text.secondary">Φόρτωση...</Typography>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (!lost || !pet) {
    return (
      <Box sx={{ bgcolor: "grey.50", minHeight: "calc(100vh - 76px)", py: 8 }}>
        <Container maxWidth="lg">
          <Typography fontWeight={900} sx={{ mb: 1 }}>
            Δεν βρέθηκαν στοιχεία
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/lost")}
            sx={{ textTransform: "none" }}
          >
            Επιστροφή
          </Button>
        </Container>
      </Box>
    );
  }

  const chip = statusChipProps(lost.status);

  return (
    <Box
      sx={{
        bgcolor: "grey.50",
        minHeight: "calc(100vh - 76px)",
        py: 3,
      }}
    >
      <Container maxWidth="lg">
        <LostBreadcrumbs />

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/lost")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        {/* Hero */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            mb: 2,
            overflow: "hidden",
            boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
            background:
              "linear-gradient(135deg, rgba(25,118,210,0.10) 0%, rgba(156,39,176,0.06) 40%, rgba(0,0,0,0) 100%)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                    {pet.name}
                  </Typography>
                  <Chip
                    label={chip.label}
                    color={chip.color}
                    size="small"
                    sx={{ fontWeight: 900 }}
                  />
                </Stack>

                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Δήλωση απώλειας κατοικιδίου • Microchip:{" "}
                  <Box component="span" sx={{ fontWeight: 900 }}>
                    {pet.microchip || "—"}
                  </Box>
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => navigate(`/lost/${lost.id}/found`)}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  px: 2.5,
                  py: 1.2,
                  boxShadow: "0 14px 30px rgba(25,118,210,0.25)",
                }}
              >
                Αναφορά Εύρεσης
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2} alignItems="flex-start">
          {/* Left */}
          <Grid size={{ xs: 12, md: 6 }}>
            <SoftCard title="Στοιχεία κατοικιδίου" icon={<PetsIcon />}>
              <Divider sx={{ mb: 1.5 }} />
              <InfoRow icon={<PetsIcon fontSize="small" />} label="Είδος" value={pet.species} />
              <Divider />
              <InfoRow
                icon={
                  String(pet.sex || "").toLowerCase().includes("θη")
                    ? <FemaleIcon fontSize="small" />
                    : <MaleIcon fontSize="small" />
                }
                label="Φύλο"
                value={pet.sex}
              />
              <Divider />
              <InfoRow icon={<EventIcon fontSize="small" />} label="Ημ/νία απώλειας" value={lost.lostDate} />
              <Divider />
              <InfoRow icon={<LocationOnIcon fontSize="small" />} label="Περιοχή" value={lost.area} />
              <Divider />
              <InfoRow icon={<BadgeIcon fontSize="small" />} label="Microchip" value={pet.microchip} />
            </SoftCard>

            <Box sx={{ mt: 2 }}>
              <SoftCard title="Περιγραφή" icon={<BadgeIcon />}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line", lineHeight: 1.7 }}
                >
                  {lost.details || "—"}
                </Typography>
              </SoftCard>
            </Box>

            <Box sx={{ mt: 2 }}>
              <SoftCard title="Σημαντική υπόδειξη" icon={<WarningAmberIcon />}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Μην πλησιάσετε το ζώο αν φαίνεται φοβισμένο. Επικοινωνήστε άμεσα με τον ιδιοκτήτη.
                </Typography>
              </SoftCard>
            </Box>
          </Grid>

          {/* Right */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 90 } }}>
              <PhotoTile src={photos.p0} h={340} radius={4} />

              

              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography fontWeight={950} sx={{ mb: 0.75 }}>
                    Αν το έχετε δει
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                    Αν έχετε δει ή βρει το εικονιζόμενο κατοικίδιο, ενημερώστε άμεσα τον ιδιοκτήτη.
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<SearchIcon />}
                    onClick={() => navigate(`/lost/${lost.id}/found`)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 950,
                      borderRadius: 2.5,
                      py: 1.2,
                    }}
                  >
                    Αναφορά Εύρεσης
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 4 }} />
      </Container>
    </Box>
  );
}

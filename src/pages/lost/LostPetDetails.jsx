import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

function PhotoBox({ src, h = 220 }) {
  return (
    <Box
      sx={{
        height: h,
        width: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 0, 
        overflow: "hidden",
        bgcolor: "grey.300",
        position: "relative",
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt="pet"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(45deg,
                transparent 49.3%,
                rgba(255,255,255,0.9) 49.3%,
                rgba(255,255,255,0.9) 50.7%,
                transparent 50.7%
              ),
              linear-gradient(-45deg,
                transparent 49.3%,
                rgba(255,255,255,0.9) 49.3%,
                rgba(255,255,255,0.9) 50.7%,
                transparent 50.7%
              )
            `,
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        />
      )}
    </Box>
  );
}

export default function LostPetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lost, setLost] = useState(null);
  const [pet, setPet] = useState(null);

  useEffect(() => {
    (async () => {
      const lostRes = await api.get(`/lostPets/${id}`);
      setLost(lostRes.data);

      const petRes = await api.get(`/pets/${lostRes.data.petId}`);
      setPet(petRes.data);
    })();
  }, [id]);

  if (!lost || !pet) return null;

  const photos = Array.isArray(lost.photos) ? lost.photos : [];

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 3 }}>
      <Container maxWidth="lg">
         <LostBreadcrumbs />
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/lost")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Grid container spacing={2} alignItems="flex-start">
          {/* Left column */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
              {pet.name}
            </Typography>

            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Στοιχεία Κατοικιδίου:
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Χρώμα:
                    </Typography>
                    <Typography fontWeight={700}>{pet.color}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Είδος:
                    </Typography>
                    <Typography fontWeight={700}>{pet.species}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Φύλο:
                    </Typography>
                    <Typography fontWeight={700}>{pet.sex}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Ημ/νία απώλειας:
                    </Typography>
                    <Typography fontWeight={700}>{lost.lostDate}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Περιοχή:
                    </Typography>
                    <Typography fontWeight={700}>{lost.area}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Microchip: {pet.microchip}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2, mt: 2 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Περιγραφή:
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-line" }}
                >
                  {lost.details || "—"}
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2, mt: 2 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Αναφορά εύρεσης ζώου
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Αν έχετε δει ή βρει το εικονιζόμενο κατοικίδιο ενημερώστε άμεσα
                  τον ιδιοκτήτη.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 2,
                    py: 1.2,
                  }}
                  onClick={() => navigate(`/lost/${lost.id}/found`)}
                >
                  Αναφορά Εύρεσης
                </Button>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ borderRadius: 2, mt: 2 }}>
              <CardContent>
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Σημαντική Υπόδειξη
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Μην πλησιάσετε το ζώο αν φαίνεται φοβισμένο. Επικοινωνήστε άμεσα
                  με τον ιδιοκτήτη.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {/* μεγάλη φωτο */}
              <PhotoBox src={photos[0]} h={320} />

              {/* δύο μικρές από κάτω */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <PhotoBox src={photos[1]} h={160} />
                </Grid>
                <Grid item xs={6}>
                  <PhotoBox src={photos[2]} h={160} />
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ mt: 4 }} />
      </Container>
    </Box>
  );
}

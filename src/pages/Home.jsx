import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Link,
  Stack,
  Typography,
  Divider
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

function InfoCard({ title, subtitle, items, ctaLabel, onCta }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>

        <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
          {items.map((t) => (
            <li key={t}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {t}
              </Typography>
            </li>
          ))}
        </Box>

        <Button onClick={onCta} sx={{ mt: 2 }} variant="text">
          {ctaLabel} →
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* HERO with background image */}
      <Box
        sx={{
          position: "relative",
          borderRadius: 0,
          overflow: "hidden",
          minHeight: { xs: 420, md: 520 },
          border: "1px solid",
          borderColor: "divider",
          color: "common.white",
          backgroundImage: `url(/hero-pets.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* dark overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.18) 100%)"
          }}
        />



        {/* Content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            px: { xs: 2.5, md: 6 },
            pt: { xs: 6, md: 8 },
            pb: { xs: 4, md: 6 }
          }}
        >
          <Box sx={{ maxWidth: 760 }}>
            <Typography variant="h3" sx={{ lineHeight: 1.1, fontWeight: 800 }}>
              Εθνικό Μητρώο{" "}
              <Box component="span" sx={{ color: "#F5A524" }}>
                Κατοικιδίων Ζώων
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{ mt: 2, opacity: 0.95, maxWidth: 620 }}
            >
              Η ψηφιακή πλατφόρμα για την καταγραφή, παρακολούθηση και προστασία
              των κατοικιδίων ζώων στην Ελλάδα.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                size="large"
                variant="contained"
                startIcon={<PetsIcon />}
                onClick={() => navigate("/login")}
                sx={{
                  bgcolor: "rgba(255,255,255,0.92)",
                  color: "text.primary",
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" }
                }}
              >
                Είμαι ιδιοκτήτης
              </Button>

              <Button
                size="large"
                variant="outlined"
                startIcon={<MedicalServicesIcon />}
                onClick={() => navigate("/login")}
                sx={{
                  borderColor: "rgba(255,255,255,0.75)",
                  color: "common.white",
                  "&:hover": { borderColor: "rgba(255,255,255,1)" }
                }}
              >
                Είμαι κτηνίατρος
              </Button>
            </Stack>

            <Button
              variant="text"
              startIcon={<SearchIcon />}
              onClick={() => navigate("/lost")}
              sx={{
                mt: 2,
                px: 0,
                color: "common.white",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                "&:hover": { textDecoration: "underline" }
              }}
            >
              Αναζήτηση απολεσθέντων ζώων →
            </Button>

            <Typography variant="caption" sx={{ display: "block", mt: 2, opacity: 0.85 }}>
              * Η αναζήτηση απολεσθέντων είναι διαθέσιμη και χωρίς λογαριασμό.
            </Typography>
          </Box>
        </Box>
      </Box>

{/* SECTION: Για όλες τις ομάδες */}
<Box sx={{ mt: 6 }}>
  <Box sx={{ maxWidth: 1100, mx: "auto" }}>
    <Typography
      variant="h5"
      fontWeight={800}
      sx={{ mb: 3, textAlign: "center" }}
    >
      Για Όλες τις Ομάδες Χρηστών
    </Typography>

    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12} md={4} sx={{ display: "flex" }}>
        <InfoCard
          title="Για Ιδιοκτήτες"
          subtitle="Διαχειριστείτε τα κατοικίδιά σας, ραντεβού και δηλώσεις απώλειας."
          items={[
            "Ψηφιακό βιβλιάριο υγείας",
            "Δήλωση απώλειας/εύρεσης",
            "Προγραμματισμός ραντεβού",
            "Αναζήτηση κτηνιάτρων"
          ]}
          ctaLabel="Περισσότερα για Ιδιοκτήτες"
          onCta={() => navigate("/info/owners")}
        />
      </Grid>

      <Grid item xs={12} md={4} sx={{ display: "flex" }}>
        <InfoCard
          title="Για Κτηνιάτρους"
          subtitle="Καταγράψτε ιατρικές πράξεις και οργανώστε τη διαθεσιμότητά σας."
          items={[
            "Καταγραφή ιατρικών πράξεων",
            "Διαχείριση ραντεβού",
            "Επαγγελματικό προφίλ",
            "Παρακολούθηση ιστορικού"
          ]}
          ctaLabel="Περισσότερα για Κτηνιάτρους"
          onCta={() => navigate("/info/vets")}
        />
      </Grid>

      <Grid item xs={12} md={4} sx={{ display: "flex" }}>
        <InfoCard
          title="Για Πολίτες"
          subtitle="Αναζητήστε απολεσθέντα και κάντε αναφορές εύρεσης."
          items={[
            "Αναζήτηση απολεσθέντων",
            "Αναφορά εύρεσης",
            "Πρόσβαση χωρίς λογαριασμό",
            "Ενημερώσεις κοινότητας"
          ]}
          ctaLabel="Περισσότερα για Πολίτες"
          onCta={() => navigate("/info/citizens")}
        />
      </Grid>
    </Grid>
  </Box>
</Box>


      {/* CTA */}
      <Card variant="outlined" sx={{ mt: 4 }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Ξεκινήστε Σήμερα
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Εγγραφείτε στην πλατφόρμα και διαχειριστείτε εύκολα όλα τα στοιχεία των κατοικιδίων σας.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate("/login")}>
            Δημιουργία Λογαριασμού
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <Box sx={{ mt: 5, mb: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Επικοινωνία: 210ΧΧΧΧΧΧΧ • 210ΧΧΧΧΧΧΧ
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Link
              component="button"
              variant="caption"
              onClick={() => alert("Placeholder: Όροι χρήσης")}
              sx={{ color: "text.secondary" }}
            >
              Όροι χρήσης
            </Link>
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Copyright 2025 • pet.gov
        </Typography>
      </Box>
    </Box>
  );
}

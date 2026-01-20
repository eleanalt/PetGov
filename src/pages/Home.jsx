import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"; // ⚠️ άλλαξε path αν στο project σου είναι αλλού

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

function getFirstName(fullName) {
  if (!fullName) return "";
  return String(fullName).trim().split(" ")[0] || "";
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isLoggedIn = !!user?.id;
  const role = user?.role; // "owner" | "vet"
  const displayName = user?.fullName || user?.name || user?.username || "";
  const firstName = getFirstName(displayName);

  const goLoginAs = (r) => navigate("/login", { state: { role: r } });

  const moreInfoPath =
    role === "owner" ? "/info/owners" : role === "vet" ? "/info/vets" : "/info/citizens";

  return (
    <Box>
      {/* HERO */}
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
          backgroundPosition: "center",
        }}
      >
        {/* overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.18) 100%)",
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            px: { xs: 2.5, md: 6 },
            pt: { xs: 6, md: 8 },
            pb: { xs: 4, md: 6 },
          }}
        >
          <Box sx={{ maxWidth: 900 }}>
            <Typography variant="h3" sx={{ lineHeight: 1.1, fontWeight: 800 }}>
              Εθνικό Μητρώο{" "}
              <Box component="span" sx={{ color: "#F5A524" }}>
                Κατοικιδίων Ζώων
              </Box>
            </Typography>

            <Typography variant="body1" sx={{ mt: 2, opacity: 0.95, maxWidth: 680 }}>
              Η ψηφιακή πλατφόρμα για την καταγραφή, παρακολούθηση και προστασία
              των κατοικιδίων ζώων στην Ελλάδα.
            </Typography>

            {/* LOGGED OUT */}
            {!isLoggedIn && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                <Button
                  size="large"
                  variant="contained"
                  startIcon={<PetsIcon />}
                  onClick={() => goLoginAs("owner")}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.92)",
                    color: "text.primary",
                    "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  Είμαι ιδιοκτήτης
                </Button>

                <Button
                  size="large"
                  variant="outlined"
                  startIcon={<MedicalServicesIcon />}
                  onClick={() => goLoginAs("vet")}
                  sx={{
                    borderColor: "rgba(255,255,255,0.75)",
                    color: "common.white",
                    "&:hover": { borderColor: "rgba(255,255,255,1)" },
                    textTransform: "none",
                    fontWeight: 800,
                  }}
                >
                  Είμαι κτηνίατρος
                </Button>

                {/* ✅ κουμπί αναζήτησης (και όταν δεν είναι logged in) */}
                <Button
                  size="large"
                  variant="text"
                  startIcon={<SearchIcon />}
                  onClick={() => navigate("/lost")}
                  sx={{
                    color: "common.white",
                    textTransform: "none",
                    fontWeight: 800,
                    width: { xs: "fit-content", sm: "auto" },
                  }}
                >
                  Αναζήτηση απολεσθέντων ζώων
                </Button>
              </Stack>
            )}

            {/* LOGGED IN */}
            {isLoggedIn && (
              <Box sx={{ mt: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.2}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    Καλώς ήρθες{firstName ? `, ${firstName}` : ""}!
                  </Typography>

                  {role && (
                    <Chip
                      size="small"
                      label={role === "owner" ? "Ιδιοκτήτης" : role === "vet" ? "Κτηνίατρος" : role}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.18)",
                        color: "common.white",
                        border: "1px solid rgba(255,255,255,0.28)",
                      }}
                    />
                  )}
                </Stack>

                <Typography variant="body2" sx={{ mt: 1, opacity: 0.92, maxWidth: 680 }}>
                  Δες γρήγορα τις βασικές ενέργειες που χρειάζεσαι από την αρχική.
                </Typography>

                {/* ✅ Συντομεύσεις (δεν πειράζονται) + κάνουμε τα 2 που ζήτησες κουμπιά */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                  {role === "owner" && (
                    <>
                      <Button
                        size="large"
                        variant="contained"
                        startIcon={<CalendarMonthIcon />}
                        onClick={() => navigate("/owner/appointments")}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.92)",
                          color: "text.primary",
                          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Τα ραντεβού μου
                      </Button>

                      <Button
                        size="large"
                        variant="outlined"
                        startIcon={<ManageAccountsIcon />}
                        onClick={() => navigate("/owner/pets")}
                        sx={{
                          borderColor: "rgba(255,255,255,0.75)",
                          color: "common.white",
                          "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Τα κατοικίδιά μου
                      </Button>

                      {/* ✅ Αναζήτηση ως ΚΟΥΜΠΙ */}
                      <Button
                        size="large"
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => navigate("/lost")}
                        sx={{
                          borderColor: "rgba(255,255,255,0.75)",
                          color: "common.white",
                          "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Αναζήτηση απολεσθέντων
                      </Button>

                      {/* ✅ Μάθετε περισσότερα ως ΚΟΥΜΠΙ */}
                      <Button
                        size="large"
                        variant="text"
                        startIcon={<InfoOutlinedIcon />}
                        onClick={() => navigate(moreInfoPath)}
                        sx={{
                          color: "common.white",
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Μάθετε περισσότερα
                      </Button>
                    </>
                  )}

                  {role === "vet" && (
                    <>
                      <Button
                        size="large"
                        variant="contained"
                        startIcon={<FactCheckIcon />}
                        onClick={() => navigate("/vet/appointments")}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.92)",
                          color: "text.primary",
                          "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Διαχείριση ραντεβού
                      </Button>

                      <Button
                        size="large"
                        variant="outlined"
                        startIcon={<MedicalServicesIcon />}
                        onClick={() => navigate("/vet/acts")}
                        sx={{
                          borderColor: "rgba(255,255,255,0.75)",
                          color: "common.white",
                          "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Ιατρικές πράξεις
                      </Button>

                      <Button
                        size="large"
                        variant="outlined"
                        startIcon={<ManageAccountsIcon />}
                        onClick={() => navigate("/vet/registrations")}
                        sx={{
                          borderColor: "rgba(255,255,255,0.75)",
                          color: "common.white",
                          "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Καταγραφές
                      </Button>

                      {/* ✅ Αναζήτηση ως ΚΟΥΜΠΙ */}
                      <Button
                        size="large"
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => navigate("/lost")}
                        sx={{
                          borderColor: "rgba(255,255,255,0.75)",
                          color: "common.white",
                          "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Αναζήτηση απολεσθέντων
                      </Button>

                      {/* ✅ Μάθετε περισσότερα ως ΚΟΥΜΠΙ */}
                      <Button
                        size="large"
                        variant="text"
                        startIcon={<InfoOutlinedIcon />}
                        onClick={() => navigate(moreInfoPath)}
                        sx={{
                          color: "common.white",
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        Μάθετε περισσότερα
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ✅ “Για Όλες τις Ομάδες Χρηστών” ΜΟΝΟ όταν ΔΕΝ είναι logged-in */}
      {!isLoggedIn && (
        <Box sx={{ mt: 6 }}>
          <Box sx={{ maxWidth: 1100, mx: "auto" }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3, textAlign: "center" }}>
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
                    "Αναζήτηση κτηνιάτρων",
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
                    "Παρακολούθηση ιστορικού",
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
                    "Ενημερώσεις κοινότητας",
                  ]}
                  ctaLabel="Περισσότερα για Πολίτες"
                  onCta={() => navigate("/info/citizens")}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* CTA (μόνο logged-out) */}
      {!isLoggedIn && (
        <Card variant="outlined" sx={{ mt: 4 }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Ξεκινήστε Σήμερα
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Εγγραφείτε στην πλατφόρμα και διαχειριστείτε εύκολα όλα τα στοιχεία
              των κατοικιδίων σας.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/login")}
              sx={{ textTransform: "none", fontWeight: 900 }}
            >
              Δημιουργία Λογαριασμού
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

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
  Container,
  Divider,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import SearchIcon from "@mui/icons-material/Search";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function InfoCard({ title, subtitle, items, ctaLabel, onCta }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 4,
        overflow: "hidden",
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
        bgcolor: "background.paper",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>

        <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
          {items.map((t) => (
            <li key={t}>
              <Typography variant="body2" sx={{ mb: 0.6 }}>
                {t}
              </Typography>
            </li>
          ))}
        </Box>

        <Button
          onClick={onCta}
          variant="text"
          endIcon={<ArrowForwardIcon />}
          sx={{ mt: 2, textTransform: "none", fontWeight: 900 }}
        >
          {ctaLabel}
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
  const role = user?.role; 
  const displayName = user?.fullName || user?.name || user?.username || "";
  const firstName = getFirstName(displayName);

  const goLoginAs = (r) => navigate("/login", { state: { role: r } });


  const moreInfoFaqPath =
    role === "owner"
      ? "/info/faqs?tab=owner"
      : role === "vet"
      ? "/info/faqs?tab=vet"
      : "/info/faqs?tab=citizen";

  return (
    <Box sx={{ bgcolor: "grey.50" }}>
      {/* HERO */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: { xs: 460, md: 560 },
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
              "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.25) 100%)",
          }}
        />
        {/* soft glow */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.35,
            background:
              "radial-gradient(circle at 15% 30%, rgba(255,170,0,0.40), transparent 55%), radial-gradient(circle at 75% 45%, rgba(156,39,176,0.30), transparent 55%)",
            pointerEvents: "none",
          }}
        />

        <Container
          sx={{ position: "relative", zIndex: 2, py: { xs: 6, md: 8 } }}
          maxWidth="lg"
        >
          <Box sx={{ maxWidth: 920 }}>
            <Chip
              size="small"
              label="National Pet Registry"
              sx={{
                mb: 1.5,
                bgcolor: "rgba(255,255,255,0.14)",
                color: "common.white",
                border: "1px solid rgba(255,255,255,0.20)",
                fontWeight: 800,
              }}
            />

            <Typography
              variant="h3"
              sx={{
                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: "-0.5px",
              }}
            >
              Εθνικό Μητρώο{" "}
              <Box component="span" sx={{ color: "#F5A524" }}>
                Κατοικιδίων Ζώων
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mt: 2,
                opacity: 0.95,
                maxWidth: 720,
                fontSize: { xs: 16, md: 18 },
              }}
            >
              Η ψηφιακή πλατφόρμα για την καταγραφή, παρακολθηση και προστασία των
              κατοικιδίων ζώων στην Ελλάδα.
            </Typography>

            {/* Actions panel (glass) */}
            <Box
              sx={{
                mt: 3,
                p: { xs: 2, md: 2.5 },
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.18)",
                bgcolor: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(8px)",
                maxWidth: 860,
              }}
            >
              {/* LOGGED OUT */}
              {!isLoggedIn && (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ flexWrap: "wrap" }}
                >
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
                      fontWeight: 900,
                      borderRadius: 999,
                      px: 2.8,
                      py: 1.15,
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
                      borderColor: "rgba(255,255,255,0.65)",
                      color: "common.white",
                      "&:hover": { borderColor: "rgba(255,255,255,1)" },
                      textTransform: "none",
                      fontWeight: 900,
                      borderRadius: 999,
                      px: 2.8,
                      py: 1.15,
                    }}
                  >
                    Είμαι κτηνίατρος
                  </Button>

                  <Button
                    size="large"
                    variant="text"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate("/lost")}
                    sx={{
                      color: "common.white",
                      textTransform: "none",
                      fontWeight: 900,
                      borderRadius: 999,
                      px: 2.2,
                      py: 1.15,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                      width: { xs: "fit-content", sm: "auto" },
                    }}
                  >
                    Αναζήτηση απολεσθέντων ζώων
                  </Button>
                </Stack>
              )}

              {/* LOGGED IN */}
              {isLoggedIn && (
                <Box>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.2}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 950 }}>
                      Καλώς ήρθες{firstName ? `, ${firstName}` : ""}!
                    </Typography>

                    {role && (
                      <Chip
                        size="small"
                        label={
                          role === "owner"
                            ? "Ιδιοκτήτης"
                            : role === "vet"
                            ? "Κτηνίατρος"
                            : role
                        }
                        sx={{
                          bgcolor: "rgba(255,255,255,0.14)",
                          color: "common.white",
                          border: "1px solid rgba(255,255,255,0.20)",
                        }}
                      />
                    )}
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.92, maxWidth: 720, mb: 2 }}
                  >
                    Δες γρήγορα τις βασικές ενέργειες που χρειάζεσαι από την
                    αρχική.
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    sx={{ flexWrap: "wrap" }}
                  >
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
                            fontWeight: 900,
                            borderRadius: 999,
                            px: 2.8,
                            py: 1.15,
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
                            borderColor: "rgba(255,255,255,0.65)",
                            color: "common.white",
                            "&:hover": { borderColor: "rgba(255,255,255,1)" },
                            textTransform: "none",
                            fontWeight: 900,
                            borderRadius: 999,
                            px: 2.8,
                            py: 1.15,
                          }}
                        >
                          Τα κατοικίδιά μου
                        </Button>

                        <Button
                          size="large"
                          variant="outlined"
                          startIcon={<SearchIcon />}
                          onClick={() => navigate("/lost")}
                          sx={{
                            borderColor: "rgba(255,255,255,0.65)",
                            color: "common.white",
                            "&:hover": { borderColor: "rgba(255,255,255,1)" },
                            textTransform: "none",
                            fontWeight: 900,
                            borderRadius: 999,
                            px: 2.8,
                            py: 1.15,
                          }}
                        >
                          Αναζήτηση απολεσθέντων
                        </Button>

                        <Button
                          size="large"
                          variant="text"
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() => navigate("/info/faqs?tab=owner")}
                          sx={{
                            color: "common.white",
                            textTransform: "none",
                            fontWeight: 900,
                            borderRadius: 999,
                            px: 2.2,
                            py: 1.15,
                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                          }}
                        >
                          Μάθετε περισσότερα
                        </Button>
                      </>
                    )}

                    {role === "vet" && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1.5,
                          "& .vetBtn": {
                            borderRadius: 999,
                            textTransform: "none",
                            fontWeight: 900,
                            py: 1.15,
                            px: 2.8,
                            minWidth: { xs: "100%", sm: 240 },
                            justifyContent: "flex-start",
                          },
                        }}
                      >
                        <Button
                          size="large"
                          variant="contained"
                          startIcon={<FactCheckIcon />}
                          onClick={() => navigate("/vet/appointments")}
                          className="vetBtn"
                          sx={{
                            bgcolor: "rgba(255,255,255,0.92)",
                            color: "text.primary",
                            "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          }}
                        >
                          Διαχείριση ραντεβού
                        </Button>

                        <Button
                          size="large"
                          variant="outlined"
                          startIcon={<MedicalServicesIcon />}
                          onClick={() => navigate("/vet/acts")}
                          className="vetBtn"
                          sx={{
                            borderColor: "rgba(255,255,255,0.65)",
                            color: "common.white",
                            "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          }}
                        >
                          Ιατρικές πράξεις
                        </Button>

                        <Button
                          size="large"
                          variant="outlined"
                          startIcon={<ManageAccountsIcon />}
                          onClick={() => navigate("/vet/registrations")}
                          className="vetBtn"
                          sx={{
                            borderColor: "rgba(255,255,255,0.65)",
                            color: "common.white",
                            "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          }}
                        >
                          Καταγραφές
                        </Button>

                        <Button
                          size="large"
                          variant="outlined"
                          startIcon={<SearchIcon />}
                          onClick={() => navigate("/lost")}
                          className="vetBtn"
                          sx={{
                            borderColor: "rgba(255,255,255,0.65)",
                            color: "common.white",
                            "&:hover": { borderColor: "rgba(255,255,255,1)" },
                          }}
                        >
                          Αναζήτηση απολεσθέντων
                        </Button>

                        <Button
                          size="large"
                          variant="text"
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() => navigate("/info/faqs?tab=vet")}
                          className="vetBtn"
                          sx={{
                            color: "common.white",
                            "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                          }}
                        >
                          Μάθετε περισσότερα
                        </Button>
                      </Box>
                    )}

                    
                    {role && role !== "owner" && role !== "vet" && (
                      <Button
                        size="large"
                        variant="text"
                        startIcon={<InfoOutlinedIcon />}
                        onClick={() => navigate("/info/faqs?tab=citizen")}
                        sx={{
                          color: "common.white",
                          textTransform: "none",
                          fontWeight: 900,
                          borderRadius: 999,
                          px: 2.2,
                          py: 1.15,
                          "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                        }}
                      >
                        Μάθετε περισσότερα
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Logged-out sections */}
      {!isLoggedIn && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Typography
            variant="h5"
            fontWeight={950}
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
                  "Αναζήτηση κτηνιάτρων",
                ]}
                ctaLabel="Περισσότερα για Ιδιοκτήτες"
                onCta={() => navigate("/info/faqs?tab=owner")}
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
                onCta={() => navigate("/info/faqs?tab=vet")}
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
                onCta={() => navigate("/info/faqs?tab=citizen")}
              />
            </Grid>
          </Grid>

          {/* CTA */}
          <Card
            variant="outlined"
            sx={{
              mt: 4,
              borderRadius: 4,
              boxShadow: "0 14px 36px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h5" fontWeight={950} gutterBottom>
                Ξεκινήστε Σήμερα
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, maxWidth: 720, mx: "auto" }}
              >
                Εγγραφείτε στην πλατφόρμα και διαχειριστείτε εύκολα όλα τα στοιχεία
                των κατοικιδίων σας.
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  textTransform: "none",
                  fontWeight: 950,
                  borderRadius: 999,
                  px: 3.5,
                  py: 1.1,
                }}
              >
                Δημιουργία Λογαριασμού
              </Button>
            </CardContent>
          </Card>
        </Container>
      )}
    </Box>
  );
}

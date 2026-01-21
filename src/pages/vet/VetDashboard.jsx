import React from "react";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import StarRateIcon from "@mui/icons-material/StarRate";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

function ActionButton({ label, icon, onClick, variant = "outlined" }) {
  return (
    <Button
      fullWidth
      variant={variant}
      startIcon={icon}
      onClick={onClick}
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        fontWeight: 900,
        borderRadius: 2,
        py: 1.4,
        px: 2,
      }}
    >
      {label}
    </Button>
  );
}

export default function VetDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = (user?.fullName || "Κτηνίατρος").split(" ")[0];

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
          {/* Header */}
          <Box sx={{ bgcolor: "grey.50" }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Stack spacing={0.5} alignItems="center" textAlign="center">
                <Typography variant="h4" fontWeight={900}>
                  Καλώς ήρθες, {firstName}!
                </Typography>
                <Typography color="text.secondary">
                  Επίλεξε μία ενέργεια για να συνεχίσεις.
                </Typography>
              </Stack>
            </CardContent>
          </Box>

          <Divider />

          {/* Όλες οι ενέργειες */}
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
              Διαχείριση
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Οδηγός"
                  icon={<MenuBookIcon />}
                  onClick={() => navigate("/vet")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Προφίλ"
                  icon={<PersonIcon />}
                  onClick={() => navigate("/vet/profile")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Καταγραφές"
                  icon={<AssignmentIcon />}
                  onClick={() => navigate("/vet/registrations")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Ιατρικές Πράξεις"
                  icon={<MedicalServicesIcon />}
                  onClick={() => navigate("/vet/acts")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Ραντεβού"
                  icon={<EventAvailableIcon />}
                  onClick={() => navigate("/vet/appointments")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Αξιολογήσεις"
                  icon={<StarRateIcon />}
                  onClick={() => navigate("/vet/reviews")}
                />
              </Grid>

              {/* Προαιρετικό: FAQ (αν υπάρχει route) */}
              
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

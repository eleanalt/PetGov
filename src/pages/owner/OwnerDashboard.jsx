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

import PersonIcon from "@mui/icons-material/Person";
import PetsIcon from "@mui/icons-material/Pets";
import EventIcon from "@mui/icons-material/Event";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SearchIcon from "@mui/icons-material/Search";

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

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = (user?.fullName || "Ιδιοκτήτης").split(" ")[0];

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

          {/* Main actions (όλες οι ενέργειες) */}
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
              Διαχείριση
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Προφίλ"
                  icon={<PersonIcon />}
                  onClick={() => navigate("/owner/profile")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Τα Κατοικίδιά μου"
                  icon={<PetsIcon />}
                  onClick={() => navigate("/owner/pets")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Τα Ραντεβού μου"
                  icon={<EventIcon />}
                  onClick={() => navigate("/owner/appointments")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Κλείσε Νέο Ραντεβού"
                  icon={<AddCircleOutlineIcon />}
                  onClick={() => navigate("/owner/appointments/new")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Δηλώσεις Απώλειας"
                  icon={<ReportProblemIcon />}
                  onClick={() => navigate("/owner/lost")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <ActionButton
                  label="Οι Δηλώσεις Εύρεσης μου"
                  icon={<FactCheckIcon />}
                  onClick={() => navigate("/owner/found/my")}
                />
              </Grid>

              <Grid item xs={12}>
                <ActionButton
                  label="Αναζήτηση Απολεσθέντων Ζώων"
                  icon={<SearchIcon />}
                  onClick={() => navigate("/lost")}
                  variant="contained"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

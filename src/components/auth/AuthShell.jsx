import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

export default function AuthShell({ children, mode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabValue = mode ?? (location.pathname.startsWith("/register") ? "register" : "login");

  const handleTabChange = (_e, v) => {
    navigate(v === "register" ? "/register" : "/login");
  };

  const crumb = tabValue === "register" ? "Εγγραφή" : "Σύνδεση";

  return (
    <Box sx={{ px: 2, pb: 6 }}>
      {/* Breadcrumb + back */}
      {/* Top bar: full width (τερμα αριστερά) */}
{/* Breadcrumb + back (FULL WIDTH για να πάει τέρμα αριστερά) */}
<Box sx={{ mb: 2 }}>
  <Typography variant="caption" color="text.secondary">
    Αρχική → {crumb}
  </Typography>

  <Button
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate("/")}
    sx={{
      mt: 0.5,
      textTransform: "none",
      color: "text.primary",
      justifyContent: "flex-start",
      px: 0,
      display: "flex"
    }}
    variant="text"
  >
    Επιστροφή στην αρχική σελίδα
  </Button>
</Box>


      {/* Center Card */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Card
          variant="outlined"
          sx={{
            width: "min(520px, 94vw)",
            borderRadius: 2,
            boxShadow: "0 8px 22px rgba(0,0,0,0.10)"
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} align="center">
              Καλώς Ήρθατε
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 0.5, mb: 2 }}
            >
              Εγγραφείτε ή συνδεθείτε
            </Typography>

            {/* Tabs like the mockups */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 2
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="standard"
                sx={{
                  bgcolor: "rgba(0,0,0,0.05)",
                  borderRadius: 2,
                  px: 0.5,
                  minHeight: 42,
                  "& .MuiTab-root": {
                    textTransform: "none",
                    minHeight: 42,
                    fontWeight: 700
                  }
                }}
              >
                <Tab value="login" label="Σύνδεση" />
                <Tab value="register" label="Εγγραφή" />
              </Tabs>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {children}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Typography
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export default function InfoFaqPage({ crumbLabel, title, intro, faqs }) {
  const navigate = useNavigate();

  return (
    <Box sx={{ px: 2, pb: 6 }}>
      {/* Breadcrumb + back */}
      {/* Top bar: full width (τερμα αριστερά) */}
<Box sx={{ mb: 2 }}>
  <Typography variant="caption" color="text.secondary">
    Αρχική → {crumbLabel}
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

      {/* Content */}
      <Box sx={{ maxWidth: 980, mx: "auto" }}>
        <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
          {title}
        </Typography>

        {intro && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 900 }}>
            {intro}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ bgcolor: "rgba(0,0,0,0.02)", borderRadius: 2, p: { xs: 1, md: 2 } }}>
          {faqs.map((f, idx) => (
            <Accordion key={idx} disableGutters elevation={0} sx={{ bgcolor: "transparent" }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={800}>{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                  {f.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

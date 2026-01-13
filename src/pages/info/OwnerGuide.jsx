import React from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export default function OwnerGuide() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Breadcrumb / Επιστροφή */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 3 }}
      >
        Επιστροφή στην αρχική σελίδα
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Τίτλος */}
        <Typography variant="h4" gutterBottom align="center">
          Οδηγός Λειτουργίας
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Βιβλιάριο Υγείας */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Βιβλιάριο Υγείας
          </Typography>
          <Typography variant="body1">
            Προβάλετε και εκτυπώστε το ψηφιακό βιβλιάριο υγείας των κατοικιδίων
            σας. Μέσα από την πλατφόρμα μπορείτε να παρακολουθείτε:
          </Typography>
          <ul>
            <li>Ιατρικές πράξεις</li>
            <li>Εμβολιασμούς</li>
            <li>Κτηνιατρικές επισκέψεις</li>
          </ul>
        </Box>

        {/* Δήλωση Απώλειας / Εύρεσης */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Δήλωση Απώλειας / Εύρεσης
          </Typography>
          <Typography variant="body1">
            Δηλώστε την απώλεια ή την εύρεση του κατοικιδίου σας και ενημερώστε
            άμεσα την κοινότητα. Η δήλωση μπορεί να αποθηκευτεί προσωρινά ή να
            υποβληθεί οριστικά.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Με αυτόν τον τρόπο συμβάλλετε στην επανένωση χαμένων κατοικιδίων με
            τους ιδιοκτήτες τους.
          </Typography>
        </Box>

        {/* Προγραμματισμός Ραντεβού */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Προγραμματισμός Ραντεβού
          </Typography>
          <Typography variant="body1">
            Αναζητήστε κτηνιάτρους με βάση:
          </Typography>
          <ul>
            <li>Περιοχή</li>
            <li>Ειδικότητα</li>
            <li>Διαθεσιμότητα</li>
          </ul>
          <Typography variant="body1">
            Προγραμματίστε ραντεβού για ιατρικές πράξεις ή καταγραφή στο βιβλιάριο
            υγείας.
          </Typography>
        </Box>

        {/* Εκτύπωση */}
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.print()}
          >
            Εκτύπωση Πληροφοριών
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

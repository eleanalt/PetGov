import React from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Breadcrumbs,
  Link as MLink,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";

export default function OwnerGuide() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στην αρχική σελίδα
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mt: 1 }}>
            Οδηγός Λειτουργίας
          </Typography>

          <Stack spacing={2} sx={{ mt: 2 }}>
            <Section
              title="Βιβλιάριο Υγείας"
              text="Προβάλλετε και εκτυπώστε το ψηφιακό βιβλιάριο υγείας των κατοικιδίων σας. Παρακολουθήστε όλες τις ιατρικές πράξεις, εμβολιασμούς και επισκέψεις."
            />
            <Section
              title="Δήλωση Απώλειας/Εύρεσης"
              text="Δηλώστε την απώλεια ή την εύρεση του κατοικιδίου σας και ενημερώστε την κοινότητα. Μπορείτε να αποθηκεύσετε προσωρινά τη δήλωση (πρόχειρη) ή να την υποβάλετε οριστικά."
            />
            <Section
              title="Έλεγχος Ιστορικού"
              text="Δείτε το ιστορικό δηλώσεων που έχετε υποβάλει (απώλειας & εύρεσης), την κατάστασή τους και τις λεπτομέρειες."
            />
            <Section
              title="Προγραμματισμός Ραντεβού"
              text="Βρείτε κτηνιάτρους με βάση περιοχή/διαθεσιμότητα και κλείστε ραντεβού ανάλογα με το είδος της πράξης."
            />

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                sx={{ textTransform: "none", borderRadius: 2, px: 6, bgcolor: "grey.700" }}
                onClick={() => alert("FAQ: (αν θες, το υλοποιούμε σε ξεχωριστή σελίδα)")}
              >
                Συχνές Ερωτήσεις (FAQ)
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function Section({ title, text }) {
  return (
    <Box>
      <Typography fontWeight={900} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}
7
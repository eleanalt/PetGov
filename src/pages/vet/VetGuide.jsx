import React from "react";
import { Box, Button, Card, CardContent, Container, Divider, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function VetGuide() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 2 }}>
              Οδηγός Λειτουργίας
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={900}>1. Καταγραφή Κατοικιδίων</Typography>
                <Typography color="text.secondary">
                  Καταγράψτε την ταυτότητα των κατοικιδίων (μικροτσίπ, είδος, φύλο, όνομα) και συμβάντα ζωής
                  (απώλεια, εύρεση, μεταβίβαση, υιοθεσία, αναδοχή).
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight={900}>2. Διαχείριση Ραντεβού</Typography>
                <Typography color="text.secondary">
                  Ορίστε τη διαθεσιμότητά σας, λάβετε αιτήματα ραντεβού και επιβεβαιώστε/απορρίψτε τα σύμφωνα με το
                  πρόγραμμά σας.
                </Typography>
              </Box>

              <Box>
                <Typography fontWeight={900}>3. Καταγραφή Ιατρικών Πράξεων</Typography>
                <Typography color="text.secondary">
                  Καταγράψτε εμβολιασμούς, εξετάσεις, χειρουργεία και άλλες ιατρικές πράξεις στο ψηφιακό βιβλιάριο
                  υγείας του κατοικιδίου.
                </Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Stack alignItems="center">
                <Button
                  variant="contained"
                  onClick={() => navigate("/vet/faq")}
                  sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2, px: 4, py: 1.2 }}
                >
                  Συχνές Ερωτήσεις (FAQ)
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

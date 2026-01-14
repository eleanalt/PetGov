import React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function OwnerPetHealth() {
  const navigate = useNavigate();

  // Mock δεδομένα κατοικιδίου
  const pet = {
    name: "Μπρούνο",
    species: "Σκύλος",
    breed: "Labrador",
    age: 4,
    chipId: "123456789",
    healthRecords: [
      {
        date: "10/01/2024",
        type: "Εμβολιασμός",
        description: "Εμβόλιο λύσσας",
        vet: "Δρ. Παπαδόπουλος",
      },
      {
        date: "22/06/2024",
        type: "Ιατρική Πράξη",
        description: "Αποπαρασίτωση",
        vet: "Δρ. Ιωάννου",
      },
    ],
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Button onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        ← Επιστροφή
      </Button>

      {/* Στοιχεία Κατοικιδίου */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Στοιχεία Κατοικιδίου
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography>Όνομα: {pet.name}</Typography>
          <Typography>Είδος: {pet.species}</Typography>
          <Typography>Ράτσα: {pet.breed}</Typography>
          <Typography>Ηλικία: {pet.age} ετών</Typography>
          <Typography>Microchip ID: {pet.chipId}</Typography>
        </CardContent>
      </Card>

      {/* Βιβλιάριο Υγείας */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Βιβλιάριο Υγείας
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {pet.healthRecords.map((record, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Typography fontWeight="bold">{record.date}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography>{record.type}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography>{record.description}</Typography>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Typography>{record.vet}</Typography>
                </Grid>
              </Grid>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}

          {/* Εκτύπωση */}
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.print()}
            >
              Εκτύπωση Βιβλιαρίου Υγείας
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

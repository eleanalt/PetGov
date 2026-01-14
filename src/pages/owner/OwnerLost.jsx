import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Box,
} from "@mui/material";

export default function OwnerLost() {
  const [status, setStatus] = useState("draft"); // draft | submitted

  const [formData, setFormData] = useState({
    petName: "",
    description: "",
    lastLocation: "",
    dateLost: "",
  });

  const isReadOnly = status === "submitted";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Δήλωση Απώλειας Κατοικιδίου
          </Typography>

          {/* Κατάσταση Δήλωσης */}
          <Box sx={{ mb: 2 }}>
            <Chip
              label={
                status === "draft"
                  ? "Προσωρινή Αποθήκευση"
                  : "Οριστική Υποβολή"
              }
              color={status === "draft" ? "warning" : "success"}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Όνομα Κατοικιδίου"
                name="petName"
                fullWidth
                value={formData.petName}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Περιγραφή"
                name="description"
                multiline
                rows={3}
                fullWidth
                value={formData.description}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Τελευταία Τοποθεσία"
                name="lastLocation"
                fullWidth
                value={formData.lastLocation}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Ημερομηνία Απώλειας"
                name="dateLost"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.dateLost}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>

          {/* Κουμπιά */}
          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            {status === "draft" && (
              <>
                <Button variant="outlined">
                  Προσωρινή Αποθήκευση
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setStatus("submitted")}
                >
                  Οριστική Υποβολή
                </Button>
              </>
            )}

            {status === "submitted" && (
              <Typography color="text.secondary">
                Η δήλωση έχει υποβληθεί και δεν μπορεί να τροποποιηθεί.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}



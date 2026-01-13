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

export default function OwnerFound() {
  const [status, setStatus] = useState("draft");

  const [formData, setFormData] = useState({
    description: "",
    location: "",
    dateFound: "",
    notes: "",
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
            Δήλωση Εύρεσης Κατοικιδίου
          </Typography>

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
                label="Περιγραφή Κατοικιδίου"
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
                label="Τοποθεσία Εύρεσης"
                name="location"
                fullWidth
                value={formData.location}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Ημερομηνία Εύρεσης"
                name="dateFound"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.dateFound}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Σημειώσεις"
                name="notes"
                multiline
                rows={2}
                fullWidth
                value={formData.notes}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            {status === "draft" && (
              <>
                <Button variant="outlined">
                  Προσωρινή Αποθήκευση
                </Button>
                <Button
                  variant="contained"
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

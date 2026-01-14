import React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Box,
  Divider,
} from "@mui/material";

export default function OwnerDeclarationsHistory() {
  // Mock ιστορικό
  const declarations = [
    {
      id: 1,
      type: "Απώλεια",
      pet: "Μπρούνο",
      date: "12/02/2024",
      status: "submitted",
    },
    {
      id: 2,
      type: "Εύρεση",
      pet: "Άγνωστο",
      date: "05/03/2024",
      status: "draft",
    },
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Ιστορικό Δηλώσεων
      </Typography>

      {declarations.map((d) => (
        <Card key={d.id} sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography fontWeight="bold">{d.type}</Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Typography>{d.pet}</Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Typography>{d.date}</Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Chip
                  label={
                    d.status === "submitted"
                      ? "Οριστική"
                      : "Προσωρινή"
                  }
                  color={d.status === "submitted" ? "success" : "warning"}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      ))}
    </Container>
  );
}

import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

export default function OwnerPets() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Τα κατοικίδιά μου</Typography>
        <Typography variant="body2">Placeholder page (θα συνδεθεί με /pets).</Typography>
      </CardContent>
    </Card>
  );
}

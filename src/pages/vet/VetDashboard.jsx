import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useAuth } from "../../auth/AuthContext";

export default function VetDashboard() {
  const { user } = useAuth();

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Vet Dashboard</Typography>
        <Typography variant="body1">Καλωσήρθες, {user.fullName}!</Typography>
      </CardContent>
    </Card>
  );
}

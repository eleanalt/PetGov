import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { useAuth } from "../../auth/AuthContext";

export default function OwnerDashboard() {
  const { user } = useAuth();

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Owner Dashboard</Typography>
        <Typography variant="body1">Γεια σου, {user.fullName}!</Typography>
      </CardContent>
    </Card>
  );
}

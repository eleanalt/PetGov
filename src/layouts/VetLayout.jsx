import React from "react";
import { Container, Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import VetBreadcrumbs from "../components/VetBreadcrumbs"; // άλλαξε path αν χρειάζεται

export default function VetLayout() {
  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <VetBreadcrumbs />
        <Outlet />
      </Container>
    </Box>
  );
}

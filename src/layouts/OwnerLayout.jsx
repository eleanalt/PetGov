import React from "react";
import { Container, Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import OwnerBreadcrumbs from "../components/OwnerBreadcrumbs"; // άλλαξε path αν χρειάζεται

export default function OwnerLayout() {
  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <OwnerBreadcrumbs />
        <Outlet />
      </Container>
    </Box>
  );
}

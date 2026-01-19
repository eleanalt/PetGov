import React from "react";
import { Box, Container, Link, Stack, Typography } from "@mui/material";

export default function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        borderTop: "1px solid",
        borderColor: "grey.200",
        bgcolor: "white",
        py: 2,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            Επικοινωνία: 210XXXXXXX • 210XXXXXXX
          </Typography>

          {/* αν έχεις route /terms άλλαξε σε component={RouterLink} to="/terms" */}
          <Link href="#" underline="hover" color="text.secondary" sx={{ fontWeight: 600 }}>
            Όροι χρήσης
          </Link>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Copyright {new Date().getFullYear()} • pet.gov
        </Typography>
      </Container>
    </Box>
  );
}

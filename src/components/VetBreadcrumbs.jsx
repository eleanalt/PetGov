import React from "react";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink, useLocation } from "react-router-dom";

export default function VetBreadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = [
    { label: "Αρχική", to: "/" },
    { label: "Κτηνίατρος", to: "/vet" },
  ];

  if (pathname.startsWith("/vet/profile")) {
    crumbs.push({ label: "Προφίλ", to: "/vet/profile" });
  } else if (pathname.startsWith("/vet/registrations")) {
    crumbs.push({ label: "Καταγραφές", to: "/vet/registrations" });
  } else if (pathname.startsWith("/vet/availability")) {
    crumbs.push({ label: "Ραντεβού", to: "/vet/availability" });
  } else if (pathname.startsWith("/vet/appointments")) {
    crumbs.push({ label: "Ραντεβού", to: "/vet/appointments" });
  } else if (pathname.startsWith("/vet/acts")) {
    crumbs.push({ label: "Ιατρικές Πράξεις", to: "/vet/acts" });
    } else if (pathname.startsWith("/vet/reviews")) {
  crumbs.push({ label: "Αξιολογήσεις", to: "/vet/reviews" });
  } else {
    crumbs.push({ label: "Dashboard", to: "/vet" });
  }

  const lastIndex = crumbs.length - 1;

  return (
    <Stack sx={{ mb: 1.5 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
        {crumbs.map((c, idx) => {
          const isLast = idx === lastIndex;
          if (isLast) {
            return (
              <Typography key={c.label} color="text.primary" fontWeight={700}>
                {c.label}
              </Typography>
            );
          }
          return (
            <Link
              key={c.label}
              component={RouterLink}
              to={c.to}
              underline="hover"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {c.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Stack>
  );
}

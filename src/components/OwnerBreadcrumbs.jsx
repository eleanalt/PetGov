import React from "react";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink, useLocation } from "react-router-dom";

export default function OwnerBreadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = [
    { label: "Αρχική", to: "/" },
    { label: "Ιδιοκτήτης", to: "/owner" },
  ];

  if (pathname.startsWith("/owner/profile")) {
    crumbs.push({ label: "Προφίλ", to: "/owner/profile" });
  } else if (pathname.startsWith("/owner/pets")) {
    crumbs.push({ label: "Τα κατοικίδιά μου", to: "/owner/pets" });
  } else if (pathname.startsWith("/owner/appointments")) {
  
    crumbs.push({ label: "Ραντεβού", to: "/owner/appointments" });

    if (pathname.startsWith("/owner/appointments/new")) {
      crumbs.push({ label: "Νέο ραντεβού", to: "/owner/appointments/new" });
    } else if (pathname.startsWith("/owner/appointments/vet")) {
      crumbs.push({ label: "Κτηνίατρος", to: pathname });
    }
  } else if (pathname.startsWith("/owner/registrations")) {
    crumbs.push({ label: "Καταγραφές", to: "/owner/registrations" });
  } else if (pathname.startsWith("/owner/lost-pets")) {
    crumbs.push({ label: "Lost Pets", to: "/owner/lost-pets" });
  } else {

    crumbs.push({ label: "Dashboard", to: "/owner" });
  }

  const lastIndex = crumbs.length - 1;

  return (
    <Stack sx={{ mb: 1.5 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
        {crumbs.map((c, idx) => {
          const isLast = idx === lastIndex;
          if (isLast) {
            return (
              <Typography key={`${c.label}-${idx}`} color="text.primary" fontWeight={700}>
                {c.label}
              </Typography>
            );
          }
          return (
            <Link
              key={`${c.label}-${idx}`}
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

import React from "react";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";

export default function LostBreadcrumbs({ petName: petNameProp }) {
  const location = useLocation();
  const { id } = useParams();

  const path = location.pathname;

  const petNameFromState = location.state?.petName;
  const petName = petNameProp || petNameFromState;

  const crumbs = [
    { label: "Αρχική", to: "/" },
    { label: "Απολεσθέντα Κατοικίδια", to: "/lost" },
  ];

  if (id) {
    crumbs.push({
      label: petName ? petName : `Κατοικίδιο #${id}`,
      to: `/lost/${id}`,
    });
  }

  if (id && path.includes(`/lost/${id}/found`)) {
    crumbs.push({ label: "Αναφορά Εύρεσης", to: `/lost/${id}/found` });
  }

  const lastIndex = crumbs.length - 1;

  return (
    <Stack sx={{ mb: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
        {crumbs.map((c, idx) => {
          const isLast = idx === lastIndex;

          if (!c.to || isLast) {
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

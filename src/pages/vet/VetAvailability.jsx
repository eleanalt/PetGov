import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Breadcrumbs,
  Link as MLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

export default function VetAvailability() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      try {
        const res = await api.get("/vetAvailability", { params: { vetId: String(user.id) } });
        setSlots(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setSlots([]);
      }
    })();
  }, [user?.id]);

  const sorted = useMemo(() => {
    return [...slots].sort((a, b) => {
      const da = `${a.date} ${a.startTime}`;
      const db = `${b.date} ${b.startTime}`;
      return da.localeCompare(db);
    });
  }, [slots]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Breadcrumbs sx={{ color: "text.secondary" }}>
            <MLink component={RouterLink} to="/" underline="hover" color="inherit">
              Αρχική
            </MLink>
            <Typography color="text.primary">Ραντεβού</Typography>
            <Typography color="text.primary">Διαθεσιμότητα</Typography>
          </Breadcrumbs>

          <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center" }}>
            Τα διαθέσιμα Ραντεβού μου
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 180 }}>Ημερομηνία</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Πράξη</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 180 }} align="right">
                      Ώρα
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ color: "text.secondary" }}>
                        Δεν υπάρχουν διαθέσιμα slots.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.date}</TableCell>
                        <TableCell>{s.actType ?? "—"}</TableCell>
                        <TableCell align="right" sx={{ pr: 3 }}>
                          {s.startTime} - {s.endTime}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/vet/availability/edit")}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    px: 5,
                    fontWeight: 900,
                    bgcolor: "grey.700",
                  }}
                >
                  Επεξεργασία Διαθεσιμότητας
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

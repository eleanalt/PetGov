import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Breadcrumbs,
  Link as MLink,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

const STATUS_LABEL = {
  draft: { label: "Πρόχειρη", color: "default" },
  submitted: { label: "ΑΝΟΙΧΤΗ", color: "success" },
  found: { label: "ΒΡΕΘΗΚΕ", color: "success" },
  cancelled: { label: "Ακυρωμένη", color: "default" },
};

export default function OwnerLostHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const res = await api.get("/lostPets", {
        params: { ownerId: String(user.id), _sort: "createdAt", _order: "desc" },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    })();
  }, [user?.id]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Breadcrumbs sx={{ color: "text.secondary" }}>
            <MLink component={RouterLink} to="/" underline="hover" color="inherit">
              Αρχική
            </MLink>
            <MLink component={RouterLink} to="/owner/lost" underline="hover" color="inherit">
              Απώλεια/Εύρεση
            </MLink>
            <Typography color="text.primary">Ιστορικό Δηλώσεων</Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/owner/lost")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στην προηγούμενη σελίδα
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center" }}>
            Ιστορικό Δηλώσεων
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Κατοικίδιο</b></TableCell>
                      <TableCell><b>Τύπος Δήλωσης</b></TableCell>
                      <TableCell><b>Ημερομηνία</b></TableCell>
                      <TableCell><b>Κατάσταση</b></TableCell>
                      <TableCell><b>Προβολή</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>Δεν υπάρχουν δηλώσεις.</TableCell>
                      </TableRow>
                    ) : (
                      items.map((x) => {
                        const st = STATUS_LABEL[x.status] ?? STATUS_LABEL.draft;
                        return (
                          <TableRow key={x.id}>
                            <TableCell>{x.petName || "—"}</TableCell>
                            <TableCell>Απώλεια</TableCell>
                            <TableCell>{x.lostDate || x.createdAt || "—"}</TableCell>
                            <TableCell>
                              <Chip size="small" label={st.label} color={st.color} />
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => navigate(`/owner/lost/${x.id}`)}
                                sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2, px: 3 }}
                              >
                                →
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

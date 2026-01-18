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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

export default function OwnerFoundMine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const res = await api.get("/foundReports", {
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
            <Typography color="text.primary">Οι δικές μου δηλώσεις εύρεσης</Typography>
          </Breadcrumbs>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/owner/lost")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στην προηγούμενη σελίδα
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center" }}>
            Οι δικές μου δηλώσεις εύρεσης
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Κατοικίδιο</b></TableCell>
                      <TableCell><b>Περιοχή</b></TableCell>
                      <TableCell><b>Ημερομηνία</b></TableCell>
                      <TableCell><b>Κατάσταση</b></TableCell>
                      <TableCell><b>Προβολή</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>Δεν υπάρχουν δηλώσεις εύρεσης.</TableCell>
                      </TableRow>
                    ) : (
                      items.map((x) => (
                        <TableRow key={x.id}>
                          <TableCell>{x.petName || "—"}</TableCell>
                          <TableCell>{x.area || "—"}</TableCell>
                          <TableCell>{x.date || x.createdAt || "—"}</TableCell>
                          <TableCell>{x.status || "—"}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => navigate(`/owner/found/${x.id}`)}
                              sx={{ textTransform: "none", bgcolor: "grey.300", borderRadius: 2, px: 3 }}
                            >
                              →
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/owner/found/new")}
                  sx={{ textTransform: "none", borderRadius: 2, px: 6, bgcolor: "grey.700" }}
                >
                  Νέα Δήλωση Εύρεσης
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

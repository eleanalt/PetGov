import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Container,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Link as MLink,
  Button,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PetsIcon from "@mui/icons-material/Pets";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

function calcAgeLabel(birthDate) {
  if (!birthDate) return "—";
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
  if (years <= 0) return "0 έτη";
  return `${years} ${years === 1 ? "έτος" : "έτη"}`;
}

export default function OwnerPets() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await api.get("/pets", { params: { ownerId: String(user.id) } });
        setPets(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error(e);
        setPets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const sorted = useMemo(() => {
    return [...pets].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [pets]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{ textTransform: "none", width: "fit-content" }}
          >
            Επιστροφή στην αρχική σελίδα
          </Button>

          <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mt: 1 }}>
            Τα κατοικίδιά μου
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
              <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>Φωτογραφία</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Όνομα</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Είδος</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Ηλικία</TableCell>
                      <TableCell sx={{ fontWeight: 900 }} align="right">
                        Προβολή
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                          Φόρτωση...
                        </TableCell>
                      </TableRow>
                    ) : sorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                          Δεν υπάρχουν κατοικίδια.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sorted.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ width: 110 }}>
                            {/* ΕΔΩ φαίνεται η φωτο */}
                            <Avatar
                              src={p.photoDataUrl || ""}
                              variant="circular"
                              sx={{ width: 64, height: 64, bgcolor: "grey.300" }}
                            >
                              <PetsIcon />
                            </Avatar>
                          </TableCell>

                          <TableCell>{p.name || "—"}</TableCell>
                          <TableCell>{p.species || p.type || "—"}</TableCell>
                          <TableCell>{calcAgeLabel(p.birthDate)}</TableCell>

                          <TableCell align="right">
                            <IconButton
                              onClick={() => navigate(`/owner/healthbook/${p.id}`)}
                              sx={{
                                bgcolor: "grey.300",
                                "&:hover": { bgcolor: "grey.400" },
                                borderRadius: 2,
                              }}
                            >
                              <ArrowForwardIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
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

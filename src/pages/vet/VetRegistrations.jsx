import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Container, Divider, Grid, Stack, Typography } from "@mui/material";
import { api } from "../../api/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function VetRegistrations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/petRegistrations");
        const all = res.data ?? [];
        // προαιρετικό φιλτράρισμα ανά κτηνίατρο
        const mine = user?.id ? all.filter((x) => x.vetUserId === user.id) : all;
        setItems(mine);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user?.id]);

  const counts = useMemo(() => {
    const draft = items.filter((x) => x.status === "draft").length;
    const submitted = items.filter((x) => x.status === "submitted").length;
    return { draft, submitted, total: items.length };
  }, [items]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
              Καταγραφή Κατοικιδίων
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Καταγράψτε τα βασικά στοιχεία του κατοικιδίου και τυχόν συμβάντα:
              <br />• Αριθμός μικροτσίπ (υποχρεωτικό)
              <br />• Είδος, φύλο, όνομα, ημερομηνία γέννησης
              <br />• Συμβάντα: απώλεια, εύρεση, μεταβίβαση, υιοθεσία, αναδοχή
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md="auto">
                <Button
                  variant="outlined"
                  sx={{ textTransform: "none", borderRadius: 2 }}
                  onClick={() => navigate("/vet/registrations/drafts")}
                >
                  Καταγραφές σε Εκκρεμότητα ({counts.draft})
                </Button>
              </Grid>
              <Grid item xs={12} md="auto">
                <Button
                  variant="contained"
                  sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                  onClick={() => navigate("/vet/registrations/new")}
                >
                  Νέα καταγραφή
                </Button>
              </Grid>

              <Grid item xs={12} md>
                <Stack direction="row" spacing={2} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
                  <Typography variant="body2" color="text.secondary">
                    Σύνολο: {counts.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Οριστικές: {counts.submitted}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

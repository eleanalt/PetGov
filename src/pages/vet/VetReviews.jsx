import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Container, Stack, Typography, Rating, Divider } from "@mui/material";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";

export default function VetReviews() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const res = await api.get("/reviews", { params: { vetId: String(user.id) } });
      setItems(Array.isArray(res.data) ? res.data : []);
    })();
  }, [user?.id]);

  const avg = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((a, r) => a + (Number(r.rating) || 0), 0) / items.length;
  }, [items]);

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" fontWeight={900}>
            Αξιολογήσεις
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography fontWeight={900}>Μέσος όρος:</Typography>
                <Rating value={avg} precision={0.5} readOnly />
                <Typography color="text.secondary">({items.length})</Typography>
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {items.length === 0 ? (
                <Typography color="text.secondary">Δεν υπάρχουν αξιολογήσεις.</Typography>
              ) : (
                <Stack spacing={2}>
                  {items.map((r) => (
                    <Card key={r.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Rating value={Number(r.rating) || 0} readOnly />
                          <Typography color="text.secondary" variant="body2">
                            {r.createdAt || ""}
                          </Typography>
                        </Stack>
                        <Typography sx={{ mt: 1 }}>{r.comment || "—"}</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Breadcrumbs,
  Link as MLink,
  Alert,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OwnerHealthBook() {
  const navigate = useNavigate();
  const { petId } = useParams();

  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [vet, setVet] = useState(null);
  const [acts, setActs] = useState([]);

  const [photoDraft, setPhotoDraft] = useState(""); // base64
  const [photoMeta, setPhotoMeta] = useState(null); // {name,size,type}
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    (async () => {
      try {
        const p = await api.get(`/pets/${petId}`);
        const petData = p.data ?? null;
        setPet(petData);

        setPhotoDraft(petData?.photoDataUrl || "");
        setPhotoMeta(null);

        if (petData?.ownerId) {
          const o = await api.get(`/users/${petData.ownerId}`);
          setOwner(o.data ?? null);
        }

        const a = await api.get(`/medicalActs`, {
          params: { petId: String(petId), _sort: "date", _order: "desc" },
        });
        const list = Array.isArray(a.data) ? a.data : [];
        setActs(list);

        const firstVetId = list?.[0]?.vetId;
        if (firstVetId) {
          const v = await api.get(`/users/${firstVetId}`);
          setVet(v.data ?? null);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [petId]);

  const clinicLabel = useMemo(() => {
    if (!vet) return "—";
    return vet.clinicName ? `${vet.clinicName} (${vet.fullName})` : vet.fullName;
  }, [vet]);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMsg({ type: "", text: "" });

    const MAX = 2 * 1024 * 1024;
    if (file.size > MAX) {
      setMsg({ type: "error", text: "Η φωτογραφία είναι πολύ μεγάλη (max 2MB)." });
      e.target.value = "";
      return;
    }

    try {
      const b64 = await fileToBase64(file);
      setPhotoDraft(b64);
      setPhotoMeta({ name: file.name, size: file.size, type: file.type });
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Αποτυχία φόρτωσης φωτογραφίας." });
    } finally {
      // για να μπορείς να επιλέξεις ξανά το ίδιο αρχείο
      e.target.value = "";
    }
  };

  const removePhoto = () => {
    setPhotoDraft("");
    setPhotoMeta(null);
    setMsg({ type: "", text: "" });
  };

  const savePhoto = async () => {
    if (!pet?.id) return;

    setSavingPhoto(true);
    setMsg({ type: "", text: "" });

    try {
      await api.patch(`/pets/${pet.id}`, {
        photoDataUrl: photoDraft || "",
        updatedAt: new Date().toISOString(),
      });

      // ενημέρωση τοπικά
      setPet((p) => ({ ...p, photoDataUrl: photoDraft || "" }));
      setMsg({ type: "success", text: "Η φωτογραφία ενημερώθηκε." });
      setPhotoMeta(null);
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία αποθήκευσης φωτογραφίας." });
    } finally {
      setSavingPhoto(false);
    }
  };

  const photoChanged = (pet?.photoDataUrl || "") !== (photoDraft || "");

  if (!pet) {
    return (
      <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
        <Container maxWidth="lg">
          <Typography>Δεν βρέθηκε κατοικίδιο.</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        

        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ textTransform: "none", mb: 2 }}>
          Επιστροφή στην προηγούμενη σελίδα
        </Button>

        <Typography variant="h4" fontWeight={900} sx={{ textAlign: "center", mb: 2 }}>
          Βιβλιάριο Υγείας
        </Typography>

        {msg.text && (
          <Alert severity={msg.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
            {msg.text}
          </Alert>
        )}

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
            <Box sx={{ display: { xs: "block", md: "flex" }, gap: 3 }}>
              {/* Left: pet details */}
              <Box
                sx={{
                  flex: 1,
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography fontWeight={900} sx={{ mb: 1 }}>
                  Στοιχεία Κατοικιδίου:
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  <Typography>
                    <b>Όνομα:</b> {pet.name || "—"}
                  </Typography>
                  <Typography>
                    <b>Microchip:</b> {pet.microchip || "—"}
                  </Typography>
                  <Typography>
                    <b>Ημερομηνία Γέννησης:</b> {pet.birthDate || "—"}
                  </Typography>
                  <Typography>
                    <b>Φύλο:</b> {pet.sex || "—"}
                  </Typography>
                  <Typography>
                    <b>Είδος Ζώου:</b> {pet.species || "—"}
                  </Typography>
                  <Typography sx={{ gridColumn: "1 / -1" }}>
                    <b>Ιδιοκτήτης:</b> {owner?.fullName || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Right: photo (editable) */}
              <Box sx={{ width: { xs: "100%", md: 360 } }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 180,
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "grey.300",
                    border: "1px solid rgba(0,0,0,0.12)",
                    position: "relative",
                  }}
                >
                  {photoDraft ? (
                    <img
                      src={photoDraft}
                      alt="Pet"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 52%)",
                      }}
                    />
                  )}
                </Box>

                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={savingPhoto}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                  >
                    Αλλαγή φωτογραφίας
                    <input hidden type="file" accept="image/*" onChange={onPickPhoto} />
                  </Button>

                  {photoDraft && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={removePhoto}
                      disabled={savingPhoto}
                      sx={{ textTransform: "none", px: 0, justifyContent: "flex-start" }}
                    >
                      Αφαίρεση φωτογραφίας
                    </Button>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {photoMeta?.name
                      ? `${photoMeta.name} • ${Math.round(photoMeta.size / 1024)} KB`
                      : "Μορφή: εικόνα • Μέγιστο: 2MB"}
                  </Typography>

                  <Button
                    variant="contained"
                    onClick={savePhoto}
                    disabled={savingPhoto || !photoChanged}
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 900 }}
                  >
                    Αποθήκευση φωτογραφίας
                  </Button>
                </Stack>
              </Box>
            </Box>

            <Typography fontWeight={900} sx={{ mt: 3, mb: 1 }}>
              Ιατρικές Πράξεις
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ bgcolor: "grey.50", borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>Ημερομηνία</b>
                    </TableCell>
                    <TableCell>
                      <b>Πράξη</b>
                    </TableCell>
                    <TableCell>
                      <b>Κλινική / Κτηνίατρος</b>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {acts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>Δεν υπάρχουν πράξεις.</TableCell>
                    </TableRow>
                  ) : (
                    acts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.date || "—"}</TableCell>
                        <TableCell>{a.type || "—"}</TableCell>
                        <TableCell>{clinicLabel}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => window.print()}
                sx={{ textTransform: "none", borderRadius: 2, px: 6, bgcolor: "primary" }}
              >
                Εκτύπωση
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

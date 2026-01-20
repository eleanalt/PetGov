import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

function normalizeUser(obj) {
  if (!obj) return null;
  if (obj.user?.id) return obj.user;
  if (obj.auth?.user?.id) return obj.auth.user;
  if (obj.id) return obj;
  return null;
}

function tryParse(raw) {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return { id: raw };
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getStoredUser() {
  const storages = [localStorage, sessionStorage];
  const preferredKeys = [
    "user",
    "authUser",
    "currentUser",
    "loggedUser",
    "auth",
    "session",
    "petgovUser",
  ];

  for (const storage of storages) {
    for (const k of preferredKeys) {
      const parsed = tryParse(storage.getItem(k));
      const u = normalizeUser(parsed);
      if (u?.id) return u;
    }
  }

  for (const storage of storages) {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      const parsed = tryParse(storage.getItem(key));
      const u = normalizeUser(parsed);
      if (u?.id) return u;
    }
  }

  return null;
}

function PhotoPlaceholder() {
  return (
    <Box
      sx={{
        width: "100%",
        height: 220,
        borderRadius: 6,
        bgcolor: "grey.300",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 52%), linear-gradient(45deg, transparent 48%, rgba(0,0,0,0.15) 49%, rgba(0,0,0,0.15) 51%, transparent 52%)",
        }}
      />
    </Box>
  );
}

function Row({
  label,
  value,
  isEditing,
  isActive,
  onStartEdit,
  onCancel,
  onSave,
  inputValue,
  setInputValue,
  errorText,
  type = "text",
}) {
  return (
    <Box sx={{ py: 1.4 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography sx={{ minWidth: 150, fontWeight: 800 }}>{label}</Typography>

        {!isEditing ? (
          <Typography sx={{ color: value ? "text.primary" : "text.secondary" }}>
            {value || "—"}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }}>
            {isActive ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <TextField
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  size="small"
  fullWidth
  type={type}
  placeholder="—"
  error={!!errorText}
  helperText={errorText || " "}
/>

                <IconButton onClick={onSave} aria-label="save">
                  <CheckIcon />
                </IconButton>
                <IconButton onClick={onCancel} aria-label="cancel">
                  <CloseIcon />
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  sx={{ color: value ? "text.primary" : "text.secondary", flex: 1 }}
                >
                  {value || "—"}
                </Typography>
                <IconButton onClick={onStartEdit} aria-label="edit">
                  <EditIcon />
                </IconButton>
              </Stack>
            )}
          </Box>
        )}
      </Stack>

      <Divider sx={{ mt: 1.4 }} />
    </Box>
  );
}

// ✅ μετατρέπει File -> base64 dataUrl
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

export default function VetProfile() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(() => getStoredUser()?.id ?? null);

  useEffect(() => {
    const read = () => setUserId(getStoredUser()?.id ?? null);
    read();
    window.addEventListener("focus", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("focus", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  const [activeField, setActiveField] = useState(null);
  const [activeValue, setActiveValue] = useState("");

  // ✅ εικόνα: κρατάμε preview στο draft (avatarDataUrl)
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!userId) return;
      const res = await api.get(`/users/${userId}`);
      setProfile(res.data);
      setDraft(res.data);
    })();
  }, [userId]);

  if (!userId) {
    return (
      <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
        <Container maxWidth="lg">
          <Typography fontWeight={900} variant="h5">
            Δεν βρέθηκε συνδεδεμένος χρήστης
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Κάνε login και βεβαιώσου ότι αποθηκεύεις τον χρήστη στο localStorage ή
            sessionStorage.
          </Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/login")}>
            Σύνδεση
          </Button>
        </Container>
      </Box>
    );
  }

  if (!profile || !draft) return null;

  const fields = [
    { key: "fullName", label: "Ονοματεπώνυμο" },
    { key: "email", label: "Email" },
    { key: "afm", label: "ΑΦΜ" },
    { key: "phone", label: "Τηλέφωνο" },
  ];

  const startEditField = (key) => {
  setActiveField(key);
  setActiveValue(draft?.[key] ?? "");
  setErrors((e) => ({ ...e, [key]: "" }));
};


  const cancelEditField = () => {
  if (activeField) setErrors((e) => ({ ...e, [activeField]: "" }));
  setActiveField(null);
  setActiveValue("");
};


  const saveEditFieldToDraft = () => {
  if (!activeField) return;

  const v = String(activeValue ?? "").trim();

  // required validation (για όλα τα πεδία)
  if (!v) {
    setErrors((e) => ({ ...e, [activeField]: "Το πεδίο είναι υποχρεωτικό." }));
    return; // ⛔ μην κλείνεις edit, μην κάνεις save
  }

  // (προαιρετικά) πιο ειδικοί έλεγχοι
  if (activeField === "email" && !/^\S+@\S+\.\S+$/.test(v)) {
    setErrors((e) => ({ ...e, [activeField]: "Μη έγκυρο email." }));
    return;
  }

  if (activeField === "afm" && !/^\d{9}$/.test(v)) {
    setErrors((e) => ({ ...e, [activeField]: "Το ΑΦΜ πρέπει να έχει 9 ψηφία." }));
    return;
  }

  setDraft((d) => ({ ...d, [activeField]: v }));
  setErrors((e) => ({ ...e, [activeField]: "" }));
  setActiveField(null);
  setActiveValue("");
};


  const cancelWholeEdit = () => {
    setDraft(profile); // επαναφορά (μαζί και της εικόνας)
    setEditMode(false);
    cancelEditField();
  };

  // ✅ άνοιγμα file picker
  const onPickPhoto = () => {
    if (!editMode) return;
    fileInputRef.current?.click();
  };

  // ✅ όταν διαλέξει εικόνα: τη μετατρέπουμε σε base64 και τη βάζουμε στο draft
  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Διάλεξε αρχείο εικόνας (png/jpg/webp).");
      e.target.value = "";
      return;
    }

    // προαιρετικό όριο (π.χ. 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Η εικόνα είναι πολύ μεγάλη (max 2MB).");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setDraft((d) => ({ ...d, avatarDataUrl: dataUrl }));
    } catch {
      alert("Αποτυχία φόρτωσης εικόνας.");
    } finally {
      // για να μπορείς να διαλέξεις την ίδια εικόνα ξανά
      e.target.value = "";
    }
  };

  const finishEdit = async () => {
    const payload = {
      ...draft,
      // κρατάς ό,τι θες εδώ
      role: profile.role || "vet",
    };

    const res = await api.patch(`/users/${userId}`, payload);
    setProfile(res.data);
    setDraft(res.data);

    setEditMode(false);
    cancelEditField();
  };

  const avatarSrc = draft?.avatarDataUrl || profile?.avatarDataUrl;

  return (
    <Box sx={{ bgcolor: "grey.100", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην αρχική σελίδα
        </Button>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h3" fontWeight={900}>
            Προφίλ Ιδιοκτήτη
          </Typography>

          {!editMode && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditMode(true)}
              sx={{ textTransform: "none", borderRadius: 999 }}
            >
              Επεξεργασία
            </Button>
          )}
        </Stack>

        <Card variant="outlined" sx={{ borderRadius: 6 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: { xs: "block", md: "flex" },
                gap: 3,
                alignItems: "flex-start",
              }}
            >
              {/* Left photo */}
              <Box sx={{ width: { xs: "100%", md: 360 } }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 220,
                    borderRadius: 6,
                    bgcolor: "grey.300",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarSrc ? (
                    <Box
                      component="img"
                      src={avatarSrc}
                      alt="avatar"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <PhotoPlaceholder />
                  )}
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<PhotoCameraOutlinedIcon />}
                  sx={{
                    mt: 2,
                    textTransform: "none",
                    borderRadius: 999,
                    width: "fit-content",
                  }}
                  onClick={onPickPhoto}
                  disabled={!editMode}
                >
                  Αλλαγή εικόνας
                </Button>

                {/* ✅ hidden input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onPhotoSelected}
                />
              </Box>

              {/* Right info rows */}
              <Box sx={{ flex: 1 }}>
                {fields.map((f) => (
                  <Row
  key={f.key}
  label={f.label}
  value={draft?.[f.key]}
  isEditing={editMode}
  isActive={activeField === f.key}
  onStartEdit={() => startEditField(f.key)}
  onCancel={cancelEditField}
  onSave={saveEditFieldToDraft}
  inputValue={activeValue}
  setInputValue={setActiveValue}
  type={f.type || "text"}
  errorText={errors?.[f.key]}
/>

                ))}

                {editMode && (
                  <Box sx={{ pt: 2 }}>
                    <Stack direction="row" justifyContent="center" spacing={2}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={cancelWholeEdit}
                        sx={{ textTransform: "none", borderRadius: 999, px: 4 }}
                        disabled={!!activeField}
                      >
                        Ακύρωση
                      </Button>

                      <Button
                        variant="contained"
                        color="success"
                        onClick={finishEdit}
                        sx={{ textTransform: "none", borderRadius: 999, px: 4, fontWeight: 900 }}
                        disabled={!!activeField}
                      >
                        Ολοκλήρωση επεξεργασίας
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";

import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

/* =========================
   Storage helpers
========================= */
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

/* =========================
   UI bits
========================= */
function PhotoPlaceholder() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "grey.200",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 10px, transparent 10px, transparent 20px)",
        }}
      />
      <Stack
        sx={{ position: "absolute", inset: 0 }}
        alignItems="center"
        justifyContent="center"
        spacing={1}
      >
        <LocalHospitalIcon sx={{ color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          Δεν υπάρχει εικόνα
        </Typography>
      </Stack>
    </Box>
  );
}

/** File -> base64 dataUrl */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/** validation per field */
function validateField(key, rawValue) {
  const v = String(rawValue ?? "").trim();

  if (!v) return "Το πεδίο είναι υποχρεωτικό.";

  if (key === "email" && !/^\S+@\S+\.\S+$/.test(v)) return "Μη έγκυρο email.";
  if (key === "afm" && !/^\d{9}$/.test(v)) return "Το ΑΦΜ πρέπει να έχει 9 ψηφία.";
  if (key === "phone" && !/^\d{10}$/.test(v)) return "Το τηλέφωνο πρέπει να έχει 10 ψηφία.";

  if (key === "experienceYears") {
    if (!/^\d+$/.test(v)) return "Δώσε έτη εμπειρίας (0-40).";
    const n = Number(v);
    if (n < 0 || n > 40) return "Δώσε έτη εμπειρίας (0-40).";
  }

  return "";
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
  options = null,
  saveDisabled = false,
}) {
  const isSelect = Array.isArray(options) && options.length > 0;

  return (
    <Box sx={{ py: 1.1 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography sx={{ minWidth: 190, fontWeight: 900 }}>{label}</Typography>

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
                  type={isSelect ? "text" : type}
                  placeholder="—"
                  select={isSelect}
                  error={!!errorText}
                  helperText={errorText || " "}
                >
                  {isSelect &&
                    options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                </TextField>

                <IconButton onClick={onSave} aria-label="save" disabled={saveDisabled}>
                  <CheckIcon />
                </IconButton>

                <IconButton onClick={onCancel} aria-label="cancel">
                  <CloseIcon />
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ color: value ? "text.primary" : "text.secondary", flex: 1 }}>
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

      <Divider sx={{ mt: 1.2 }} />
    </Box>
  );
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

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const [activeField, setActiveField] = useState(null);
  const [activeValue, setActiveValue] = useState("");
  const [errors, setErrors] = useState({});

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
      <Box sx={{ bgcolor: "grey.50", minHeight: "calc(100vh - 76px)", py: 6 }}>
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
    { key: "email", label: "Email", type: "email" },
    { key: "afm", label: "ΑΦΜ" },
    { key: "phone", label: "Τηλέφωνο", type: "tel" },
    {
      key: "gender",
      label: "Φύλο",
      options: [
        { value: "Αρσενικό", label: "Αρσενικό" },
        { value: "Θηλυκό", label: "Θηλυκό" },
        { value: "Άλλο", label: "Άλλο" },
      ],
    },
    {
      key: "educationLevel",
      label: "Επίπεδο σπουδών",
      options: [
        { value: "Απολυτήριο", label: "Απολυτήριο" },
        { value: "ΙΕΚ", label: "ΙΕΚ" },
        { value: "Πτυχίο", label: "Πτυχίο" },
        { value: "Μεταπτυχιακό", label: "Μεταπτυχιακό" },
        { value: "Διδακτορικό", label: "Διδακτορικό" },
      ],
    },
    {
      key: "experienceYears",
      label: "Εμπειρία (έτη)",
      options: Array.from({ length: 41 }, (_, i) => ({
        value: String(i),
        label: `${i}`,
      })),
    },
    { key: "clinicName", label: "Επωνυμία" },
    { key: "clinicAddress", label: "Διεύθυνση" },
  ];

  const startEditField = (key) => {
    setActiveField(key);
    setErrors((e) => ({ ...e, [key]: "" }));
    setMsg({ type: "", text: "" });

    if (key === "experienceYears") {
      const v = draft?.[key];
      setActiveValue(v === 0 ? "0" : v ? String(v) : "");
      return;
    }
    setActiveValue(draft?.[key] ?? "");
  };

  const cancelEditField = () => {
    if (activeField) setErrors((e) => ({ ...e, [activeField]: "" }));
    setActiveField(null);
    setActiveValue("");
  };

  const saveEditFieldToDraft = () => {
    if (!activeField) return;

    const err = validateField(activeField, activeValue);
    if (err) {
      setErrors((e) => ({ ...e, [activeField]: err }));
      return;
    }

    let v = String(activeValue ?? "").trim();
    if (activeField === "experienceYears") v = Number(v);

    setDraft((d) => ({ ...d, [activeField]: v }));
    setErrors((e) => ({ ...e, [activeField]: "" }));
    setActiveField(null);
    setActiveValue("");
  };

  const cancelWholeEdit = () => {
    setDraft(profile);
    setEditMode(false);
    cancelEditField();
    setErrors({});
    setMsg({ type: "", text: "" });
  };

  const finishEdit = async () => {
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const payload = { ...draft, role: "vet" };
      const res = await api.patch(`/users/${userId}`, payload);

      setProfile(res.data);
      setDraft(res.data);

      setEditMode(false);
      cancelEditField();
      setErrors({});
      setMsg({ type: "success", text: "Το προφίλ ενημερώθηκε επιτυχώς." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία ενημέρωσης προφίλ." });
    } finally {
      setSaving(false);
    }
  };

  // avatar
  const onPickPhoto = () => {
    if (!editMode) return;
    fileInputRef.current?.click();
  };

  const onPhotoSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMsg({ type: "error", text: "Διάλεξε αρχείο εικόνας (png/jpg/webp)." });
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMsg({ type: "error", text: "Η εικόνα είναι πολύ μεγάλη (max 2MB)." });
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setDraft((d) => ({ ...d, avatarDataUrl: dataUrl }));
      setMsg({ type: "success", text: "Η εικόνα επιλέχθηκε." });
    } catch {
      setMsg({ type: "error", text: "Αποτυχία φόρτωσης εικόνας." });
    } finally {
      e.target.value = "";
    }
  };

  const avatarSrc = draft?.avatarDataUrl || profile?.avatarDataUrl;

  const initials = (draft?.fullName || profile?.fullName || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  const activeErrorLive = activeField ? validateField(activeField, activeValue) : "";
  const saveDisabled = !!activeField && !!activeErrorLive;

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "calc(100vh - 76px)", py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ textTransform: "none", mb: 2 }}
        >
          Επιστροφή στην αρχική σελίδα
        </Button>

        {/* Header */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            mb: 2,
            overflow: "hidden",
            boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
            background:
              "linear-gradient(135deg, rgba(25,118,210,0.10) 0%, rgba(156,39,176,0.06) 40%, rgba(0,0,0,0) 100%)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                  Προφίλ Κτηνιάτρου
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Ενημέρωσε τα στοιχεία σου και την επαγγελματική σου παρουσία.
                </Typography>
              </Box>

              {!editMode && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditMode(true)}
                  sx={{ textTransform: "none", borderRadius: 999, px: 2.5, py: 1.1 }}
                >
                  Επεξεργασία
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>

        {msg.text ? (
          <Alert
            severity={msg.type === "success" ? "success" : "error"}
            sx={{ mb: 2, borderRadius: 3 }}
          >
            {msg.text}
          </Alert>
        ) : null}

        {/* Main */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box
              sx={{
                display: { xs: "block", md: "flex" },
                gap: 3,
                alignItems: "flex-start",
              }}
            >
              {/* Avatar column */}
              <Box sx={{ width: { xs: "100%", md: 320 } }}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack alignItems="center" spacing={1.5}>
                      {/* ring */}
                      <Box
                        sx={{
                          p: 0.5,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, rgba(25,118,210,0.9) 0%, rgba(156,39,176,0.7) 100%)",
                        }}
                      >
                        <Avatar
                          src={avatarSrc || undefined}
                          sx={{
                            width: 132,
                            height: 132,
                            bgcolor: "grey.200",
                            fontWeight: 950,
                            fontSize: 44,
                          }}
                        >
                          {initials}
                        </Avatar>
                      </Box>

                      <Typography fontWeight={950} sx={{ textAlign: "center" }}>
                        {draft?.fullName || "—"}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
                        {draft?.email || "—"}
                      </Typography>

                      <Button
                        variant="outlined"
                        startIcon={<PhotoCameraOutlinedIcon />}
                        onClick={onPickPhoto}
                        disabled={!editMode}
                        sx={{ textTransform: "none", borderRadius: 999, mt: 1 }}
                      >
                        Αλλαγή εικόνας
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onPhotoSelected}
                      />

                      {!avatarSrc ? (
                        <Box sx={{ width: "100%", height: 140, borderRadius: 3, overflow: "hidden" }}>
                          <PhotoPlaceholder />
                        </Box>
                      ) : null}

                      {!editMode ? (
                        <Typography variant="caption" color="text.secondary">
                          Πάτησε “Επεξεργασία” για αλλαγές.
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Επιτρέπονται εικόνες έως 2MB.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {/* Fields column */}
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={950} sx={{ mb: 1 }}>
                  Στοιχεία κτηνιάτρου
                </Typography>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    bgcolor: "background.paper",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {fields.map((f) => {
                      const shownValue =
                        f.key === "experienceYears" && (draft?.[f.key] ?? "") !== ""
                          ? String(draft?.[f.key])
                          : draft?.[f.key];

                      const errToShow =
                        activeField === f.key ? errors?.[f.key] || activeErrorLive : "";

                      return (
                        <Row
                          key={f.key}
                          label={f.label}
                          value={shownValue}
                          isEditing={editMode}
                          isActive={activeField === f.key}
                          onStartEdit={() => startEditField(f.key)}
                          onCancel={cancelEditField}
                          onSave={saveEditFieldToDraft}
                          inputValue={activeValue}
                          setInputValue={setActiveValue}
                          type={f.type || "text"}
                          options={f.options || null}
                          errorText={errToShow}
                          saveDisabled={activeField === f.key ? saveDisabled : false}
                        />
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Buttons κάτω */}
                {editMode && (
                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="center" spacing={2}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={cancelWholeEdit}
                        sx={{ textTransform: "none", borderRadius: 999, px: 4 }}
                        disabled={!!activeField || saving}
                      >
                        Ακύρωση
                      </Button>

                      <Button
                        variant="contained"
                        color="success"
                        onClick={finishEdit}
                        sx={{ textTransform: "none", borderRadius: 999, px: 4, fontWeight: 950 }}
                        disabled={!!activeField || saving}
                      >
                        Αποθήκευση
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

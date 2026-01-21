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
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";

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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function InfoRow({
  icon,
  label,
  value,
  editMode,
  active,
  onStartEdit,
  onCancel,
  onSave,
  inputValue,
  setInputValue,
  errorText,
  type = "text",
}) {
  return (
    <Box sx={{ py: 1.25 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ mt: "2px", color: "text.secondary" }}>{icon}</Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {label}
          </Typography>

          {!editMode ? (
            <Typography fontWeight={850} sx={{ lineHeight: 1.25 }}>
              {value || "—"}
            </Typography>
          ) : (
            <>
              {active ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    size="small"
                    fullWidth
                    type={type}
                    placeholder="—"
                    error={!!errorText}
                    helperText={errorText || " "}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: 2 },
                    }}
                  />

                  <IconButton onClick={onSave} aria-label="save">
                    <CheckIcon />
                  </IconButton>
                  <IconButton onClick={onCancel} aria-label="cancel">
                    <CloseIcon />
                  </IconButton>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    sx={{
                      flex: 1,
                      fontWeight: 850,
                      color: value ? "text.primary" : "text.secondary",
                      lineHeight: 1.25,
                    }}
                  >
                    {value || "—"}
                  </Typography>
                  <IconButton onClick={onStartEdit} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                </Stack>
              )}
            </>
          )}
        </Box>
      </Stack>

      <Divider sx={{ mt: 1.25 }} />
    </Box>
  );
}

export default function OwnerProfile() {
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
  const [errors, setErrors] = useState({});

  const [activeField, setActiveField] = useState(null);
  const [activeValue, setActiveValue] = useState("");

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
          <Typography fontWeight={950} variant="h5">
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
    { key: "fullName", label: "Ονοματεπώνυμο", icon: <PersonOutlineIcon fontSize="small" /> },
    { key: "email", label: "Email", icon: <EmailOutlinedIcon fontSize="small" />, type: "email" },
    { key: "afm", label: "ΑΦΜ", icon: <BadgeOutlinedIcon fontSize="small" /> },
    {
      key: "phone",
      label: "Τηλέφωνο",
      icon: <PhoneIphoneOutlinedIcon fontSize="small" />,
      type: "tel",
    },
  ];

  const startEditField = (key) => {
    setActiveField(key);
    setActiveValue(draft?.[key] ?? "");
    setErrors((e) => ({ ...e, [key]: "" }));
    setMsg({ type: "", text: "" });
  };

  const cancelEditField = () => {
    if (activeField) setErrors((e) => ({ ...e, [activeField]: "" }));
    setActiveField(null);
    setActiveValue("");
  };

  const saveEditFieldToDraft = () => {
    if (!activeField) return;

    const v = String(activeValue ?? "").trim();

    if (!v) {
      setErrors((e) => ({ ...e, [activeField]: "Το πεδίο είναι υποχρεωτικό." }));
      return;
    }

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
    setDraft(profile);
    setEditMode(false);
    cancelEditField();
    setMsg({ type: "", text: "" });
  };

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
      setMsg({ type: "success", text: "Η εικόνα ενημερώθηκε (προεπισκόπηση)." });
    } catch {
      setMsg({ type: "error", text: "Αποτυχία φόρτωσης εικόνας." });
    } finally {
      e.target.value = "";
    }
  };

  const finishEdit = async () => {
    setMsg({ type: "", text: "" });

    try {
      const payload = {
        ...draft,
        role: profile.role || "owner",
      };

      const res = await api.patch(`/users/${userId}`, payload);
      setProfile(res.data);
      setDraft(res.data);

      setEditMode(false);
      cancelEditField();
      setMsg({ type: "success", text: "Οι αλλαγές αποθηκεύτηκαν." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "error", text: "Αποτυχία αποθήκευσης αλλαγών." });
    }
  };

  const avatarSrc = draft?.avatarDataUrl || profile?.avatarDataUrl;
  const initials = (draft?.fullName || profile?.fullName || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

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

        {/* Hero */}
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
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                  Προφίλ Ιδιοκτήτη
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Διαχείριση στοιχείων λογαριασμού και εικόνας προφίλ.
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
          <Alert severity={msg.type === "success" ? "success" : "error"} sx={{ mb: 2 }}>
            {msg.text}
          </Alert>
        ) : null}

        {/* Main card */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 4,
            boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box sx={{ display: { xs: "block", md: "flex" }, gap: 3, alignItems: "flex-start" }}>
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
                  Στοιχεία λογαριασμού
                </Typography>
                <Divider sx={{ mb: 1 }} />

                {fields.map((f) => (
                  <InfoRow
                    key={f.key}
                    icon={f.icon}
                    label={f.label}
                    value={draft?.[f.key]}
                    editMode={editMode}
                    active={activeField === f.key}
                    onStartEdit={() => startEditField(f.key)}
                    onCancel={cancelEditField}
                    onSave={saveEditFieldToDraft}
                    inputValue={activeValue}
                    setInputValue={setActiveValue}
                    type={f.type || "text"}
                    errorText={errors?.[f.key]}
                  />
                ))}

                {editMode ? (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Συμπλήρωσε τα πεδία και πάτησε ✓ για κάθε πεδίο. Τέλος πάτησε “Αποθήκευση”.
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            </Box>

            {editMode && (
              <Box sx={{ mt: 3 }}>
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
                    sx={{ textTransform: "none", borderRadius: 999, px: 4, fontWeight: 950 }}
                    disabled={!!activeField}
                  >
                    Αποθήκευση
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}


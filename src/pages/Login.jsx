import React, { useState } from "react";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthShell from "../components/auth/AuthShell";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("maria@demo.gr");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}/users`, {
        params: { email: email.trim(), password: password.trim() },
      });

      const user = Array.isArray(res.data) ? res.data[0] : null;
      if (!user) {
        setError("Λάθος email ή κωδικός.");
        return;
      }

      // κρατάμε το login στο context (και συνήθως γράφει και localStorage)
      if (typeof login === "function") login(user);

      // ✅ ΠΑΝΤΑ στην κανονική αρχική
      navigate("/", { replace: true });
    } catch {
      setError("Δεν είναι διαθέσιμος ο server (JSON Server στο 3001).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="login">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit}>
        <TextField
          label="Email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Κωδικός Πρόσβασης"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ py: 1.2, textTransform: "none", fontWeight: 800 }}
        >
          {loading ? "..." : "Σύνδεση"}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Demo logins: maria@demo.gr / 1234 (owner), vet@demo.gr / 1234 (vet)
        </Typography>
      </Box>
    </AuthShell>
  );
}

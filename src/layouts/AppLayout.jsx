import React, { useMemo, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SiteFooter from "../components/SiteFooter";
import {
  MAIN_NAV,
  USER_MENU,
  ROLE_LABELS,
  isAllowed,
  effectiveRole,
  HEADER_ACTIONS, // ✅ πρόσθεσε αυτό
} from "../routes/menuConfig";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = effectiveRole(user);

  const visibleMainNav = useMemo(
    () => MAIN_NAV.filter((item) => isAllowed(item.roles, user)),
    [user]
  );

  const dropdownItems = USER_MENU[role] ?? [];
  const headerAction = HEADER_ACTIONS?.[role] ?? null; // ✅ Dashboard button config

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const go = (to) => {
    handleClose();
    navigate(to);
  };

  const onLogout = () => {
    handleClose();
    logout();
    navigate("/");
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar
          sx={{
            minHeight: 76,
            px: { xs: 2, md: 3 },
            gap: 2,
          }}
        >
          {/* Left: Brand */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              color: "inherit",
              textDecoration: "none",
              fontWeight: 800,
              letterSpacing: 0.5,
            }}
          >
            PETGOV
          </Typography>

          {/* Center: main nav */}
          <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
            <Stack direction="row" spacing={1}>
              {visibleMainNav.map((item) => (
                <Button
                  key={item.to}
                  color="inherit"
                  component={RouterLink}
                  to={item.to}
                  sx={{
                    textTransform: "none",
                    fontSize: 16,
                    px: 2,
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          </Box>

          {/* Right: auth buttons / dashboard + dropdown */}
          {!user ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                component={RouterLink}
                to="/register"
                variant="outlined"
                sx={{
                  textTransform: "none",
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.75)",
                  px: 2.2,
                  py: 1,
                  borderRadius: 2,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,1)",
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Εγγραφή
              </Button>

              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{
                  textTransform: "none",
                  px: 2.2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.92)",
                  color: "text.primary",
                  "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                }}
              >
                Σύνδεση
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* ✅ Dashboard button ΔΙΠΛΑ απο το dropdown */}
              {headerAction && (
                <Button
                  variant="contained"
                  onClick={() => navigate(headerAction.to)}
                  sx={{
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.92)",
                    color: "text.primary",
                    fontWeight: 900,
                    "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                  }}
                >
                  {headerAction.label}
                </Button>
              )}

              {/* Dropdown trigger */}
              <Button
                color="inherit"
                onClick={handleOpen}
                startIcon={
                  <Avatar sx={{ width: 28, height: 28 }}>
                    {user.fullName?.[0]?.toUpperCase() ?? "U"}
                  </Avatar>
                }
                endIcon={<ExpandMoreIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.15)",
                  px: 1.5,
                  py: 1,
                }}
              >
                {/* ✅ δείχνει ΟΝΟΜΑΤΕΠΩΝΥΜΟ δίπλα, όχι μόνο ρόλο */}
                {user.fullName}
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2">{user.fullName}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {ROLE_LABELS[role] ?? role}
                  </Typography>
                </Box>

                <Divider />

                {/* ✅ Dropdown items ΧΩΡΙΣ Dashboard */}
                {dropdownItems.map((it) => (
                  <MenuItem key={it.to} onClick={() => go(it.to)}>
                    {it.label}
                  </MenuItem>
                ))}

                {dropdownItems.length > 0 && <Divider />}

                <MenuItem onClick={onLogout} sx={{ color: "error.main" }}>
                  Αποσύνδεση
                </MenuItem>
              </Menu>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* content */}
      <Box sx={{ flexGrow: 1, pt: 4 }}>
        <Outlet />
      </Box>

      <SiteFooter />
    </Box>
  );
}

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#0B4F8A" },     // “gov” μπλε
    secondary: { main: "#0F8B8D" },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF"
    },
    text: {
      primary: "#1F2A37",
      secondary: "#4B5563"
    }
  },
  typography: {
    fontFamily: [
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "Arial",
      "sans-serif"
    ].join(","),
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 }
      }
    }
  }
});

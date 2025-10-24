import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#F59E0B",
      light: "#FBBF24",
      dark: "#D97706",
      contrastText: "#000000",
    },
    success: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
    },
    warning: {
      main: "#F59E0B",
      light: "#FBBF24",
      dark: "#D97706",
    },
    error: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#DC2626",
    },
    info: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#2563EB",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    text: {
      primary: "#F1F5F9",
      secondary: "#94A3B8",
      disabled: "#64748B",
    },
    divider: "#334155",
    grey: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "-0.015em",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 600,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0px 2px 4px rgba(0, 0, 0, 0.3)",
    "0px 4px 8px rgba(0, 0, 0, 0.35)",
    "0px 6px 12px rgba(0, 0, 0, 0.4)",
    "0px 8px 16px rgba(0, 0, 0, 0.45)",
    "0px 10px 20px rgba(0, 0, 0, 0.5)",
    "0px 12px 24px rgba(0, 0, 0, 0.55)",
    "0px 14px 28px rgba(0, 0, 0, 0.6)",
    "0px 16px 32px rgba(0, 0, 0, 0.65)",
    "0px 18px 36px rgba(0, 0, 0, 0.7)",
    "0px 20px 40px rgba(0, 0, 0, 0.75)",
    "0px 22px 44px rgba(0, 0, 0, 0.8)",
    "0px 24px 48px rgba(0, 0, 0, 0.85)",
    "0px 26px 52px rgba(0, 0, 0, 0.9)",
    "0px 28px 56px rgba(0, 0, 0, 0.95)",
    "0px 30px 60px rgba(0, 0, 0, 1)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
    "0px 1px 18px 0px rgba(0,0,0,0.12),0px 6px 10px 0px rgba(0,0,0,0.14),0px 3px 5px -1px rgba(0,0,0,0.20)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#475569 #1E293B",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            width: 8,
            height: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#475569",
            minHeight: 24,
            "&:hover": {
              backgroundColor: "#64748B",
            },
          },
          "&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track": {
            borderRadius: 8,
            backgroundColor: "#1E293B",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 24px",
          fontSize: "0.9375rem",
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0px 8px 24px rgba(16, 185, 129, 0.3)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
            boxShadow: "0px 10px 30px rgba(16, 185, 129, 0.4)",
          },
        },
        outlined: {
          borderWidth: 2,
          borderColor: "#10B981",
          "&:hover": {
            borderWidth: 2,
            borderColor: "#34D399",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#1E293B",
          border: "1px solid #334155",
        },
        elevation1: {
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.4)",
        },
        elevation2: {
          boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.5)",
        },
        elevation3: {
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.6)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#1E293B",
          border: "1px solid #334155",
          boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.4)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0px 8px 32px rgba(16, 185, 129, 0.2)",
            transform: "translateY(-6px)",
            borderColor: "#10B981",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(30, 41, 59, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #334155",
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1E293B",
          borderRight: "1px solid #334155",
          boxShadow: "none",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#0F172A",
            transition: "all 0.2s ease-in-out",
            "& fieldset": {
              borderColor: "#334155",
            },
            "&:hover fieldset": {
              borderColor: "#10B981",
              borderWidth: 2,
            },
            "&.Mui-focused fieldset": {
              borderColor: "#10B981",
              borderWidth: 2,
              boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.1)",
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#10B981",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: "0.8125rem",
        },
        filled: {
          border: "1px solid transparent",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: "#0F172A",
          color: "#F1F5F9",
          borderBottom: "2px solid #334155",
        },
        body: {
          borderBottom: "1px solid #334155",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: "4px 12px",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            transform: "translateX(6px)",
          },
          "&.Mui-selected": {
            background:
              "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)",
            borderLeft: "3px solid #10B981",
            "&:hover": {
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.35) 100%)",
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0F172A",
          border: "1px solid #334155",
          fontSize: "0.8125rem",
          fontWeight: 500,
        },
        arrow: {
          color: "#0F172A",
        },
      },
    },
  },
});

export default theme;

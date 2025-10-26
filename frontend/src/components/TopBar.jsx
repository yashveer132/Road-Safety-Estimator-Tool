import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { text: "Dashboard", path: "/" },
  { text: "Upload Report", path: "/upload" },
  { text: "Estimates", path: "/estimates" },
  { text: "Price Management", path: "/prices" },
];

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: "1px solid",
        borderColor: "#334155",
        bgcolor: "rgba(30, 41, 59, 0.98)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "1.2rem",
              boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.5)",
            }}
          >
            RS
          </Box>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
                background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              Road Safety Estimator
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <Button
                key={item.text}
                onClick={() => navigate(item.path)}
                variant={isActive ? "contained" : "text"}
                sx={{
                  color: isActive ? "white" : "primary.main",
                  bgcolor: isActive ? "primary.main" : "transparent",
                  "&:hover": {
                    bgcolor: isActive
                      ? "primary.dark"
                      : "rgba(16, 185, 129, 0.15)",
                  },
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                }}
              >
                {item.text}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

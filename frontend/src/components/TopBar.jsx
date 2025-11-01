import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import TrafficIcon from "@mui/icons-material/Traffic";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { text: "Dashboard", path: "/", icon: DashboardIcon },
  { text: "Upload Report", path: "/upload", icon: CloudUploadIcon },
  { text: "Estimates", path: "/estimates", icon: AssessmentIcon },
  {
    text: "Safety Interventions GPT",
    path: "/road-safety-gpt",
    icon: TrafficIcon,
  },
  { text: "Price Management", path: "/prices", icon: SettingsIcon },
];

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

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
              Estimator Tool For Intervention{" "}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: { sm: 1, md: 2 },
              flexWrap: "wrap",
            }}
          >
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
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    fontWeight: 500,
                    px: { xs: 1.5, sm: 2 },
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
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <IconButton
              color="inherit"
              aria-label="open menu"
              onClick={handleMenuToggle}
              sx={{ color: "primary.main" }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Toolbar>
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: 260, sm: 280 },
            bgcolor: "rgba(30, 41, 59, 0.98)",
            backdropFilter: "blur(12px)",
            borderLeft: "1px solid #334155",
            boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.3)",
            overflowX: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            pt: 8,
            mt: 4,
            borderBottom: "1px solid #334155",
            bgcolor: "rgba(16, 185, 129, 0.1)",
            minHeight: 80,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "white",
              textAlign: "center",
              background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}
          >
            Estimator Tool For Intervention{" "}
          </Typography>
        </Box>

        <List sx={{ pt: 2, pb: 2 }}>
          {menuItems.map((item, index) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            const IconComponent = item.icon;

            return (
              <Box key={item.text}>
                <ListItem
                  button
                  onClick={() => handleMenuItemClick(item.path)}
                  sx={{
                    mx: 1,
                    mb: 0.5,
                    borderRadius: 2,
                    bgcolor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "white" : "primary.main",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: isActive
                        ? "primary.dark"
                        : "rgba(16, 185, 129, 0.15)",
                      transform: "translateX(2px)",
                    },
                    "&:active": {
                      transform: "translateX(1px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? "white" : "primary.main",
                      minWidth: 40,
                    }}
                  >
                    <IconComponent />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.95rem",
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItem>
                {index < menuItems.length - 1 && (
                  <Divider
                    sx={{
                      mx: 2,
                      my: 0.5,
                      bgcolor: "rgba(51, 65, 85, 0.3)",
                    }}
                  />
                )}
              </Box>
            );
          })}
        </List>

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            borderTop: "1px solid #334155",
            bgcolor: "rgba(30, 41, 59, 0.95)",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#64748B",
              textAlign: "center",
              display: "block",
              fontSize: "0.75rem",
            }}
          >
            © 2025 Estimator Tool For Intervention
          </Typography>
        </Box>
      </Drawer>
    </AppBar>
  );
}

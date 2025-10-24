import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate, useLocation } from "react-router-dom";

export default function TopBar({ toggleSidebar, sidebarOpen }) {
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
          <Tooltip title={sidebarOpen ? "Close sidebar" : "Open sidebar"} arrow>
            <IconButton
              onClick={toggleSidebar}
              sx={{
                color: "primary.main",
                "&:hover": {
                  bgcolor: "rgba(16, 185, 129, 0.15)",
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
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
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              AI-Powered Cost Analysis
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Upload Report" arrow>
            <IconButton
              onClick={() => navigate("/upload")}
              sx={{
                bgcolor:
                  location.pathname === "/upload"
                    ? "primary.main"
                    : "transparent",
                color:
                  location.pathname === "/upload" ? "white" : "primary.main",
                "&:hover": {
                  bgcolor:
                    location.pathname === "/upload"
                      ? "primary.dark"
                      : "rgba(16, 185, 129, 0.15)",
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <UploadFileIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications" arrow>
            <IconButton
              sx={{
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "rgba(16, 185, 129, 0.15)",
                  color: "primary.main",
                },
              }}
            >
              <NotificationsOutlinedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Account" arrow>
            <IconButton
              sx={{
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "rgba(16, 185, 129, 0.15)",
                  color: "primary.main",
                },
              }}
            >
              <AccountCircleOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

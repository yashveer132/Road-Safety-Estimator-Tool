import React from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 280;

const menuItems = [
  { text: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/" },
  { text: "Upload Report", icon: <UploadFileOutlinedIcon />, path: "/upload" },
  { text: "Estimates", icon: <AssessmentOutlinedIcon />, path: "/estimates" },
  {
    text: "Price Management",
    icon: <LocalOfferOutlinedIcon />,
    path: "/prices",
  },
];

export default function SideNav({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const drawerContent = (
    <>
      <Toolbar />

      <Box sx={{ overflow: "auto", mt: 2 }}>
        <List sx={{ px: 1.5 }}>
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));

            return (
              <ListItemButton
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                selected={isActive}
                sx={{
                  mb: 0.5,
                  borderRadius: 2,
                  py: 1.5,
                  transition: "all 0.2s ease-in-out",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.4)",
                    "&:hover": {
                      bgcolor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                  "&:hover": {
                    bgcolor: isActive
                      ? "primary.dark"
                      : "rgba(16, 185, 129, 0.15)",
                    transform: "translateX(4px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "white" : "text.secondary",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.9375rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <Box sx={{ px: 3, py: 2 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)",
              border: "1px solid",
              borderColor: "rgba(16, 185, 129, 0.3)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                mb: 1.5,
                boxShadow: "0px 4px 12px rgba(16, 185, 129, 0.4)",
              }}
            >
              <AssessmentOutlinedIcon />
            </Box>
            <Box
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "text.primary",
                mb: 0.5,
              }}
            >
              Quick Info
            </Box>
            <Box
              sx={{
                fontSize: "0.75rem",
                color: "text.secondary",
                lineHeight: 1.5,
              }}
            >
              Upload intervention reports to get instant material cost estimates
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={open && isMobile}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, 
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#1E293B",
            borderRight: "1px solid",
            borderColor: "#334155",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="persistent"
        open={open && !isMobile}
        sx={{
          display: { xs: "none", md: "block" },
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#1E293B",
            borderRight: "1px solid",
            borderColor: "#334155",
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

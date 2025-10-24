import React, { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import TopBar from "./TopBar.jsx";
import SideNav from "./SideNav.jsx";
import Container from "@mui/material/Container";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#0F172A",
        overflow: "hidden",
      }}
    >
      <TopBar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <SideNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: "64px",
          ml: { xs: 0, md: sidebarOpen ? "280px" : "0" },
          minHeight: "calc(100vh - 64px)",
          width: {
            xs: "100%",
            md: sidebarOpen ? "calc(100% - 280px)" : "100%",
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
        }}
      >
        <Box
          sx={{
            maxWidth: "1400px",
            margin: "0 auto",
            width: "100%",
            px: { xs: 1, sm: 2 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

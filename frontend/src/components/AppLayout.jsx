import React from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import TopBar from "./TopBar.jsx";
import Container from "@mui/material/Container";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#0F172A",
        overflow: "hidden",
      }}
    >
      <TopBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: "64px",
          minHeight: "calc(100vh - 64px)",
          width: "100%",
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

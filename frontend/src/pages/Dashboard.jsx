import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEstimates: 0,
    completedEstimates: 0,
    processingEstimates: 0,
    totalCost: 0,
  });
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);

    const mockEstimates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mock-estimate-")) {
        try {
          const estimate = JSON.parse(localStorage.getItem(key));
          mockEstimates.push(estimate);
        } catch (e) {
          console.error("Failed to parse mock estimate:", e);
        }
      }
    }

    axios
      .get(
        (import.meta.env.VITE_API_URL || "http://localhost:5000") +
          "/api/estimator"
      )
      .then((r) => {
        const apiEstimates = r.data.data.estimates || [];

        const allEstimates = [...mockEstimates, ...apiEstimates].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setRecentEstimates(allEstimates.slice(0, 5));
        setStats({
          totalEstimates: allEstimates.length,
          completedEstimates: allEstimates.filter(
            (e) => e.status === "completed"
          ).length,
          processingEstimates: allEstimates.filter(
            (e) => e.status === "processing"
          ).length,
          totalCost: allEstimates.reduce(
            (sum, e) => sum + (e.totalMaterialCost || 0),
            0
          ),
        });
      })
      .catch(() => {
        setRecentEstimates(mockEstimates.slice(0, 5));
        setStats({
          totalEstimates: mockEstimates.length,
          completedEstimates: mockEstimates.filter(
            (e) => e.status === "completed"
          ).length,
          processingEstimates: mockEstimates.filter(
            (e) => e.status === "processing"
          ).length,
          totalCost: mockEstimates.reduce(
            (sum, e) => sum + (e.totalMaterialCost || 0),
            0
          ),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      title: "Total Estimates",
      value: stats.totalEstimates,
      icon: <AssessmentOutlinedIcon sx={{ fontSize: 40 }} />,
      color: "#10B981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      trend: "+12%",
    },
    {
      title: "Completed",
      value: stats.completedEstimates,
      icon: <DescriptionOutlinedIcon sx={{ fontSize: 40 }} />,
      color: "#27AE60",
      bgColor: "rgba(39, 174, 96, 0.1)",
      trend: "+8%",
    },
    {
      title: "Processing",
      value: stats.processingEstimates,
      icon: <AccessTimeIcon sx={{ fontSize: 40 }} />,
      color: "#F39C12",
      bgColor: "rgba(243, 156, 18, 0.1)",
      trend: "2 active",
    },
    {
      title: "Total Cost",
      value: `₹${(stats.totalCost / 100000).toFixed(2)}L`,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: "#E67E22",
      bgColor: "rgba(230, 126, 34, 0.1)",
      trend: "+15%",
    },
  ];

  return (
    <Box className="fade-in">
      <Box
        sx={{
          background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
          borderRadius: 4,
          p: 4,
          mb: 4,
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0px 8px 24px rgba(16, 185, 129, 0.25)",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome to Road Safety Estimator
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 3, opacity: 0.95, maxWidth: 700, mx: "auto" }}
          >
            AI-powered tool to estimate material costs for road safety
            interventions. Upload intervention reports and get instant cost
            analysis with IRC standards compliance.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate("/upload")}
            startIcon={<UploadFileOutlinedIcon />}
            sx={{
              bgcolor: "#1E293B",
              color: "white",
              fontWeight: 600,
              px: 4,
              "&:hover": {
                bgcolor: "#0F172A",
                transform: "translateY(-2px)",
                boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.3)",
              },
            }}
          >
            Upload New Report
          </Button>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: -50,
            top: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            filter: "blur(40px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: 100,
            bottom: -80,
            width: 250,
            height: 250,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.08)",
            filter: "blur(50px)",
          }}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0px 8px 24px rgba(44, 62, 80, 0.12)",
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: stat.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Chip
                    label={stat.trend}
                    size="small"
                    sx={{
                      bgcolor: "success.light",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Recent Estimates
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Latest processed intervention reports
                </Typography>
              </Box>
              <Button
                onClick={() => navigate("/estimates")}
                sx={{ fontWeight: 600, position: "absolute", right: 24 }}
              >
                View All
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ py: 4 }}>
                <LinearProgress />
              </Box>
            ) : recentEstimates.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  bgcolor: "rgba(30, 41, 59, 0.5)",
                  borderRadius: 2,
                }}
              >
                <DescriptionOutlinedIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography
                  variant="h6"
                  sx={{ color: "text.secondary", mb: 1 }}
                >
                  No estimates yet
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mb: 3 }}
                >
                  Upload your first intervention report to get started
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate("/upload")}
                  startIcon={<UploadFileOutlinedIcon />}
                >
                  Upload Report
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {recentEstimates.map((estimate) => (
                  <Box
                    key={estimate._id}
                    onClick={() => navigate(`/estimates/${estimate._id}`)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        bgcolor: "rgba(16, 185, 129, 0.08)",
                        borderColor: "primary.main",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 0.5 }}
                        >
                          {estimate.documentName}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary", mb: 1 }}
                        >
                          {new Date(estimate.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Typography>
                        <Chip
                          label={estimate.status}
                          size="small"
                          color={
                            estimate.status === "completed"
                              ? "success"
                              : estimate.status === "processing"
                              ? "warning"
                              : "default"
                          }
                          sx={{ textTransform: "capitalize", fontWeight: 500 }}
                        />
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          ₹
                          {(estimate.totalMaterialCost || 0).toLocaleString(
                            "en-IN"
                          )}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          Material Cost
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

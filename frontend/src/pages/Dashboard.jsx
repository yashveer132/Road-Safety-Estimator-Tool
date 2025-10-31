import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Skeleton,
  Tab,
  Tabs,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";
import CountUp from "react-countup";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import StorageIcon from "@mui/icons-material/Storage";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#14B8A6",
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  trend,
  trendDirection,
  loading,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)`,
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          borderColor: color,
          transform: { xs: "none", sm: "translateY(-4px)" },
          boxShadow: { xs: "none", sm: `0 8px 24px ${color}25` },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box
          sx={{
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${color}20`,
            mb: 1,
          }}
        >
          <Icon sx={{ color, fontSize: { xs: 16, sm: 20 } }} />
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            textAlign: "center",
          }}
        >
          {title}
        </Typography>
      </Box>

      {loading ? (
        <Skeleton variant="text" width="70%" sx={{ mb: 1 }} />
      ) : (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            display: "flex",
            alignItems: "baseline",
            gap: 0.5,
            fontSize: { xs: "1rem", sm: "1.25rem" },
            justifyContent: "center",
          }}
        >
          {value >= 1000 ? (
            <CountUp end={Math.round(value)} duration={2} />
          ) : (
            <CountUp
              end={Math.round(value * 100) / 100}
              duration={2}
              decimals={2}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            {unit}
          </Typography>
        </Typography>
      )}

      {trend !== undefined && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: trendDirection === "up" ? "#10B981" : "#EF4444",
              fontWeight: 600,
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {trendDirection === "up" ? "↑" : "↓"} {Math.abs(trend)}%
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            vs last week
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [recentEstimates, setRecentEstimates] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [ircData, setIrcData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);

      const [kpiRes, performanceRes, categoryRes, ircRes, recentRes] =
        await Promise.all([
          axios.get(`${apiUrl}/api/dashboard/kpi`),
          axios.get(`${apiUrl}/api/dashboard/analytics/performance`),
          axios.get(`${apiUrl}/api/dashboard/breakdown/categories`),
          axios.get(`${apiUrl}/api/dashboard/distribution/irc`),
          axios.get(`${apiUrl}/api/dashboard/estimates/recent?limit=8`),
        ]);

      setKpiData(kpiRes.data.data);
      setPerformanceData(performanceRes.data.data);
      setCategoryData(categoryRes.data.data);
      setIrcData(ircRes.data.data);
      setRecentEstimates(recentRes.data.data);

      generateAlerts(kpiRes.data.data, performanceRes.data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      enqueueSnackbar("Failed to load dashboard data", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (kpi, performance) => {
    const alerts = [];

    if (performance && performance.successRate < 80) {
      alerts.push({
        type: "warning",
        message: `Success rate is ${performance.successRate}%. Consider reviewing failed estimates.`,
      });
    }

    if (kpi && kpi.failedEstimates > 5) {
      alerts.push({
        type: "error",
        message: `${kpi.failedEstimates} estimates have failed. Check error logs.`,
      });
    }

    if (kpi && kpi.completionRate < 70) {
      alerts.push({
        type: "warning",
        message:
          "Processing backlog detected. Some estimates are still pending.",
      });
    }

    setActiveAlerts(alerts);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box className="fade-in" sx={{ pb: { xs: 2, sm: 4 } }}>
      <Box
        sx={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          borderRadius: { xs: 2, sm: 4 },
          p: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 4 },
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
            }}
          >
            🛣️ Road Safety Intervention Analytics Dashboard
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              opacity: 0.95,
              maxWidth: { xs: "100%", sm: 600, md: 700 },
              mx: "auto",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              px: { xs: 1, sm: 0 },
            }}
          >
            Comprehensive analytics for material cost estimation with IRC
            standards compliance. Real-time insights into your estimates and
            cost distribution.
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1.5, sm: 2 },
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/upload")}
              startIcon={<UploadFileOutlinedIcon />}
              sx={{
                background: "#EF4444",
                color: "white",
                fontWeight: 600,
                width: { xs: "100%", sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                "&:hover": {
                  background: "#DC2626",
                  transform: "translateY(-2px)",
                  boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.3)",
                },
              }}
            >
              Upload New Report
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/estimates")}
              sx={{
                borderColor: "white",
                color: "white",
                fontWeight: 600,
                width: { xs: "100%", sm: "auto" },
                fontSize: { xs: "0.9rem", sm: "1rem" },
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              View All Estimates
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: -25, sm: -50 },
            top: { xs: -25, sm: -50 },
            width: { xs: 120, sm: 200 },
            height: { xs: 120, sm: 200 },
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            filter: "blur(40px)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            right: { xs: 50, sm: 100 },
            bottom: { xs: -40, sm: -80 },
            width: { xs: 150, sm: 250 },
            height: { xs: 150, sm: 250 },
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.08)",
            filter: "blur(50px)",
          }}
        />
      </Box>

      {activeAlerts.length > 0 && (
        <Box
          sx={{
            mb: { xs: 2, sm: 3 },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          {activeAlerts.map((alert, idx) => (
            <Alert
              key={idx}
              severity={alert.type}
              sx={{
                borderRadius: 2,
                animation: "slideInDown 0.3s ease-in-out",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                py: { xs: 1, sm: 1.5 },
                px: { xs: 2, sm: 3 },
              }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      <Grid
        container
        spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
        sx={{ mb: { xs: 2, sm: 4 } }}
      >
        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Total Estimates"
            value={kpiData?.totalEstimates || 0}
            unit="reports"
            icon={AssignmentIcon}
            color="#3B82F6"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Total Material Cost"
            value={kpiData?.totalMaterialCost || 0}
            unit="₹"
            icon={TrendingUpIcon}
            color="#10B981"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Completion Rate"
            value={kpiData?.completionRate || 0}
            unit="%"
            icon={CheckCircleIcon}
            color="#8B5CF6"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Avg Cost/Estimate"
            value={kpiData?.averageCostPerEstimate || 0}
            unit="₹"
            icon={SpeedIcon}
            color="#F59E0B"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Total Interventions"
            value={kpiData?.totalInterventions || 0}
            unit="items"
            icon={PrecisionManufacturingIcon}
            color="#EC4899"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Unique Materials"
            value={kpiData?.uniqueMaterials || 0}
            unit="types"
            icon={StorageIcon}
            color="#06B6D4"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Estimate Accuracy"
            value={kpiData?.estimateAccuracy || 0}
            unit="%"
            icon={AnalyticsIcon}
            color="#14B8A6"
            loading={loading}
          />
        </Grid>

        <Grid item xs={6} sm={6} md={4} lg={3}>
          <KPICard
            title="Failed Estimates"
            value={kpiData?.failedEstimates || 0}
            unit="errors"
            icon={ErrorIcon}
            color="#EF4444"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          borderRadius: { xs: 2, sm: 3 },
          border: "1px solid",
          borderColor: "divider",
          mb: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            minHeight: { xs: 48, sm: 64 },
            "& .MuiTab-root": {
              minWidth: { xs: 100, sm: 120, md: 150 },
              fontWeight: 600,
              textTransform: "none",
              fontSize: { xs: "0.8rem", sm: "0.875rem", md: "0.95rem" },
              textAlign: "center",
              minHeight: { xs: 48, sm: 64 },
              px: { xs: 1, sm: 2 },
            },
            "& .MuiTabs-scrollButtons": {
              width: { xs: 32, sm: 48 },
            },
          }}
        >
          <Tab label="📊 Overview" />
          <Tab label="🏗️ Categories" />
          <Tab label="📋 Standards" />
        </Tabs>
      </Paper>

      <Box>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    textAlign: "center",
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  }}
                >
                  Category Summary
                </Typography>
                <Grid container spacing={2}>
                  {categoryData.map((category, idx) => (
                    <Grid item xs={6} sm={6} key={idx}>
                      <Box
                        sx={{
                          p: { xs: 1.25, sm: 1.5 },
                          borderRadius: 1.5,
                          bgcolor: `${COLORS[idx % COLORS.length]}15`,
                          border: `1px solid`,
                          borderColor: `${COLORS[idx % COLORS.length]}30`,
                          textAlign: "center",
                          minHeight: { xs: 70, sm: 80 },
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            mb: 0.5,
                          }}
                        >
                          {category.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontSize: { xs: "0.7rem", sm: "0.75rem" },
                          }}
                        >
                          ₹{category.totalCost.toLocaleString()} •{" "}
                          {category.itemCount} items
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  mb: { xs: 2, sm: 3 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    textAlign: "center",
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  }}
                >
                  📝 Recent Estimates
                </Typography>
                {recentEstimates.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: { xs: 3, sm: 4 } }}>
                    <DescriptionOutlinedIcon
                      sx={{
                        fontSize: { xs: 36, sm: 48 },
                        color: "text.disabled",
                        mb: 1,
                      }}
                    />
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                    >
                      No estimates yet. Upload your first report!
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: { xs: 1, sm: 1.5 },
                    }}
                  >
                    {recentEstimates.map((estimate) => (
                      <Box
                        key={estimate.id}
                        onClick={() => navigate(`/estimates/${estimate.id}`)}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "rgba(16, 185, 129, 0.08)",
                            borderColor: "primary.main",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 1, sm: 0 },
                            textAlign: { xs: "center", sm: "left" },
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                              }}
                            >
                              {estimate.documentName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
                            >
                              {estimate.interventionsCount} interventions •{" "}
                              {estimate.sectionsCount} sections
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                            }}
                          >
                            ₹{estimate.totalCost.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {categoryData.map((cat, idx) => (
              <Grid item xs={12} sm={6} lg={4} key={idx}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <CardContent
                    sx={{ p: { xs: 2, sm: 3 }, textAlign: "center" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          borderRadius: 2,
                          bgcolor: `${COLORS[idx % COLORS.length]}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: COLORS[idx % COLORS.length],
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {idx + 1}
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          textAlign: "center",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        }}
                      >
                        {cat.name}
                      </Typography>
                    </Box>
                    <Grid container spacing={{ xs: 1, sm: 2 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "block",
                              mb: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            Total Cost
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                              fontSize: { xs: "1rem", sm: "1.25rem" },
                            }}
                          >
                            ₹{(cat.totalCost / 1000).toFixed(1)}K
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "block",
                              mb: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            Item Count
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "1rem", sm: "1.25rem" },
                            }}
                          >
                            {cat.itemCount}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "block",
                              mb: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            Share
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                            }}
                          >
                            {cat.percentage}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              display: "block",
                              mb: 0.5,
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                            }}
                          >
                            Avg Cost
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                            }}
                          >
                            ₹{cat.averageCostPerItem.toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    textAlign: "center",
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  }}
                >
                  📋 IRC Standards Usage
                </Typography>
                {ircData.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: { xs: 3, sm: 4 },
                      color: "text.secondary",
                    }}
                  >
                    No IRC standards data available
                  </Box>
                ) : (
                  <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                    {ircData.slice(0, 10).map((irc, idx) => (
                      <Grid item xs={12} sm={6} lg={4} key={idx}>
                        <Box
                          sx={{
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "rgba(30, 41, 59, 0.3)",
                            textAlign: "center",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                            minHeight: { xs: 100, sm: 120 },
                          }}
                        >
                          <Chip
                            label={irc.code}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: "text.secondary",
                              textAlign: "center",
                              minHeight: "2.5em",
                              display: "flex",
                              alignItems: "center",
                              fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              lineHeight: 1.3,
                            }}
                          >
                            {irc.clause}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                            }}
                          >
                            {irc.usageCount} uses
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
}

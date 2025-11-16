import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import TableChartIcon from "@mui/icons-material/TableChart";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import {
  formatCurrency,
  formatIndianNumber,
  getCategoryInfo,
  formatSourceWithMetadata,
  generateVersionFooter,
  detectOutlierWarning,
  getConfidenceIndicator,
  getSourceBadge,
  formatQuantityWithUnit,
} from "../utils/format";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const printStyles = `
  @media print {
    body { margin: 0; padding: 20px; }
    .no-print { display: none !important; }
    .fade-in { box-shadow: none; }
    table { page-break-inside: avoid; }
    .MuiPaper-root { box-shadow: none !important; border: 1px solid #ccc !important; }
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = printStyles;
document.head.appendChild(styleSheet);

export default function EstimateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAssumptions, setExpandedAssumptions] = useState(new Set());
  const [rationaleModal, setRationaleModal] = useState({
    open: false,
    item: null,
  });

  useEffect(() => {
    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/estimator/${id}`);
        setEstimate(response.data.data);
      } catch (error) {
        console.error("Error fetching estimate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [id]);

  if (loading) {
    return (
      <Box className="fade-in">
        <LinearProgress />
        <Typography
          variant="body2"
          sx={{ textAlign: "center", mt: 3, color: "text.secondary" }}
        >
          Loading estimate details...
        </Typography>
      </Box>
    );
  }

  if (!estimate) {
    return (
      <Box className="fade-in">
        <Typography
          variant="h6"
          sx={{ color: "text.secondary", textAlign: "center", mt: 4 }}
        >
          Estimate not found
        </Typography>
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button
            onClick={() => navigate("/estimates")}
            startIcon={<ArrowBackIcon />}
          >
            Back to Estimates
          </Button>
        </Box>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const totalCost = estimate.totalMaterialCost || 0;
  const totalInterventions =
    estimate.totalInterventions || estimate.interventions?.length || 0;
  const totalCategories = estimate.categories?.length || 0;

  const toggleAssumptions = (itemId) => {
    setExpandedAssumptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleOpenRationaleModal = (item) => {
    setRationaleModal({
      open: true,
      item: item,
    });
  };

  const handleCloseRationaleModal = () => {
    setRationaleModal({
      open: false,
      item: null,
    });
  };

  return (
    <>
      <Box className="fade-in" sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                color: "white",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                fontWeight: 700,
              }}
            >
              🚦
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "1.75rem", sm: "2.125rem" },
              }}
            >
              {estimate.documentName}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={estimate.status}
                color={getStatusColor(estimate.status)}
                sx={{
                  textTransform: "capitalize",
                  fontWeight: 600,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Created:{" "}
                {new Date(estimate.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: 4,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            background: "linear-gradient(135deg, #1E293B 0%, #0f172a 100%)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: "white",
              textAlign: "center",
              fontSize: { xs: "1.25rem", sm: "1.5rem" },
            }}
          >
            📊 Road Safety Intervention Report
          </Typography>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255,255,255,0.9)",
                mb: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              <strong>Total Interventions Detected:</strong>{" "}
              {totalInterventions}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "rgba(255,255,255,0.9)",
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              <strong>Categories Identified:</strong> {totalCategories}
            </Typography>
          </Box>
        </Paper>

        {estimate.categories && estimate.categories.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                textAlign: "center",
                fontSize: { xs: "1.1rem", sm: "1.25rem" },
              }}
            >
              Categories Overview
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "stretch",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {estimate.categories.map((category) => (
                <Box
                  key={category.id}
                  sx={{ flex: "1 1 300px", maxWidth: 400 }}
                >
                  <Tooltip
                    title={getCategoryInfo(category.id, category.name).tooltip}
                    arrow
                    placement="top"
                  >
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        transition: "all 0.2s",
                        cursor: "pointer",
                        height: "100%",
                        "&:hover": {
                          borderColor: "primary.main",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                        },
                      }}
                      onClick={() => {
                        const element = document.getElementById(
                          `category-${category.id}`
                        );
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ textAlign: "center" }}>
                          <Typography
                            variant="h4"
                            sx={{
                              mb: 1,
                              fontSize: { xs: "2rem", sm: "2.5rem" },
                            }}
                          >
                            {category.emoji}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              mb: 1,
                              fontSize: { xs: "1.1rem", sm: "1.25rem" },
                            }}
                          >
                            {category.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontSize: { xs: "0.8rem", sm: "0.875rem" },
                            }}
                          >
                            {category.count} intervention
                            {category.count !== 1 ? "s" : ""}
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "primary.main",
                              fontSize: { xs: "1.1rem", sm: "1.25rem" },
                            }}
                          >
                            ₹{category.totalCost.toLocaleString("en-IN")}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          sx={{ mb: 4, justifyContent: "center" }}
        >
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: 2,
                      bgcolor: "rgba(16, 185, 129, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "primary.main",
                    }}
                  >
                    <TrendingUpIcon
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      ₹{totalCost.toLocaleString("en-IN")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      }}
                    >
                      Total Cost
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: 2,
                      bgcolor: "rgba(230, 126, 34, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "secondary.main",
                    }}
                  >
                    <DescriptionOutlinedIcon
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      {totalInterventions}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      }}
                    >
                      Interventions
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: 2,
                      bgcolor: "rgba(39, 174, 96, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "success.main",
                    }}
                  >
                    <CategoryOutlinedIcon
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      {totalCategories}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      }}
                    >
                      Categories
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      borderRadius: 2,
                      bgcolor: "rgba(23, 162, 184, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "info.main",
                    }}
                  >
                    <VerifiedOutlinedIcon
                      sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      }}
                    >
                      IRC
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      }}
                    >
                      Standards
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 3,
              textAlign: "center",
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
            }}
          >
            Detailed Intervention Breakdown
          </Typography>

          {estimate.interventions && estimate.interventions.length > 0 ? (
            estimate.interventions.map((category, index) => (
              <Paper
                key={index}
                id={`category-${category.categoryId}`}
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: { xs: 2, sm: 3 },
                    bgcolor: "#1E293B",
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 500,
                      mb: 0.5,
                      fontSize: { xs: "0.85rem", sm: "0.95rem" },
                      opacity: 0.9,
                    }}
                  >
                    {category.categoryId} – {category.categoryName} (
                    {category.items?.length || 0}{" "}
                    {category.items?.length === 1 ? "item" : "items"})
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                    }}
                  >
                    {category.categoryEmoji}
                  </Typography>
                </Box>
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(30, 41, 59, 0.3)" }}>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 30, sm: 40 },
                          }}
                        >
                          #
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 100, sm: 130 },
                          }}
                        >
                          Intervention
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 70, sm: 90 },
                          }}
                        >
                          IRC Reference
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 130, sm: 180 },
                          }}
                        >
                          Materials
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 80, sm: 100 },
                          }}
                        >
                          Unit Rate (₹)
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 80, sm: 100 },
                          }}
                        >
                          Total (₹)
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 60, sm: 70 },
                          }}
                        >
                          Source
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "0.75rem", sm: "0.85rem" },
                            minWidth: { xs: 70, sm: 90 },
                          }}
                        >
                          Details
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {category.items?.map((item, idx) => (
                        <TableRow
                          key={idx}
                          hover
                          sx={{
                            minHeight: 80,
                            "&:hover": {
                              bgcolor: "rgba(16, 185, 129, 0.04)",
                            },
                          }}
                        >
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          >
                            {item.no}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              {item.intervention}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.ircReference}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: { xs: "0.6rem", sm: "0.7rem" },
                                fontWeight: 600,
                                bgcolor: "rgba(16, 185, 129, 0.1)",
                                color: "primary.main",
                                borderColor: "primary.main",
                                height: { xs: 24, sm: 28 },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2,
                                bgcolor: "rgba(139, 69, 19, 0.05)",
                                border: "1px solid rgba(139, 69, 19, 0.2)",
                                borderRadius: 1,
                                minWidth: 180,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "text.secondary",
                                  fontSize: "0.85rem",
                                  mb: 1,
                                  textAlign: "center",
                                }}
                              >
                                Materials
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.7,
                                  alignItems: "flex-start",
                                }}
                              >
                                {(Array.isArray(item.materials)
                                  ? item.materials
                                  : (item.materials || "")
                                      .split(/[,\n]/)
                                      .filter((m) => m.trim())
                                ).map((material, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 0.6,
                                      width: "100%",
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: "0.8rem",
                                        color: "warning.main",
                                        fontWeight: 700,
                                        minWidth: "10px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      •
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: "0.8rem",
                                        color: "text.primary",
                                        fontWeight: 500,
                                        lineHeight: 1.3,
                                        textAlign: "left",
                                        flex: 1,
                                      }}
                                    >
                                      {material.trim()}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Paper>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                          >
                            ₹{formatIndianNumber(item.unitRate || 0, 2)}
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "primary.main",
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              ₹{formatIndianNumber(item.totalCost || 0, 2)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                              }}
                            >
                              <Tooltip
                                title={
                                  getSourceBadge(item.source).label ||
                                  "Rate Source"
                                }
                                arrow
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    justifyContent: "center",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                                    }}
                                  >
                                    {getSourceBadge(item.source).badge}
                                  </Typography>
                                  <Chip
                                    label={formatSourceWithMetadata(
                                      item.source || "N/A",
                                      item.itemId,
                                      item.rateYear || "2024"
                                    )}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      fontSize: { xs: "0.6rem", sm: "0.7rem" },
                                      fontWeight: 600,
                                      height: { xs: 24, sm: 28 },
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                              {item.confidence && (
                                <Tooltip
                                  title={`Confidence: ${item.confidence}`}
                                  arrow
                                >
                                  <Chip
                                    label={
                                      getConfidenceIndicator(item.confidence)
                                        .emoji
                                    }
                                    size="small"
                                    sx={{
                                      fontSize: { xs: "0.6rem", sm: "0.65rem" },
                                      height: 20,
                                      bgcolor:
                                        getConfidenceIndicator(item.confidence)
                                          .color + "20",
                                      color: getConfidenceIndicator(
                                        item.confidence
                                      ).color,
                                      fontWeight: 600,
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View rationale & assumptions" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenRationaleModal(item)}
                                sx={{
                                  color: "primary.main",
                                  "&:hover": {
                                    bgcolor: "rgba(16, 185, 129, 0.1)",
                                  },
                                }}
                              >
                                <InfoOutlinedIcon
                                  sx={{
                                    fontSize: { xs: "1rem", sm: "1.1rem" },
                                  }}
                                />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>{" "}
                <Box
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    bgcolor: "rgba(16, 185, 129, 0.05)",
                    borderTop: "2px solid",
                    borderColor: "divider",
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "primary.main",
                      fontSize: { xs: "1rem", sm: "1.25rem" },
                    }}
                  >
                    Subtotal ({category.categoryId}): ₹
                    {(category.totalCost || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Paper>
            ))
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                textAlign: "center",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.9rem", sm: "1rem" },
                }}
              >
                No interventions available yet
              </Typography>
            </Paper>
          )}
        </Box>

        {estimate.categories && estimate.categories.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(30, 41, 59, 0.8)" }}>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        textAlign: "center",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        minWidth: { xs: 120, sm: 150 },
                      }}
                    >
                      Category
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        minWidth: { xs: 100, sm: 120 },
                      }}
                    >
                      Total (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estimate.categories.map((cat) => (
                    <TableRow key={cat.id} hover sx={{ minHeight: 60 }}>
                      <TableCell
                        sx={{
                          textAlign: "center",
                          fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          }}
                        >
                          {cat.id}. {cat.name}
                        </Typography>
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.8rem", sm: "0.875rem" },
                          }}
                        >
                          ₹{cat.totalCost.toLocaleString("en-IN")}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: "#1E293B", minHeight: 70 }}>
                    <TableCell
                      sx={{
                        textAlign: "center",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "white",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        }}
                      >
                        Grand Total (Material Cost)
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "#10b981",
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        }}
                      >
                        ₹{totalCost.toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mt: 4,
            borderRadius: 3,
            background: "linear-gradient(135deg, #1E293B 0%, #0f172a 100%)",
            color: "white",
            border: "1px solid rgba(16, 185, 129, 0.3)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              textAlign: "center",
              maxWidth: "100%",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              💰 FINAL MATERIAL COST ESTIMATE
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.95,
                mb: 2,
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
              }}
            >
              Excludes labour, installation, and taxes
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                mb: 1,
              }}
            >
              {formatCurrency(totalCost)}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                fontSize: { xs: "0.75rem", sm: "0.85rem" },
              }}
            >
              ± 5% margin: {formatCurrency(totalCost * 0.95)} -{" "}
              {formatCurrency(totalCost * 1.05)}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            mt: 3,
            borderRadius: 3,
            bgcolor: "rgba(59, 130, 246, 0.05)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: "info.main",
              fontSize: { xs: "1rem", sm: "1.125rem" },
            }}
          >
            ℹ️ Important Notes
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              lineHeight: 1.6,
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
              maxWidth: "90%",
              mx: "auto",
            }}
          >
            <strong>Scope:</strong> This estimate covers material costs only and
            excludes labor, installation, equipment rental, transportation, site
            preparation, permits, taxes, and contingencies.
            <br />
            <strong>Accuracy:</strong> Estimates are based on standard
            specifications and prevailing market rates. Actual costs may vary
            based on location, supplier, and market conditions.
            <br />
            <strong>Standards:</strong> All interventions comply with IRC
            guidelines and relevant road safety standards.
            <br />
            <strong>Updates:</strong> Material rates are sourced from CPWD SOR
            2024 and may require periodic updates.
          </Typography>
        </Paper>

        <Box
          sx={{
            mt: 3,
            p: 2,
            textAlign: "center",
            bgcolor: "rgba(30, 41, 59, 0.5)",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: { xs: "0.7rem", sm: "0.75rem" },
            }}
          >
            {generateVersionFooter("1.0.0", "CPWD SOR 2024")}
          </Typography>
        </Box>
      </Box>
      <Dialog
        open={rationaleModal.open}
        onClose={handleCloseRationaleModal}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "rgba(30, 41, 59, 0.95)",
            color: "white",
            textAlign: "center",
            py: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pr: 5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Intervention Details
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, opacity: 0.9, textAlign: "center" }}
            >
              {rationaleModal.item?.intervention}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseRationaleModal}
            sx={{
              color: "white",
              position: "absolute",
              right: 16,
              top: 16,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {rationaleModal.item && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: "primary.main",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  📋 Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(16, 185, 129, 0.05)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
                      >
                        IRC Reference
                      </Typography>
                      <Chip
                        label={rationaleModal.item.ircReference}
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: "rgba(59, 130, 246, 0.05)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
                      >
                        Quantity
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {formatQuantityWithUnit(
                          rationaleModal.item.quantity,
                          rationaleModal.item.unit
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: "#d4af37",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  📌 Rationale
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: "rgba(212, 175, 55, 0.1)",
                    border: "1px solid rgba(212, 175, 55, 0.3)",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#d4af37",
                      fontWeight: 600,
                      lineHeight: 1.6,
                      fontSize: "1rem",
                    }}
                  >
                    {rationaleModal.item.rationale}
                  </Typography>

                  {rationaleModal.item.ircClause && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "primary.main",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        🔗 IRC Reference: {rationaleModal.item.ircClause}
                      </Typography>
                    </Box>
                  )}

                  {rationaleModal.item.sorItems &&
                    rationaleModal.item.sorItems.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          📋 CPWD SOR Items:{" "}
                          {rationaleModal.item.sorItems.join(", ")}
                        </Typography>
                      </Box>
                    )}

                  {rationaleModal.item.confidenceTag && (
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={rationaleModal.item.confidenceTag}
                        sx={{
                          bgcolor:
                            rationaleModal.item.confidence === "high"
                              ? "success.main"
                              : rationaleModal.item.confidence === "low"
                              ? "error.main"
                              : "warning.main",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Box>

              {rationaleModal.item.assumptions &&
                rationaleModal.item.assumptions.length > 0 && (
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 2,
                        color: "text.primary",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      🎯 Key Assumptions (
                      {rationaleModal.item.assumptions.length})
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        bgcolor: "rgba(0, 0, 0, 0.02)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        {rationaleModal.item.assumptions.map(
                          (assumption, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 2,
                                p: 1.5,
                                bgcolor: "rgba(16, 185, 129, 0.05)",
                                borderRadius: 1,
                                border: "1px solid rgba(16, 185, 129, 0.1)",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  color: "primary.main",
                                  fontSize: "1.1rem",
                                  minWidth: "24px",
                                }}
                              >
                                {index + 1}.
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  color: "text.primary",
                                  lineHeight: 1.5,
                                  flex: 1,
                                }}
                              >
                                {assumption}
                              </Typography>
                            </Box>
                          )
                        )}
                      </Box>
                    </Paper>
                  </Box>
                )}

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: "success.main",
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  💰 Cost Breakdown
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "rgba(16, 185, 129, 0.05)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
                      >
                        Unit Rate
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        ₹
                        {formatIndianNumber(
                          rationaleModal.item.unitRate || 0,
                          2
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "rgba(34, 197, 94, 0.05)",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
                      >
                        Total Cost
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "success.main" }}
                      >
                        ₹
                        {formatIndianNumber(
                          rationaleModal.item.totalCost || 0,
                          2
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        textAlign: "center",
                        bgcolor: "rgba(59, 130, 246, 0.05)",
                        border: "1px solid rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "text.secondary", mb: 1 }}
                      >
                        Source
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "info.main" }}
                      >
                        {rationaleModal.item.source || "N/A"}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

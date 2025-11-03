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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import TableChartIcon from "@mui/icons-material/TableChart";
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
  createIRCLink,
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

  return (
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

        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: "auto", sm: "auto" },
              px: { xs: 1, sm: 2 },
            }}
            className="no-print"
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>Print</Box>
            <Box sx={{ display: { xs: "block", sm: "none" } }}>🖨️</Box>
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              const htmlContent = generatePDFReport(estimate);
              const printWindow = window.open("", "_blank");
              printWindow.document.write(htmlContent);
              printWindow.document.close();
              printWindow.print();
            }}
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: "auto", sm: "auto" },
              px: { xs: 1, sm: 2 },
            }}
            className="no-print"
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>Export PDF</Box>
            <Box sx={{ display: { xs: "block", sm: "none" } }}>📄</Box>
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={() => {
              const headers = [
                "Sr.",
                "Category",
                "Intervention",
                "Material",
                "Quantity",
                "Unit",
                "Rate (₹)",
                "Total (₹)",
                "IRC Ref",
                "Source",
              ];
              let csvContent = headers.join(",") + "\n";

              let srNo = 1;
              estimate.interventions?.forEach((category) => {
                category.items?.forEach((item) => {
                  const row = [
                    srNo++,
                    category.categoryName.replace(/,/g, ";"),
                    item.intervention.replace(/,/g, ";"),
                    item.materials.replace(/,/g, ";"),
                    item.quantity,
                    item.unit,
                    item.unitRate || 0,
                    item.totalCost || 0,
                    item.ircReference.replace(/,/g, ";"),
                    (item.source || "N/A").replace(/,/g, ";"),
                  ];
                  csvContent += row.join(",") + "\n";
                });
              });

              csvContent += `\n,,,,,,GRAND TOTAL,${totalCost},,\n`;

              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `${estimate.documentName}_BOQ.csv`;
              link.click();
            }}
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: "auto", sm: "auto" },
              px: { xs: 1, sm: 2 },
            }}
            className="no-print"
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>Export BOQ</Box>
            <Box sx={{ display: { xs: "block", sm: "none" } }}>📊</Box>
          </Button>
          <Button
            variant="outlined"
            startIcon={<TableChartIcon />}
            onClick={() => {
              const data = [
                [
                  "Sr.",
                  "Category",
                  "Intervention",
                  "Material",
                  "Quantity",
                  "Unit",
                  "Rate (₹)",
                  "Total (₹)",
                  "IRC Ref",
                  "Source",
                  "SOR Item Code",
                  "Confidence",
                ],
              ];

              let srNo = 1;
              estimate.interventions?.forEach((category) => {
                category.items?.forEach((item) => {
                  data.push([
                    srNo++,
                    category.categoryName,
                    item.intervention,
                    item.materials,
                    formatQuantityWithUnit(item.quantity, item.unit),
                    item.unit,
                    formatIndianNumber(item.unitRate || 0, 2),
                    formatIndianNumber(item.totalCost || 0, 2),
                    item.ircReference,
                    item.source || "N/A",
                    item.itemId || "N/A",
                    item.confidence || "N/A",
                  ]);
                });
              });

              data.push([
                "",
                "",
                "",
                "",
                "",
                "",
                "GRAND TOTAL",
                formatIndianNumber(totalCost, 2),
                "",
                "",
                "",
                "",
              ]);

              const summaryData = [
                ["COST ESTIMATE SUMMARY"],
                [""],
                ["Category", "Item Count", "Total Cost (₹)"],
              ];

              estimate.categories?.forEach((cat) => {
                summaryData.push([
                  cat.name,
                  cat.count || 0,
                  formatIndianNumber(cat.totalCost, 2),
                ]);
              });

              summaryData.push([
                "GRAND TOTAL",
                totalInterventions,
                formatIndianNumber(totalCost, 2),
              ]);

              summaryData.push(["", "", ""]);
              summaryData.push(["ERROR MARGIN (±5%)"]);
              summaryData.push([""]);
              summaryData.push([
                "Minimum Estimate",
                "",
                formatIndianNumber(totalCost * 0.95, 2),
              ]);
              summaryData.push([
                "Maximum Estimate",
                "",
                formatIndianNumber(totalCost * 1.05, 2),
              ]);
              summaryData.push(["", "", ""]);
              summaryData.push(["Generated by Road Safety Estimator v1.0.0"]);
              summaryData.push([
                `Report Date: ${new Date().toLocaleDateString("en-IN")}`,
              ]);

              const ws = XLSX.utils.aoa_to_sheet(data);
              const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "BOQ");
              XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

              XLSX.writeFile(
                wb,
                `${estimate.documentName}_BOQ_${
                  new Date().toISOString().split("T")[0]
                }.xlsx`
              );
            }}
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              minWidth: { xs: "auto", sm: "auto" },
              px: { xs: 1, sm: 2 },
            }}
            className="no-print"
          >
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              Export Excel
            </Box>
            <Box sx={{ display: { xs: "block", sm: "none" } }}>📈</Box>
          </Button>
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
            <strong>Total Interventions Detected:</strong> {totalInterventions}
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
          <Grid
            container
            spacing={{ xs: 1, sm: 2 }}
            sx={{ justifyContent: "center" }}
          >
            {estimate.categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
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
              </Grid>
            ))}
          </Grid>
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
                          minWidth: { xs: 40, sm: 50 },
                        }}
                      >
                        #
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 120, sm: 150 },
                        }}
                      >
                        Intervention
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 80, sm: 100 },
                        }}
                      >
                        IRC Reference
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 100, sm: 120 },
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
                        Quantity
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 90, sm: 110 },
                        }}
                      >
                        Unit Rate (₹)
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 90, sm: 110 },
                        }}
                      >
                        Total (₹)
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 70, sm: 80 },
                        }}
                      >
                        Source
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.75rem", sm: "0.85rem" },
                          minWidth: { xs: 150, sm: 200 },
                        }}
                      >
                        Rationale
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {category.items?.map((item, idx) => (
                      <TableRow
                        key={idx}
                        hover
                        sx={{
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
                          <Tooltip
                            title="Click to view IRC specification"
                            arrow
                            placement="top"
                          >
                            <Chip
                              label={item.ircReference}
                              size="small"
                              component="a"
                              href={
                                createIRCLink(item.ircReference)?.url ||
                                "https://irc.gov.in/"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              clickable
                              sx={{
                                fontSize: { xs: "0.6rem", sm: "0.7rem" },
                                fontWeight: 600,
                                bgcolor: "rgba(16, 185, 129, 0.1)",
                                color: "primary.main",
                                height: { xs: 24, sm: 28 },
                                cursor: "pointer",
                                "&:hover": {
                                  bgcolor: "rgba(16, 185, 129, 0.2)",
                                  transform: "translateY(-1px)",
                                },
                                transition: "all 0.2s",
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: "0.75rem", sm: "0.8rem" },
                            }}
                          >
                            {item.materials}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          >
                            {formatQuantityWithUnit(item.quantity, item.unit)}
                          </Typography>
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
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              maxHeight: "220px",
                              overflowY: "auto",
                              pr: 1,
                              "&::-webkit-scrollbar": {
                                width: "6px",
                              },
                              "&::-webkit-scrollbar-track": {
                                background: "rgba(0,0,0,0.1)",
                                borderRadius: "3px",
                              },
                              "&::-webkit-scrollbar-thumb": {
                                background: "rgba(212, 175, 55, 0.5)",
                                borderRadius: "3px",
                              },
                              "&::-webkit-scrollbar-thumb:hover": {
                                background: "rgba(212, 175, 55, 0.7)",
                              },
                            }}
                          >
                            <Box sx={{ mb: 1 }}>
                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  bgcolor: "rgba(212, 175, 55, 0.1)",
                                  borderRadius: 1,
                                  border: "1px solid rgba(212, 175, 55, 0.3)",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                    color: "#d4af37",
                                    fontWeight: 600,
                                    mb: 1,
                                  }}
                                >
                                  📌 {item.rationale}
                                </Typography>

                                {item.ircClause && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: {
                                          xs: "0.65rem",
                                          sm: "0.68rem",
                                        },
                                        color: "primary.main",
                                        fontWeight: 600,
                                      }}
                                    >
                                      🔗 IRC Reference: {item.ircClause}
                                    </Typography>
                                  </Box>
                                )}

                                {item.sorItems && item.sorItems.length > 0 && (
                                  <Box sx={{ mb: 1 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: {
                                          xs: "0.65rem",
                                          sm: "0.68rem",
                                        },
                                        color: "text.secondary",
                                        fontWeight: 600,
                                      }}
                                    >
                                      📋 CPWD SOR Items:{" "}
                                      {item.sorItems.join(", ")}
                                    </Typography>
                                  </Box>
                                )}

                                {item.confidenceTag && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: {
                                        xs: "0.65rem",
                                        sm: "0.68rem",
                                      },
                                      fontWeight: 700,
                                      color:
                                        item.confidence === "high"
                                          ? "success.main"
                                          : item.confidence === "low"
                                          ? "error.main"
                                          : "warning.main",
                                    }}
                                  >
                                    {item.confidenceTag}
                                  </Typography>
                                )}
                              </Paper>
                            </Box>

                            {item.assumptions &&
                              item.assumptions.length > 0 && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      fontWeight: 700,
                                      color: "text.secondary",
                                      mb: 0.5,
                                      fontSize: {
                                        xs: "0.65rem",
                                        sm: "0.68rem",
                                      },
                                    }}
                                  >
                                    Key Assumptions:
                                  </Typography>
                                  <Box sx={{ ml: 0.5 }}>
                                    {item.assumptions
                                      .slice(
                                        0,
                                        expandedAssumptions.has(item.no)
                                          ? item.assumptions.length
                                          : 3
                                      )
                                      .map((assumption, aidx) => (
                                        <Typography
                                          key={aidx}
                                          variant="caption"
                                          sx={{
                                            display: "block",
                                            fontSize: {
                                              xs: "0.62rem",
                                              sm: "0.65rem",
                                            },
                                            color: "text.secondary",
                                            mb: 0.2,
                                            lineHeight: 1.3,
                                          }}
                                        >
                                          • {assumption}
                                        </Typography>
                                      ))}
                                    {item.assumptions.length > 3 && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          display: "block",
                                          fontSize: {
                                            xs: "0.6rem",
                                            sm: "0.63rem",
                                          },
                                          color: "primary.main",
                                          fontStyle: "italic",
                                          cursor: "pointer",
                                          "&:hover": {
                                            textDecoration: "underline",
                                          },
                                        }}
                                        onClick={() =>
                                          toggleAssumptions(item.no)
                                        }
                                      >
                                        {expandedAssumptions.has(item.no)
                                          ? "Show less..."
                                          : `+${
                                              item.assumptions.length - 3
                                            } more...`}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              )}
                          </Box>
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
                  <TableRow key={cat.id} hover>
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
                <TableRow sx={{ bgcolor: "#1E293B" }}>
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
  );
}

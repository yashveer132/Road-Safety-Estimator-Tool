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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

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
              const printWindow = window.open("", "_blank");
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Road Safety Estimate Report</title>
                    <style>
                      body {
                        font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background: #0f172a;
                        color: #e2e8f0;
                        line-height: 1.5;
                      }
                      .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #10b981;
                        padding-bottom: 20px;
                        background: linear-gradient(135deg, #1E293B 0%, #0f172a 100%);
                        color: white;
                        padding: 30px 20px;
                        border-radius: 12px;
                      }
                      .logo {
                        font-size: 4rem;
                        margin-bottom: 15px;
                        color: #10b981;
                      }
                      .status-chip {
                        display: inline-block;
                        padding: 4px 12px;
                        background: #10b981;
                        color: white;
                        border-radius: 16px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        margin: 10px 0;
                      }
                      .summary-card {
                        background: linear-gradient(135deg, #1E293B 0%, #0f172a 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        margin: 20px 0;
                      }
                      .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin: 20px 0;
                      }
                      .stat-card {
                        background: #1E293B;
                        border: 1px solid #374151;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        color: white;
                      }
                      .stat-icon {
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        margin: 0 auto 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                      }
                      .category-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                        margin: 20px 0;
                      }
                      .category-card {
                        background: #1E293B;
                        border: 1px solid #374151;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        color: white;
                      }
                      table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        page-break-inside: avoid;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        background: #1E293B;
                        border-radius: 8px;
                        overflow: hidden;
                      }
                      th, td {
                        border: 1px solid #374151;
                        padding: 12px;
                        text-align: center;
                        font-size: 0.85rem;
                        color: #e2e8f0;
                      }
                      th {
                        background-color: #0f172a;
                        font-weight: 700;
                        color: white;
                      }
                      .category-header {
                        background-color: #1E293B;
                        color: white;
                        padding: 15px;
                        text-align: center;
                        margin: 30px 0 10px 0;
                        border-radius: 8px;
                        font-size: 1.2rem;
                        font-weight: 700;
                      }
                      .subtotal-highlight {
                        background: rgba(16, 185, 129, 0.1);
                        padding: 10px;
                        text-align: center;
                        border-top: 2px solid #10b981;
                        margin-bottom: 30px;
                        border-radius: 8px;
                        color: #10b981;
                        font-weight: 700;
                      }
                      .final-total {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 12px;
                        margin: 30px 0;
                        font-size: 1.5rem;
                        font-weight: 700;
                      }
                      .summary-table {
                        margin-top: 20px;
                        background: #1E293B;
                        border-radius: 8px;
                        overflow: hidden;
                      }
                      .summary-table th {
                        background-color: #0f172a;
                        color: white;
                        border: 1px solid #374151;
                      }
                      .summary-table td {
                        border: 1px solid #374151;
                        color: #e2e8f0;
                      }
                      .grand-total-row {
                        background-color: #1E293B;
                        color: white;
                        font-weight: 700;
                        font-size: 1.1rem;
                      }
                      @media print {
                        body {
                          margin: 0;
                          padding: 15px;
                          background: #0f172a !important;
                          -webkit-print-color-adjust: exact;
                          color-adjust: exact;
                        }
                        .no-print { display: none !important; }
                        .stat-card, .category-card {
                          break-inside: avoid;
                          -webkit-print-color-adjust: exact;
                          color-adjust: exact;
                        }
                        table {
                          page-break-inside: avoid;
                          -webkit-print-color-adjust: exact;
                          color-adjust: exact;
                        }
                        .header, .summary-card, .category-header, .final-total {
                          -webkit-print-color-adjust: exact;
                          color-adjust: exact;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div class="logo">🚦</div>
                      <h1>${estimate.documentName}</h1>
                      <div class="status-chip">${estimate.status}</div>
                      <p>Created: ${new Date(
                        estimate.createdAt
                      ).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div class="summary-card">
                      <h2>📊 Road Safety Intervention Report</h2>
                      <p style="font-size: 1.2rem; margin: 10px 0;">
                        <strong>Total Interventions Detected:</strong> ${totalInterventions}
                      </p>
                      <p style="font-size: 1.2rem; margin: 10px 0;">
                        <strong>Categories Identified:</strong> ${totalCategories}
                      </p>
                    </div>
                    <div class="stats-grid">
                      <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">📈</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">₹${totalCost.toLocaleString(
                          "en-IN"
                        )}</div>
                        <div style="color: #9ca3af;">Total Cost</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(230, 126, 34, 0.1); color: #e67e22;">📋</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${totalInterventions}</div>
                        <div style="color: #9ca3af;">Interventions</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(39, 174, 96, 0.1); color: #27ae60;">🏷️</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">${totalCategories}</div>
                        <div style="color: #9ca3af;">Categories</div>
                      </div>
                      <div class="stat-card">
                        <div class="stat-icon" style="background: rgba(23, 162, 184, 0.1); color: #17a2b8;">✓</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">IRC</div>
                        <div style="color: #9ca3af;">Standards</div>
                      </div>
                    </div>
                    ${
                      estimate.categories
                        ? `
                    <h3 style="text-align: center; margin: 30px 0 20px 0; color: #e2e8f0;">Categories Overview</h3>
                    <div class="category-grid">
                      ${estimate.categories
                        .map(
                          (cat) => `
                        <div class="category-card">
                          <div style="font-size: 2rem; margin-bottom: 10px;">${
                            cat.emoji
                          }</div>
                          <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">${
                            cat.name
                          }</div>
                          <div style="color: #9ca3af; margin-bottom: 10px;">${
                            cat.count
                          } intervention${cat.count !== 1 ? "s" : ""}</div>
                          <div style="font-size: 1.3rem; font-weight: 700; color: #10b981;">₹${cat.totalCost.toLocaleString(
                            "en-IN"
                          )}</div>
                        </div>
                      `
                        )
                        .join("")}
                    </div>
                    `
                        : ""
                    }
                    <h3 style="text-align: center; margin: 30px 0 20px 0; color: #e2e8f0;">Detailed Intervention Breakdown</h3>
                    ${
                      estimate.interventions
                        ? estimate.interventions
                            .map(
                              (category) => `
                      <div class="category-header">
                        ${category.categoryEmoji} ${category.categoryName}
                      </div>
                      <div style="margin-bottom: 10px; text-align: center; color: #9ca3af;">
                        ${category.items?.length || 0} intervention${
                                category.items?.length !== 1 ? "s" : ""
                              } • Subtotal: ₹${(
                                category.totalCost || 0
                              ).toLocaleString("en-IN")}
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Intervention</th>
                            <th>IRC Reference</th>
                            <th>Materials</th>
                            <th>Quantity</th>
                            <th>Unit Rate (₹)</th>
                            <th>Total (₹)</th>
                            <th>Source</th>
                            <th>Rationale</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${
                            category.items
                              ? category.items
                                  .map(
                                    (item) => `
                            <tr>
                              <td>${item.no}</td>
                              <td style="text-align: left; font-weight: 600;">${
                                item.intervention
                              }</td>
                              <td><span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${
                                item.ircReference
                              }</span></td>
                              <td style="text-align: left;">${
                                item.materials
                              }</td>
                              <td>${item.quantity} ${item.unit}</td>
                              <td>₹${(item.unitRate || 0).toLocaleString(
                                "en-IN"
                              )}</td>
                              <td style="font-weight: 700; color: #10b981;">₹${(
                                item.totalCost || 0
                              ).toLocaleString("en-IN")}</td>
                              <td><span style="background: #374151; padding: 2px 6px; border-radius: 4px;">${
                                item.source || "N/A"
                              }</span></td>
                              <td style="text-align: left; font-weight: 600; color: #d4af37;">${
                                item.rationale
                              }</td>
                            </tr>
                          `
                                  )
                                  .join("")
                              : ""
                          }
                        </tbody>
                      </table>
                      <div style="background: rgba(16, 185, 129, 0.05); padding: 10px; text-align: center; border-top: 2px solid #10b981; margin-bottom: 30px;">
                        <strong>Subtotal (${category.categoryId}):</strong> ₹${(
                                category.totalCost || 0
                              ).toLocaleString("en-IN")}
                      </div>
                    `
                            )
                            .join("")
                        : ""
                    }
                    ${
                      estimate.categories
                        ? `
                    <table class="summary-table">
                      <thead>
                        <tr>
                          <th style="text-align: center;">Category</th>
                          <th style="text-align: center;">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${estimate.categories
                          .map(
                            (cat) => `
                          <tr>
                            <td style="text-align: center;">${cat.id}. ${
                              cat.name
                            }</td>
                            <td style="text-align: center;">₹${cat.totalCost.toLocaleString(
                              "en-IN"
                            )}</td>
                          </tr>
                        `
                          )
                          .join("")}
                        <tr class="grand-total-row">
                          <td style="text-align: center;"><strong>Grand Total (Material Cost)</strong></td>
                          <td style="text-align: center;"><strong>₹${totalCost.toLocaleString(
                            "en-IN"
                          )}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                    `
                        : ""
                    }
                    <div class="final-total">
                      💰 FINAL MATERIAL COST ESTIMATE<br>
                      <small style="opacity: 0.9;">Excludes labour, installation, and taxes</small><br>
                      <span style="font-size: 2rem;">₹${totalCost.toLocaleString(
                        "en-IN"
                      )}</span>
                    </div>
                  </body>
                </html>
              `);
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
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  }}
                >
                  {category.categoryEmoji} {category.categoryName}
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
                          <Chip
                            label={item.ircReference}
                            size="small"
                            sx={{
                              fontSize: { xs: "0.6rem", sm: "0.7rem" },
                              fontWeight: 600,
                              bgcolor: "rgba(16, 185, 129, 0.1)",
                              color: "primary.main",
                              height: { xs: 24, sm: 28 },
                            }}
                          />
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
                            {item.quantity} {item.unit}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                        >
                          ₹{(item.unitRate || 0).toLocaleString("en-IN")}
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
                            ₹{(item.totalCost || 0).toLocaleString("en-IN")}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.source || "N/A"}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: { xs: "0.6rem", sm: "0.7rem" },
                              fontWeight: 500,
                              height: { xs: 24, sm: 28 },
                            }}
                          />
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
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                                color: "#d4af37",
                                fontWeight: 600,
                              }}
                            >
                              {item.rationale}
                            </Typography>
                            {item.assumptions &&
                              item.assumptions.length > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    pt: 1,
                                    borderTop:
                                      "1px solid rgba(212, 175, 55, 0.3)",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: "block",
                                      fontWeight: 700,
                                      color: "rgba(212, 175, 55, 0.8)",
                                      mb: 0.5,
                                      fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                    }}
                                  >
                                    Assumptions:
                                  </Typography>
                                  <Box sx={{ ml: 1 }}>
                                    {item.assumptions.map(
                                      (assumption, aidx) => (
                                        <Typography
                                          key={aidx}
                                          variant="caption"
                                          sx={{
                                            display: "block",
                                            fontSize: {
                                              xs: "0.65rem",
                                              sm: "0.7rem",
                                            },
                                            color: "rgba(226, 232, 240, 0.7)",
                                            mb: 0.3,
                                          }}
                                        >
                                          • {assumption}
                                        </Typography>
                                      )
                                    )}
                                  </Box>
                                </Box>
                              )}
                            {item.notes && (
                              <Box
                                sx={{
                                  mt: 0.5,
                                  pt: 0.5,
                                  borderTop:
                                    "1px solid rgba(212, 175, 55, 0.3)",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    fontWeight: 700,
                                    color: "rgba(212, 175, 55, 0.8)",
                                    fontSize: { xs: "0.65rem", sm: "0.7rem" },
                                  }}
                                >
                                  Notes: {item.notes}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

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
                        fontSize: { xs: "1rem", sm: "1.25rem" },
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
                        color: "white",
                        fontSize: { xs: "1rem", sm: "1.25rem" },
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
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
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
            }}
          >
            ₹{totalCost.toLocaleString("en-IN")}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

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

export default function EstimateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(
        (import.meta.env.VITE_API_URL || "http://localhost:5000") +
          `/api/estimator/${id}`
      )
      .then((r) => setEstimate(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
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

  const totalCost =
    estimate.materialEstimates?.reduce(
      (sum, m) => sum + (m.totalCost || 0),
      0
    ) ||
    estimate.totalMaterialCost ||
    0;

  return (
    <Box className="fade-in">
      <Box sx={{ mb: 4 }}>
        <Button
          onClick={() => navigate("/estimates")}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2, fontWeight: 600 }}
        >
          Back to Estimates
        </Button>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {estimate.documentName}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={estimate.status}
                color={getStatusColor(estimate.status)}
                sx={{ textTransform: "capitalize", fontWeight: 600 }}
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
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

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 600 }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              sx={{ fontWeight: 600 }}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(45, 95, 63, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "primary.main",
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                  >
                    ₹{totalCost.toLocaleString("en-IN")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(230, 126, 34, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "secondary.main",
                  }}
                >
                  <DescriptionOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {estimate.interventions?.length || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(39, 174, 96, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "success.main",
                  }}
                >
                  <CategoryOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {estimate.materialEstimates?.reduce(
                      (sum, m) => sum + (m.items?.length || 0),
                      0
                    ) || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Items
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
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(23, 162, 184, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "info.main",
                  }}
                >
                  <VerifiedOutlinedIcon />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    IRC
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Standards
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {estimate.interventions && estimate.interventions.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Road Safety Interventions
          </Typography>
          <Grid container spacing={2}>
            {estimate.interventions.map((intervention, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: "rgba(45, 95, 63, 0.04)",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {intervention.name || intervention.description}
                  </Typography>
                  {intervention.quantity && (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Quantity: {intervention.quantity}{" "}
                      {intervention.unit || ""}
                    </Typography>
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Material Cost Breakdown
        </Typography>

        {estimate.materialEstimates && estimate.materialEstimates.length > 0 ? (
          estimate.materialEstimates.map((materialEst, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "primary.main",
                  color: "white",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {materialEst.intervention}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {materialEst.items?.length || 0} items • Total: ₹
                  {(materialEst.totalCost || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Quantity
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Unit
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Unit Price
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Total
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {materialEst.items?.map((item, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.itemName}
                          </Typography>
                          {item.specification && (
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              {item.specification}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{item.unit}</TableCell>
                        <TableCell align="right">
                          ₹{(item.unitPrice || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            ₹
                            {(
                              item.quantity * item.unitPrice || 0
                            ).toLocaleString("en-IN")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.source || "N/A"}
                            size="small"
                            sx={{ fontSize: "0.75rem", fontWeight: 500 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {materialEst.rationale && (
                <Box
                  sx={{
                    p: 2.5,
                    bgcolor: "rgba(45, 95, 63, 0.04)",
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    Rationale & IRC Citations
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {materialEst.rationale}
                  </Typography>
                </Box>
              )}
            </Paper>
          ))
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              No material estimates available yet
            </Typography>
          </Paper>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 4,
          borderRadius: 3,
          background: "linear-gradient(135deg, #2D5F3F 0%, #4A8A5D 100%)",
          color: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Total Material Cost Estimate
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Excludes labour, installation, and taxes
            </Typography>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            ₹{totalCost.toLocaleString("en-IN")}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

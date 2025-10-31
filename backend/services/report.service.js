export const generatePDFReport = async (estimate) => {
  try {
    console.log("📄 Generating PDF report...");

    const htmlContent = generateHTMLReport(estimate);

    const reportData = {
      html: htmlContent,
      estimateId: estimate._id,
      generatedAt: new Date().toISOString(),
    };

    const buffer = Buffer.from(JSON.stringify(reportData, null, 2));

    return buffer;
  } catch (error) {
    console.error("Error generating PDF report:", error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
};

const generateHTMLReport = (estimate) => {
  const formatCurrency = (amount) =>
    `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN");

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Road Safety Intervention - Cost Estimate Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; }
    .header h1 { color: #2c3e50; font-size: 28px; margin-bottom: 10px; }
    .header p { color: #7f8c8d; font-size: 14px; }
    .summary { background: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .summary h2 { color: #2c3e50; font-size: 20px; margin-bottom: 15px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .summary-item { display: flex; justify-content: space-between; padding: 10px; background: white; border-radius: 5px; }
    .summary-item label { font-weight: 600; color: #34495e; }
    .summary-item value { color: #16a085; font-weight: 700; }
    .intervention { margin-bottom: 40px; page-break-inside: avoid; }
    .intervention-header { background: #3498db; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
    .intervention-header h3 { font-size: 18px; }
    .intervention-body { border: 2px solid #3498db; border-top: none; padding: 20px; border-radius: 0 0 8px 8px; }
    .irc-reference { background: #fffae6; padding: 10px; border-left: 4px solid #f39c12; margin: 15px 0; }
    .irc-reference strong { color: #f39c12; }
    .materials-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .materials-table th { background: #34495e; color: white; padding: 12px; text-align: left; font-weight: 600; }
    .materials-table td { padding: 10px; border-bottom: 1px solid #ecf0f1; }
    .materials-table tr:nth-child(even) { background: #f8f9fa; }
    .materials-table tr:hover { background: #e8f4f8; }
    .total-row { background: #d5f4e6 !important; font-weight: 700; font-size: 16px; }
    .total-row td { border-top: 2px solid #16a085; padding: 15px 10px; }
    .assumptions { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .assumptions h4 { color: #856404; margin-bottom: 10px; }
    .assumptions ul { margin-left: 20px; }
    .assumptions li { margin: 5px 0; color: #856404; }
    .rationale { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .rationale h4 { color: #0c5460; margin-bottom: 10px; }
    .rationale p { color: #0c5460; }
    .footer { margin-top: 50px; text-align: center; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #7f8c8d; font-size: 12px; }
    .grand-total { background: #2ecc71; color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0; }
    .grand-total h2 { font-size: 24px; margin-bottom: 10px; }
    .grand-total .amount { font-size: 36px; font-weight: 700; }
    .note { background: #ffeaa7; padding: 15px; border-left: 4px solid #fdcb6e; margin: 20px 0; }
    .note strong { color: #e17055; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛣️ Road Safety Intervention Cost Estimate Report</h1>
    <p>Material Cost Estimation Based on IRC Standards</p>
    <p>Document: ${estimate.documentName} | Generated: ${formatDate(
    new Date()
  )}</p>
  </div>

  <div class="summary">
    <h2>📊 Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <label>Total Interventions:</label>
        <value>${estimate.interventions.length}</value>
      </div>
      <div class="summary-item">
        <label>Total Material Cost:</label>
        <value>${formatCurrency(estimate.totalMaterialCost)}</value>
      </div>
      <div class="summary-item">
        <label>Document Type:</label>
        <value>${estimate.documentType.toUpperCase()}</value>
      </div>
      <div class="summary-item">
        <label>Report Date:</label>
        <value>${formatDate(estimate.createdAt)}</value>
      </div>
    </div>
  </div>

  <div class="note">
    <strong>⚠️ Important Note:</strong> This estimate includes <strong>MATERIAL COSTS ONLY</strong>. 
    Labour charges, installation costs, service fees, transportation, and taxes are NOT included in this estimate.
  </div>
`;

  estimate.materialEstimates.forEach((materialEst, index) => {
    html += `
  <div class="intervention">
    <div class="intervention-header">
      <h3>${index + 1}. ${materialEst.intervention}</h3>
    </div>
    <div class="intervention-body">
      <div class="irc-reference">
        <strong>📚 IRC Reference:</strong> ${materialEst.ircReference}
      </div>

      <table class="materials-table">
        <thead>
          <tr>
            <th>Material Item</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Unit Price</th>
            <th>Total Price</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
`;

    materialEst.items.forEach((item) => {
      html += `
          <tr>
            <td><strong>${item.itemName}</strong></td>
            <td>${item.description || "-"}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.totalPrice)}</td>
            <td><small>${item.source}</small></td>
          </tr>
`;
    });

    html += `
          <tr class="total-row">
            <td colspan="5"><strong>Subtotal for ${
              materialEst.intervention
            }</strong></td>
            <td colspan="2"><strong>${formatCurrency(
              materialEst.totalCost
            )}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="rationale">
        <h4>💡 Rationale & Methodology</h4>
        <p>${materialEst.rationale}</p>
      </div>

      <div class="assumptions">
        <h4>📋 Assumptions</h4>
        <ul>
          ${materialEst.assumptions
            .map((assumption) => `<li>${assumption}</li>`)
            .join("")}
        </ul>
      </div>
    </div>
  </div>
`;
  });

  html += `
  <div class="grand-total">
    <h2>💰 Grand Total Material Cost</h2>
    <div class="amount">${formatCurrency(estimate.totalMaterialCost)}</div>
    <p style="margin-top: 10px; font-size: 14px;">Material costs only - excludes labor, installation, and taxes</p>
  </div>

  <div class="footer">
    <p><strong>Estimator Tool For Intervention</strong></p>
    <p>Powered by AI | Based on IRC Standards and CPWD/GeM Price Data</p>
    <p>Report ID: ${estimate._id} | Generated: ${new Date().toLocaleString(
    "en-IN"
  )}</p>
    <p style="margin-top: 10px; font-size: 11px;">
      This is an automated estimate. Please verify quantities and prices before procurement.
    </p>
  </div>
</body>
</html>
`;

  return html;
};

export default {
  generatePDFReport,
  generateHTMLReport,
};

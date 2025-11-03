import {
  formatCurrency,
  formatIndianNumber,
  formatSourceWithMetadata,
  generateVersionFooter,
} from "../utils/format";

export const generatePDFReport = (estimate) => {
  const totalCost = estimate.totalMaterialCost || 0;
  const totalInterventions =
    estimate.totalInterventions || estimate.interventions?.length || 0;
  const totalCategories = estimate.categories?.length || 0;
  const versionFooter = generateVersionFooter("1.0.0", "CPWD SOR 2024");

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Road Safety Estimate Report - ${estimate.documentName}</title>
    <meta charset="UTF-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        padding: 20px;
        background: #0f172a;
        color: #e2e8f0;
        line-height: 1.6;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px solid #10b981;
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
      
      .header h1 {
        font-size: 2.2rem;
        margin-bottom: 10px;
        font-weight: 700;
      }
      
      .status-chip {
        display: inline-block;
        padding: 6px 16px;
        background: #10b981;
        color: white;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 10px 0;
        text-transform: capitalize;
      }
      
      .metadata {
        font-size: 0.9rem;
        color: #94a3b8;
        margin-top: 10px;
      }
      
      .summary-card {
        background: linear-gradient(135deg, #1E293B 0%, #0f172a 100%);
        color: white;
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        margin: 25px 0;
        border: 2px solid #10b981;
      }
      
      .summary-card h2 {
        font-size: 1.8rem;
        margin-bottom: 15px;
        color: #10b981;
      }
      
      .summary-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-top: 15px;
      }
      
      .stat-item {
        padding: 10px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 8px;
      }
      
      .stat-label {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 5px;
      }
      
      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #10b981;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 25px 0;
      }
      
      .stat-card {
        background: #1E293B;
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        color: white;
        transition: transform 0.2s;
      }
      
      .stat-card:hover {
        transform: translateY(-2px);
        border-color: #10b981;
      }
      
      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 10px;
        margin: 0 auto 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
      }
      
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin: 25px 0;
      }
      
      .category-card {
        background: #1E293B;
        border: 2px solid #334155;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        color: white;
        transition: all 0.2s;
      }
      
      .category-card:hover {
        border-color: #10b981;
        transform: translateY(-2px);
      }
      
      .category-emoji {
        font-size: 2.5rem;
        margin-bottom: 10px;
      }
      
      .category-name {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .category-count {
        font-size: 0.9rem;
        color: #94a3b8;
        margin-bottom: 10px;
      }
      
      .category-cost {
        font-size: 1.4rem;
        font-weight: 700;
        color: #10b981;
      }
      
      .section-title {
        text-align: center;
        margin: 40px 0 25px 0;
        font-size: 1.8rem;
        font-weight: 700;
        color: #e2e8f0;
      }
      
      .category-header {
        background: linear-gradient(135deg, #1E293B 0%, #0f172a 100%);
        color: white;
        padding: 20px;
        text-align: center;
        margin: 35px 0 15px 0;
        border-radius: 10px;
        font-size: 1.5rem;
        font-weight: 700;
        border: 2px solid #10b981;
      }
      
      .category-meta {
        font-size: 0.95rem;
        color: #94a3b8;
        text-align: center;
        margin-bottom: 15px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        page-break-inside: avoid;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        background: #1E293B;
        border-radius: 10px;
        overflow: hidden;
      }
      
      th, td {
        border: 1px solid #334155;
        padding: 14px 10px;
        text-align: center;
        font-size: 0.9rem;
        color: #e2e8f0;
      }
      
      th {
        background-color: #0f172a;
        font-weight: 700;
        color: white;
        text-transform: uppercase;
        font-size: 0.85rem;
        letter-spacing: 0.5px;
      }
      
      tr:hover {
        background: rgba(16, 185, 129, 0.05);
      }
      
      .confidence-badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        margin-left: 5px;
      }
      
      .confidence-high { background: #10b981; color: white; }
      .confidence-medium { background: #f59e0b; color: white; }
      .confidence-low { background: #ef4444; color: white; }
      
      .source-badge {
        background: #334155;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        display: inline-block;
      }
      
      .irc-badge {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        padding: 4px 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.85rem;
      }
      
      .subtotal-highlight {
        background: rgba(16, 185, 129, 0.1);
        padding: 15px;
        text-align: center;
        border-top: 3px solid #10b981;
        margin: 20px 0 35px 0;
        border-radius: 8px;
        font-size: 1.3rem;
        font-weight: 700;
        color: #10b981;
      }
      
      .final-total {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 35px;
        text-align: center;
        border-radius: 12px;
        margin: 35px 0;
        box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
      }
      
      .final-total-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 10px;
      }
      
      .final-total-note {
        font-size: 0.9rem;
        opacity: 0.95;
        margin-bottom: 15px;
      }
      
      .final-total-amount {
        font-size: 2.5rem;
        font-weight: 700;
      }
      
      .error-margin {
        font-size: 1rem;
        margin-top: 10px;
        opacity: 0.9;
      }
      
      .summary-table {
        margin-top: 25px;
        background: #1E293B;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .grand-total-row {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        font-weight: 700;
        font-size: 1.2rem;
      }
      
      .grand-total-row td {
        padding: 18px;
        border-color: #059669;
      }
      
      .footer {
        text-align: center;
        margin-top: 40px;
        padding: 20px;
        background: #1E293B;
        border-radius: 10px;
        border-top: 2px solid #10b981;
        font-size: 0.85rem;
        color: #94a3b8;
      }
      
      .disclaimer {
        background: rgba(239, 68, 68, 0.1);
        border-left: 4px solid #ef4444;
        padding: 15px;
        margin: 25px 0;
        border-radius: 6px;
        font-size: 0.9rem;
      }
      
      .disclaimer-title {
        font-weight: 700;
        color: #ef4444;
        margin-bottom: 8px;
      }
      
      .rationale-section {
        background: rgba(212, 175, 55, 0.1);
        padding: 12px;
        border-radius: 6px;
        margin-top: 8px;
        font-size: 0.85rem;
        text-align: left;
      }
      
      .rationale-title {
        font-weight: 700;
        color: #d4af37;
        margin-bottom: 6px;
      }
      
      .assumption-list {
        margin: 8px 0 0 15px;
        color: #cbd5e1;
      }
      
      .assumption-list li {
        margin-bottom: 4px;
      }
      
      @media print {
        body {
          margin: 0;
          padding: 15px;
          background: #0f172a !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .stat-card, .category-card, .category-header, .final-total {
          break-inside: avoid;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        table {
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .header, .summary-card {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <!-- Header -->
    <div class="header">
      <div class="logo">🚦</div>
      <h1>${estimate.documentName}</h1>
      <div class="status-chip">${estimate.status}</div>
      <div class="metadata">
        Created: ${new Date(estimate.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>

    <!-- Summary Card -->
    <div class="summary-card">
      <h2>📊 Road Safety Intervention Estimate</h2>
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-label">Total Interventions Detected</div>
          <div class="stat-value">${totalInterventions}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Categories Identified</div>
          <div class="stat-value">${totalCategories}</div>
        </div>
      </div>
    </div>

    <!-- Key Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">📈</div>
        <div class="stat-value">${formatCurrency(totalCost)}</div>
        <div class="stat-label">Total Material Cost</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(230, 126, 34, 0.15); color: #e67e22;">📋</div>
        <div class="stat-value">${totalInterventions}</div>
        <div class="stat-label">Interventions</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(39, 174, 96, 0.15); color: #27ae60;">🏷️</div>
        <div class="stat-value">${totalCategories}</div>
        <div class="stat-label">Categories</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(23, 162, 184, 0.15); color: #17a2b8;">✓</div>
        <div class="stat-value">IRC</div>
        <div class="stat-label">Standards Compliant</div>
      </div>
    </div>

    <!-- Categories Overview -->
    ${
      estimate.categories && estimate.categories.length > 0
        ? `
    <h3 class="section-title">Categories Overview</h3>
    <div class="category-grid">
      ${estimate.categories
        .map(
          (cat) => `
        <div class="category-card">
          <div class="category-emoji">${cat.emoji}</div>
          <div class="category-name">${cat.name}</div>
          <div class="category-count">${cat.count} intervention${
            cat.count !== 1 ? "s" : ""
          }</div>
          <div class="category-cost">${formatCurrency(cat.totalCost)}</div>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <!-- Detailed Breakdown -->
    <h3 class="section-title">Detailed Intervention Breakdown</h3>
    
    ${
      estimate.interventions
        ? estimate.interventions
            .map(
              (category) => `
      <div class="category-header">
        ${category.categoryEmoji} ${category.categoryName}
      </div>
      <div class="category-meta">
        ${category.items?.length || 0} intervention${
                category.items?.length !== 1 ? "s" : ""
              } • 
        Subtotal: <strong>${formatCurrency(category.totalCost || 0)}</strong>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Intervention</th>
            <th>IRC Reference</th>
            <th>Materials</th>
            <th>Quantity</th>
            <th>Unit Rate</th>
            <th>Total Cost</th>
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
              <td><strong>${item.no}</strong></td>
              <td style="text-align: left; font-weight: 600;">${
                item.intervention
              }</td>
              <td><span class="irc-badge">${item.ircReference}</span></td>
              <td style="text-align: left;">${item.materials}</td>
              <td><strong>${item.quantity} ${item.unit}</strong></td>
              <td>${formatCurrency(item.unitRate || 0)}</td>
              <td style="font-weight: 700; color: #10b981;">${formatCurrency(
                item.totalCost || 0
              )}</td>
              <td>
                <span class="source-badge">${formatSourceWithMetadata(
                  item.source,
                  item.itemId,
                  item.rateYear || "2024"
                )}</span>
                ${
                  item.confidence
                    ? `<span class="confidence-badge confidence-${
                        item.confidence
                      }">${item.confidence.toUpperCase()}</span>`
                    : ""
                }
              </td>
              <td style="text-align: left;">
                <div class="rationale-section">
                  <div class="rationale-title">📌 ${item.rationale}</div>
                  ${
                    item.assumptions && item.assumptions.length > 0
                      ? `
                    <ul class="assumption-list">
                      ${item.assumptions
                        .slice(0, 3)
                        .map((assumption) => `<li>${assumption}</li>`)
                        .join("")}
                    </ul>
                  `
                      : ""
                  }
                  ${
                    item.notes
                      ? `<div style="margin-top: 8px; font-size: 0.8rem; opacity: 0.9;"><strong>Note:</strong> ${item.notes}</div>`
                      : ""
                  }
                </div>
              </td>
            </tr>
          `
                  )
                  .join("")
              : ""
          }
        </tbody>
      </table>
      
      <div class="subtotal-highlight">
        <strong>Subtotal (${category.categoryId}):</strong> ${formatCurrency(
                category.totalCost || 0
              )}
      </div>
    `
            )
            .join("")
        : ""
    }

    <!-- Summary Table -->
    ${
      estimate.categories && estimate.categories.length > 0
        ? `
    <h3 class="section-title">Cost Summary by Category</h3>
    <table class="summary-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Description</th>
          <th>Interventions</th>
          <th>Total Cost</th>
        </tr>
      </thead>
      <tbody>
        ${estimate.categories
          .map(
            (cat) => `
          <tr>
            <td style="font-weight: 600;">${cat.id}. ${cat.emoji} ${
              cat.name
            }</td>
            <td style="text-align: left;">${
              cat.description || "Road safety improvements"
            }</td>
            <td>${cat.count}</td>
            <td style="font-weight: 600;">${formatCurrency(cat.totalCost)}</td>
          </tr>
        `
          )
          .join("")}
        <tr class="grand-total-row">
          <td colspan="3"><strong>GRAND TOTAL (Material Cost)</strong></td>
          <td><strong>${formatCurrency(totalCost)}</strong></td>
        </tr>
      </tbody>
    </table>
    `
        : ""
    }

    <!-- Final Total -->
    <div class="final-total">
      <div class="final-total-title">💰 FINAL MATERIAL COST ESTIMATE</div>
      <div class="final-total-note">Excludes labour, installation, taxes, and contingencies</div>
      <div class="final-total-amount">${formatCurrency(totalCost)}</div>
      <div class="error-margin">± 5% margin: ${formatCurrency(
        totalCost * 0.95
      )} - ${formatCurrency(totalCost * 1.05)}</div>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <div class="disclaimer-title">⚠️ Important Notes</div>
      <ul style="margin-left: 20px; margin-top: 8px;">
        <li>Material costs are based on CPWD SOR 2024 and GeM portal rates</li>
        <li>Prices exclude GST, labour charges, installation, transportation, and site conditions</li>
        <li>Actual costs may vary based on location, market conditions, and procurement method</li>
        <li>All interventions comply with relevant IRC specifications and standards</li>
        <li>Quantities are estimated based on standard practices; site verification recommended</li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${versionFooter}
    </div>
  </body>
</html>
  `;
};

export default generatePDFReport;

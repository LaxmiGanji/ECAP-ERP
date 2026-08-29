/**
 * Report Exporter Utility
 * Provides CSV export and institutional print/PDF report generation
 */

// Export array of objects as a downloadable CSV file
export const downloadCSV = (filename, dataArray) => {
  if (!dataArray || dataArray.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Extract column keys
  const keys = Object.keys(dataArray[0]);

  // Build CSV headers and rows
  const csvRows = [];
  csvRows.push(keys.map((k) => `"${k.toUpperCase()}"`).join(","));

  dataArray.forEach((row) => {
    const values = keys.map((key) => {
      const val = row[key] === null || row[key] === undefined ? "" : String(row[key]);
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Print/PDF formatted document layout
export const printFormattedReport = (title, headers, dataArray, metadata = {}) => {
  if (!dataArray || dataArray.length === 0) {
    alert("No data available to generate report.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to open the print preview.");
    return;
  }

  const keys = Object.keys(headers);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #6366f1;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .institution {
            font-size: 20px;
            font-weight: 800;
            color: #1e1b4b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .sub-title {
            font-size: 13px;
            color: #64748b;
            font-weight: 600;
            margin-top: 4px;
          }
          .meta-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .meta-item {
            font-weight: 600;
            color: #475569;
          }
          .meta-value {
            color: #4338ca;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 24px;
          }
          th {
            background-color: #4338ca;
            color: #ffffff;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #3730a3;
          }
          td {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 10px;
          }
          .badge-high { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
          .badge-medium { background: #fffbebf; color: #d97706; border: 1px solid #fcd34d; }
          .badge-low { background: #ecfdf5; color: #059669; border: 1px solid #6ee7b7; }
          .footer {
            margin-top: 32px;
            padding-top: 12px;
            border-top: 1px dashed #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="institution">ECAP ACADEMIC ERP REPORT SYSTEM</div>
            <div class="sub-title">${title}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
        </div>

        <div class="meta-bar">
          <div class="meta-item">Total Records: <span class="meta-value">${dataArray.length}</span></div>
          ${Object.keys(metadata).map(k => `<div class="meta-item">${k}: <span class="meta-value">${metadata[k]}</span></div>`).join("")}
        </div>

        <table>
          <thead>
            <tr>
              ${keys.map((k) => `<th>${headers[k]}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${dataArray.map((row) => `
              <tr>
                ${keys.map((k) => {
                  const val = row[k] === null || row[k] === undefined ? "" : String(row[k]);
                  if (k === "riskLevel" || k === "placementStatus") {
                    const badgeClass = val.includes("High") || val.includes("Enhancement") ? "badge-high" : val.includes("Medium") || val.includes("Moderate") ? "badge-medium" : "badge-low";
                    return `<td><span class="badge ${badgeClass}">${val}</span></td>`;
                  }
                  return `<td>${val}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          <div>CONFIDENTIAL • FOR INSTITUTIONAL USE ONLY</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

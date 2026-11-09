/**
 * htmlDocument.js — Document Shell & Printable CSS Engine.
 * 
 * Assembles the full HTML document string for preview iframes and physical printing.
 */

import { SHARED_PRINT_CSS } from "../../../pages/settings/sharedPrintConfig.js";

export function assembleHtmlDocument({
  title = "Medical Encounter Slip",
  pageSize = "A4",
  pageMargin = 6,
  orientation = "portrait",
  headerHtml = "",
  titleBannerHtml = "",
  demographicsHtml = "",
  bodyHtml = "",
  footerHtml = "",
  isPreview = false,
  iframeScript = "",
}) {
  const isA5 = pageSize.toUpperCase() === "A5";
  const sizeRule = isA5 ? "A5 portrait" : `${pageSize} ${orientation}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${SHARED_PRINT_CSS}

    @page {
      size: ${sizeRule};
      margin: ${pageMargin}mm;
    }

    body {
      margin: 0;
      padding: ${isPreview ? "10px" : "0"};
      background: ${isPreview ? "#f8fafc" : "#ffffff"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .printable-sheet {
      width: 100%;
      max-width: ${isA5 ? "148mm" : "210mm"};
      margin: 0 auto;
      background: #ffffff;
      box-sizing: border-box;
      ${isPreview ? "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 12px;" : ""}
    }

    .slip-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-top: 4px;
    }

    .slip-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
    }

    .slip-table td {
      border: 1px solid #e2e8f0;
      padding: 3.5px 6px;
      vertical-align: middle;
    }

    .num-col {
      width: 28px;
      text-align: center;
      font-weight: 700;
      color: #64748b;
    }

    .amt-col {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    @media print {
      body {
        padding: 0 !important;
        background: transparent !important;
      }
      .printable-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="printable-sheet">
    ${headerHtml}
    ${titleBannerHtml}
    ${demographicsHtml}
    ${bodyHtml}
    ${footerHtml}
  </div>
  ${iframeScript ? `<script>${iframeScript}</script>` : ""}
</body>
</html>`;
}

export default assembleHtmlDocument;

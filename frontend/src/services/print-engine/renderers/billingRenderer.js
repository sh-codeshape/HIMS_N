/**
 * billingRenderer.js — IPD Final Tax Invoice & Itemized Ledger Body Renderer.
 * 
 * Supports:
 * - Dynamic GST modes (composite, exempt, inclusive, exclusive) via cfg.billing.gstMode
 * - UPI Dynamic QR generation via cfg.billing.upiId
 * - Charge category grouping via cfg.billing.groupCharges
 * - Payments ledger audit via cfg.billing.paymentBreakdown
 */

import { getElementComputedStyle, getClickableAttr } from "../../../pages/settings/sharedPrintConfig.js";
import { esc, getUpiQrUrl } from "../config/defaults.js";

export function renderBillingBody(data, cfg, options = {}) {
  const fs = cfg.fieldStyles || {};
  const cardStyle = getElementComputedStyle("body.card", fs);
  const clickAttr = getClickableAttr("body.card", options.isPreview);

  const billingCfg = cfg.billing || {};
  const gstMode = billingCfg.gstMode || "composite";
  const upiId = billingCfg.upiId || data.upiId || "";
  const showGroupCharges = billingCfg.groupCharges !== false;
  const showPaymentBreakdown = billingCfg.paymentBreakdown !== false;

  const rawItems = Array.isArray(data.items) && data.items.length > 0 ? data.items : [];
  const rawPayments = Array.isArray(data.payments) && data.payments.length > 0 ? data.payments : [];

  const subtotal = Number(data.subtotal || rawItems.reduce((acc, i) => acc + Number(i.amount || 0), 0));
  const discount = Number(data.discount || 0);
  const netBillable = Math.max(0, subtotal - discount);

  let taxRate = 0;
  let taxAmount = 0;
  let finalNetBillable = netBillable;

  if (gstMode === "exclusive") {
    taxRate = 5;
    taxAmount = (netBillable * taxRate) / 100;
    finalNetBillable = netBillable + taxAmount;
  } else if (gstMode === "inclusive") {
    taxRate = 5;
    taxAmount = (netBillable * taxRate) / (100 + taxRate);
  }

  const advancePaid = Number(
    data.advancePaid ||
      data.totalPaid ||
      rawPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)
  );
  const balanceDue = finalNetBillable - advancePaid;

  const upiQrUrl = upiId && balanceDue > 0
    ? getUpiQrUrl(upiId, balanceDue, cfg.hospital?.name, data.billNo || data.encounterNo)
    : "";

  return `
    <div class="slip-body-card" style="${cardStyle}" ${clickAttr}>
      <!-- Top Billing Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #0284c7; padding-bottom: 4px; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 10px; color: #0b3b60; text-transform: uppercase;">Inpatient Final Tax Invoice &amp; Settlement Ledger</span>
        <span style="font-size: 8.5px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px;">
          Bill No: ${esc(data.billNo || data.invoiceNo || data.encounterNo || "—")}
        </span>
      </div>

      <!-- Itemized Ledger Table -->
      <div style="margin-bottom: 6px;">
        <table class="slip-table">
          <thead>
            <tr>
              <th class="num-col">#</th>
              <th>Date</th>
              <th>Service Particulars</th>
              ${showGroupCharges ? `<th>Category</th>` : ""}
              <th class="num-col">Qty</th>
              <th class="amt-col">Rate (₹)</th>
              <th class="amt-col">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${
              rawItems.length === 0
                ? `<tr><td colspan="${showGroupCharges ? 7 : 6}" style="text-align: center; color: #94a3b8; padding: 8px;">No billable ledger items recorded.</td></tr>`
                : rawItems
                    .map(
                      (item, idx) => `
              <tr>
                <td class="num-col">${idx + 1}</td>
                <td style="white-space: nowrap; font-size: 8px; color: #64748b;">${esc(item.date || "—")}</td>
                <td><strong>${esc(item.particular || item.name || "Service Charge")}</strong></td>
                ${showGroupCharges ? `<td style="font-size: 8px; color: #0284c7;">${esc(item.category || "General")}</td>` : ""}
                <td class="num-col">${Number(item.qty || 1)}</td>
                <td class="amt-col">${Number(item.rate || item.amount || 0).toFixed(2)}</td>
                <td class="amt-col" style="font-family: monospace;">${Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            `
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>

      <!-- Settlement Split: Payments Ledger & Totals Table -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
        ${
          showPaymentBreakdown
            ? `
          <!-- Left: Payments Breakdown -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>ADVANCE &amp; INTERIM PAYMENTS</span>
              <span style="color: #059669;">Total Paid: ₹ ${advancePaid.toFixed(2)}</span>
            </div>
            ${
              rawPayments.length === 0
                ? `<p style="font-size: 7.5px; color: #94a3b8; margin: 4px 0;">No advance payments recorded.</p>`
                : rawPayments
                    .map(
                      (p) => `
              <div style="display: flex; justify-content: space-between; font-size: 8px; padding: 2px 0; border-bottom: 1px dotted #e2e8f0;">
                <span style="color: #475569;">${esc(p.date || "")} (${esc(p.mode || "Payment")})</span>
                <strong style="color: #0f172a; font-family: monospace;">₹ ${Number(p.amount || 0).toFixed(2)}</strong>
              </div>
            `
                    )
                    .join("")
            }
          </div>
        `
            : `<div></div>`
        }

        <!-- Right: Financial Summary & UPI QR -->
        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; display: flex; gap: 8px; justify-content: space-between; align-items: center;">
          ${
            upiQrUrl
              ? `
            <div style="text-align: center; flex-shrink: 0;">
              <img src="${upiQrUrl}" alt="UPI QR" style="width: 72px; height: 72px; border: 1px solid #cbd5e1; border-radius: 4px;" />
              <div style="font-size: 6.5px; font-weight: 700; color: #0284c7; margin-top: 2px;">SCAN TO PAY VIA UPI</div>
            </div>
          `
              : ""
          }

          <div style="flex-grow: 1;">
            <table style="width: 100%; font-size: 8.5px; border-collapse: collapse;">
              <tr><td>Gross Incurred:</td><td class="amt-col">₹ ${subtotal.toFixed(2)}</td></tr>
              ${discount > 0 ? `<tr style="color: #15803d;"><td>Privilege Discount:</td><td class="amt-col">- ₹ ${discount.toFixed(2)}</td></tr>` : ""}
              ${gstMode !== "exempt" ? `<tr><td>GST (${taxRate}% ${gstMode}):</td><td class="amt-col">₹ ${taxAmount.toFixed(2)}</td></tr>` : ""}
              <tr style="font-weight: 700; border-top: 1px solid #cbd5e1;"><td>Net Billable:</td><td class="amt-col" style="font-family: monospace;">₹ ${finalNetBillable.toFixed(2)}</td></tr>
              <tr style="font-weight: 800; font-size: 9.5px; color: ${balanceDue > 0 ? "#dc2626" : "#059669"};">
                <td>${balanceDue > 0 ? "Net Due:" : "Credit Balance:"}</td>
                <td class="amt-col" style="font-family: monospace;">₹ ${Math.abs(balanceDue).toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default renderBillingBody;

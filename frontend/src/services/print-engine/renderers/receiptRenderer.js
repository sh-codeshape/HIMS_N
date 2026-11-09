/**
 * receiptRenderer.js — A5 Half-Page Official Payment Receipt & Cash Voucher Renderer.
 */

import { getElementComputedStyle, getClickableAttr } from "../../../pages/settings/sharedPrintConfig.js";
import { esc, numberToWords } from "../config/defaults.js";

export function renderReceiptBody(data, cfg, options = {}) {
  const fs = cfg.fieldStyles || {};
  const cardStyle = getElementComputedStyle("body.card", fs);
  const clickAttr = getClickableAttr("body.card", options.isPreview);

  const amountVal = Number(data.amount || 0);
  const audit = data.audit || {};
  const totalCharges = Number(audit.totalCharges || 0);
  const totalPaid = Number(audit.totalPaid || amountVal);
  const excessCredit = Number(audit.excessCredit || 0);
  const pendingBalance = Number(audit.pendingBalance || (totalCharges > totalPaid ? totalCharges - totalPaid : 0));

  return `
    <div class="slip-body-card" style="border: 1.5px solid #0284c7; ${cardStyle}" ${clickAttr}>
      <!-- Top Receipt Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f0f9ff; padding: 5px 8px; border-radius: 6px; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 9.5px; color: #0369a1; text-transform: uppercase;">💳 Official Cash &amp; Digital Payment Voucher</span>
        <span style="font-size: 8px; font-weight: 800; background: #0284c7; color: #ffffff; padding: 1px 6px; border-radius: 3px; font-family: monospace;">
          ${esc(data.receiptNo || "—")}
        </span>
      </div>

      <!-- Amount Received Block -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
        <div style="background: #f8fafc; border: 1.5px dashed #0284c7; border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; justify-content: center;">
          <span style="font-size: 7.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount Received</span>
          <div style="font-size: 19px; font-weight: 900; color: #059669; font-family: monospace; line-height: 1.2; margin: 2px 0;">
            ₹ ${amountVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div style="font-size: 7.5px; color: #334155; font-style: italic;">
            In Words: <strong>${esc(numberToWords(amountVal))}</strong>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; font-size: 8.5px;">
          <div style="display: flex; justify-content: space-between;"><span>Category:</span> <strong>${esc(data.type || data.category || "Running Interim Deposit")}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Payment Mode:</span> <strong style="color: #0284c7;">${esc(data.mode || "Cash Counter")}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Date &amp; Time:</span> <span>${esc(data.date || "")} ${esc(data.time || "")}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Notes:</span> <span style="font-style: italic; color: #475569; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(data.remarks || "Counter Receipt")}</span></div>
        </div>
      </div>

      ${
        totalCharges > 0 || totalPaid > 0
          ? `
        <!-- Ledger Snapshot Bar with Light English Labels -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #f1f5f9; border-radius: 6px; padding: 5px 8px; font-size: 8px; text-align: center;">
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">Total Charges</span> <strong>₹ ${totalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">Amount Paid</span> <strong style="color: #059669;">₹ ${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">${excessCredit > 0 ? "Excess Credit" : "Balance Due"}</span> <strong style="color: #0284c7;">₹ ${(excessCredit > 0 ? excessCredit : pendingBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

export default renderReceiptBody;

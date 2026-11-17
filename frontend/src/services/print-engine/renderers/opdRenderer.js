/**
 * opdRenderer.js — OPD Consultation Slip Body Renderer.
 * 
 * Supports:
 * - Particulars fee table (connected to cfg.opd.showParticulars, consultationFee, registrationFee, discount)
 * - Clinical Rx and doctor prescription lines
 */

import { getElementComputedStyle, getClickableAttr } from "../../../pages/settings/sharedPrintConfig.js";
import { esc } from "../config/defaults.js";

export function renderOpdBody(data, cfg, options = {}) {
  const fs = cfg.fieldStyles || {};
  const cardStyle = getElementComputedStyle("body.card", fs);
  const clickAttr = getClickableAttr("body.card", options.isPreview);

  const opdCfg = cfg.opd || {};
  const showParticulars = opdCfg.showParticulars !== false;

  const consultationFee = Number(data.consultationFee ?? opdCfg.consultationFee ?? 500);
  const registrationFee = Number(data.registrationFee ?? opdCfg.registrationFee ?? 100);
  const serviceFee = Number(data.serviceFee ?? opdCfg.serviceFee ?? 0);
  const discount = Number(data.discount ?? opdCfg.discount ?? 0);
  const totalAmount = Math.max(0, consultationFee + registrationFee + serviceFee - discount);

  return `
    <div class="slip-body-card" style="${cardStyle}" ${clickAttr}>
      <!-- Encounter Header Ribbon with Bold Token Number -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #0284c7; padding-bottom: 4px; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 10px; color: #0b3b60; text-transform: uppercase;">Outpatient Clinical Encounter</span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">Queue Token:</span>
          <span style="font-size: 11px; font-weight: 900; color: #0284c7; background: #e0f2fe; border: 1.5px solid #0284c7; padding: 2px 8px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px;">
            ${esc(data.tokenNo || "—")}
          </span>
        </div>
      </div>

      <!-- Quick Consultation Info -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; font-size: 8.5px;">
        <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Attending Consultant</span><strong style="color: #0b3b60;">${esc(data.doctor || "—")}</strong></div>
        <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Speciality / Department</span><strong>${esc(data.department || "General Medicine")}</strong></div>
        <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Consultation Date</span><strong>${esc(data.admissionDate || data.encounterDate || "—")}</strong></div>
      </div>

      ${
        showParticulars
          ? `
        <!-- Fee Particulars Table -->
        <table class="slip-table" style="margin-bottom: 8px;">
          <thead>
            <tr>
              <th class="num-col">#</th>
              <th>Service / Particulars</th>
              <th class="amt-col">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="num-col">1</td>
              <td>OPD Specialist Consultation Fee</td>
              <td class="amt-col">${consultationFee.toFixed(2)}</td>
            </tr>
            ${
              registrationFee > 0
                ? `
              <tr>
                <td class="num-col">2</td>
                <td>Patient Hospital Registration Fee</td>
                <td class="amt-col">${registrationFee.toFixed(2)}</td>
              </tr>
            `
                : ""
            }
            ${
              serviceFee > 0
                ? `
              <tr>
                <td class="num-col">3</td>
                <td>Clinical Care / Hospital Service Charges</td>
                <td class="amt-col">${serviceFee.toFixed(2)}</td>
              </tr>
            `
                : ""
            }
            ${
              discount > 0
                ? `
              <tr style="color: #15803d; font-style: italic;">
                <td class="num-col">-</td>
                <td>Privilege Discount / Concession</td>
                <td class="amt-col">- ${discount.toFixed(2)}</td>
              </tr>
            `
                : ""
            }
            <tr style="font-weight: 800; background: #f8fafc; border-top: 1.5px solid #cbd5e1;">
              <td colspan="2" style="text-align: right; padding-right: 10px;">Total Consultation Fee Paid:</td>
              <td class="amt-col" style="color: #0b3b60; font-family: monospace;">₹ ${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      `
          : ""
      }

      <!-- Doctor Clinical Examination & Prescription Lines -->
      ${
        cfg.opd?.showRxNotes !== false && !cfg.slipConfigs?.opd?.inactiveElements?.includes("opd.rxNotes")
          ? `
      <div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px; margin-top: 6px; min-height: 140px; background: #fafafa;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
          <strong style="font-size: 8.5px; color: #475569; text-transform: uppercase;">Rx / Doctor Clinical Notes, Vitals &amp; Advice:</strong>
          <span style="font-size: 7.5px; color: #94a3b8; font-style: italic;">Use this space for handwritten clinical diagnosis &amp; treatment</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 8px;">
          <div style="border-bottom: 1px dotted #e2e8f0; height: 1px;"></div>
          <div style="border-bottom: 1px dotted #e2e8f0; height: 1px;"></div>
          <div style="border-bottom: 1px dotted #e2e8f0; height: 1px;"></div>
          <div style="border-bottom: 1px dotted #e2e8f0; height: 1px;"></div>
        </div>
      </div>
      `
          : ""
      }
    </div>
  `;
}

export default renderOpdBody;

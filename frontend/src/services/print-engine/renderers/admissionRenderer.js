/**
 * admissionRenderer.js — IPD Admission Ticket Body Renderer.
 * 
 * Supports:
 * - Bed Allotment & Ward matrix (controlled by cfg.admission.showBedCard)
 * - Triage vitals (controlled by cfg.admission.showVitals)
 * - Advance Deposit calculation (controlled by cfg.admission.advanceDeposit)
 */

import { getElementComputedStyle, getClickableAttr } from "../../../pages/settings/sharedPrintConfig.js";
import { esc } from "../config/defaults.js";

export function renderAdmissionBody(data, cfg, options = {}) {
  const fs = cfg.fieldStyles || {};
  const cardStyle = getElementComputedStyle("body.card", fs);
  const clickAttr = getClickableAttr("body.card", options.isPreview);

  const admCfg = cfg.admission || {};
  const showBedCard = admCfg.showBedCard !== false;
  const showVitals = admCfg.showVitals !== false;

  const advanceAmt = Number(data.advanceAmount ?? data.advanceDeposit ?? admCfg.advanceDeposit ?? 5000);
  const vitals = data.vitals || {};

  return `
    <div class="slip-body-card" style="${cardStyle}" ${clickAttr}>
      <!-- Top Admission Meta Ribbon -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #0284c7; padding-bottom: 4px; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 10px; color: #0b3b60; text-transform: uppercase;">Inpatient Admission &amp; Bed Allotment</span>
        <span style="font-size: 8.5px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px;">
          Adm No: ${esc(data.ipdNo || data.admissionNo || "—")}
        </span>
      </div>

      ${
        showBedCard
          ? `
        <!-- Bed Allotment & Advance Snapshot -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px;">
          <div>
            <span style="font-size: 7.5px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Admission Category</span>
            <strong style="font-size: 9.5px; color: #0f172a;">${esc(data.category || data.admissionType || "Planned Medical Inpatient")}</strong>
          </div>
          <div>
            <span style="font-size: 7.5px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Allotted Bed / Ward</span>
            <strong style="font-size: 9.5px; color: #0369a1;">${esc(data.wardBed || "—")}</strong>
          </div>
          <div>
            <span style="font-size: 7.5px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Admission Advance Deposit</span>
            <strong style="font-size: 10.5px; color: #15803d; font-family: monospace;">₹ ${advanceAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      `
          : ""
      }

      ${
        showVitals
          ? `
        <!-- Admission Triage Vitals Bar -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; margin-bottom: 6px; font-size: 8px;">
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">Blood Pressure</span> <strong>${esc(vitals.bp || "—")}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">Pulse Rate</span> <strong>${esc(vitals.pulse || "—")}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">Temperature</span> <strong>${esc(vitals.temp || vitals.temperature || "—")}</strong></div>
          <div><span style="color: #64748b; display: block; font-size: 7px; text-transform: uppercase;">Oxygen (SpO2)</span> <strong>${esc(vitals.spo2 || "—")}</strong></div>
        </div>
      `
          : ""
      }

      <!-- Attending Medical Team & Ward Details -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 6px; font-size: 8.5px;">
        <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Treating Specialist</span><strong style="color: #0b3b60;">${esc(data.doctor || "—")}</strong></div>
        <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Admitting Department</span><strong>${esc(data.department || "General Medicine")}</strong></div>
        <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Admission Date &amp; Time</span><strong>${esc(data.admissionDate || "—")}</strong></div>
      </div>

      <!-- Consent & Admission Notes Area -->
      <div style="border: 1px dashed #cbd5e1; border-radius: 6px; padding: 6px 8px; background: #fafafa; font-size: 7.5px; color: #475569; line-height: 1.4;">
        <strong style="color: #0f172a; text-transform: uppercase;">Admission Undertaking &amp; Consent:</strong>
        <p style="margin: 2px 0 0 0;">
          I hereby consent to hospital admission, diagnostic workup, routine nursing care, and emergency stabilization under the supervision of the attending medical consultant. All personal valuables are under patient/attendant responsibility.
        </p>
      </div>
    </div>
  `;
}

export default renderAdmissionBody;

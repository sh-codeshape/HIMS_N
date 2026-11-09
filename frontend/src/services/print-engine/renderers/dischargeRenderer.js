/**
 * dischargeRenderer.js — Inpatient Clinical Discharge Summary Body Renderer.
 * 
 * Supports:
 * - Real prescribed discharge medications (connected to real patient medications)
 * - Toggles:
 *   - cfg.discharge.showTimeline (Admission & Discharge dates, length of stay, status)
 *   - cfg.discharge.showMedications (Prescription Rx Table)
 *   - cfg.discharge.showAdvice (Follow-up, Diet, Activity & Warning Signs)
 *   - cfg.discharge.showVitals (Discharge Vitals snapshot)
 *   - cfg.discharge.showInvestigations (Lab & diagnostic investigations)
 *   - cfg.discharge.showBillingClearance (Billing clearance certificate badge)
 */

import { getElementComputedStyle, getClickableAttr } from "../../../pages/settings/sharedPrintConfig.js";
import { esc } from "../config/defaults.js";

export function renderDischargeBody(data, cfg, options = {}) {
  const fs = cfg.fieldStyles || {};
  const cardStyle = getElementComputedStyle("body.card", fs);
  const clickAttr = getClickableAttr("body.card", options.isPreview);

  const disCfg = cfg.discharge || {};
  const showTimeline = disCfg.showTimeline !== false;
  const showMedications = disCfg.showMedications !== false;
  const showAdvice = disCfg.showAdvice !== false;
  const showVitals = disCfg.showVitals !== false;
  const showInvestigations = disCfg.showInvestigations !== false;
  const showBillingClearance = disCfg.showBillingClearance !== false;

  const meds = Array.isArray(data.medications) ? data.medications : [];
  const vitals = data.vitals || {};
  const advice = data.advice || {};
  const clearance = data.billingClearance || {};

  return `
    <div class="slip-body-card" style="${cardStyle}" ${clickAttr}>
      <!-- Top Clinical Ribbon -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #0284c7; padding-bottom: 4px; margin-bottom: 6px;">
        <span style="font-weight: 800; font-size: 10px; color: #0b3b60; text-transform: uppercase;">
          📋 Inpatient Clinical Discharge Summary &amp; Treatment Course
        </span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 8px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 1.5px 6px; border-radius: 4px;">
            Condition: ${esc(data.dischargeCondition || "Stable")}
          </span>
          ${
            showBillingClearance && clearance.isCleared !== false
              ? `<span style="font-size: 8px; font-weight: 700; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1.5px 6px; border-radius: 4px;">
                  ✓ BILLING CLEARED
                </span>`
              : ""
          }
        </div>
      </div>

      ${
        showTimeline
          ? `
        <!-- Admission, Discharge & Stay Timeline Bar -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px; margin-bottom: 6px; font-size: 8.5px;">
          <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Admission Date</span><strong>${esc(data.admissionDate || "—")}</strong></div>
          <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Discharge Date</span><strong style="color: #0284c7;">${esc(data.dischargeDate || "—")}</strong></div>
          <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Length of Stay</span><strong>${esc(data.stay || "—")}</strong></div>
          <div><span style="color: #64748b; font-size: 7.5px; display: block; text-transform: uppercase;">Discharge Type</span><strong style="color: #15803d;">${esc(data.dischargeType || "NORMAL")}</strong></div>
        </div>
      `
          : ""
      }

      ${
        showVitals && (vitals.bp || vitals.pulse || vitals.temperature || vitals.spo2)
          ? `
        <!-- Discharge Vitals Snapshot -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: #f1f5f9; border-radius: 6px; padding: 4px 8px; margin-bottom: 6px; font-size: 8px; text-align: center;">
          <div><span style="color: #64748b; font-size: 7px; display: block; text-transform: uppercase;">Discharge BP</span> <strong>${esc(vitals.bp || "—")}</strong></div>
          <div><span style="color: #64748b; font-size: 7px; display: block; text-transform: uppercase;">Pulse Rate</span> <strong>${esc(vitals.pulse || "—")}</strong></div>
          <div><span style="color: #64748b; font-size: 7px; display: block; text-transform: uppercase;">Temperature</span> <strong>${esc(vitals.temp || vitals.temperature || "—")}</strong></div>
          <div><span style="color: #64748b; font-size: 7px; display: block; text-transform: uppercase;">Oxygen (SpO2)</span> <strong>${esc(vitals.spo2 || "—")}</strong></div>
        </div>
      `
          : ""
      }

      <!-- Diagnoses & Hospital Course Block -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; font-size: 8.5px;">
        <div style="margin-bottom: 4px;">
          <span style="color: #64748b; font-size: 7.5px; text-transform: uppercase; display: block; font-weight: 700;">Final Clinical Diagnosis / Reason for Admission</span>
          <strong style="color: #0b3b60; font-size: 9.5px;">${esc(data.primaryDiagnosis || "—")}</strong>
          ${data.secondaryDiagnosis ? `<span style="color: #64748b; font-size: 8px; margin-left: 6px;">(${esc(data.secondaryDiagnosis)})</span>` : ""}
        </div>

        <div style="font-size: 8px; color: #334155; line-height: 1.4; border-top: 1px dotted #e2e8f0; padding-top: 4px;">
          <strong>Clinical Summary &amp; Inpatient Course:</strong> ${esc(data.hospitalCourse || "—")}
        </div>

        ${
          showInvestigations && (data.investigations || data.procedures)
            ? `
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dotted #e2e8f0; font-size: 8px; color: #475569;">
            ${data.investigations ? `<div><strong>Investigations:</strong> ${esc(data.investigations)}</div>` : ""}
            ${data.procedures ? `<div><strong>Procedures Performed:</strong> ${esc(data.procedures)}</div>` : ""}
          </div>
        `
            : ""
        }
      </div>

      ${
        showMedications
          ? `
        <!-- Prescribed Discharge Medications (Rx) Table -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 8.5px; font-weight: 800; color: #0284c7; margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between;">
            <span>💊 Discharge Medication Regimen (℞ डिस्चार्ज पर दवाइयाँ):</span>
            <span style="font-size: 7.5px; color: #64748b; font-weight: 600;">${meds.length} ${meds.length === 1 ? "Medicine" : "Medicines"} Prescribed</span>
          </div>
          <table class="slip-table">
            <thead>
              <tr>
                <th class="num-col">#</th>
                <th style="width: 36%;">Medicine Name &amp; Formulation</th>
                <th style="width: 14%;">Dosage</th>
                <th style="width: 22%;">Frequency / Timing</th>
                <th style="width: 12%;">Duration</th>
                <th style="width: 14%;">Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${
                meds.length === 0
                  ? `
                <tr>
                  <td colspan="6" style="text-align: center; color: #94a3b8; padding: 8px; font-size: 8px; font-style: italic;">
                    No post-discharge oral medications prescribed. Follow general clinical advice.
                  </td>
                </tr>
              `
                  : meds
                      .map(
                        (m, idx) => `
                <tr>
                  <td class="num-col">${idx + 1}</td>
                  <td><strong>${esc(m.name || "Medicine")}</strong></td>
                  <td>${esc(m.dosage || "1 Tab")}</td>
                  <td>${esc(m.frequency || "BD")}</td>
                  <td>${esc(m.duration || "5 Days")}</td>
                  <td style="font-size: 8px; color: #475569;">${esc(m.instructions || "As directed")}</td>
                </tr>
              `
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      `
          : ""
      }

      ${
        showAdvice
          ? `
        <!-- Discharge Advice, Diet & Follow-Up Card -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 8px; line-height: 1.35;">
          <div>
            <div style="color: #0b3b60; font-weight: 800; margin-bottom: 2px; text-transform: uppercase;">Follow-Up &amp; Diet Advice:</div>
            <div><strong>Review in OPD:</strong> ${esc(advice.followUpDate || "After 5 days in OPD")}</div>
            ${advice.diet ? `<div><strong>Dietary Advice:</strong> ${esc(advice.diet)}</div>` : ""}
            ${advice.activity ? `<div><strong>Physical Activity:</strong> ${esc(advice.activity)}</div>` : ""}
          </div>
          <div>
            <div style="color: #dc2626; font-weight: 800; margin-bottom: 2px; text-transform: uppercase;">Warning Signs &amp; Emergency:</div>
            <p style="margin: 0; color: #7f1d1d; font-size: 7.5px;">
              ${esc(advice.warningSigns || "Report immediately in case of high fever, persistent vomiting, severe pain, breathing difficulty or bleeding.")}
            </p>
            <div style="margin-top: 3px; font-size: 7.5px; color: #0369a1; font-weight: 700;">
              24x7 Emergency Contact: ${esc(advice.emergencyContact || cfg.hospital?.emergencyPhone || cfg.hospital?.phone || "+91 7388660408")}
            </div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

export default renderDischargeBody;

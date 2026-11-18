/**
 * configResolver.js — Pure configuration resolver for the medical print system.
 * 
 * Computes EffectiveConfig = resolve(MasterSettings, SlipOverrides).
 * - Master owns: Hospital identity, letterhead, demographics, footer policies & base fieldStyles.
 * - Slip overrides own: Document title/badge, section toggles (vitals, medications, ledger),
 *   page orientation/margins, and slip-specific fieldStyles overrides.
 * - Eliminates dual storage: saving a slip never mutates Master; saving Master never erases slip toggles.
 */

import { DEFAULT_SHARED_CONFIG, mergeSharedSettings } from "../../../pages/settings/sharedPrintConfig.js";
import { DEFAULT_SLIP_CONFIGS, normalizeSlipType } from "./defaults.js";

export function resolveEffectiveConfig(slipType = "opd", masterConfig = null, slipOverrides = null) {
  const normType = normalizeSlipType(slipType);
  const baseMaster = masterConfig || DEFAULT_SHARED_CONFIG;
  const specific = slipOverrides || {};

  const defaultSlipCfg = DEFAULT_SLIP_CONFIGS[normType] || {};

  // 1. Resolve Slip Title & Copy Badge
  // Precedence: specific.slipConfigs[type] > specific.title/copyBadge > baseMaster.slipConfigs[type] > defaults
  const specificSlipSubCfg = specific.slipConfigs?.[normType] || {};
  const masterSlipSubCfg = baseMaster.slipConfigs?.[normType] || {};

  const resolvedSlipTitle =
    specificSlipSubCfg.title ||
    specific.title ||
    masterSlipSubCfg.title ||
    defaultSlipCfg.title;

  const resolvedCopyBadge =
    specificSlipSubCfg.copyBadge ||
    specific.copyBadge ||
    masterSlipSubCfg.copyBadge ||
    defaultSlipCfg.copyBadge;

  // 2. Resolve Page Settings
  const resolvedPage = {
    size: (normType === "ipd_receipt" ? "A5" : (specific.page?.size || baseMaster.page?.size || "A4")),
    orientation: specific.page?.orientation || baseMaster.page?.orientation || "portrait",
    margin: specific.page?.margin ?? baseMaster.page?.margin ?? 6,
  };

  // 3. Resolve Inactive Elements (Master Designer authority + Per-slip toggles)
  const masterInactives = new Set([
    ...(masterSlipSubCfg.inactiveElements || []),
    ...(baseMaster.slipConfigs?.all?.inactiveElements || []),
    ...(baseMaster.inactiveElements || []),
  ]);

  // Any element explicitly marked show: false in Master fieldStyles is inactive across all slips
  for (const [k, v] of Object.entries(baseMaster.fieldStyles || {})) {
    if (v && v.show === false) {
      masterInactives.add(k);
    }
  }

  const specificInactives = specificSlipSubCfg.inactiveElements || specific.inactiveElements || [];
  const combinedInactives = new Set([
    ...masterInactives,
    ...specificInactives,
  ]);

  // 4. Resolve FieldStyles (Per-element offsets, colors, typography)
  // Master letterhead & identity owns header.* and base styling.
  const resolvedFieldStyles = {
    ...(baseMaster.fieldStyles || {}),
  };

  // Merge slip-specific fieldStyles:
  for (const [k, v] of Object.entries(specific.fieldStyles || {})) {
    if (k.startsWith("header.")) {
      // Header styles are Master-governed.
      // If Master has marked this header element inactive or hidden, Master ALWAYS wins!
      if (masterInactives.has(k) || baseMaster.fieldStyles?.[k]?.show === false) {
        resolvedFieldStyles[k] = {
          ...(resolvedFieldStyles[k] || {}),
          ...(v || {}),
          show: false,
        };
        combinedInactives.add(k);
      } else if (combinedInactives.has(k)) {
        resolvedFieldStyles[k] = {
          ...(resolvedFieldStyles[k] || {}),
          ...(v || {}),
          show: false,
        };
      } else {
        // Active in Master: inherit Master's base layout, allowing safe per-slip font size tweaks
        resolvedFieldStyles[k] = {
          ...(baseMaster.fieldStyles?.[k] || {}),
          ...(v || {}),
          show: true,
        };
      }
    } else {
      // Non-header styles (slip body, ledger, clinical details)
      resolvedFieldStyles[k] = {
        ...(resolvedFieldStyles[k] || {}),
        ...(v || {}),
      };
    }
  }

  // Ensure all inactive elements have show: false in resolvedFieldStyles
  for (const inactKey of combinedInactives) {
    if (!resolvedFieldStyles[inactKey]) resolvedFieldStyles[inactKey] = {};
    resolvedFieldStyles[inactKey].show = false;
  }

  // 3b. Sanitize Patient Demographics Field Styles:
  // Patient demographics is a structured 3-column CSS grid table.
  // Individual fields inside the grid must NEVER carry relative coordinate offsets (offsetX, offsetY)
  // which causes fields to overlap, collide or break out of grid columns.
  const demographicsKeys = [
    "patient.name", "patient.uhid", "patient.ageGender", "patient.mobile",
    "patient.bloodGroup", "patient.guardian", "patient.address", "patient.payer",
    "patient.doctor", "patient.department", "name", "uhid", "ageGender",
    "mobile", "bloodGroup", "guardian", "address", "payer", "doctor", "department"
  ];

  for (const dk of demographicsKeys) {
    if (resolvedFieldStyles[dk]) {
      delete resolvedFieldStyles[dk].offsetX;
      delete resolvedFieldStyles[dk].offsetY;
      delete resolvedFieldStyles[dk].display;
    }
  }

  // 4. Resolve Domain-Specific Section Configurations (toggles & features)
  const opdSection = {
    ...DEFAULT_SLIP_CONFIGS.opd,
    ...(baseMaster.opd || {}),
    ...(specific.opd || {}),
    showRxNotes: specific.opd?.showRxNotes !== undefined ? specific.opd.showRxNotes : (baseMaster.opd?.showRxNotes !== false),
    showSignatures: specific.opd?.showSignatures !== undefined ? specific.opd.showSignatures : (baseMaster.opd?.showSignatures !== false),
    showTerms: specific.opd?.showTerms !== undefined ? specific.opd.showTerms : (baseMaster.opd?.showTerms !== false),
    ...(specific.particulars
      ? {
          showParticulars: specific.particulars.showTable !== false,
          consultationFee: specific.particulars.consultFee ?? specific.particulars.consultationFee ?? DEFAULT_SLIP_CONFIGS.opd.consultationFee,
          registrationFee: specific.particulars.regFee ?? specific.particulars.registrationFee ?? DEFAULT_SLIP_CONFIGS.opd.registrationFee,
        }
      : {}),
  };

  const admissionSection = {
    ...DEFAULT_SLIP_CONFIGS.ipd_admission,
    ...(baseMaster.admission || {}),
    ...(specific.admission || {}),
  };

  const billingSection = {
    ...DEFAULT_SLIP_CONFIGS.ipd_billing,
    ...(baseMaster.billing || {}),
    ...(specific.billing || {}),
    ...(specific.gst?.mode ? { gstMode: specific.gst.mode } : {}),
    ...(specific.gst?.showTax !== undefined ? { showTax: Boolean(specific.gst.showTax) } : {}),
    ...(specific.billing?.showTax !== undefined ? { showTax: Boolean(specific.billing.showTax) } : {}),
    ...(specific.bankDetails?.upiId !== undefined ? { upiId: specific.bankDetails.upiId } : {}),
    ...(specific.bankDetails?.showUpiQr !== undefined ? { showUpiQr: Boolean(specific.bankDetails.showUpiQr) } : {}),
    ...(specific.billing?.showUpiQr !== undefined ? { showUpiQr: Boolean(specific.billing.showUpiQr) } : {}),
    ...(specific.charges?.groupByDepartment !== undefined ? { groupCharges: specific.charges.groupByDepartment } : {}),
    ...(specific.settlement?.showPaymentBreakdown !== undefined ? { paymentBreakdown: specific.settlement.showPaymentBreakdown } : {}),
    ...(specific.billing?.totalLabel ? { totalLabel: specific.billing.totalLabel } : {}),
    ...(specific.billing?.payableLabel ? { payableLabel: specific.billing.payableLabel } : {}),
    ...(specific.billing?.dueLabel ? { dueLabel: specific.billing.dueLabel } : {}),
    ...(specific.billing?.paidLabel ? { paidLabel: specific.billing.paidLabel } : {}),
    ...(specific.billing?.paymentsTitle ? { paymentsTitle: specific.billing.paymentsTitle } : {}),
  };

  const dischargeSection = {
    ...DEFAULT_SLIP_CONFIGS.ipd_discharge,
    ...(baseMaster.discharge || {}),
    ...(specific.discharge || {}),
  };

  const receiptSection = {
    ...DEFAULT_SLIP_CONFIGS.ipd_receipt,
    ...(baseMaster.receipt || {}),
    ...(specific.receipt || {}),
  };

  // Check if terms / hospital instructions are disabled on this slip or globally
  const isTermsDisabled =
    specific[normType]?.showTerms === false ||
    specific.opd?.showTerms === false ||
    specific.receipt?.showTerms === false ||
    specific.billing?.showTerms === false ||
    specific.admission?.showTerms === false ||
    specific.discharge?.showTerms === false ||
    specific.showTerms === false ||
    specific.particulars?.showTerms === false ||
    specific.footer?.showTerms === false ||
    baseMaster.footer?.showTerms === false ||
    masterInactives.has("terms.card") ||
    specificInactives.includes("terms.card") ||
    resolvedFieldStyles["terms.card"]?.show === false;

  if (isTermsDisabled) {
    combinedInactives.add("terms.card");
    combinedInactives.add("terms.title");
    combinedInactives.add("terms.list");
    combinedInactives.add("terms.helpline");
    combinedInactives.add("terms.address");
    combinedInactives.add("terms.footerTagline");
    combinedInactives.add("terms.disclaimer");
    if (!resolvedFieldStyles["terms.card"]) resolvedFieldStyles["terms.card"] = {};
    resolvedFieldStyles["terms.card"].show = false;
  }

  // Check if signatures are disabled on this slip or globally
  const isSignaturesDisabled =
    specific[normType]?.showSignatures === false ||
    specific.opd?.showSignatures === false ||
    specific.receipt?.showSignatures === false ||
    specific.billing?.showSignatures === false ||
    specific.admission?.showSignatures === false ||
    specific.discharge?.showSignatures === false ||
    specific.showSignatures === false ||
    specific.footer?.showSignatures === false ||
    baseMaster.footer?.showSignatures === false ||
    masterInactives.has("signatures.card") ||
    specificInactives.includes("signatures.card") ||
    resolvedFieldStyles["signatures.card"]?.show === false;

  if (isSignaturesDisabled) {
    combinedInactives.add("signatures.card");
    combinedInactives.add("signatures.doctor");
    combinedInactives.add("signatures.nurse");
    combinedInactives.add("signatures.attendant");
    combinedInactives.add("signatures.cashier");
    combinedInactives.add("signatures.stamp");
    if (!resolvedFieldStyles["signatures.card"]) resolvedFieldStyles["signatures.card"] = {};
    resolvedFieldStyles["signatures.card"].show = false;
  }

  const resolvedInactiveElements = Array.from(combinedInactives);

  // 5. Build Resolved Effective Configuration
  const effective = {
    ...mergeSharedSettings(baseMaster, {}),
    slipType: normType,
    useSharedHeaderFooter: true,
    page: resolvedPage,
    fieldStyles: resolvedFieldStyles,
    slipConfigs: {
      ...(baseMaster.slipConfigs || {}),
      ...(specific.slipConfigs || {}),
      [normType]: {
        ...defaultSlipCfg,
        ...masterSlipSubCfg,
        ...specificSlipSubCfg,
        title: resolvedSlipTitle,
        copyBadge: resolvedCopyBadge,
        inactiveElements: resolvedInactiveElements,
      },
    },
    // Document sections with concrete toggle support
    opd: opdSection,
    admission: admissionSection,
    billing: billingSection,
    discharge: dischargeSection,
    receipt: receiptSection,
  };

  return effective;
}

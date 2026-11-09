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

  // 3. Resolve FieldStyles (Per-element offsets, colors, typography)
  // Master fieldStyles apply to all slips; specific fieldStyles can override for that slip
  const resolvedFieldStyles = {
    ...(baseMaster.fieldStyles || {}),
    ...(specific.fieldStyles || {}),
  };

  // 4. Resolve Domain-Specific Section Configurations (toggles & features)
  const opdSection = {
    ...DEFAULT_SLIP_CONFIGS.opd,
    ...(baseMaster.opd || {}),
    ...(specific.opd || {}),
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
    ...(specific.bankDetails?.upiId ? { upiId: specific.bankDetails.upiId } : {}),
    ...(specific.charges?.groupByDepartment !== undefined ? { groupCharges: specific.charges.groupByDepartment } : {}),
    ...(specific.settlement?.showPaymentBreakdown !== undefined ? { paymentBreakdown: specific.settlement.showPaymentBreakdown } : {}),
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

  // 4b. Resolve Inactive Elements (Per-slip element removal from Master Designer or Slip tab)
  const masterInactives = masterSlipSubCfg.inactiveElements || [];
  const specificInactives = specificSlipSubCfg.inactiveElements || specific.inactiveElements || [];
  const combinedInactives = new Set([
    ...masterInactives,
    ...specificInactives,
  ]);

  // Check if terms / hospital instructions are disabled on this slip or globally
  const isTermsDisabled =
    specific.opd?.showTerms === false ||
    specific.showTerms === false ||
    specific.particulars?.showTerms === false ||
    specific.footer?.showTerms === false ||
    baseMaster.footer?.showTerms === false ||
    masterInactives.includes("terms.card") ||
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

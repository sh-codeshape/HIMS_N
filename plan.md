# HIMS — Billing Phase Implementation Plan

## Context

IPD discharge screen computes pending dues per department via:

- Backend: `backend/src/modules/ipd/ipd.repository.ts → getPendingDues()`
- API: `GET /ipd/admissions/:id/pending-dues` (`backend/src/modules/ipd/ipd.controller.ts`, `ipd.service.ts`, `ipd.routes.ts`)
- Frontend: `frontend/src/pages/ipd/IPDDischarge.jsx` + `frontend/src/api/services/ipdService.js`

## Research findings — DB schema completeness

The schema is substantially more complete than a typical HMS build. Verdict: **billing core ~9/10, pricing ~8/10, insurance ~8/10, clinical-billing wiring ~6/10, pending-dues computation ~5/10**.

| Area | Status |
|---|---|
| `charges` table (source_type enum, status lifecycle, responsibility, tax/discount, package-inclusion) | ✅ Complete |
| `invoices` (ipd_interim/ipd_final/pharmacy/diagnostics/package types, bill_to, write_off, credit notes, auto-recalc triggers) | ✅ Complete |
| `payments` + `payment_allocations` (direction, types, refund chain, allocation triggers) | ✅ Complete |
| Pricing engine (services, tariff_plans w/ inheritance, tariff_rates w/ effective dating, `get_service_rate()`) | ✅ Complete |
| Packages (surgery/insurance bundles, inclusions/exclusions) | ✅ Complete |
| Insurance/claims (`patient_coverages`, `encounter_coverages`, `insurance_claims`, `claim_invoices`) | ✅ Complete |
| Credit notes / write-offs | ✅ Complete |
| Clinical-billing integration points (orders→order_items, dispensations, surgeries, blood, ambulance charge links) | ⚠️ Schema-ready, **code unwired** (only manual + advance-deposit charge writes exist today) |
| Pending-dues computation (netting + allocation semantics) | ⚠️ Needed bill-phase implementation |

## Bill phase design decisions

1. **Bill phase scope**: pending dues = unbilled (`status = 'billable'`) charges for the encounter, netted against completed payments.
2. **Netting**: encounter-level totals (`totalCharges − totalPayments`, floored at 0).
3. **Allocation**: deterministic — highest outstanding balance first, tie-break by department/source type.
4. **Cleared semantics**: a group is cleared only when its charges are fully covered; overall cleared = `pendingAmount === 0`.
5. **Response contract**: `{ encounterId, totalCharges, totalPayments, pendingAmount, cleared, breakdown[], sourceBreakdown[] }` where:
   - `breakdown[]` = department-level rollup (clearance gating/summary).
   - `sourceBreakdown[]` = full granular rows (department × source_type).

## Phases — FINAL STATE

- [x] Phase 1 — Bill phase implementation (backend `getPendingDues`): **upgraded to FULL breakdown** (dept × source_type), deterministic allocation, rollup, returns `sourceBreakdown`.
- [x] Phase 2 — UI update based on bill phase:
  - Department breakdown rows: cleared amount / pending-of-charges.
  - New **Fee-wise pending dues (all charge sources)** section rendering `sourceBreakdown`.
  - Summary label fixed to "IPD Billing Charges".
- [x] Phase 3 — UI navigation (dedicated discharge page):
  - Created `frontend/src/pages/ipd/components/IPDDischargeWorkflow.jsx` (full workflow: clearance + disposition + clinical summary + meds + follow-up + print + submit).
  - Created `frontend/src/pages/ipd/IPDDischargeDetail.jsx` (page wrapper w/ back navigation).
  - Added route `/ipd/discharge/:id` in `frontend/src/routes/modules/ipdRoutes.jsx`.
  - List page discharge button now navigates to `/ipd/discharge/:id` (with admission state) instead of opening the modal.
- [x] Phase 4 — Verification: backend `tsc --noEmit` clean; frontend `vite build` success.

## Implementation log

- **Backend** (`backend/src/modules/ipd/ipd.repository.ts → getPendingDues`):
  - Groups billable charges by department × source_type.
  - Nets vs completed payments.
  - Deterministic allocation (balance desc, tie-break dept+source).
  - Rolls up to department-level `breakdown`.
  - Returns `sourceBreakdown` (full) + `breakdown` (rollup).
- **Frontend**:
  - `IPDDischarge.jsx`: summary label fixed; dept rows show cleared/pending amounts; discharge button navigates.
  - `IPDDischarge.css`: added `.ipd-dues-sources`, `.ipd-dues-sources-title`, `.ipd-dues-source-row`, `.ipd-dues-source-head`, `.ipd-dues-source-dept`, `.ipd-dues-source-type`.
  - `IPDDischargeWorkflow.jsx` (new): full workflow component.
  - `IPDDischargeDetail.jsx` (new): detail page wrapper with back.
  - `ipdRoutes.jsx`: added `/ipd/discharge/:id`.

## Open questions / decisions log

1. Running bill vs final bill vs unbilled-only for discharge clearance — **decided**: unbilled (`billable`) charges drive clearance.
2. Breakdown dimension: **NOW FULL** — department rollup + source-level fee-wise breakdown.
3. Payment netting: encounter-sum for now; charge-level allocation via invoice chain deferred.

## Verdict

The DB schema fully supports the billing domain (charges → invoices → payments → allocations → pricing → packages → insurance → credits). The pending-dues feature now implements the **full** breakdown across departments and fee sources. Discharge is gated on cleared dues; UI moved to a dedicated page with proper routing/back.

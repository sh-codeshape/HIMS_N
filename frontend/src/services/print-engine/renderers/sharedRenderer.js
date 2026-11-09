/**
 * sharedRenderer.js — Letterhead, Header, Demographics, and Footer renderer.
 * 
 * Generates the standardized brand shell adhering 100% to Master Shared Settings.
 */

import {
  buildSharedHeaderHTML,
  buildSharedDemographicsHTML,
  buildSharedFooterHTML,
  getElementComputedStyle,
  getClickableAttr,
  generateBarcodeSvg,
} from "../../../pages/settings/sharedPrintConfig.js";
import { esc } from "../config/defaults.js";

export class SharedRenderer {
  buildHeader(cfg, data, options = {}) {
    const combinedOptions = {
      ...(typeof options === "object" ? options : {}),
      slipType: options?.slipType || cfg.slipType || "all",
      encounterData: data,
    };
    return buildSharedHeaderHTML(cfg, combinedOptions);
  }

  buildDemographics(cfg, data, options = {}) {
    const combinedOptions = {
      ...(typeof options === "object" ? options : {}),
      slipType: options?.slipType || cfg.slipType || "all",
    };
    return buildSharedDemographicsHTML(cfg, data, null, combinedOptions);
  }

  buildFooter(cfg, data, options = {}) {
    const combinedOptions = {
      ...(typeof options === "object" ? options : {}),
      slipType: options?.slipType || cfg.slipType || "all",
      encounterData: data,
    };
    return buildSharedFooterHTML(cfg, combinedOptions);
  }

  buildDocumentTitleBanner(slipType, cfg, data = {}, options = {}) {
    const fs = cfg.fieldStyles || {};
    const slipConfig = cfg.slipConfigs?.[slipType] || {};
    const titleText = slipConfig.title || options.titleOverride || "MEDICAL ENCOUNTER SLIP";
    const copyText = slipConfig.copyBadge || options.copyBadgeOverride || "ORIGINAL RECORD";

    const titleStyle = getElementComputedStyle("ticket.title", fs);
    const copyStyle = getElementComputedStyle("ticket.copyType", fs);
    const titleClick = getClickableAttr("ticket.title", options.isPreview);
    const copyClick = getClickableAttr("ticket.copyType", options.isPreview);

    const showBarcode = cfg.header?.showBarcode !== false;
    const barcodeSvg = showBarcode && (data.encounterNo || data.tokenNo)
      ? generateBarcodeSvg(data.encounterNo || data.tokenNo, 26)
      : "";

    const tokenNumber = data.tokenNo || data.token_number || data.token;

    return `
      <div class="slip-doc-banner" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-bottom: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h2 style="margin: 0; font-size: 11.5px; font-weight: 800; color: #0b3b60; letter-spacing: 0.5px; text-transform: uppercase; ${titleStyle}" ${titleClick}>
            ${esc(titleText)}
          </h2>
          <span style="font-size: 8px; font-weight: 700; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 1.5px 6px; border-radius: 4px; text-transform: uppercase; ${copyStyle}" ${copyClick}>
            ${esc(copyText)}
          </span>
          ${
            tokenNumber
              ? `<span style="font-size: 8.5px; font-weight: 800; background: #e0f2fe; color: #0369a1; border: 1.5px solid #0284c7; padding: 1.5px 7px; border-radius: 4px; font-family: monospace; letter-spacing: 0.5px;">
                  TOKEN #${esc(tokenNumber)}
                </span>`
              : ""
          }
        </div>
        ${barcodeSvg ? `<div>${barcodeSvg}</div>` : ""}
      </div>
    `;
  }
}

export const sharedRenderer = new SharedRenderer();
export default sharedRenderer;

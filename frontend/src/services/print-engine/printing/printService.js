/**
 * printService.js — Physical print execution manager.
 * 
 * Strategy:
 * 1. Invisible sandbox iframe with onload trigger.
 * 2. Fallback to pop-up window if browser blocks hidden iframe printing.
 */

export class PrintService {
  /**
   * Main entry point to print raw HTML.
   */
  async printHtml(html) {
    if (typeof window === "undefined" || !document) return false;

    const iframeSuccess = await this.printViaIframe(html);
    if (!iframeSuccess) {
      return this.printViaWindow(html);
    }
    return true;
  }

  printViaIframe(html) {
    return new Promise((resolve) => {
      try {
        const frameId = "hims-unified-silent-print-frame";
        let frame = document.getElementById(frameId);
        if (frame) {
          try {
            frame.remove();
          } catch (_) {}
        }

        frame = document.createElement("iframe");
        frame.id = frameId;
        frame.style.position = "fixed";
        frame.style.top = "-9999px";
        frame.style.left = "-9999px";
        frame.style.width = "1px";
        frame.style.height = "1px";
        frame.style.border = "none";
        frame.style.opacity = "0.01";
        frame.style.pointerEvents = "none";
        frame.setAttribute("aria-hidden", "true");
        document.body.appendChild(frame);

        const win = frame.contentWindow;
        if (!win) {
          resolve(false);
          return;
        }

        const doc = win.document;
        doc.open();
        doc.write(html);
        doc.close();

        let printed = false;
        const trigger = () => {
          if (printed) return;
          printed = true;
          try {
            win.focus();
            win.print();
            resolve(true);
          } catch (e) {
            console.warn("PrintService: Silent iframe printing failed, falling back to window:", e);
            resolve(false);
          }
        };

        if (doc.readyState === "complete") {
          setTimeout(trigger, 250);
        } else {
          win.onload = () => setTimeout(trigger, 200);
          setTimeout(trigger, 700);
        }
      } catch (err) {
        console.warn("PrintService: Iframe creation error:", err);
        resolve(false);
      }
    });
  }

  printViaWindow(html) {
    const printWin = window.open("", "_blank", "width=920,height=800,scrollbars=yes,menubar=yes,status=yes");
    if (!printWin) {
      if (typeof window !== "undefined" && window.alert) {
        window.alert("Please allow pop-ups for this site to print patient slips.");
      }
      return false;
    }
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => {
      try {
        printWin.focus();
        printWin.print();
      } catch (_) {}
    }, 400);
    return true;
  }
}

export const printService = new PrintService();
export default printService;

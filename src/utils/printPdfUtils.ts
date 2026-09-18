import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { cleanWhatsAppPhone } from './formatters';

export interface PrintOptions {
  title?: string;
  landscape?: boolean;
}

export interface PDFOptions {
  filename: string;
  margin?: [number, number, number, number];
  orientation?: 'portrait' | 'landscape';
  scale?: number;
}

export interface PDFBlobResult {
  blob: Blob;
  file: File;
  filename: string;
  objectUrl: string;
}

export type SharePdfEventDetail =
  | { type: 'START_GENERATING'; filename: string; title?: string }
  | { type: 'SUCCESS_NATIVE'; filename: string; title?: string }
  | {
      type: 'FALLBACK_READY';
      filename: string;
      phoneNumber?: string;
      messageText: string;
      blob: Blob;
      objectUrl: string;
    }
  | { type: 'ERROR'; filename: string; errorMessage: string }
  | { type: 'CLOSE' };

/**
 * Dispatches custom events to notify global UI modals/toasts about the current PDF share state
 */
export function dispatchSharePdfEvent(detail: SharePdfEventDetail): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('food-erp-share-pdf-event', { detail }));
  }
}

/**
 * Robust in-memory PDF generation engine.
 * Generates an exact, bank-grade, high-resolution (scale >= 2) A4 PDF as Blob & File objects.
 * Uses an isolated off-screen template container, strips UI buttons, controls, and scrollbars,
 * handles Bengali font rendering, and cleanly slices multi-page documents.
 */
export async function generatePDFBlob(
  elementOrId: HTMLElement | string,
  options: PDFOptions | string
): Promise<PDFBlobResult> {
  let container: HTMLElement | null = null;
  try {
    const filename = typeof options === 'string' ? options : options.filename;
    const orientation =
      typeof options === 'object' && options.orientation ? options.orientation : 'portrait';
    const margin: [number, number, number, number] =
      typeof options === 'object' && options.margin ? options.margin : [8, 8, 8, 8];
    const scaleFactor = typeof options === 'object' && options.scale ? options.scale : 2;

    const targetEl =
      typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;

    if (!targetEl) {
      throw new Error(`[PDF Engine] Target element not found: ${elementOrId}`);
    }

    // Ensure sanitized filename ending in .pdf
    let sanitizedFilename = filename.replace(/[/\\?%*:|"<>]/g, '_');
    if (!sanitizedFilename.toLowerCase().endsWith('.pdf')) {
      sanitizedFilename += '.pdf';
    }

    // Create a pristine, isolated off-screen render container
    container = document.createElement('div');
    container.id = 'pdf-generation-isolated-container';
    container.style.position = 'fixed';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.width = orientation === 'landscape' ? '1120px' : '800px';
    container.style.background = '#ffffff';
    container.style.color = '#0f172a';
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.fontFamily = "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif";
    container.style.zIndex = '-9999';
    container.style.boxSizing = 'border-box';
    container.style.visibility = 'visible';

    // Deep clone target DOM node
    const clone = targetEl.cloneNode(true) as HTMLElement;

    // Remove buttons, toolbars, modal controls, and anything with .no-print
    clone
      .querySelectorAll(
        '.no-print, button, .modal-close-btn, [data-no-print="true"], input[type="button"], input[type="submit"]'
      )
      .forEach(el => {
        el.remove();
      });

    // Replace inputs or selects with their clean text representation
    clone.querySelectorAll('input:not([type="hidden"]), textarea').forEach(input => {
      const span = document.createElement('span');
      span.textContent = (input as HTMLInputElement).value || '';
      span.className = 'font-semibold text-slate-800';
      input.replaceWith(span);
    });

    // Strip dark-mode classes to ensure clean, high-contrast, bank-grade white background
    clone.classList.remove('dark');
    clone.querySelectorAll('.dark').forEach(el => el.classList.remove('dark'));

    // Remove scrollbars, overflow clipping, and max-height constraints
    clone.style.overflow = 'visible';
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.width = '100%';

    container.appendChild(clone);
    document.body.appendChild(container);

    // Wait for fonts to finish loading
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await new Promise(resolve => setTimeout(resolve, 150));

    // High-resolution canvas render
    const canvas = await html2canvas(clone, {
      scale: scaleFactor,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'landscape' ? 1120 : 800,
    });

    // Initialize jsPDF with A4 format
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // A4 dimensions in mm
    const pageWidth = orientation === 'landscape' ? 297 : 210;
    const pageHeight = orientation === 'landscape' ? 210 : 297;

    const [marginTop, marginRight, marginBottom, marginLeft] = margin;
    const contentWidth = pageWidth - (marginLeft + marginRight);
    const contentHeight = pageHeight - (marginTop + marginBottom);

    const imgWidth = contentWidth;
    const totalPdfHeight = (canvas.height * imgWidth) / canvas.width;

    if (totalPdfHeight <= contentHeight) {
      // Single page document
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, imgWidth, totalPdfHeight);
    } else {
      // Multi-page document: slice canvas cleanly page-by-page
      const pageCanvasHeight = (canvas.width * contentHeight) / contentWidth;
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
          const pageImgHeight = (sliceHeight * contentWidth) / canvas.width;
          pdf.addImage(pageImgData, 'JPEG', marginLeft, marginTop, contentWidth, pageImgHeight);
        }

        renderedHeight += sliceHeight;
        pageIndex++;
      }
    }

    // Generate in-memory Blob and File
    const blob = pdf.output('blob');
    const file = new File([blob], sanitizedFilename, { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);

    return {
      blob,
      file,
      filename: sanitizedFilename,
      objectUrl,
    };
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Downloads a generated PDF Blob cleanly to user's device
 */
export function downloadPDFBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 60000);
}

/**
 * Cleanly generates and downloads a PDF file from an HTML element or element ID
 */
export async function exportElementToPDF(
  elementOrId: HTMLElement | string,
  options: PDFOptions | string
): Promise<boolean> {
  try {
    const pdfOptions: PDFOptions = typeof options === 'string' ? { filename: options } : options;
    const { blob, filename } = await generatePDFBlob(elementOrId, pdfOptions);
    
    // Dispatch event to show the preview modal
    window.dispatchEvent(new CustomEvent('preview-pdf', {
      detail: { blob, filename, title: 'Report Preview' }
    }));
    
    return true;
  } catch (error) {
    console.error('[PDF Export Error]:', error);
    // Fallback: trigger standard browser print dialog if pdf generator fails
    window.focus();
    window.print();
    return false;
  }
}

export interface ShareAsPDFOptions {
  elementOrId: HTMLElement | string;
  fileName: string;
  phoneNumber?: string;
  messageText?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: [number, number, number, number];
  scale?: number;
  onStatusChange?: (
    status: 'GENERATING' | 'SHARING' | 'SUCCESS' | 'FALLBACK' | 'ERROR',
    detail?: any
  ) => void;
  skipGlobalModal?: boolean;
}

export interface SharePDFResult {
  success: boolean;
  method: 'NATIVE_SHARE' | 'FALLBACK_DOWNLOAD_AND_WA' | 'CANCELLED';
  filename: string;
  file?: File;
  blob?: Blob;
  error?: any;
}

/**
 * Universal Master PDF Sharing Function for WhatsApp / Email / Native Share.
 * 1. Checks device file-sharing support (navigator.canShare({ files: [pdfFile] })).
 * 2. If supported: calls navigator.share to open native Share Sheet where user selects WhatsApp (real attached PDF).
 * 3. If unsupported (fallback): Auto-downloads the PDF Blob, opens wa.me with prefilled message in a new tab,
 *    and presents a clear on-screen instruction: "PDF ডাউনলোড হয়েছে ✅ — WhatsApp চ্যাটে গিয়ে ফাইলটি Attach করুন (📎 বাটনে ক্লিক করে)".
 * 4. Never fails silently: visual loading states, error handling, and notifications are guaranteed.
 */
export async function shareAsPDF(options: ShareAsPDFOptions): Promise<SharePDFResult> {
  let sanitizedFilename = options.fileName.replace(/[/\\?%*:|"<>]/g, '_');
  if (!sanitizedFilename.toLowerCase().endsWith('.pdf')) {
    sanitizedFilename += '.pdf';
  }

  try {
    // Notify UI that generation has started
    if (!options.skipGlobalModal) {
      dispatchSharePdfEvent({
        type: 'START_GENERATING',
        filename: sanitizedFilename,
        title: options.title,
      });
    }
    options.onStatusChange?.('GENERATING');

    // Step 1: Generate high-resolution PDF Blob & File
    const { blob, file, objectUrl } = await generatePDFBlob(options.elementOrId, {
      filename: sanitizedFilename,
      orientation: options.orientation || 'portrait',
      margin: options.margin || [8, 8, 8, 8],
      scale: options.scale || 2,
    });

    options.onStatusChange?.('SHARING');

    // Step 2: Check if device / browser supports direct file sharing (Mobile Chrome/Safari, Android, iOS, etc.)
    let sharedNatively = false;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData: ShareData = {
          files: [file],
          title: options.title || sanitizedFilename,
          text: options.messageText || '',
        };

        if (typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          sharedNatively = true;

          if (!options.skipGlobalModal) {
            dispatchSharePdfEvent({
              type: 'SUCCESS_NATIVE',
              filename: sanitizedFilename,
              title: options.title,
            });
          }
          options.onStatusChange?.('SUCCESS');

          return {
            success: true,
            method: 'NATIVE_SHARE',
            filename: sanitizedFilename,
            file,
            blob,
          };
        }
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          // User deliberately cancelled the share dialog
          if (!options.skipGlobalModal) {
            dispatchSharePdfEvent({ type: 'CLOSE' });
          }
          return {
            success: true,
            method: 'CANCELLED',
            filename: sanitizedFilename,
            file,
            blob,
          };
        }
        console.warn('[Native Share File unsupported or failed, activating fallback]:', shareErr);
        sharedNatively = false;
      }
    }

    // Step 3: Reliable Fallback for Desktop Browsers and devices without file share capability
    // 3a. Auto-download the PDF Blob immediately to user's device
    downloadPDFBlob(blob, sanitizedFilename);

    // 3b. Open WhatsApp in new tab with prefilled message after 0.5-1s delay
    const cleanPhone = cleanWhatsAppPhone(options.phoneNumber);
    const defaultPrefix = 'আসসালামু আলাইকুম, আপনার স্টেটমেন্ট/ইনভয়েসের PDF ফাইলটি ডাউনলোড হয়েছে, এখানে 📎 বাটনে ক্লিক করে অ্যাটাচ করে দিন।';
    const finalMsg = options.messageText
      ? `${defaultPrefix}\n\n${options.messageText}`
      : defaultPrefix;
    const encodedMsg = encodeURIComponent(finalMsg);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;

    // Open WhatsApp tab after 750ms so browser download starts smoothly first
    setTimeout(() => {
      try {
        window.open(waUrl, '_blank');
      } catch (e) {
        console.warn('[WhatsApp window.open blocked]:', e);
      }
    }, 750);

    // 3c. Display the required clear on-screen instruction
    if (!options.skipGlobalModal) {
      dispatchSharePdfEvent({
        type: 'FALLBACK_READY',
        filename: sanitizedFilename,
        phoneNumber: cleanPhone,
        messageText: finalMsg,
        blob,
        objectUrl,
      });
    }
    options.onStatusChange?.('FALLBACK', { filename: sanitizedFilename, cleanPhone });

    return {
      success: true,
      method: 'FALLBACK_DOWNLOAD_AND_WA',
      filename: sanitizedFilename,
      file,
      blob,
    };
  } catch (err: any) {
    console.error('[shareAsPDF Error]:', err);
    const errorMsg =
      err?.message || 'PDF তৈরি করা যায়নি, অনুগ্রহ করে আবার চেষ্টা করুন।';

    if (!options.skipGlobalModal) {
      dispatchSharePdfEvent({
        type: 'ERROR',
        filename: sanitizedFilename,
        errorMessage: errorMsg,
      });
    }
    options.onStatusChange?.('ERROR', err);

    return {
      success: false,
      method: 'FALLBACK_DOWNLOAD_AND_WA',
      filename: sanitizedFilename,
      error: err,
    };
  }
}

/**
 * Robust, cross-browser, iframe-bypassing document print trigger.
 * Uses window.open('', '_blank') + document.write(htmlString) + onload print()
 * which isolates document styles and bypasses preview iframe sandbox restrictions.
 */
export function printDocument(elementOrId?: HTMLElement | string | null, options?: PrintOptions): void {
  const title = options?.title || document.title || 'Food ERP Document';

  if (!elementOrId) {
    window.focus();
    window.print();
    return;
  }

  const targetEl =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!targetEl) {
    window.focus();
    window.print();
    return;
  }

  try {
    // Copy all style sheets and font links from parent document
    let stylesHtml = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      stylesHtml += node.outerHTML;
    });

    // Clone element and strip no-print buttons and action controls
    const clone = targetEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.no-print, button, .modal-close-btn, [data-no-print="true"]').forEach((el) => {
      el.remove();
    });

    const isLandscape = options?.landscape ? 'landscape' : 'portrait';

    const fullHtml = `<!DOCTYPE html>
<html lang="bn">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    ${stylesHtml}
    <style>
      @page {
        size: A4 ${isLandscape};
        margin: 8mm;
      }
      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        background-color: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Hind Siliguri', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
        margin: 0 !important;
        padding: 20px !important;
        font-size: 11pt;
      }
      .print-top-action-bar {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 20px;
        margin: -20px -20px 20px -20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        font-family: 'Hind Siliguri', sans-serif;
      }
      .print-top-action-bar button {
        cursor: pointer;
        font-weight: 700;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: opacity 0.2s;
      }
      .btn-print-now {
        background: #0d9488;
        color: #ffffff;
      }
      .btn-print-now:hover {
        background: #0f766e;
      }
      .btn-close-win {
        background: #334155;
        color: #ffffff;
        margin-left: 8px;
      }
      .btn-close-win:hover {
        background: #475569;
      }
      @media print {
        .print-top-action-bar, .no-print, button, .modal-close-btn {
          display: none !important;
        }
        body {
          padding: 0 !important;
        }
      }
    </style>
  </head>
  <body class="bg-white text-slate-900">
    <div class="print-top-action-bar no-print">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:bold;font-size:14px;">🖨️ প্রিন্ট প্রিভিউ উইন্ডো</span>
        <span style="font-size:12px;opacity:0.85;">(স্বয়ংক্রিয় ডায়ালগ না আসলে ডানদিকের বোতাম চাপুন)</span>
      </div>
      <div>
        <button class="btn-print-now" onclick="window.focus(); window.print();">
          🖨️ এখনই প্রিন্ট করুন
        </button>
        <button class="btn-close-win" onclick="window.close();">
          ❌ উইন্ডো বন্ধ করুন
        </button>
      </div>
    </div>
    <div class="print-content-wrapper">
      ${clone.outerHTML}
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          try {
            window.focus();
            window.print();
          } catch (e) {
            console.warn('Auto-print error:', e);
          }
        }, 400);
      };
    </script>
  </body>
</html>`;

    // Step 2: Open a new window/tab
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      // Step 3: Write HTML string to new window
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback if popup blocker or sandbox prevents window.open
      console.warn('[printDocument]: window.open blocked by popup blocker or iframe sandbox, using isolated frame fallback');
      fallbackIframePrint(fullHtml);
    }
  } catch (err) {
    console.error('[Print Document Error]:', err);
    window.focus();
    window.print();
  }
}

/**
 * Fallback printing method using an isolated iframe if window.open is blocked
 */
function fallbackIframePrint(fullHtml: string): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.id = 'erp-print-isolation-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(iframe);
      window.focus();
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(fullHtml);
    frameDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print error, falling back to window.print():', e);
        window.focus();
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 300);
  } catch (e) {
    console.error('fallbackIframePrint error:', e);
    window.focus();
    window.print();
  }
}

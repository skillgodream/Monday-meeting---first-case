import * as pdfjsLib from 'pdfjs-dist';
import { SlidePage } from '../types';

// Configure worker safely for browser environments
try {
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('[PDF Service] Could not set GlobalWorkerOptions.workerSrc:', e);
}

/**
 * Extracts digital text and page metadata from a PDF file directly in the browser.
 */
export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer,
  timeoutMs: number = 15000
): Promise<{ text: string; pageCount: number }> {
  const result = await extractSlidesFromPdf(fileOrBuffer, timeoutMs);
  return { text: result.text, pageCount: result.pageCount };
}

/**
 * Extracts structured slide pages AND renders 1:1 canvas images for each PDF page.
 */
export async function extractSlidesFromPdf(
  fileOrBuffer: File | ArrayBuffer,
  timeoutMs: number = 20000
): Promise<{ text: string; pageCount: number; slides: SlidePage[] }> {
  const extractPromise = (async () => {
    try {
      const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      let fullText = '';
      const slides: SlidePage[] = [];

      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageLines: string[] = [];
        let lastY: number | null = null;
        let currentLine = '';

        for (const item of textContent.items) {
          if ('str' in item && typeof item.str === 'string') {
            const hasY = 'transform' in item && Array.isArray((item as any).transform);
            const currentY = hasY ? (item as any).transform[5] : null;

            if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
              if (currentLine.trim()) pageLines.push(currentLine.trim());
              currentLine = item.str;
            } else {
              currentLine += (currentLine ? ' ' : '') + item.str;
            }
            if (currentY !== null) lastY = currentY;
          }
        }
        if (currentLine.trim()) pageLines.push(currentLine.trim());

        const pageText = pageLines.join('\n');
        if (pageText.trim()) {
          fullText += `${pageText}\n\n`;
        }

        // Render page onto an HTML5 Canvas to capture high-res page screenshot
        let imageDataUrl: string | undefined;
        try {
          if (typeof document !== 'undefined') {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              await page.render({ canvasContext: ctx, canvas, viewport } as any).promise;
              imageDataUrl = canvas.toDataURL('image/png');
            }
          }
        } catch (renderErr) {
          console.warn(`[PDF Service] Canvas render failed for page ${i}:`, renderErr);
        }

        const title = pageLines[0] || `Slide ${i}`;
        const bullets = pageLines.slice(1).filter((l) => l.trim().length > 0);

        slides.push({
          slideNumber: i,
          title,
          subtitle: bullets[0] || `PDF Document Page ${i}`,
          bullets: bullets.length > 0 ? bullets : [pageText || `Page ${i} content`],
          rawContent: pageText,
          imageDataUrl,
        });
      }

      return { text: fullText.trim(), pageCount, slides };
    } catch (err) {
      console.warn('[PDF Service] PDF slide extraction failed:', err);
      return { text: '', pageCount: 0, slides: [] };
    }
  })();

  let timerId: any;
  const timeoutPromise = new Promise<{ text: string; pageCount: number; slides: SlidePage[] }>((resolve) => {
    timerId = setTimeout(() => {
      console.warn(`[PDF Service] PDF extraction timed out after ${timeoutMs}ms`);
      resolve({ text: '', pageCount: 0, slides: [] });
    }, timeoutMs);
  });

  const res = await Promise.race([extractPromise, timeoutPromise]);
  clearTimeout(timerId);
  return res;
}

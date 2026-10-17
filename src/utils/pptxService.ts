import JSZip from 'jszip';
import { SlidePage } from '../types';

/**
 * Extracts real PowerPoint slide pages, titles, bullet points, text, and media images
 * directly from uploaded .pptx files using JSZip and XML analysis.
 */
export async function extractSlidesFromPptx(
  fileOrBuffer: File | ArrayBuffer
): Promise<{ slides: SlidePage[]; fullText: string; pageCount: number }> {
  try {
    const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
    const zip = await JSZip.loadAsync(buffer);

    // Find all ppt/slides/slide\d+.xml entries
    const slideFiles: { name: string; num: number; zipEntry: JSZip.JSZipObject }[] = [];
    zip.forEach((relativePath, file) => {
      const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
      if (match) {
        slideFiles.push({
          name: relativePath,
          num: parseInt(match[1], 10),
          zipEntry: file,
        });
      }
    });

    // Sort numerically by slide number (slide1.xml, slide2.xml, slide3.xml...)
    slideFiles.sort((a, b) => a.num - b.num);

    if (slideFiles.length === 0) {
      console.warn('[pptxService] No slide XML files found in pptx zip structure.');
      return { slides: [], fullText: '', pageCount: 0 };
    }

    const slides: SlidePage[] = [];
    const fullTextParts: string[] = [];

    // Parse each slide XML
    for (let i = 0; i < slideFiles.length; i++) {
      const slideItem = slideFiles[i];
      const xmlText = await slideItem.zipEntry.async('string');

      // Extract all text paragraphs (<a:p>)
      const paragraphMatches = xmlText.match(/<a:p[^>]*>[\s\S]*?<\/a:p>/gi) || [];
      const paragraphs: string[] = [];

      for (const pXml of paragraphMatches) {
        const textMatches = pXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        if (textMatches.length > 0) {
          const lineText = textMatches
            .map((tNode) => tNode.replace(/<[^>]+>/g, ''))
            .join(' ')
            .trim();
          if (lineText.length > 0) {
            paragraphs.push(lineText);
          }
        }
      }

      // If no <a:p> match, fallback to any <a:t>
      if (paragraphs.length === 0) {
        const fallbackTextMatches = xmlText.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        if (fallbackTextMatches.length > 0) {
          const raw = fallbackTextMatches.map((tNode) => tNode.replace(/<[^>]+>/g, '')).join(' ');
          if (raw.trim()) paragraphs.push(raw.trim());
        }
      }

      const slideNum = slideItem.num || i + 1;
      const title = paragraphs[0] || `Slide ${slideNum}`;
      const bullets = paragraphs.slice(1).filter((p) => p.length > 0);
      const rawContent = paragraphs.join('\n');

      // Check if slide rels point to an image media file
      let imageDataUrl: string | undefined;
      const relsFileName = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      const relsFile = zip.file(relsFileName);
      if (relsFile) {
        try {
          const relsXml = await relsFile.async('string');
          const imageTargetMatch = relsXml.match(/Target="\.\.\/media\/([^"]+)"/i) || relsXml.match(/Target="media\/([^"]+)"/i);
          if (imageTargetMatch) {
            const mediaFileName = `ppt/media/${imageTargetMatch[1]}`;
            const mediaFile = zip.file(mediaFileName);
            if (mediaFile) {
              const base64Data = await mediaFile.async('base64');
              const ext = mediaFileName.split('.').pop()?.toLowerCase() || 'png';
              const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
              imageDataUrl = `data:${mime};base64,${base64Data}`;
            }
          }
        } catch {
          // ignore rels error
        }
      }

      slides.push({
        slideNumber: slideNum,
        title: title,
        subtitle: bullets[0] ? bullets[0] : `Slide ${slideNum} from uploaded PowerPoint presentation.`,
        bullets: bullets.length > 0 ? bullets : [rawContent || `Content from slide ${slideNum}`],
        rawContent,
        imageDataUrl,
      });

      if (rawContent.trim()) {
        fullTextParts.push(`--- SLIDE ${slideNum}: ${title} ---\n${rawContent}`);
      }
    }

    const fullText = fullTextParts.join('\n\n');
    console.log(`[pptxService SUCCESS] Parsed ${slides.length} slides from PPTX zip structure.`);

    return {
      slides,
      fullText,
      pageCount: slides.length,
    };
  } catch (err) {
    console.warn('[pptxService Error] Failed to parse PPTX zip:', err);
    return { slides: [], fullText: '', pageCount: 0 };
  }
}

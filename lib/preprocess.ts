import sharp from 'sharp';
import { IMAGE_MAX_WIDTH, IMAGE_JPEG_QUALITY, IMAGE_CONTRAST_MULTIPLIER } from '@/constants';

/** Options for the image preprocessing pipeline. */
interface PreprocessOptions {
  /** Maximum pixel width for resize (default: {@link IMAGE_MAX_WIDTH}). */
  maxWidth?: number;
  /** Whether to convert to grayscale (default: true). */
  grayscale?: boolean;
  /** Linear contrast multiplier (default: {@link IMAGE_CONTRAST_MULTIPLIER}). */
  contrastMultiplier?: number;
  /** Optional binary threshold value for OCR enhancement. */
  threshold?: number;
}

/** Result of the preprocessing pipeline. */
interface PreprocessResult {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Preprocesses a raw image buffer for optimal Gemini AI extraction.
 *
 * Pipeline steps:
 * 1. **Resize** — Caps width at {@link IMAGE_MAX_WIDTH}px to reduce token cost.
 * 2. **Grayscale** — Strips color noise to improve text recognition.
 * 3. **Contrast** — Applies linear scaling to enhance text legibility.
 * 4. **Threshold** — Optional binary threshold for high-noise images.
 * 5. **Compress** — Outputs JPEG at {@link IMAGE_JPEG_QUALITY}% quality.
 *
 * @param buffer - The raw image buffer from the uploaded file.
 * @param options - Optional preprocessing configuration overrides.
 * @returns The processed image buffer and its MIME type.
 */
export async function preprocessImage(
  buffer: Buffer,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> {
  const {
    maxWidth = IMAGE_MAX_WIDTH,
    grayscale = true,
    contrastMultiplier = IMAGE_CONTRAST_MULTIPLIER,
  } = options;

  let pipeline = sharp(buffer);
  const metadata = await pipeline.metadata();

  // 1. Resize if image exceeds max width
  if (metadata.width && metadata.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth });
  }

  // 2. Convert to grayscale to reduce visual complexity
  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  // 3. Apply contrast adjustment: output = input × multiplier + offset
  if (contrastMultiplier !== 1.0) {
    const offset = -128 * (contrastMultiplier - 1);
    pipeline = pipeline.linear(contrastMultiplier, offset);
  }

  // 4. Optional binary thresholding
  if (options.threshold !== undefined) {
    pipeline = pipeline.threshold(options.threshold);
  }

  // 5. Compress to JPEG
  const processedBuffer = await pipeline
    .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return {
    buffer: processedBuffer,
    mimeType: 'image/jpeg',
  };
}

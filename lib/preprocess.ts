import sharp from 'sharp';

/**
 * Preprocesses a raw image buffer (from receipt or bill upload).
 * 1. Resizes the image to a maximum width (default 1200px) to keep token counts low.
 * 2. Grayscales the image to strip color noise.
 * 3. Applies linear contrast scaling to make the text stand out.
 * 4. Compresses it to a standard JPEG format at 80% quality.
 */
export async function preprocessImage(
  buffer: Buffer,
  options: {
    maxWidth?: number;
    grayscale?: boolean;
    contrastMultiplier?: number;
    threshold?: number;
  } = {}
): Promise<{ buffer: Buffer; mimeType: string }> {
  const {
    maxWidth = 1200,
    grayscale = true,
    contrastMultiplier = 1.2,
  } = options;

  let pipeline = sharp(buffer);
  const metadata = await pipeline.metadata();

  // 1. Resize if image is larger than maxWidth
  if (metadata.width && metadata.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth });
  }

  // 2. Convert to grayscale to reduce visual complexity and file size
  if (grayscale) {
    pipeline = pipeline.grayscale();
  }

  // 3. Apply contrast adjustments: output = input * multiplier + offset
  // We use offset = -128 * (multiplier - 1) to keep the neutral gray balance.
  if (contrastMultiplier !== 1.0) {
    const offset = -128 * (contrastMultiplier - 1);
    pipeline = pipeline.linear(contrastMultiplier, offset);
  }

  // 4. Custom binary thresholding (if specified)
  if (options.threshold !== undefined) {
    pipeline = pipeline.threshold(options.threshold);
  }

  // 5. Compress and convert to jpeg
  const processedBuffer = await pipeline
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return {
    buffer: processedBuffer,
    mimeType: 'image/jpeg'
  };
}

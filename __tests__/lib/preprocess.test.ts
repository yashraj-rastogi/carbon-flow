/**
 * @jest-environment node
 */
import { preprocessImage } from '@/lib/preprocess';

// Mock sharp
const mockMetadata = jest.fn();
const mockResize = jest.fn();
const mockGrayscale = jest.fn();
const mockLinear = jest.fn();
const mockThreshold = jest.fn();
const mockJpeg = jest.fn();
const mockToBuffer = jest.fn();

jest.mock('sharp', () => {
  const sharpMock = (buffer: Buffer) => {
    const instance = {
      metadata: mockMetadata,
      resize: mockResize,
      grayscale: mockGrayscale,
      linear: mockLinear,
      threshold: mockThreshold,
      jpeg: mockJpeg,
      toBuffer: mockToBuffer,
    };
    mockMetadata.mockImplementation(() => Promise.resolve({ width: 2000 }));
    mockResize.mockImplementation(() => instance);
    mockGrayscale.mockImplementation(() => instance);
    mockLinear.mockImplementation(() => instance);
    mockThreshold.mockImplementation(() => instance);
    mockJpeg.mockImplementation(() => instance);
    mockToBuffer.mockImplementation(() => Promise.resolve(Buffer.from('processed-mock-buffer')));
    return instance;
  };
  return sharpMock;
});

describe('preprocessImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preprocesses an image with default options', async () => {
    const inputBuffer = Buffer.from('input-buffer');
    const result = await preprocessImage(inputBuffer);

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.buffer.toString()).toBe('processed-mock-buffer');
    expect(mockMetadata).toHaveBeenCalledTimes(1);
    expect(mockResize).toHaveBeenCalledWith({ width: 1200 }); // Default IMAGE_MAX_WIDTH
    expect(mockGrayscale).toHaveBeenCalledTimes(1);
    expect(mockLinear).toHaveBeenCalledTimes(1);
    expect(mockJpeg).toHaveBeenCalledWith(expect.objectContaining({ quality: 80 }));
    expect(mockToBuffer).toHaveBeenCalledTimes(1);
  });

  it('does not resize if width is below maxWidth', async () => {
    mockMetadata.mockResolvedValueOnce({ width: 800 });
    const inputBuffer = Buffer.from('input-buffer');
    const result = await preprocessImage(inputBuffer, { maxWidth: 1000 });

    expect(result.buffer.toString()).toBe('processed-mock-buffer');
    expect(mockResize).not.toHaveBeenCalled();
  });

  it('respects optional configurations like disabling grayscale', async () => {
    mockMetadata.mockResolvedValueOnce({ width: 800 });
    const inputBuffer = Buffer.from('input-buffer');
    await preprocessImage(inputBuffer, { grayscale: false, contrastMultiplier: 1.0 });

    expect(mockGrayscale).not.toHaveBeenCalled();
    expect(mockLinear).not.toHaveBeenCalled();
  });

  it('applies optional binary thresholding if provided', async () => {
    mockMetadata.mockResolvedValueOnce({ width: 800 });
    const inputBuffer = Buffer.from('input-buffer');
    await preprocessImage(inputBuffer, { threshold: 128 });

    expect(mockThreshold).toHaveBeenCalledWith(128);
  });
});

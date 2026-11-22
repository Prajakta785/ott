import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// Resolve FFmpeg binary from direct path, @ffmpeg-installer/ffmpeg, or system environment
export function getFFmpegPath(): string {
  const directPaths = [
    path.join(process.cwd(), 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.join(process.cwd(), '..', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
  ];
  for (const p of directPaths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const installer = require('@ffmpeg-installer/ffmpeg');
    if (installer?.path && fs.existsSync(installer.path)) {
      return installer.path;
    }
  } catch {}

  return 'ffmpeg';
}

export interface CompressionResult {
  success: boolean;
  localFilePath: string;
  localUrl: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
  duration?: number;
  error?: string;
}

/**
 * Get or create the local video storage directory
 */
export function ensureVideoStorageDirectories(): { uploadDir: string; tempDir: string } {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');
  const tempDir = path.join(uploadDir, 'temp');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return { uploadDir, tempDir };
}

/**
 * Compress a video buffer using FFmpeg (H.264 CRF 21, visually lossless)
 * and save it permanently to the local server disk.
 */
export async function compressAndSaveVideoLocally(
  inputBuffer: Buffer,
  originalFileName: string,
  options: {
    crf?: number; // 21 is visually lossless (lower = higher quality, 18-23 standard)
    preset?: string; // 'faster', 'fast', 'medium'
    onProgress?: (percent: number) => void;
  } = {}
): Promise<CompressionResult> {
  const { uploadDir, tempDir } = ensureVideoStorageDirectories();
  const crf = options.crf ?? 21;
  const preset = options.preset ?? 'faster';

  const timestamp = Date.now();
  const cleanBaseName = originalFileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);

  const tempInputPath = path.join(tempDir, `raw_${timestamp}_${cleanBaseName}.tmp`);
  const finalFileName = `${timestamp}_${cleanBaseName}_optimized.mp4`;
  const finalOutputPath = path.join(uploadDir, finalFileName);

  const originalSize = inputBuffer.length;

  try {
    // 1. Write the uploaded raw buffer to temp disk
    await fs.promises.writeFile(tempInputPath, inputBuffer);

    // 2. Execute FFmpeg visually-lossless compression
    await new Promise<void>((resolve, reject) => {
      // FFmpeg arguments:
      // -c:v libx264: Industry standard H.264 video codec
      // -crf 21: Constant Rate Factor (visually indistinguishable from original, saves 40-60% size)
      // -preset faster: high speed encoding with great compression efficiency
      // -pix_fmt yuv420p: universal playback compatibility (Android, iOS, TVs, Web)
      // -c:a aac -b:a 192k: Studio quality stereo audio
      // -movflags +faststart: relocate moov atom to start of file for zero-wait streaming
      const args = [
        '-y', // overwrite output if exists
        '-i', tempInputPath,
        '-c:v', 'libx264',
        '-crf', String(crf),
        '-preset', preset,
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        finalOutputPath
      ];

      const ffmpegBin = getFFmpegPath();
      console.log(`[FFmpeg] Starting compression with: ${ffmpegBin}`);
      const child = spawn(ffmpegBin, args);
      let stderrData = '';

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0 && fs.existsSync(finalOutputPath)) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}. Details: ${stderrData.slice(-400)}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });

    // 3. Measure compressed results
    const compressedStat = await fs.promises.stat(finalOutputPath);
    const compressedSize = compressedStat.size;
    const savedPercentage = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

    // 4. Clean up temp raw input
    try {
      if (fs.existsSync(tempInputPath)) {
        await fs.promises.unlink(tempInputPath);
      }
    } catch {}

    return {
      success: true,
      localFilePath: finalOutputPath,
      localUrl: `/uploads/videos/${finalFileName}`,
      fileName: finalFileName,
      originalSize,
      compressedSize,
      savedPercentage,
    };
  } catch (err: any) {
    console.warn('FFmpeg compression notice, saving raw fallback:', err?.message);

    // Fallback: if FFmpeg fails on an unusual raw format, save original buffer locally
    try {
      const fallbackName = `${timestamp}_${cleanBaseName}_original.mp4`;
      const fallbackPath = path.join(uploadDir, fallbackName);
      await fs.promises.writeFile(fallbackPath, inputBuffer);

      // Clean up temp
      if (fs.existsSync(tempInputPath)) {
        await fs.promises.unlink(tempInputPath).catch(() => {});
      }

      return {
        success: true,
        localFilePath: fallbackPath,
        localUrl: `/uploads/videos/${fallbackName}`,
        fileName: fallbackName,
        originalSize,
        compressedSize: originalSize,
        savedPercentage: 0,
        error: err?.message,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        localFilePath: '',
        localUrl: '',
        fileName: originalFileName,
        originalSize,
        compressedSize: originalSize,
        savedPercentage: 0,
        error: fallbackErr?.message || err?.message,
      };
    }
  }
}

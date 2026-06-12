import type { EchoMedia } from "@/lib/types";

export const MAX_POST_IMAGES = 9;
export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export function validateImageFile(
  file: Pick<File, "size" | "type">,
): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "仅支持 JPG、PNG、WebP 或 HEIC 图片";
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    return "单张图片不能超过 15MB";
  }
  return null;
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  quality: number,
): string {
  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) {
    return webp;
  }
  return canvas.toDataURL("image/jpeg", quality);
}

export async function sanitizeImage(file: File): Promise<EchoMedia> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1440;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    bitmap.close();
    throw new Error("无法处理图片");
  }

  context.fillStyle = "#f4f0e7";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.78;
  let dataUrl = canvasToDataUrl(canvas, quality);
  while (dataUrl.length > 650_000 && quality > 0.46) {
    quality -= 0.08;
    dataUrl = canvasToDataUrl(canvas, quality);
  }

  return {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataUrl,
    width,
    height,
    name: file.name,
  };
}

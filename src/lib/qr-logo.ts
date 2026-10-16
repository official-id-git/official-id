/**
 * QR Code Logo Stamping & Optimization Utility
 * 
 * Memungkinkan penambahan logo PNG di tengah-tengah QR Code dengan:
 * 1. Koreksi kesalahan tingkat tinggi (QR Error Correction Level H - hingga 30%)
 * 2. Background badge pelindung (Rounded, Circle, atau Square) agar modul QR tidak bertabrakan dengan logo
 * 3. Preservasi aspek rasio logo (contain) dan transparansi PNG
 * 4. Kompresi & optimasi file PNG lokal ke Data URL ringkas (~15-30KB)
 */

export type LogoShape = "rounded" | "circle" | "square";

export interface LogoRenderOptions {
  sizeRatio?: number; // Proporsi terhadap ukuran QR (default: 0.22 = 22%)
  shape?: LogoShape;
  borderRadius?: number;
  padding?: number;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

/**
 * Menggambar rounded rectangle pada Canvas 2D
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Memuat objek gambar (Image) secara asynchronous
 */
export function loadLogoImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load logo: " + String(e)));
    img.src = src;
  });
}

/**
 * Menggambar logo di bagian tengah (center) dari canvas QR code yang sudah ada
 */
export async function drawLogoOnQrCanvas(
  canvas: HTMLCanvasElement,
  logoSrc: string,
  options?: LogoRenderOptions
): Promise<void> {
  if (!logoSrc || typeof window === "undefined") return;

  try {
    const img = await loadLogoImage(logoSrc);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    // Batasi rasio logo antara 16% s/d 26% untuk memastikan QR Level H terbaca 100%
    const ratio = Math.min(Math.max(options?.sizeRatio ?? 0.22, 0.16), 0.26);
    const badgeSize = Math.round(Math.min(width, height) * ratio);
    const shape = options?.shape ?? "circle";
    const padding = options?.padding ?? Math.round(badgeSize * 0.11);
    const bgColor = options?.bgColor ?? "#ffffff";
    const borderColor = options?.borderColor ?? "rgba(0, 0, 0, 0.08)";
    const borderWidth = options?.borderWidth ?? Math.max(2, Math.round(badgeSize * 0.02));
    const radius = options?.borderRadius ?? Math.round(badgeSize * 0.2);

    const cx = width / 2;
    const cy = height / 2;
    const bx = cx - badgeSize / 2;
    const by = cy - badgeSize / 2;

    ctx.save();

    // 1. Gambar badge latar belakang (menutupi modul QR di tengah agar logo terbaca bersih)
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(cx, cy, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (shape === "rounded") {
      drawRoundedRect(ctx, bx, by, badgeSize, badgeSize, radius);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(bx, by, badgeSize, badgeSize);
      ctx.strokeRect(bx, by, badgeSize, badgeSize);
    }

    // 2. Terapkan kliping agar logo tidak meluber keluar dari bentuk badge
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(cx, cy, badgeSize / 2 - 1, 0, Math.PI * 2);
      ctx.clip();
    } else if (shape === "rounded") {
      drawRoundedRect(ctx, bx + 1, by + 1, badgeSize - 2, badgeSize - 2, radius);
      ctx.clip();
    }

    // 3. Hitung dimensi gambar (aspek rasio contain)
    const availSize = Math.max(10, badgeSize - padding * 2);
    const imgAspect = (img.naturalWidth || img.width) / (img.naturalHeight || img.height || 1);
    let dw = availSize;
    let dh = availSize;

    if (imgAspect > 1) {
      dh = availSize / imgAspect;
    } else {
      dw = availSize * imgAspect;
    }

    const dx = cx - dw / 2;
    const dy = cy - dh / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, dw, dh);

    ctx.restore();
  } catch (err) {
    console.warn("Failed to draw logo on QR canvas:", err);
  }
}

/**
  * Optimizes a local image file into a compact PNG Data URL (max 256x256)
  * preserving original transparency.
  */
export async function optimizeLogoFile(
  file: File,
  maxDimension = 256
): Promise<{ dataUrl: string; width: number; height: number; name: string; size: number }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (PNG, WebP, SVG, or JPG).");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result;
      if (typeof src !== "string") {
        reject(new Error("Failed to read image file."));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({
            dataUrl: src,
            width: w,
            height: h,
            name: file.name,
            size: file.size,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png");

        resolve({
          dataUrl,
          width: w,
          height: h,
          name: file.name,
          size: Math.round((dataUrl.length * 3) / 4),
        });
      };
      img.onerror = () => reject(new Error("Corrupt image file or unsupported format."));
      img.src = src;
    };
    reader.onerror = () => reject(new Error("Failed to open file from device."));
    reader.readAsDataURL(file);
  });
}

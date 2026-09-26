import QRCode from "qrcode";

export type ThemeId = "magic-tree" | "cyberpunk" | "golden-badge" | "retro-arcade" | "official-slate";

export interface ColorTheme {
  id: ThemeId;
  name: string;
  category: string;
  accent: string;
  palette: {
    bg: string;
    primaryTop: string;
    primaryLeft: string;
    primaryRight: string;
    secondaryTop?: string;
    secondaryLeft?: string;
    secondaryRight?: string;
    finderTop: string;
    finderLeft: string;
    finderRight: string;
    gridLine?: string;
  };
}

export const QR_THEMES: Record<ThemeId, ColorTheme> = {
  "magic-tree": {
    id: "magic-tree",
    name: "Magic Pixel Tree",
    category: "Nature 3D (ICQR)",
    accent: "#10b981",
    palette: {
      bg: "#061f18",
      primaryTop: "#34d399",
      primaryLeft: "#059669",
      primaryRight: "#047857",
      secondaryTop: "#10b981",
      secondaryLeft: "#047857",
      secondaryRight: "#065f46",
      finderTop: "#6ee7b7",
      finderLeft: "#059669",
      finderRight: "#064e3b",
      gridLine: "rgba(16, 185, 129, 0.15)",
    },
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Neon Metropolis",
    category: "Futuristic Voxel",
    accent: "#06b6d4",
    palette: {
      bg: "#090915",
      primaryTop: "#38bdf8",
      primaryLeft: "#0284c7",
      primaryRight: "#0369a1",
      secondaryTop: "#e879f9",
      secondaryLeft: "#c026d3",
      secondaryRight: "#9333ea",
      finderTop: "#22d3ee",
      finderLeft: "#0891b2",
      finderRight: "#0e7490",
      gridLine: "rgba(6, 182, 212, 0.15)",
    },
  },
  "golden-badge": {
    id: "golden-badge",
    name: "Official Golden ID",
    category: "Luxury Corporate",
    accent: "#f59e0b",
    palette: {
      bg: "#18140c",
      primaryTop: "#fbbf24",
      primaryLeft: "#d97706",
      primaryRight: "#b45309",
      secondaryTop: "#fef08a",
      secondaryLeft: "#eab308",
      secondaryRight: "#ca8a04",
      finderTop: "#fde047",
      finderLeft: "#d97706",
      finderRight: "#78350f",
      gridLine: "rgba(245, 158, 11, 0.15)",
    },
  },
  "retro-arcade": {
    id: "retro-arcade",
    name: "Retro 8-Bit Gameboy",
    category: "Arcade Nostalgia",
    accent: "#84cc16",
    palette: {
      bg: "#1a2408",
      primaryTop: "#a3e635",
      primaryLeft: "#65a30d",
      primaryRight: "#4d7c0f",
      secondaryTop: "#bef264",
      secondaryLeft: "#84cc16",
      secondaryRight: "#3f6212",
      finderTop: "#bef264",
      finderLeft: "#4d7c0f",
      finderRight: "#365314",
      gridLine: "rgba(132, 204, 22, 0.15)",
    },
  },
  "official-slate": {
    id: "official-slate",
    name: "Official Titanium",
    category: "Clean Executive",
    accent: "#6366f1",
    palette: {
      bg: "#0b0f19",
      primaryTop: "#818cf8",
      primaryLeft: "#4f46e5",
      primaryRight: "#3730a3",
      secondaryTop: "#a5b4fc",
      secondaryLeft: "#6366f1",
      secondaryRight: "#312e81",
      finderTop: "#c7d2fe",
      finderLeft: "#4338ca",
      finderRight: "#1e1b4b",
      gridLine: "rgba(99, 102, 241, 0.15)",
    },
  },
};

export interface QRPixelData {
  size: number;
  matrix: boolean[][];
  finderMask: boolean[][];
}

/**
 * Generate QR code boolean matrix and finder pattern mask
 */
export function generateQRMatrix(text: string): QRPixelData {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const matrix: boolean[][] = [];
  const finderMask: boolean[][] = [];

  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    const fRow: boolean[] = [];
    for (let x = 0; x < size; x++) {
      row.push(qr.modules.get(x, y) === 1);

      // Finder pattern identification (Top-left, Top-right, Bottom-left)
      const isTopLeft = x < 8 && y < 8;
      const isTopRight = x >= size - 8 && y < 8;
      const isBottomLeft = x < 8 && y >= size - 8;
      fRow.push(isTopLeft || isTopRight || isBottomLeft);
    }
    matrix.push(row);
    finderMask.push(fRow);
  }

  return { size, matrix, finderMask };
}

/**
 * Draw isometric cube with top, left, and right faces
 */
function drawIsometricCube(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  x: number,
  y: number,
  h: number,
  unitW: number,
  unitH: number,
  topColor: string,
  leftColor: string,
  rightColor: string
) {
  const sx = originX + ((x - y) * unitW) / 2;
  const sy = originY + ((x + y) * unitH) / 2;

  // Top Face (Diamond)
  ctx.beginPath();
  ctx.moveTo(sx, sy - h);
  ctx.lineTo(sx + unitW / 2, sy - h + unitH / 2);
  ctx.lineTo(sx, sy - h + unitH);
  ctx.lineTo(sx - unitW / 2, sy - h + unitH / 2);
  ctx.closePath();
  ctx.fillStyle = topColor;
  ctx.fill();

  if (h > 0) {
    // Left Face
    ctx.beginPath();
    ctx.moveTo(sx - unitW / 2, sy - h + unitH / 2);
    ctx.lineTo(sx, sy - h + unitH);
    ctx.lineTo(sx, sy + unitH);
    ctx.lineTo(sx - unitW / 2, sy + unitH / 2);
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();

    // Right Face
    ctx.beginPath();
    ctx.moveTo(sx, sy - h + unitH);
    ctx.lineTo(sx + unitW / 2, sy - h + unitH / 2);
    ctx.lineTo(sx + unitW / 2, sy + unitH / 2);
    ctx.lineTo(sx, sy + unitH);
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
  }
}

/**
 * Render the Pixel Art QR Code onto a canvas
 * @param canvas Target HTML Canvas
 * @param qrData QR matrix data
 * @param theme Color Theme
 * @param morphProgress 0.0 (Flat 2D Pixel) to 1.0 (Full 3D Isometric Voxel)
 * @param shapeType Height modulation shape ('tree', 'city', 'pyramid', 'flat')
 */
export function renderQRPixelCanvas(
  canvas: HTMLCanvasElement,
  qrData: QRPixelData,
  theme: ColorTheme,
  morphProgress: number, // 0 to 1
  shapeType: "tree" | "city" | "pyramid" | "flat" = "tree"
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { size, matrix, finderMask } = qrData;
  const width = canvas.width;
  const height = canvas.height;

  // Clear background
  ctx.fillStyle = theme.palette.bg;
  ctx.fillRect(0, 0, width, height);

  // When morphProgress is 0 (Pure 2D Flat Mode)
  if (morphProgress <= 0.02) {
    const padding = 36;
    const cellSize = (Math.min(width, height) - padding * 2) / size;
    const offsetX = (width - cellSize * size) / 2;
    const offsetY = (height - cellSize * size) / 2;

    // Draw Subtle Grid background
    ctx.strokeStyle = theme.palette.gridLine || "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + i * cellSize, offsetY);
      ctx.lineTo(offsetX + i * cellSize, offsetY + size * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + i * cellSize);
      ctx.lineTo(offsetX + size * cellSize, offsetY + i * cellSize);
      ctx.stroke();
    }

    // Draw 2D Pixel Modules
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (!matrix[y][x]) continue;

        const isFinder = finderMask[y][x];
        ctx.fillStyle = isFinder
          ? theme.palette.finderTop
          : (x + y) % 3 === 0 && theme.palette.secondaryTop
          ? theme.palette.secondaryTop
          : theme.palette.primaryTop;

        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;

        // Draw crisp pixel square with 1px inset for pixel art aesthetic
        ctx.fillRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
      }
    }
    return;
  }

  // 3D Isometric Rendering
  const unitW = (width * 0.9) / size;
  const unitH = unitW / 2;
  const maxExtrusion = 28 * morphProgress;
  const originX = width / 2;
  const originY = height * 0.35 + (1 - morphProgress) * 40;

  // Sorting order for Painter's Algorithm: render from back to front (x + y ascending)
  const order: { x: number; y: number; sum: number }[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      order.push({ x, y, sum: x + y });
    }
  }
  order.sort((a, b) => a.sum - b.sum);

  // Draw Ground Base Plinth (Isometric Grid Shadow)
  for (const item of order) {
    const { x, y } = item;
    const sx = originX + ((x - y) * unitW) / 2;
    const sy = originY + ((x + y) * unitH) / 2;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + unitW / 2, sy + unitH / 2);
    ctx.lineTo(sx, sy + unitH);
    ctx.lineTo(sx - unitW / 2, sy + unitH / 2);
    ctx.closePath();
    ctx.fillStyle = theme.palette.gridLine || "rgba(255, 255, 255, 0.03)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 0.5;
    ctx.fill();
    ctx.stroke();
  }

  const mid = size / 2;

  // Render 3D Voxels
  for (const item of order) {
    const { x, y } = item;
    if (!matrix[y][x]) continue;

    const isFinder = finderMask[y][x];

    // Compute sculpted height based on shape type
    let heightMultiplier = 1;
    const distToCenter = Math.sqrt((x - mid) ** 2 + (y - mid) ** 2);
    const maxDist = Math.sqrt(2 * mid ** 2);

    if (isFinder) {
      // Keep finder patterns uniform so scan is stable
      heightMultiplier = 0.45;
    } else if (shapeType === "tree") {
      // Tree crown dome: center is highest, edges slope down
      heightMultiplier = Math.max(0.2, 1 - (distToCenter / maxDist) * 0.85);
    } else if (shapeType === "city") {
      // Metropolis: pseudo-random skyline based on coordinates
      const pseudoNoise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      heightMultiplier = 0.3 + (Math.abs(pseudoNoise) % 1) * 0.9;
    } else if (shapeType === "pyramid") {
      heightMultiplier = Math.max(0.15, (1 - distToCenter / mid) * 1.2);
    }

    const cubeH = maxExtrusion * heightMultiplier;

    let topColor = theme.palette.primaryTop;
    let leftColor = theme.palette.primaryLeft;
    let rightColor = theme.palette.primaryRight;

    if (isFinder) {
      topColor = theme.palette.finderTop;
      leftColor = theme.palette.finderLeft;
      rightColor = theme.palette.finderRight;
    } else if ((x + y) % 3 === 0 && theme.palette.secondaryTop) {
      topColor = theme.palette.secondaryTop;
      leftColor = theme.palette.secondaryLeft || theme.palette.primaryLeft;
      rightColor = theme.palette.secondaryRight || theme.palette.primaryRight;
    }

    drawIsometricCube(
      ctx,
      originX,
      originY,
      x,
      y,
      cubeH,
      unitW,
      unitH,
      topColor,
      leftColor,
      rightColor
    );
  }
}

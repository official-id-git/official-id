import QRCode from "qrcode";

export type SeasonType = "summer" | "spring" | "autumn" | "flower" | "building" | "hero";

export interface VoxelItem {
  x: number;
  y: number; // Y is UP in Three.js
  z: number;
  size?: number;
  color: string;
  role: "trunk" | "branch" | "leaf" | "stone" | "border" | "hedge" | "flower" | "person" | "petal" | "stamen";
  isQrDark?: boolean;
  part?: number;
  u?: number;
  ang?: number;
  phase?: number;
}

export interface SeasonTheme {
  name: string;
  badge: string;
  bgColor: string;
  paperColor: string;
  leafPrimary: string[];
  leafHighlight: string[];
  leafShadow: string[];
  trunkPrimary: string[];
  hedgeColor: string[];
  stonePaver: string[];
  stoneBorder: string;
  qrDark: string[];
  finderOuter: string[];
  finderInner: string[];
  petalFloor: string[];
  particleColors: string[];
  accentColor: string;
}

export interface TreeOptions {
  /**
   * Jika true, voxel paling atas tiap kolom (yang terlihat saat top-down) tidak memakai
   * warna terlalu terang, supaya kontras QR tetap aman saat discan dari atas.
   */
  scanSafeTop?: boolean;
}

export const SEASONS: Record<SeasonType, SeasonTheme> = {
  summer: {
    name: "Summer Green",
    badge: "Summer Green",
    bgColor: "#F6F1E7",
    paperColor: "#EFE8DA",
    leafPrimary: ["#1E7E34", "#28A745", "#218838", "#19692C"],
    leafHighlight: ["#4ADE80", "#22C55E", "#86EFAC", "#16A34A"],
    leafShadow: ["#14532D", "#0F3D21", "#0B2E18", "#166534"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#15803D", "#166534", "#14532D"],
    stonePaver: ["#FFFFFF", "#FAF6EE", "#FDFCFA", "#F5EFE4"],
    stoneBorder: "#E2DDD2",
    qrDark: ["#052E16", "#064E3B", "#0D3812", "#022C22"],
    finderOuter: ["#052E16", "#064E3B", "#14532D"],
    finderInner: ["#052E16", "#022C22", "#064E3B"],
    petalFloor: ["#22C55E", "#4ADE80", "#16A34A"],
    particleColors: ["#22C55E", "#4ADE80", "#16A34A", "#86EFAC"],
    accentColor: "#16A34A",
  },
  spring: {
    name: "Sakura Spring",
    badge: "Sakura Blossom",
    bgColor: "#FAF3F3",
    paperColor: "#F5ECEC",
    leafPrimary: ["#F472B6", "#EC4899", "#F43F5E", "#FB7185"],
    leafHighlight: ["#FFFFFF", "#FFF1F2", "#FCE7F3", "#FBCFE8"],
    // Ungu (#701A75) diganti merah-plum agar tidak muncul garis ungu yang janggal
    leafShadow: ["#BE185D", "#9D174D", "#831843", "#881337"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#DB2777", "#BE185D", "#F472B6"],
    stonePaver: ["#FFFFFF", "#FFF5F7", "#FDF4F6", "#FAF0F2"],
    stoneBorder: "#E8D5DE",
    qrDark: ["#3B0764", "#4A044E", "#500724", "#300638"],
    finderOuter: ["#3B0764", "#4A044E", "#500724"],
    finderInner: ["#3B0764", "#4A044E", "#2E0854"],
    petalFloor: ["#F472B6", "#FBCFE8", "#FFFFFF", "#FCE7F3"],
    particleColors: ["#FFB7C5", "#FFCCD5", "#FCE7F3", "#F472B6", "#FFFFFF"],
    accentColor: "#EC4899",
  },
  autumn: {
    name: "Golden Autumn",
    badge: "Golden Autumn",
    bgColor: "#F7F3EA",
    paperColor: "#EFE6D6",
    leafPrimary: ["#F59E0B", "#D97706", "#EA580C", "#D97706"],
    leafHighlight: ["#FDE68A", "#FCD34D", "#FBBF24", "#FEF08A"],
    // Ungu (#6B21A8) diganti coklat-karat supaya bayangan terasa alami
    leafShadow: ["#B45309", "#92400E", "#78350F", "#7C2D12"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#B45309", "#92400E", "#78350F"],
    stonePaver: ["#FFFFFF", "#FFFBEB", "#FDF8ED", "#FEF3C7"],
    stoneBorder: "#E5DAC6",
    qrDark: ["#271708", "#381207", "#451A03", "#301306"],
    finderOuter: ["#271708", "#381207", "#451A03"],
    finderInner: ["#271708", "#381207", "#1E1106"],
    petalFloor: ["#F59E0B", "#D97706", "#FBBF24", "#EA580C"],
    particleColors: ["#F97316", "#FB923C", "#F59E0B", "#FBBF24", "#EA580C"],
    accentColor: "#D97706",
  },
  flower: {
    name: "Flower Bloom",
    badge: "Flower Bloom",
    bgColor: "#FFF8F8",
    paperColor: "#FDF2F4",
    leafPrimary: ["#D8261D", "#B51913", "#E02F21", "#991B1B"],
    leafHighlight: ["#F8D31F", "#FBE04A", "#FBBF24", "#FEF08A"],
    leafShadow: ["#B51913", "#7F1D1D", "#881337", "#4C0519"],
    trunkPrimary: ["#166534", "#15803D", "#14532D", "#0F3D21"],
    hedgeColor: ["#D8261D", "#B51913", "#991B1B"],
    stonePaver: ["#FFFFFF", "#FFF5F7", "#FDF4F6", "#FFF1F2"],
    stoneBorder: "#E8D0DA",
    qrDark: ["#991B1B", "#7F1D1D", "#881337", "#4C0519"],
    finderOuter: ["#991B1B", "#7F1D1D", "#881337"],
    finderInner: ["#7F1D1D", "#4C0519", "#991B1B"],
    petalFloor: ["#F8D31F", "#FBE04A", "#D8261D", "#E02F21"],
    particleColors: ["#F8D31F", "#FBE04A", "#D8261D", "#E02F21", "#FDA4AF"],
    accentColor: "#D8261D",
  },
  building: {
    name: "Heritage Landmark",
    badge: "Heritage Landmark",
    bgColor: "#EEF0F2",
    paperColor: "#E2E5E8",
    leafPrimary: ["#EFEFEC", "#E2E3E0", "#D5D7D4", "#C6C8C6"],
    leafHighlight: ["#F7F7F5", "#F6F6F4", "#FFFFFF", "#F2C418"],
    leafShadow: ["#8E9193", "#9FA2A5", "#7B4B2A", "#6B3E22"],
    trunkPrimary: ["#C6C8C6", "#B9BBB9", "#D5D7D4", "#8E9193"],
    hedgeColor: ["#CE1126", "#B51913", "#23262B"],
    stonePaver: ["#FFFFFF", "#F6F7F9", "#EDF0F3", "#E2E5E8"],
    stoneBorder: "#CFD3D8",
    qrDark: ["#23262B", "#1C1E23", "#2B2F36", "#15181C"],
    finderOuter: ["#CE1126", "#B51913", "#23262B"],
    finderInner: ["#CE1126", "#23262B", "#B51913"],
    petalFloor: ["#CE1126", "#F6F6F4", "#F2C418"],
    particleColors: ["#CE1126", "#F6F6F4", "#F2C418", "#EFEFEC"],
    accentColor: "#CE1126",
  },
  hero: {
    name: "Mythic Hero",
    badge: "Mythic Hero",
    bgColor: "#F8F6F0",
    paperColor: "#EFEBE1",
    leafPrimary: ["#1D1D22", "#D9A63A", "#B3192A", "#F0C75A"],
    leafHighlight: ["#F0C75A", "#D9A63A", "#FFFFFF", "#F5E0A3"],
    leafShadow: ["#131317", "#0D0D10", "#7A0E1D", "#9C6E1C"],
    trunkPrimary: ["#9C6E1C", "#D9A63A", "#6D4C12", "#52380B"],
    hedgeColor: ["#D9A63A", "#B8860B", "#1D1D22"],
    stonePaver: ["#FFFFFF", "#FAF8F5", "#F7F3EB", "#F4ECE0"],
    stoneBorder: "#D9A63A",
    qrDark: ["#121217", "#1D1D22", "#131317", "#241E14"],
    finderOuter: ["#D9A63A", "#C59328", "#F0C75A"],
    finderInner: ["#121217", "#1D1D22", "#0D0D10"],
    petalFloor: ["#D9A63A", "#F0C75A", "#B3192A", "#FFFFFF"],
    particleColors: ["#D9A63A", "#F0C75A", "#B3192A", "#FFF3E0", "#E8B82A"],
    accentColor: "#D9A63A",
  },
};

// ---------------------------------------------------------------------------
// Utilitas acak deterministik & noise
// ---------------------------------------------------------------------------

function coordHash(x: number, z: number, seed = 42): number {
  let h = (x * 374761393 + z * 668265263 + seed) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function hash3(x: number, y: number, z: number, seed = 0): number {
  let h =
    (Math.imul(x | 0, 374761393) +
      Math.imul(y | 0, 668265263) +
      Math.imul(z | 0, 1103515245) +
      Math.imul(seed | 0, 1442695041)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function pickRandom<T>(arr: T[], hashVal: number): T {
  const idx = Math.floor(hashVal * arr.length) % arr.length;
  return arr[idx];
}

/** Pilih warna dengan sedikit geseran per-rumpun daun, agar tiap gumpalan punya nuansa beda. */
function pickTinted<T>(arr: T[], hashVal: number, tint: number): T {
  const idx = (Math.floor(hashVal * arr.length) + tint) % arr.length;
  return arr[idx];
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function valueNoise3D(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = smooth(x - xi), v = smooth(y - yi), w = smooth(z - zi);
  const n000 = hash3(xi, yi, zi, seed);
  const n100 = hash3(xi + 1, yi, zi, seed);
  const n010 = hash3(xi, yi + 1, zi, seed);
  const n110 = hash3(xi + 1, yi + 1, zi, seed);
  const n001 = hash3(xi, yi, zi + 1, seed);
  const n101 = hash3(xi + 1, yi, zi + 1, seed);
  const n011 = hash3(xi, yi + 1, zi, seed);
  const n111 = hash3(xi + 1, yi + 1, zi, seed);
  const y0 = lerp(lerp(n000, n100, u), lerp(n010, n110, u), v);
  const y1 = lerp(lerp(n001, n101, u), lerp(n011, n111, u), v);
  return lerp(y0, y1, w);
}

function fbm3(x: number, y: number, z: number, seed: number): number {
  return (
    valueNoise3D(x, y, z, seed) * 0.65 +
    valueNoise3D(x * 2.1, y * 2.1, z * 2.1, seed + 1) * 0.35
  );
}

function hexLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ---------------------------------------------------------------------------
// QR helpers
// ---------------------------------------------------------------------------

export function generateQrMatrix(text: string): { matrix: number[][]; size: number } {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
    const size = qr.modules.size;
    const matrix: number[][] = [];
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      for (let c = 0; c < size; c++) {
        row.push(qr.modules.get(r, c) ? 1 : 0);
      }
      matrix.push(row);
    }
    return { matrix, size };
  } catch (err) {
    console.error("QR Generation error, falling back:", err);
    const size = 29;
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));
    return { matrix, size };
  }
}

export function isFinderPattern(r: number, c: number, size: number): boolean {
  const isTL = r < 8 && c < 8;
  const isTR = r < 8 && c >= size - 8;
  const isBL = r >= size - 8 && c < 8;
  return isTL || isTR || isBL;
}

export function getFinderRole(r: number, c: number, size: number): "hedge" | "walkway" | "flower" | null {
  const checkOne = (row: number, col: number) => {
    if (row < 0 || row > 6 || col < 0 || col > 6) return null;
    if (row === 0 || row === 6 || col === 0 || col === 6) return "hedge";
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return "flower";
    return "walkway";
  };

  if (r <= 6 && c <= 6) return checkOne(r, c);
  if (r <= 6 && c >= size - 7) return checkOne(r, c - (size - 7));
  if (r >= size - 7 && c <= 6) return checkOne(r - (size - 7), c);

  return null;
}

// ---------------------------------------------------------------------------
// Bentuk canopy: kumpulan "gumpalan" (lobe) elipsoid + noise 3D
// ---------------------------------------------------------------------------

interface Lobe {
  cx: number;
  cy: number;
  cz: number;
  rx: number;
  ry: number;
  rz: number;
  tint: number;
}

function buildCanopyLobes(size: number, trunkHeight: number, scale: number): { lobes: Lobe[]; baseY: number } {
  const lobes: Lobe[] = [];
  const baseY = trunkHeight + 3 * scale;

  // Gumpalan utama di tengah
  lobes.push({
    cx: 0,
    cy: baseY + 2 * scale,
    cz: 0,
    rx: size * 0.27,
    ry: 5.5 * scale,
    rz: size * 0.27,
    tint: 0,
  });

  // Gumpalan satelit melingkar dengan jarak, tinggi, dan ukuran acak
  const ring = 7;
  for (let i = 0; i < ring; i++) {
    const ang = (i / ring) * Math.PI * 2 + (hash3(i, 1, 1, 71) - 0.5) * 0.6;
    const dist = size * (0.2 + hash3(i, 2, 2, 71) * 0.1);
    const hr = size * (0.13 + hash3(i, 3, 3, 71) * 0.07);
    lobes.push({
      cx: Math.cos(ang) * dist,
      cy: baseY + (hash3(i, 4, 4, 71) - 0.4) * 4 * scale,
      cz: Math.sin(ang) * dist,
      rx: hr,
      ry: hr * 0.7,
      rz: hr,
      tint: i + 1,
    });
  }

  // Gumpalan kecil di puncak, supaya siluet atas tidak rata
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2 + hash3(i, 5, 5, 72) * 1.2;
    const dist = size * 0.1;
    const hr = size * (0.12 + hash3(i, 6, 6, 72) * 0.04);
    lobes.push({
      cx: Math.cos(ang) * dist,
      cy: baseY + 6 * scale + hash3(i, 7, 7, 72) * 1.5,
      cz: Math.sin(ang) * dist,
      rx: hr,
      ry: hr * 0.75,
      rz: hr,
      tint: i + 2,
    });
  }

  return { lobes, baseY };
}

function canopyField(x: number, y: number, z: number, lobes: Lobe[]): { v: number; lobe: number } {
  let best = -Infinity;
  let idx = 0;
  for (let i = 0; i < lobes.length; i++) {
    const l = lobes[i];
    const dx = (x - l.cx) / l.rx;
    const dy = (y - l.cy) / l.ry;
    const dz = (z - l.cz) / l.rz;
    const v = 1 - Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (v > best) {
      best = v;
      idx = i;
    }
  }
  // Noise membuat tepi gumpalan bergerigi organik, bukan bola mulus
  const n = (fbm3(x * 0.3, y * 0.3, z * 0.3, 913) - 0.5) * 0.6;
  return { v: best + n, lobe: idx };
}

const isFinderBoxArea = (r: number, c: number, size: number) =>
  (r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7);

interface CanopyCell {
  c: number;
  r: number;
  y: number;
  x: number;
  z: number;
  lobe: number;
}

const cellKey = (c: number, r: number, y: number) => ((y + 64) * 256 + r) * 256 + c;
const colKey = (c: number, r: number) => r * 256 + c;

// ---------------------------------------------------------------------------
// Generator utama
// ---------------------------------------------------------------------------

/**
 * Pohon voxel di atas QR code.
 *
 * Aturan scannability tetap dijaga: setiap voxel canopy/batang hanya berada di atas
 * modul QR gelap, dan footprint-nya tidak pernah keluar dari sel modul tersebut.
 * Kotak besar (2x2x2) hanya dibuat jika keempat sel di bawahnya semuanya gelap.
 */
export function generateVoxelTree(
  matrix: number[][],
  size: number,
  season: SeasonType = "summer",
  options: TreeOptions = {}
): VoxelItem[] {
  const theme = SEASONS[season];
  const voxels: VoxelItem[] = [];

  const center = (size - 1) / 2;
  const quietZone = 5;
  const scale = size / 29;
  const trunkHeight = Math.round(14 * scale);

  const isDark = (r: number, c: number) =>
    r >= 0 && r < size && c >= 0 && c < size && matrix[r][c] === 1;

  // 1. LANTAI COURTYARD & PERIMETER
  for (let r = -quietZone; r < size + quietZone; r++) {
    for (let c = -quietZone; c < size + quietZone; c++) {
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 101);

      const isInsideQr = r >= 0 && r < size && c >= 0 && c < size;
      const isPerimeter =
        r === -quietZone ||
        r === size + quietZone - 1 ||
        c === -quietZone ||
        c === size + quietZone - 1;

      voxels.push({
        x,
        y: 0,
        z,
        size: 1.0,
        color: isPerimeter ? theme.stoneBorder : pickRandom(theme.stonePaver, h),
        role: isPerimeter ? "border" : "stone",
        isQrDark: false,
      });

      if (isPerimeter) {
        voxels.push({ x, y: 0.35, z, size: 1.0, color: theme.stoneBorder, role: "border" });
      }

      if (isInsideQr && matrix[r][c] === 1) {
        const floorDarkColor = isFinderPattern(r, c, size)
          ? theme.finderOuter[0]
          : pickRandom(theme.qrDark, h);
        voxels.push({ x, y: 0.04, z, size: 1.0, color: floorDarkColor, role: "leaf", isQrDark: true });
      }
    }
  }

  // 2. FINDER PATTERN (monumen taman)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && isFinderPattern(r, c, size)) {
        const x = c - center;
        const z = r - center;
        const finderRole = getFinderRole(r, c, size);
        const h = coordHash(x, z, 55);

        if (finderRole === "hedge") {
          voxels.push({ x, y: 0.45, z, size: 1.0, color: pickRandom(theme.finderOuter, h), role: "hedge", isQrDark: true });
        } else if (finderRole === "flower") {
          voxels.push({ x, y: 0.45, z, size: 1.0, color: theme.finderOuter[0], role: "flower", isQrDark: true });
          voxels.push({ x, y: 0.85, z, size: 1.0, color: pickRandom(theme.finderInner, h), role: "flower", isQrDark: true });
        }
      }
    }
  }

  // 3. BATANG (dengan akar melebar & bagian atas mengecil masuk ke canopy)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 1 || isFinderPattern(r, c, size)) continue;
      const x = c - center;
      const z = r - center;
      const distSq = x * x + z * z;

      // Akar (area depan dikosongkan untuk orang yang bersandar)
      if (distSq <= 3.6 && !(z > 0.8 && Math.abs(x) < 1.2)) {
        for (let ty = 1; ty <= 2; ty++) {
          voxels.push({
            x, y: ty, z, size: 0.96,
            color: pickRandom(theme.trunkPrimary, coordHash(x, z, ty * 19)),
            role: "trunk", isQrDark: true,
          });
        }
      }

      // Batang utama, makin ke atas makin ramping
      for (let ty = 1; ty < trunkHeight + 3; ty++) {
        const maxR2 = ty < trunkHeight - 3 ? 2.2 : 1.2;
        if (distSq > maxR2) continue;
        const s = ty < trunkHeight - 3 ? 0.96 : 0.84;
        voxels.push({
          x, y: ty, z, size: s,
          color: pickRandom(theme.trunkPrimary, coordHash(x, z, ty * 17)),
          role: "trunk", isQrDark: true,
        });
      }
    }
  }

  // 4. CANOPY ORGANIK
  const { lobes, baseY } = buildCanopyLobes(size, trunkHeight, scale);
  const yMin = Math.floor(trunkHeight - 3);
  const yMax = Math.ceil(baseY + 12 * scale);

  const occ = new Map<number, CanopyCell>();
  const colTop = new Map<number, number>();
  const colBottom = new Map<number, number>();

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 1 || isFinderBoxArea(r, c, size)) continue;
      const x = c - center;
      const z = r - center;
      for (let y = yMin; y <= yMax; y++) {
        const f = canopyField(x, y, z, lobes);
        if (f.v <= 0) continue;
        occ.set(cellKey(c, r, y), { c, r, y, x, z, lobe: f.lobe });
        const k = colKey(c, r);
        colTop.set(k, Math.max(colTop.get(k) ?? -Infinity, y));
        colBottom.set(k, Math.min(colBottom.get(k) ?? Infinity, y));
      }
    }
  }

  const has = (c: number, r: number, y: number) => occ.has(cellKey(c, r, y));
  const isSurface = (cell: CanopyCell) =>
    !has(cell.c + 1, cell.r, cell.y) || !has(cell.c - 1, cell.r, cell.y) ||
    !has(cell.c, cell.r + 1, cell.y) || !has(cell.c, cell.r - 1, cell.y) ||
    !has(cell.c, cell.r, cell.y + 1) || !has(cell.c, cell.r, cell.y - 1);

  // Arah cahaya (dari kiri-atas-depan)
  const Lx = -0.45, Ly = 0.8, Lz = 0.4;
  const Ll = Math.hypot(Lx, Ly, Lz);

  const colorFor = (cell: CanopyCell, sampleY = cell.y): string => {
    const l = lobes[cell.lobe];
    let nx = (cell.x - l.cx) / l.rx;
    let ny = (sampleY - l.cy) / l.ry;
    let nz = (cell.z - l.cz) / l.rz;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl; ny /= nl; nz /= nl;

    const lambert = Math.max(0, (nx * Lx + ny * Ly + nz * Lz) / Ll);
    const top = colTop.get(colKey(cell.c, cell.r)) ?? sampleY;
    const depth = top - sampleY;
    const ao = Math.max(0.25, 1 - depth * 0.09); // makin dalam makin gelap
    const dither = (hash3(cell.c, sampleY, cell.r, 17) - 0.5) * 0.22; // pecah pola garis

    const t = (0.55 * lambert + 0.45 * ((ny + 1) / 2)) * ao + dither;
    const h = hash3(cell.c, sampleY, cell.r, 29);
    const isTop = sampleY === top;

    let color: string;
    if (t > 0.6) color = pickTinted(theme.leafHighlight, h, l.tint);
    else if (t > 0.3) color = pickTinted(theme.leafPrimary, h, l.tint);
    else color = pickTinted(theme.leafShadow, h, l.tint);

    if (options.scanSafeTop && isTop && hexLuminance(color) > 0.55) {
      color = pickTinted(theme.leafPrimary, h, l.tint);
      if (hexLuminance(color) > 0.55) color = pickTinted(theme.leafShadow, h, l.tint);
    }
    return color;
  };

  // 4a. Emit voxel: campuran kotak besar (2x2x2), normal, dan kecil
  const consumed = new Set<number>();
  for (let y = yMin; y <= yMax; y++) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = cellKey(c, r, y);
        const cell = occ.get(key);
        if (!cell || consumed.has(key)) continue;

        // Coba gabung jadi kotak besar 2x2x2 (hanya jika 8 sel terisi = 4 modul gelap)
        if (hash3(c, y, r, 404) < 0.55) {
          const block: number[] = [];
          let ok = true;
          for (let dy = 0; dy <= 1 && ok; dy++) {
            for (let dr = 0; dr <= 1 && ok; dr++) {
              for (let dc = 0; dc <= 1 && ok; dc++) {
                const k = cellKey(c + dc, r + dr, y + dy);
                if (!occ.has(k) || consumed.has(k)) ok = false;
                else block.push(k);
              }
            }
          }
          if (ok) {
            block.forEach((k) => consumed.add(k));
            const upper = occ.get(cellKey(c, r, y + 1))!;
            voxels.push({
              x: cell.x + 0.5,
              y: y + 0.5,
              z: cell.z + 0.5,
              size: 1.9,
              color: colorFor(upper),
              role: "leaf",
              isQrDark: true,
            });
            continue;
          }
        }

        consumed.add(key);
        const surface = isSurface(cell);
        const isTop = y === colTop.get(colKey(c, r));

        // Lubang kecil di sisi canopy agar cahaya "tembus" (puncak kolom tidak pernah dibolongi)
        if (surface && !isTop && hash3(c, y, r, 611) > 0.93) continue;

        const hs = hash3(c, y, r, 505);
        const s = surface ? (hs < 0.5 ? 0.96 : hs < 0.8 ? 0.82 : 0.68) : 0.96;
        const jitter = (0.96 - s) / 2; // tetap di dalam sel modul
        voxels.push({
          x: cell.x + (hash3(c, y, r, 506) - 0.5) * 2 * jitter,
          y: y + (hash3(c, y, r, 507) - 0.5) * 2 * jitter,
          z: cell.z + (hash3(c, y, r, 508) - 0.5) * 2 * jitter,
          size: s,
          color: colorFor(cell),
          role: "leaf",
          isQrDark: true,
        });

        // Taburan daun mungil di permukaan atas
        if (isTop && hash3(c, y, r, 709) > 0.55) {
          const l = lobes[cell.lobe];
          let sprinkle = pickTinted(theme.leafHighlight, hash3(c, y, r, 710), l.tint);
          if (options.scanSafeTop && hexLuminance(sprinkle) > 0.55) {
            sprinkle = pickTinted(theme.leafPrimary, hash3(c, y, r, 710), l.tint);
          }
          voxels.push({
            x: cell.x + (hash3(c, y, r, 711) - 0.5) * 0.4,
            y: y + 0.62,
            z: cell.z + (hash3(c, y, r, 712) - 0.5) * 0.4,
            size: 0.44,
            color: sprinkle,
            role: "leaf",
            isQrDark: true,
          });
        }
      }
    }
  }

  // 4b. Juntaian daun di tepi bawah canopy (panjang & ukuran bervariasi, mengecil ke ujung)
  const canopyReach = size * 0.46;
  colBottom.forEach((bottom, k) => {
    const c = k % 256;
    const r = Math.floor(k / 256);
    const cell = occ.get(cellKey(c, r, bottom));
    if (!cell) return;
    const distNorm = Math.hypot(cell.x, cell.z) / canopyReach;
    if (distNorm < 0.35) return; // area atas orang & batang tetap lega
    if (hash3(c, bottom, r, 777) < 0.5) return;

    const len = 1 + Math.floor(hash3(c, bottom, r, 778) * 3);
    for (let i = 1; i <= len; i++) {
      const s = Math.max(0.42, 0.82 - i * 0.14);
      const jitter = (0.96 - s) / 2;
      voxels.push({
        x: cell.x + (hash3(c, i, r, 779) - 0.5) * 2 * jitter,
        y: bottom - i,
        z: cell.z + (hash3(c, i, r, 780) - 0.5) * 2 * jitter,
        size: s,
        color: i === len
          ? pickRandom(theme.leafPrimary, hash3(c, i, r, 781))
          : pickRandom(theme.leafShadow, hash3(c, i, r, 782)),
        role: "leaf",
        isQrDark: true,
      });
    }
  });

  // 4c. Cabang dari batang menuju tiap gumpalan (hanya di sel gelap)
  const branchSeen = new Set<number>();
  for (let i = 1; i < lobes.length; i++) {
    const l = lobes[i];
    const x0 = 0, y0 = trunkHeight - 4, z0 = 0;
    const x1 = l.cx * 0.75, y1 = l.cy - l.ry * 0.3, z1 = l.cz * 0.75;
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
    const steps = Math.ceil(len * 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = lerp(x0, x1, t);
      const py = lerp(y0, y1, t);
      const pz = lerp(z0, z1, t);
      const c = Math.round(px + center);
      const r = Math.round(pz + center);
      const y = Math.round(py);
      if (!isDark(r, c) || isFinderBoxArea(r, c, size)) continue;
      const k = cellKey(c, r, y);
      if (branchSeen.has(k) || occ.has(k)) continue;
      branchSeen.add(k);
      voxels.push({
        x: c - center,
        y,
        z: r - center,
        size: lerp(0.9, 0.6, t),
        color: pickRandom(theme.trunkPrimary, hash3(c, y, r, 23)),
        role: "branch",
        isQrDark: true,
      });
    }
  }

  // 5. ORANG DUDUK BERSANDAR DI BATANG
  voxels.push(...generateSittingPersonVoxels());

  return voxels;
}

// ---------------------------------------------------------------------------
// FLOWER VOXEL GENERATOR – menampilkan bunga bukan pohon
// ---------------------------------------------------------------------------

/**
 * Bunga voxel di atas QR code.
 * Alih-alih pohon, menghasilkan:
 * 1. Batang pendek hijau di tengah
 * 2. Kelopak mawar berlapis-lapis memancar ke segala arah
 * 3. Putik emas (stamen) di puncak tengah
 * 4. Daun kecil di sepanjang batang
 * 5. Kelopak-kelopak jatuh di lantai
 *
 * Scannability: voxel hanya diletakkan di atas modul QR gelap.
 */
export function generateVoxelFlower(
  matrix: number[][],
  size: number,
  season: SeasonType = "flower",
  _options: TreeOptions = {}
): VoxelItem[] {
  const theme = SEASONS[season];
  const voxels: VoxelItem[] = [];

  const center = (size - 1) / 2;
  const quietZone = 5;

  // 1. LANTAI COURTYARD & PERIMETER
  for (let r = -quietZone; r < size + quietZone; r++) {
    for (let c = -quietZone; c < size + quietZone; c++) {
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 101);

      const isInsideQr = r >= 0 && r < size && c >= 0 && c < size;
      const isPerimeter =
        r === -quietZone ||
        r === size + quietZone - 1 ||
        c === -quietZone ||
        c === size + quietZone - 1;

      voxels.push({
        x,
        y: 0,
        z,
        size: 1.0,
        color: isPerimeter ? theme.stoneBorder : pickRandom(theme.stonePaver, h),
        role: isPerimeter ? "border" : "stone",
        isQrDark: false,
        part: -99,
        u: 0,
        ang: 0,
        phase: 0,
      });

      if (isPerimeter) {
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 1.0,
          color: theme.stoneBorder,
          role: "border",
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }

      if (isInsideQr && matrix[r][c] === 1) {
        const floorDarkColor = isFinderPattern(r, c, size)
          ? theme.finderOuter[0]
          : pickRandom(theme.qrDark, h);
        voxels.push({
          x,
          y: 0.04,
          z,
          size: 1.0,
          color: floorDarkColor,
          role: "leaf",
          isQrDark: true,
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }
    }
  }

  // 2. FINDER PATTERN (monumen taman QR)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && isFinderPattern(r, c, size)) {
        const x = c - center;
        const z = r - center;
        const finderRole = getFinderRole(r, c, size);
        const h = coordHash(x, z, 55);

        if (finderRole === "hedge") {
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 1.0,
            color: pickRandom(theme.finderOuter, h),
            role: "hedge",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        } else if (finderRole === "flower") {
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 1.0,
            color: theme.finderOuter[0],
            role: "flower",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
          voxels.push({
            x,
            y: 0.85,
            z,
            size: 1.0,
            color: pickRandom(theme.finderInner, h),
            role: "flower",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        }
      }
    }
  }

  // 3. BATANG HIJAU BUNGA (menopang bunga dari tengah courtyard)
  const stemBaseY = 1;
  const flowerCenterY = 11.5;

  for (let y = stemBaseY; y <= flowerCenterY - 1; y++) {
    const t = (y - stemBaseY) / (flowerCenterY - stemBaseY);
    const sx = Math.sin(t * Math.PI * 0.5) * -1.0;
    const sz = Math.sin(t * Math.PI * 0.5) * -1.0;
    voxels.push({ x: sx, y, z: sz, size: 0.95, color: "#166534", role: "trunk", isQrDark: false, part: -99, u: 0, ang: 0, phase: 0 });
    voxels.push({ x: sx + 0.6, y, z: sz, size: 0.85, color: "#15803D", role: "trunk", isQrDark: false, part: -99, u: 0, ang: 0, phase: 0 });
    voxels.push({ x: sx, y, z: sz + 0.6, size: 0.85, color: "#14532D", role: "trunk", isQrDark: false, part: -99, u: 0, ang: 0, phase: 0 });
  }

  // Daun hijau penopang di bawah mahkota bunga
  const leaves = [
    { lx: 2.2, ly: 5.5, lz: -1.5 },
    { lx: 2.8, ly: 5.8, lz: -2.0 },
    { lx: -2.2, ly: 6.8, lz: 1.8 },
    { lx: -2.9, ly: 7.1, lz: 2.3 },
    { lx: -1.5, ly: 8.5, lz: -2.2 },
    { lx: -2.0, ly: 8.8, lz: -2.8 },
  ];
  for (const l of leaves) {
    voxels.push({ x: l.lx, y: l.ly, z: l.lz, size: 0.9, color: "#22C55E", role: "leaf", isQrDark: false, part: -99, u: 0, ang: 0, phase: 0 });
  }

  // 4. BUNGA VOXEL PATRAKOMALA 3D (Authentic Bandung Emblem Algorithm)
  // Basis ortonormal menghadap ke arah kamera isometrik (50, 42, 50) dengan sudut pandang prima
  const fU = { x: 0.7071068, y: 0.0, z: -0.7071068 };
  const fN = { x: 0.4472136, y: 0.7745967, z: 0.4472136 };
  const fV = {
    x: fN.y * fU.z - fN.z * fU.y,
    y: fN.z * fU.x - fN.x * fU.z,
    z: fN.x * fU.y - fN.y * fU.x,
  }; // (-0.5477226, 0.6324555, -0.5477226)
  const fCenter = { x: 0, y: flowerCenterY, z: 0 };

  // Palet Warna Khas Patrakomala
  const COL = {
    red: "#D8261D",      // Patrakomala scarlet red
    redDk: "#B51913",    // Deep carmine red underside
    tongue: "#E02F21",   // Central crimson flame
    yellow: "#F8D31F",   // Vibrant golden yellow
    yellowLt: "#FBE04A", // Sunny stamen highlight
  };

  const localVox = new Map<string, { lx: number; ly: number; lz: number; color: string; part: number; u: number; ang: number; phase: number; role: "petal" | "stamen" }>();
  function putLocal(lx: number, ly: number, lz: number, color: string, part: number, u: number, ang: number, phase: number, role: "petal" | "stamen" = "petal") {
    const k = `${lx},${ly},${lz}`;
    if (localVox.has(k)) return;
    localVox.set(k, { lx, ly, lz, color, part, u, ang, phase, role });
  }

  // 5 Kelopak Patrakomala Kincir (Pinwheel Petals)
  const PETALS = 5, R0 = 1.6, LEN = 13.8, WMAX = 5.4;

  for (let i = 0; i < PETALS; i++) {
    const th = (i * Math.PI * 2) / PETALS + Math.PI / 2;
    const cs = Math.cos(th), sn = Math.sin(th);
    const phase = i * 1.37;

    for (let x = -17; x <= 17; x++) {
      for (let z = -17; z <= 17; z++) {
        const s = x * cs + z * sn;  // jarak sepanjang kelopak
        const v = -x * sn + z * cs; // posisi melintang kelopak
        if (s < R0 - 0.5 || s > R0 + LEN) continue;

        const t = Math.min(Math.max((s - R0) / LEN, 0), 1);
        const c = 2.8 * t * t; // kelopak melengkung (efek kincir pinwheel)
        const ruffle = 1 + 0.09 * Math.sin(t * 19 + i * 1.7 + (v > c ? 0 : 2.3)) + 0.05 * Math.sin(t * 41 + i);
        const w = WMAX * Math.pow(Math.sin(Math.PI * t), 0.55) * ruffle + 0.35;
        const dv = v - c;
        if (Math.abs(dv) > w) continue;

        const d = Math.abs(dv) / w;
        const edge = w - Math.abs(dv);
        // yb: kelopak melengkung ke atas (dish bowl) + miring agar saling menumpuk
        const yb = Math.round(3.8 * t * t + 0.12 * dv + 0.5);
        const thick = 1 + Math.round(1.3 * (1 - d * d) * (1 - 0.35 * t));
        const u = t;

        // Lidah merah khas Patrakomala dari pusat
        const tt = t / 0.62;
        let tongue = false;
        if (tt < 1) {
          const tw = (1.8 * Math.pow(1 - tt, 0.7) + 0.45) * (1 + 0.28 * Math.sin(tt * 13 + i));
          tongue = Math.abs(v - (c * 0.55 - 0.3)) < tw && edge > 1.0;
        }

        putLocal(x, yb, z, COL.redDk, i, u, th, phase, "petal"); // Lapisan dasar merah tua
        if (edge <= 0.85) {
          putLocal(x, yb + 1, z, COL.red, i, u, th, phase, "petal"); // Bingkai merah timbul
        } else {
          for (let l = 1; l <= thick; l++) {
            putLocal(x, yb + l, z, l === thick ? COL.yellowLt : COL.yellow, i, u, th, phase, "petal");
          }
          if (tongue) {
            putLocal(x, yb + thick + 1, z, COL.tongue, i, u, th, phase, "petal");
          }
        }
      }
    }
  }

  // Inti bunga Patrakomala (Core Sphere)
  for (let x = -3; x <= 3; x++) {
    for (let y = 1; y <= 3; y++) {
      for (let z = -3; z <= 3; z++) {
        if (Math.hypot(x, (y - 1) * 1.1, z) <= 2.9) {
          putLocal(x, y, z, COL.red, -1, 0, 0, 0, "petal");
        }
      }
    }
  }

  // Putik / benang sari anggun Patrakomala (4 Arching Stamens with Golden Anther Pollen Tips)
  const BETA = -0.35;
  const STAMENS = [
    { a: BETA - 0.38, len: 14.5, h: 4.5, side: 1.3 },
    { a: BETA - 0.12, len: 17.0, h: 6.5, side: -0.8 },
    { a: BETA + 0.14, len: 15.5, h: 3.5, side: 1.0 },
    { a: BETA + 0.40, len: 13.0, h: 5.5, side: -1.3 },
  ];

  STAMENS.forEach((st, j) => {
    const dx = Math.cos(st.a), dz = Math.sin(st.a);
    const px = -dz, pz = dx;
    const path = (u: number) => {
      const r = st.len * u, side = st.side * Math.sin(Math.PI * u);
      return [dx * r + px * side, 2.0 + st.h * Math.sin(Math.PI * u * 0.62), dz * r + pz * side];
    };
    const phase = j * 1.3 + 0.4;

    for (let u = 0; u <= 1; u += 0.016) {
      const [cx, cy, cz] = path(u);
      const rad = 0.85 - 0.25 * u;
      for (let x = Math.floor(cx - 1); x <= Math.ceil(cx + 1); x++) {
        for (let y = Math.floor(cy - 1); y <= Math.ceil(cy + 1); y++) {
          for (let z = Math.floor(cz - 1); z <= Math.ceil(cz + 1); z++) {
            if (Math.hypot(x - cx, y - cy, z - cz) <= rad) {
              putLocal(x, y, z, COL.red, 10 + j, u, st.a, phase, "stamen");
            }
          }
        }
      }
    }

    // Ujung kepala sari (anther) emas
    const [tx, ty, tz] = path(1);
    for (let x = Math.floor(tx - 2); x <= Math.ceil(tx + 2); x++) {
      for (let y = Math.floor(ty - 2); y <= Math.ceil(ty + 2); y++) {
        for (let z = Math.floor(tz - 2); z <= Math.ceil(tz + 2); z++) {
          if (Math.hypot(x - tx, y - ty, z - tz) <= 1.4) {
            const col = (y - ty) >= 0.3 ? COL.yellowLt : COL.yellow;
            putLocal(x, y, z, col, 10 + j, 1.0, st.a, phase, "stamen");
          }
        }
      }
    }
  });

  // Transformasi semua voxel bunga lokal ke ruang dunia diorama official.id
  for (const item of localVox.values()) {
    const wx = +(fCenter.x + item.lx * fU.x + item.ly * fN.x + item.lz * fV.x).toFixed(2);
    const wy = +(fCenter.y + item.lx * fU.y + item.ly * fN.y + item.lz * fV.y).toFixed(2);
    const wz = +(fCenter.z + item.lx * fU.z + item.ly * fN.z + item.lz * fV.z).toFixed(2);

    voxels.push({
      x: wx,
      y: wy,
      z: wz,
      size: 0.96,
      color: item.color,
      role: item.role,
      isQrDark: false,
      part: item.part,
      u: item.u,
      ang: item.ang,
      phase: item.phase,
    });
  }

  // 5. KELOPAK JATUH DI LANTAI (scattered fallen petals on courtyard floor)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 1 || isFinderPattern(r, c, size)) continue;
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 999);

      if (h > 0.88) {
        voxels.push({
          x,
          y: 0.15,
          z,
          size: 0.45 + h * 0.2,
          color: pickRandom(theme.petalFloor, h),
          role: "petal",
          isQrDark: false,
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }
    }
  }

  return voxels;
}

interface RawBuildingVoxel {
  x: number;
  y: number;
  z: number;
  color: string;
  part: number; // 0 = static, 1 = flag
  u: number;
  ph: number;
}

let cachedGedungVoxels: RawBuildingVoxel[] | null = null;

function buildGedungVoxelsRaw(): RawBuildingVoxel[] {
  if (cachedGedungVoxels) return cachedGedungVoxels;

  const C = {
    wall: "#EFEFEC", wallSh: "#E2E3E0", roof: "#F7F7F5", plinth: "#C6C8C6", step: "#B9BBB9",
    trim: "#D5D7D4", dentil: "#8E9193", frame: "#7B4B2A", glass: "#3B2A1F", door: "#6B3E22", doorLine: "#4A2914",
    rosette: "#9FA2A5", pole: "#E9EAEA", knob: "#D9B23A",
    red: "#CE1126", white: "#F6F6F4",
    crestY: "#F2C418", crestB: "#1F5FA8", crestW: "#F3F3F3", crestG: "#2F8A3C",
  };

  const cells = new Map<string, RawBuildingVoxel>();
  const K = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const set = (x: number, y: number, z: number, color: string, part = 0, u = 0, ph = 0) => {
    cells.set(K(x, y, z), { x, y, z, color, part, u, ph });
  };
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string) => {
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        for (let z = z0; z <= z1; z++) {
          set(x, y, z, color);
        }
      }
    }
  };
  const cyl = (cx: number, cz: number, r: number, y0: number, y1: number, color: string) => {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
        if (Math.hypot(x - cx, z - cz) <= r) {
          for (let y = y0; y <= y1; y++) set(x, y, z, color);
        }
      }
    }
  };
  const paint = (x: number, y: number, z: number, color: string) => {
    const v = cells.get(K(x, y, z));
    if (v) v.color = color;
  };
  const del = (x: number, y: number, z: number) => cells.delete(K(x, y, z));
  const both = (fn: (s: number) => void) => { fn(1); fn(-1); };

  function opening(face: string, plane: number, a0: number, a1: number, y0: number, y1: number, kind = "win") {
    const ax = face[0], sg = face[1] === "+" ? 1 : -1;
    for (let a = a0; a <= a1; a++) {
      for (let y = y0; y <= y1; y++) {
        const at = (d: number): [number, number, number] =>
          ax === "z" ? [a, y, plane - d * sg] : [plane - d * sg, y, a];
        del(...at(0));
        const border = a === a0 || a === a1 || y === y0 || y === y1;
        let c: string;
        if (kind === "win") {
          const mull = (a - a0) % 3 === 0 || y === Math.round((y0 + y1) / 2);
          c = border || mull ? C.frame : C.glass;
        } else {
          c = border ? C.doorLine : ((a - a0) % 2 === 0 ? C.doorLine : C.door);
        }
        paint(...at(1), c);
      }
    }
  }

  // 1. Sayap luar (kiri & kanan)
  both((s) => {
    const xa = s > 0 ? 41 : -57, xb = s > 0 ? 57 : -41;
    box(xa - 1, xb + 1, 0, 1, -23, 15, C.plinth);
    box(xa, xb, 2, 9, -22, 14, C.wall);
    box(xa - 1, xb + 1, 10, 10, -23, 15, C.roof);
    box(xa, xb, 11, 11, -22, 14, C.trim);
    const xo = s > 0 ? xb + 1 : xa - 1;
    box(xo, xo, 8, 8, -21, 13, C.roof);
  });

  // 2. Blok penghubung + selasar beratap
  both((s) => {
    const xa = s > 0 ? 25 : -40, xb = s > 0 ? 40 : -25;
    box(xa, xb, 0, 1, -18, 11, C.plinth);
    box(xa, xb, 2, 8, -18, 10, C.wall);
    box(xa - 1, xb + 1, 9, 9, -19, 19, C.roof);
    box(xa, xb, 7, 8, 18, 19, C.wall);
    for (let x = xa; x <= xb; x++) if (x % 2 === 0) paint(x, 7, 19, C.dentil);
    box(xa, xb, 0, 0, 11, 19, C.plinth);
    const cols = s > 0 ? [26, 31, 36, 39] : [-27, -32, -37, -40];
    cols.forEach((cx) => box(cx, cx + 1, 1, 6, 17, 18, C.wall));
    const ox = s > 0 ? 26 : -29;
    box(ox, ox + 3, 10, 10, 15, 18, C.wall);
    box(ox + 1, ox + 2, 11, 12, 16, 18, C.wall);
  });

  // 3. Blok utama (2 lantai) dengan tembok bergerigi
  box(-25, 25, 0, 1, -27, 11, C.plinth);
  box(-24, 24, 2, 14, -26, 10, C.wall);
  for (let x = -24; x <= 24; x++) {
    for (let z = -26; z <= 10; z++) {
      const edge = x === -24 || x === 24 || z === -26 || z === 10;
      if (edge) {
        set(x, 15, z, C.wall);
        if ((x + z) % 2 === 0) set(x, 16, z, C.wall);
      }
    }
  }

  // 4. Blok puncak (lantai 3)
  box(-11, 11, 15, 21, -16, 2, C.wall);
  box(-13, 13, 22, 22, -18, 4, C.roof);
  box(-12, 12, 23, 23, -17, 3, C.trim);

  // 5. Portiko pintu masuk
  box(-12, 12, 0, 2, 11, 19, C.plinth);
  box(-9, 9, 0, 1, 20, 21, C.step);
  box(-10, 10, 0, 0, 22, 23, C.step);
  box(-9, 9, 3, 11, 11, 12, C.wall);
  box(-4, -3, 3, 11, 13, 13, C.wallSh);
  box(3, 4, 3, 11, 13, 13, C.wallSh);
  cyl(-10.5, 17, 2.3, 3, 11, C.wall);
  cyl(10.5, 17, 2.3, 3, 11, C.wall);
  box(-13, 13, 12, 12, 11, 20, C.roof);
  box(-12, 12, 13, 13, 11, 19, C.trim);
  box(-9, 9, 14, 17, 11, 13, C.wall);
  box(-4, -3, 14, 17, 14, 14, C.wallSh);
  box(3, 4, 14, 17, 14, 14, C.wallSh);
  box(-11, 11, 18, 18, 11, 15, C.roof);

  // 6. Dua menara + tiang bendera
  const towers: { px: number; pz: number }[] = [];
  both((s) => {
    const xa = s > 0 ? 17 : -24, xb = s > 0 ? 24 : -17;
    box(xa - 1, xb + 1, 0, 1, 3, 13, C.plinth);
    box(xa, xb, 2, 20, 4, 12, C.wall);
    box(xa - 1, xb + 1, 21, 21, 3, 13, C.roof);
    for (let x = xa - 1; x <= xb + 1; x++) {
      for (let z = 3; z <= 13; z++) {
        const edge = x === xa - 1 || x === xb + 1 || z === 3 || z === 13;
        if (edge && (x + z) % 2 === 0) {
          set(x, 22, z, C.wall);
          set(x, 23, z, C.wall);
        }
      }
    }
    box(xa - 2, xb + 2, 24, 24, 2, 14, C.roof);
    box(xa + 2, xb - 2, 25, 25, 6, 10, C.trim);
    const rx = (xa + xb) / 2, ry = 16;
    for (let x = xa; x <= xb; x++) {
      for (let y = ry - 3; y <= ry + 3; y++) {
        const d = Math.hypot(x - rx, y - ry);
        if (d <= 3.1) paint(x, y, 12, d > 2.3 ? C.rosette : ((x + y) % 2 === 0 ? C.rosette : C.wall));
      }
    }
    const px = s > 0 ? 20 : -21, pz = 8;
    towers.push({ px, pz });
  });

  // 7. Lambang perisai di parapet
  const crest: [number, number, number, string][] = [
    [6, 11, 21, C.crestY], [6, 11, 20, C.crestY],
    [6, 11, 19, "wave1"], [6, 11, 18, "wave2"], [6, 11, 17, "wave1"],
    [6, 11, 16, C.crestG], [7, 10, 15, C.crestG], [8, 9, 14, C.crestG],
  ];
  crest.forEach(([a, b, y, c]) => {
    for (let x = a; x <= b; x++) {
      const col = c === "wave1" ? (x % 2 ? C.crestB : C.crestW) : c === "wave2" ? (x % 2 ? C.crestW : C.crestB) : c;
      set(x, y + 5, 15, col);
    }
  });

  // 8. Jendela & pintu
  both((s) => {
    const xa = s > 0 ? 41 : -57, xb = s > 0 ? 57 : -41;
    opening("z+", 14, xa + 3, xb - 3, 3, 7);
    opening("z-", -22, xa + 3, xb - 3, 3, 7);
    const xo = s > 0 ? xb : xa;
    for (let z = -19; z <= 9; z += 7) opening(s > 0 ? "x+" : "x-", xo, z, z + 3, 3, 6);
    const ca = s > 0 ? 25 : -40;
    opening("z+", 10, ca + 2, ca + 5, 3, 6);
    opening("z+", 10, ca + 8, ca + 9, 2, 6, "door");
    opening("z+", 10, ca + 12, ca + 14, 3, 6);
    const ma = s > 0 ? 12 : -16;
    opening("z+", 10, ma, ma + 4, 3, 7);
    opening("z+", 10, ma, ma + 4, 9, 12);
    const ta = s > 0 ? 19 : -22;
    opening("z+", 12, ta, ta + 3, 4, 7);
    for (let z = -22; z <= 4; z += 6) opening(s > 0 ? "x+" : "x-", s > 0 ? 24 : -24, z, z + 3, 11, 13);
    opening("z+", 2, s > 0 ? 4 : -7, s > 0 ? 7 : -4, 16, 19);
    for (let z = -13; z <= -1; z += 6) opening(s > 0 ? "x+" : "x-", s > 0 ? 11 : -11, z, z + 2, 17, 19);
  });
  for (let x = -24; x <= 20; x += 8) { opening("z-", -26, x, x + 3, 3, 7); opening("z-", -26, x, x + 3, 9, 12); }
  [[-7, -5], [-1, 1], [5, 7]].forEach(([a, b]) => {
    opening("z+", 12, a, b, 3, 10, "door");
    opening("z+", 13, a, b, 14, 16);
  });
  for (let x = -9; x <= 9; x += 3) paint(x, 20, 2, C.dentil);

  // 9. Tiang & bendera
  const FLAG_L = 13, FLAG_H = 8, POLE_TOP = 54;
  towers.forEach(({ px, pz }, i) => {
    for (let y = 25; y <= POLE_TOP; y++) set(px, y, pz, C.pole);
    set(px, POLE_TOP + 1, pz, C.knob);
    const ph = i * 1.9;
    for (let a = 1; a <= FLAG_L; a++) {
      for (let h = 0; h < FLAG_H; h++) {
        const y = POLE_TOP - h;
        set(px + a, y, pz, h < FLAG_H / 2 ? C.red : C.white, 1, a / FLAG_L, ph);
      }
    }
  });

  // 10. Buang voxel dalam yang tak terlihat (culling)
  const out: RawBuildingVoxel[] = [];
  const nb = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (const v of cells.values()) {
    if (v.part === 1 || nb.some(([dx, dy, dz]) => !cells.has(K(v.x + dx, v.y + dy, v.z + dz)))) {
      out.push(v);
    }
  }

  cachedGedungVoxels = out;
  return out;
}

export function generateVoxelBuilding(
  matrix: number[][],
  size: number,
  season: SeasonType = "building",
  options?: TreeOptions
): VoxelItem[] {
  const theme = SEASONS[season] ?? SEASONS.building;
  const voxels: VoxelItem[] = [];
  const center = (size - 1) / 2;
  const quietZone = 5;

  // 1. LANTAI COURTYARD & PERIMETER (Identik persis dengan varian pohon & bunga)
  for (let r = -quietZone; r < size + quietZone; r++) {
    for (let c = -quietZone; c < size + quietZone; c++) {
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 101);

      const isInsideQr = r >= 0 && r < size && c >= 0 && c < size;
      const isPerimeter =
        r === -quietZone ||
        r === size + quietZone - 1 ||
        c === -quietZone ||
        c === size + quietZone - 1;

      voxels.push({
        x,
        y: 0,
        z,
        size: 1.0,
        color: isPerimeter ? theme.stoneBorder : pickRandom(theme.stonePaver, h),
        role: isPerimeter ? "border" : "stone",
        isQrDark: false,
        part: -99,
        u: 0,
        ang: 0,
        phase: 0,
      });

      if (isPerimeter) {
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 1.0,
          color: theme.stoneBorder,
          role: "border",
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }

      if (isInsideQr && matrix[r][c] === 1) {
        const floorDarkColor = isFinderPattern(r, c, size)
          ? theme.finderOuter[0]
          : pickRandom(theme.qrDark, h);
        voxels.push({
          x,
          y: 0.04,
          z,
          size: 1.0,
          color: floorDarkColor,
          role: "leaf",
          isQrDark: true,
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }
    }
  }

  // 2. MONUMEN FINDER PATTERN
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && isFinderPattern(r, c, size)) {
        const x = c - center;
        const z = r - center;
        const finderRole = getFinderRole(r, c, size);
        const h = coordHash(x, z, 55);

        if (finderRole === "hedge") {
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 1.0,
            color: pickRandom(theme.finderOuter, h),
            role: "hedge",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        } else if (finderRole === "flower") {
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 1.0,
            color: theme.finderOuter[0],
            role: "flower",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
          voxels.push({
            x,
            y: 0.85,
            z,
            size: 1.0,
            color: pickRandom(theme.finderInner, h),
            role: "flower",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        }
      }
    }
  }

  // 3. MODEL GEDUNG VOXEL 3D DENGAN BENDERA BERKIBAR
  const rawList = buildGedungVoxelsRaw();
  const scale = 0.22;
  const vSize = 0.23;
  const yBase = 0.35;

  for (let i = 0; i < rawList.length; i++) {
    const rv = rawList[i];
    const wx = +(rv.x * scale).toFixed(3);
    const wy = +(yBase + rv.y * scale).toFixed(3);
    const wz = +(rv.z * scale).toFixed(3);

    const isFlag = rv.part === 1;
    voxels.push({
      x: wx,
      y: wy,
      z: wz,
      size: vSize,
      color: rv.color,
      role: isFlag ? "leaf" : "branch",
      isQrDark: false,
      part: isFlag ? 20 : 21,
      u: rv.u,
      ang: 0,
      phase: rv.ph,
    });
  }

  // 4. KELOPAK/KONFETI MERAH-PUTIH BERJATUHAN DI PLAZA
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 1 || isFinderPattern(r, c, size)) continue;
      const x = c - center;
      const z = r - center;
      if (Math.abs(x) > 12.0 || Math.abs(z) > 6.0) {
        const h = coordHash(x, z, 777);
        if (h > 0.68) {
          voxels.push({
            x: x + (coordHash(x, z, 81) - 0.5) * 0.45,
            y: 0.95,
            z: z + (coordHash(x, z, 92) - 0.5) * 0.45,
            size: 0.35 + h * 0.15,
            color: pickRandom(theme.petalFloor, h),
            role: "petal",
            isQrDark: false,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        }
      }
    }
  }

  return voxels;
}

/* ==================================================================
   HERO VOXEL MODEL (Ksatria Voxel / Mythic Hero)
================================================================== */
export const HERO_COLORS = {
  skin: 0xdba070,
  skinSh: 0xc4865a,
  skinLt: 0xe8b388,
  black: 0x1d1d22,
  blackLt: 0x2a2a31,
  blackDk: 0x131317,
  gold: 0xd9a63a,
  goldDk: 0x9c6e1c,
  goldLt: 0xf0c75a,
  red: 0xa8162a,
  redDk: 0x7a0e1d,
  ruby: 0xd0102e,
  hair: 0x121212,
  eye: 0xf4f1ea,
  mouth: 0x6a2622,
  sashTip: 0xe8b82a,
  cloud: 0xe1e2e4,
  cloudMid: 0xc9cbce,
  cloudSh: 0xa9acb0,
};
export const HERO_METAL = new Set([
  HERO_COLORS.gold,
  HERO_COLORS.goldDk,
  HERO_COLORS.goldLt,
  HERO_COLORS.sashTip,
]);

export const HERO_RIG: Record<
  string,
  { parent: string | null; pos: [number, number, number] }
> = {
  hips: { parent: null, pos: [0, 34, 0] },
  torso: { parent: "hips", pos: [0, 1, 0] },
  head: { parent: "torso", pos: [0, 20, 0] },
  wingL: { parent: "torso", pos: [3, 14, -5] },
  wingR: { parent: "torso", pos: [-3, 14, -5] },
  armL: { parent: "torso", pos: [12.5, 16.5, 0] },
  foreL: { parent: "armL", pos: [0.5, -12, 0] },
  armR: { parent: "torso", pos: [-12.5, 16.5, 0] },
  foreR: { parent: "armR", pos: [-0.5, -12, 0] },
  legL: { parent: "hips", pos: [5, -2, 0] },
  shinL: { parent: "legL", pos: [0.5, -14, 0.5] },
  legR: { parent: "hips", pos: [-5, -2, 0] },
  shinR: { parent: "legR", pos: [-0.5, -14, 0.5] },
  sash: { parent: "hips", pos: [8.5, -3, 2] },
};

export const HERO_JOINTS = Object.keys(HERO_RIG);

export const HERO_POSES: Record<
  string,
  { label: string; hipsY: number; [joint: string]: any }
> = {
  kuda: {
    label: "Stance (Kuda-kuda)",
    hipsY: -3,
    hips: [0, 0.15, 0],
    torso: [0.08, -0.15, 0],
    head: [0, 0.12, 0],
    armL: [-0.7, 0, 0.45],
    foreL: [-1.7, 0, 0],
    armR: [-0.35, 0, -0.55],
    foreR: [-1.9, 0, 0],
    legL: [-0.55, 0, 0.32],
    shinL: [0.75, 0, 0],
    legR: [0.4, 0, -0.35],
    shinR: [0.35, 0, 0],
    wingL: [0, 0, 0],
    wingR: [0, 0, 0],
    sash: [0, 0, 0],
  },
  pukulKanan: {
    label: "Right Strike",
    hipsY: -3.5,
    hips: [0, 0.25, 0],
    torso: [0.12, 0.45, 0],
    head: [0, -0.35, 0],
    armL: [-0.4, 0, 0.5],
    foreL: [-2.0, 0, 0],
    armR: [-1.55, 0, -0.12],
    foreR: [-0.08, 0, 0],
    legL: [-0.65, 0, 0.32],
    shinL: [0.85, 0, 0],
    legR: [0.5, 0, -0.35],
    shinR: [0.25, 0, 0],
    wingL: [0, 0.1, 0],
    wingR: [0, 0.1, 0],
    sash: [0.2, 0, 0.15],
  },
  pukulKiri: {
    label: "Left Strike",
    hipsY: -3.5,
    hips: [0, -0.15, 0],
    torso: [0.12, -0.45, 0],
    head: [0, 0.35, 0],
    armL: [-1.55, 0, 0.12],
    foreL: [-0.08, 0, 0],
    armR: [-0.4, 0, -0.5],
    foreR: [-2.0, 0, 0],
    legL: [-0.55, 0, 0.32],
    shinL: [0.75, 0, 0],
    legR: [0.45, 0, -0.35],
    shinR: [0.35, 0, 0],
    wingL: [0, -0.1, 0],
    wingR: [0, -0.1, 0],
    sash: [-0.15, 0, -0.1],
  },
  terbang: {
    label: "Flight (Ascend)",
    hipsY: 9,
    hips: [-0.05, 0, 0],
    torso: [-0.1, 0, 0],
    head: [-0.25, 0, 0],
    armL: [0.15, 0, 0.65],
    foreL: [-1.5, 0, 0],
    armR: [-2.95, 0, -0.15],
    foreR: [-0.15, 0, 0],
    legL: [-1.35, 0, 0.15],
    shinL: [1.7, 0, 0],
    legR: [0.12, 0, -0.08],
    shinR: [0.25, 0, 0],
    wingL: [0, -0.35, 0],
    wingR: [0, 0.35, 0],
    sash: [0.5, 0, 0.3],
  },
};

export const HERO_SEQ: [string, number, number][] = [
  ["kuda", 0.7, 1.4],
  ["pukulKanan", 0.2, 0.55],
  ["kuda", 0.35, 0.45],
  ["pukulKiri", 0.2, 0.55],
  ["kuda", 0.35, 0.45],
  ["pukulKanan", 0.18, 0.45],
  ["kuda", 0.4, 1.0],
  ["terbang", 0.95, 2.4],
  ["kuda", 0.85, 1.2],
];

export function heroWorldPivot(name: string): [number, number, number] {
  let p: [number, number, number] = [0, 0, 0];
  let n: string | null = name;
  while (n) {
    const node: { parent: string | null; pos: [number, number, number] } | undefined = HERO_RIG[n];
    if (!node) break;
    p = [p[0] + node.pos[0], p[1] + node.pos[1], p[2] + node.pos[2]];
    n = node.parent;
  }
  return p;
}

export interface HeroCell {
  x: number;
  y: number;
  z: number;
  c: number;
}

export interface HeroCharacterData {
  parts: Record<string, HeroCell[]>;
  cloud: HeroCell[];
}

let cachedHeroCharacter: HeroCharacterData | null = null;

export function buildHeroCharacterRaw(): HeroCharacterData {
  if (cachedHeroCharacter) return cachedHeroCharacter;

  const C = HERO_COLORS;
  let seed = 1337;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const parts: Record<string, Map<string, HeroCell>> = {};
  const P = (name: string) => (parts[name] ||= new Map());
  const K = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const set = (m: Map<string, HeroCell>, x: number, y: number, z: number, c: number) =>
    m.set(K(x, y, z), { x, y, z, c });
  const has = (m: Map<string, HeroCell>, x: number, y: number, z: number) => m.has(K(x, y, z));
  const paint = (m: Map<string, HeroCell>, x: number, y: number, z: number, c: number) => {
    const v = m.get(K(x, y, z));
    if (v) v.c = c;
  };

  function ell(
    m: Map<string, HeroCell>,
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    rz: number,
    col: number | ((x: number, y: number, z: number) => number)
  ) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
          const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
          if (d <= 1) set(m, x, y, z, typeof col === "function" ? col(x, y, z) : col);
        }
      }
    }
  }

  function cap(
    m: Map<string, HeroCell>,
    a: [number, number, number],
    b: [number, number, number],
    r0: number,
    r1: number,
    col: number | ((x: number, y: number, z: number, t: number) => number)
  ) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const steps = Math.ceil(L * 3);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = r0 + (r1 - r0) * t;
      const cx = a[0] + (b[0] - a[0]) * t;
      const cy = a[1] + (b[1] - a[1]) * t;
      const cz = a[2] + (b[2] - a[2]) * t;
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
          for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
            if (Math.hypot(x - cx, y - cy, z - cz) <= r && !has(m, x, y, z)) {
              set(m, x, y, z, typeof col === "function" ? col(x, y, z, t) : col);
            }
          }
        }
      }
    }
  }

  function frontMap(m: Map<string, HeroCell>) {
    const f = new Map<string, number>();
    for (const v of m.values()) {
      const k = `${v.x},${v.y}`;
      if (!f.has(k) || (f.get(k) as number) < v.z) f.set(k, v.z);
    }
    return f;
  }

  const engrave = (x: number, y: number, z: number) =>
    Math.sin(x * 1.3) + Math.sin(y * 1.1 + 0.5) + Math.sin(z * 1.25) > 1.55 ? C.goldDk : C.gold;

  // 1. Torso
  const T = P("torso");
  for (let y = 35; y <= 54; y++) {
    const ty = y - 35;
    const rx = ty <= 15 ? 7.5 + 3.5 * Math.pow(ty / 15, 1.3) : 11 - (ty - 15) * 0.55;
    const rz = 4.8 + 1.6 * (ty / 19);
    for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
      for (let z = Math.floor(-rz); z <= Math.ceil(rz); z++) {
        if ((x / rx) ** 2 + (z / rz) ** 2 <= 1) set(T, x, y, z, C.black);
      }
    }
  }
  ell(T, 4.6, 48.5, 3.4, 4.6, 3.6, 3, C.black);
  ell(T, -4.6, 48.5, 3.4, 4.6, 3.6, 3, C.black);
  for (const v of T.values()) {
    const d = Math.hypot(v.x, v.z * 1.15);
    if (v.y >= 52 && d < 4.2) v.c = C.skin;
    else if (v.y >= 52 && d < 7.2) v.c = C.gold;
    else if (v.y >= 50 && v.z > 2 && Math.abs(v.x) < 7 && d > 4.5 && d < 6.6) v.c = C.gold;
    else if (v.y >= 46 && Math.abs(v.x) >= 9.3) v.c = C.gold;
    else if (v.z > 3 && v.y >= 37 && v.y <= 45 && (v.x === 0 || v.y === 40 || v.y === 43)) v.c = C.blackDk;
    else if (rnd() < 0.08) v.c = C.blackLt;
  }
  {
    const f = frontMap(T);
    const sy = 46;
    for (let x = -6; x <= 6; x++) {
      for (let y = sy - 6; y <= sy + 6; y++) {
        const dx = x;
        const dy = y - sy;
        const r = Math.hypot(dx, dy);
        const th = Math.atan2(dy, dx);
        const R = 1.9 + 3.6 * Math.pow(Math.abs(Math.cos(4 * th)), 5);
        const fz = f.get(`${x},${y}`);
        if (fz === undefined) continue;
        if (r <= R) {
          set(T, x, y, fz + 1, r < 2.2 ? C.goldLt : C.gold);
          paint(T, x, y, fz, C.gold);
        }
        if (Math.abs(dx) + Math.abs(dy) <= 1.6) set(T, x, y, fz + 2, C.ruby);
      }
    }
  }

  // 2. Hips & Belt
  const H = P("hips");
  ell(H, 0, 31.5, 0, 8.2, 4.5, 5.6, C.black);
  for (let y = 28; y <= 31; y++) {
    for (let x = -9; x <= 9; x++) {
      for (let z = -7; z <= 7; z++) {
        if ((x / 9) ** 2 + (z / 6.8) ** 2 <= 1 && (x / 7.6) ** 2 + (z / 5.4) ** 2 > 1) {
          set(H, x, y, z, C.red);
        }
      }
    }
  }
  for (let y = 32; y <= 34; y++) {
    for (let x = -9; x <= 9; x++) {
      for (let z = -7; z <= 7; z++) {
        if ((x / 8.8) ** 2 + (z / 6.4) ** 2 <= 1) set(H, x, y, z, y === 33 ? C.gold : C.goldDk);
      }
    }
  }
  for (let x = -2; x <= 2; x++) {
    for (let y = 31; y <= 35; y++) {
      const dx = x;
      const dy = y - 33;
      if (Math.abs(dx) + Math.abs(dy) <= 2) {
        set(H, x, y, 7, Math.abs(dx) + Math.abs(dy) <= 0.5 ? C.ruby : C.goldLt);
      }
    }
  }
  for (let y = 31; y >= 17; y--) {
    const k = 31 - y;
    const w = 7.6 - k * 0.06 + 0.5 * Math.sin(k * 0.7);
    const zc = Math.round(6 + k * 0.14);
    for (let x = Math.floor(-w); x <= Math.ceil(w); x++) {
      const edge = Math.abs(x) > w - 1.2 || k >= 13;
      const fold = Math.sin(x * 1.1 + k * 0.35) > 0.72;
      for (let z = zc; z <= zc + 1; z++) set(H, x, y, z, edge ? C.gold : fold ? C.redDk : C.red);
    }
  }
  for (let y = 31; y >= 20; y--) {
    const k = 31 - y;
    const w = 8.2 - k * 0.1;
    const zc = Math.round(-6 - k * 0.12);
    for (let x = Math.floor(-w); x <= Math.ceil(w); x++) {
      const edge = Math.abs(x) > w - 1.2 || k >= 10;
      for (let z = zc - 1; z <= zc; z++) {
        set(H, x, y, z, edge ? C.gold : Math.sin(x * 0.9 + k * 0.4) > 0.7 ? C.redDk : C.red);
      }
    }
  }

  // 3. Sash
  const S = P("sash");
  cap(S, [9, 30, 3], [13, 22, 6], 1.9, 1.5, C.red);
  cap(S, [13, 22, 6], [15.5, 15, 7.5], 1.5, 1.2, (_x, _y, _z, t) => (t > 0.7 ? C.redDk : C.red));
  ell(S, 16, 13, 7.6, 2.4, 2.8, 1.4, (_x, y) => (y < 13 ? C.sashTip : C.red));

  // 4. Legs
  for (const [s, L, Sh] of [
    [1, "legL", "shinL"],
    [-1, "legR", "shinR"],
  ] as [number, string, string][]) {
    const Lm = P(L);
    const Sm = P(Sh);
    cap(Lm, [5 * s, 32, 0], [5.5 * s, 18, 0.5], 4.5, 3.5, C.black);
    ell(Lm, 5.2 * s, 26, 1.6, 4.1, 6, 3.6, C.black);
    for (const v of Lm.values()) if (rnd() < 0.07) v.c = C.blackLt;
    cap(Sm, [5.5 * s, 18, 0.5], [5.5 * s, 5, 0], 3.5, 2.8, (_x, y) =>
      y >= 11 ? C.black : y === 10 ? C.goldLt : C.gold
    );
    ell(Sm, 5.5 * s, 14, -1, 3.1, 4, 3, C.black);
    for (let x = Math.round(5.5 * s - 2.5); x <= Math.round(5.5 * s + 2.5); x++) {
      for (let y = 2; y <= 5; y++) {
        for (let z = -3; z <= 6; z++) {
          if (!(y === 5 && z > 3)) set(Sm, x, y, z, z === 6 || y === 2 ? C.goldDk : C.gold);
        }
      }
    }
  }

  // 5. Arms
  for (const [s, A, F] of [
    [1, "armL", "foreL"],
    [-1, "armR", "foreR"],
  ] as [number, string, string][]) {
    const Am = P(A);
    const Fm = P(F);
    ell(Am, 12.8 * s, 52, 0, 5.6, 5.2, 5.6, (x, y, z) => (y <= 48 ? C.goldLt : engrave(x, y, z)));
    for (const k of [...Am.keys()]) {
      const v = Am.get(k)!;
      if (v.y < 48) Am.delete(k);
    }
    cap(Am, [12.5 * s, 51.5, 0], [13 * s, 39.5, 0], 3.7, 3.1, C.skin);
    ell(Am, 13 * s, 45.5, 1.4, 3.3, 4.3, 3.2, C.skin);
    ell(Am, 13.4 * s, 45.5, -1.3, 3.1, 4.1, 3, C.skinSh);
    for (const v of Am.values()) if (v.y >= 43 && v.y <= 44 && v.c !== C.gold) v.c = C.gold;
    cap(Fm, [13 * s, 39.5, 0], [13 * s, 28.5, 0.6], 3.1, 2.5, C.skin);
    ell(Fm, 13 * s, 36, 0.6, 3.3, 3.6, 3.1, C.skin);
    for (const v of Fm.values()) {
      if (v.y === 29 || v.y === 30 || v.y === 32) v.c = v.y === 30 ? C.goldDk : C.gold;
      else if (rnd() < 0.1) v.c = C.skinSh;
    }
    ell(Fm, 13 * s, 25.8, 0.9, 2.9, 2.9, 3.1, (_x, y, z) =>
      z >= 3 && y >= 26 ? C.skinSh : C.skin
    );
  }

  // 6. Head
  const Hd = P("head");
  cap(Hd, [0, 54, 0], [0, 59, 0.3], 3.2, 3, C.skin);
  ell(Hd, 0, 63, 0.5, 4.7, 5.6, 4.9, C.skin);
  ell(Hd, 0, 59.5, 1, 4.4, 3, 3.9, C.skin);
  ell(Hd, 4.8, 62.5, -0.5, 1, 1.6, 1.2, C.skinSh);
  ell(Hd, -4.8, 62.5, -0.5, 1, 1.6, 1.2, C.skinSh);
  for (const v of Hd.values()) {
    if (v.y >= 67 || (v.z < -1 && v.y >= 61)) v.c = C.hair;
    else if (Math.abs(v.x) >= 4 && v.y >= 59 && v.y <= 62 && v.z > -1) v.c = C.hair;
    if (v.y >= 65 && v.y <= 66) v.c = v.y === 65 ? C.goldDk : C.gold;
  }
  {
    const f = frontMap(Hd);
    const face = (x: number, y: number, c: number, out = 0) => {
      const fz = f.get(`${x},${y}`);
      if (fz === undefined) return;
      if (out) set(Hd, x, y, fz + out, c);
      else paint(Hd, x, y, fz, c);
    };
    for (const s of [1, -1]) {
      face(1 * s, 64, C.hair, 1);
      face(2 * s, 64, C.hair, 1);
      face(3 * s, 65, C.hair, 1);
      face(4 * s, 65, C.hair, 1);
      face(2 * s, 63, C.hair);
      face(3 * s, 63, C.eye);
      face(3 * s, 61, C.hair, 1);
      face(4 * s, 62, C.hair, 1);
    }
    for (let x = -3; x <= 3; x++) face(x, 60, C.hair, 1);
    face(0, 62, C.skinSh, 1);
    face(0, 61, C.skinSh, 1);
    for (let x = -1; x <= 1; x++) face(x, 59, x === 0 ? C.mouth : C.skinSh);
    face(0, 57, C.hair, 1);
    face(0, 56, C.hair, 1);
    for (let y = 66; y <= 71; y++) {
      for (let x = -3; x <= 3; x++) {
        if (Math.abs(x) > 3.2 - (y - 66) * 0.62) continue;
        const fz = f.get(`${x},${Math.min(y, 66)}`);
        if (fz === undefined) continue;
        set(Hd, x, y, fz + 1, x === 0 && y === 67 ? C.ruby : engrave(x, y, fz));
      }
    }
  }
  ell(Hd, 5, 64.5, -1, 1.2, 3, 2.5, engrave);
  ell(Hd, -5, 64.5, -1, 1.2, 3, 2.5, engrave);
  ell(Hd, 5.3, 67.5, -1.8, 1, 2.2, 2, C.gold);
  ell(Hd, -5.3, 67.5, -1.8, 1, 2.2, 2, C.gold);
  ell(Hd, 0, 69, -1.2, 2.7, 0.9, 2.7, C.gold);
  ell(Hd, 0, 71.5, -1.4, 2.2, 3.2, 2.2, C.hair);

  // 7. Golden Wings
  for (const [s, W] of [
    [1, "wingL"],
    [-1, "wingR"],
  ] as [number, string][]) {
    const Wm = P(W);
    for (let ax = 1; ax <= 24; ax++) {
      for (let y = 40; y <= 82; y++) {
        const inOuter = Math.hypot(ax - 6, y - 58) <= 16.5;
        const inInner = Math.hypot(ax - 0.5, y - 65) <= 14;
        if (!inOuter || inInner) continue;
        const zc = Math.round(-6 - 0.2 * ax);
        const rimO = Math.hypot(ax - 6, y - 58) > 15.3;
        for (let z = zc - 1; z <= zc; z++) set(Wm, ax * s, y, z, rimO ? C.goldLt : engrave(ax, y, z));
      }
    }
  }

  // 8. Cloud Pedestal
  const cloud = new Map<string, HeroCell>();
  const cloudCol = (_x: number, y: number) => (y >= 8 ? C.cloud : y >= 5 ? C.cloudMid : C.cloudSh);
  for (let i = 0; i < 34; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    ell(
      cloud,
      Math.cos(a) * r * 22,
      3 + rnd() * 5,
      Math.sin(a) * r * 12,
      4 + rnd() * 3,
      3 + rnd() * 2.5,
      4 + rnd() * 3,
      cloudCol
    );
  }
  for (const s of [1, -1]) {
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      ell(
        cloud,
        s * (24 + t * 12),
        7 + t * 6 + Math.sin(t * 6) * 1.5,
        -3 + t * 2,
        3.2 - t * 1.6,
        2.6 - t * 1.2,
        3 - t * 1.4,
        cloudCol
      );
    }
  }

  const nb = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  const shell = (m: Map<string, HeroCell>) =>
    [...m.values()].filter((v) => nb.some(([a, b, c]) => !m.has(K(v.x + a, v.y + b, v.z + c))));

  const out: Record<string, HeroCell[]> = {};
  for (const [name, m] of Object.entries(parts)) {
    const p = heroWorldPivot(name);
    out[name] = shell(m).map((v) => ({
      x: v.x - p[0],
      y: v.y - p[1],
      z: v.z - p[2],
      c: v.c,
    }));
  }

  cachedHeroCharacter = {
    parts: out,
    cloud: shell(cloud),
  };
  return cachedHeroCharacter;
}

export function generateVoxelHero(
  matrix: number[][],
  size: number,
  season: SeasonType = "hero",
  _options?: TreeOptions
): VoxelItem[] {
  const theme = SEASONS[season] ?? SEASONS.hero;
  const voxels: VoxelItem[] = [];
  const center = (size - 1) / 2;
  const quietZone = 5;

  // 1. LANTAI COURTYARD & PERIMETER
  for (let r = -quietZone; r < size + quietZone; r++) {
    for (let c = -quietZone; c < size + quietZone; c++) {
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 101);

      const isInsideQr = r >= 0 && r < size && c >= 0 && c < size;
      const isPerimeter =
        r === -quietZone ||
        r === size + quietZone - 1 ||
        c === -quietZone ||
        c === size + quietZone - 1;

      voxels.push({
        x,
        y: 0,
        z,
        size: 1.0,
        color: isPerimeter ? theme.stoneBorder : pickRandom(theme.stonePaver, h),
        role: isPerimeter ? "border" : "stone",
        isQrDark: false,
        part: -99,
        u: 0,
        ang: 0,
        phase: 0,
      });

      if (isPerimeter) {
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 1.0,
          color: theme.stoneBorder,
          role: "border",
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }

      if (isInsideQr && matrix[r][c] === 1) {
        const floorDarkColor = isFinderPattern(r, c, size)
          ? theme.finderOuter[0]
          : pickRandom(theme.qrDark, h);
        voxels.push({
          x,
          y: 0.04,
          z,
          size: 1.0,
          color: floorDarkColor,
          role: "leaf",
          isQrDark: true,
          part: -99,
          u: 0,
          ang: 0,
          phase: 0,
        });
      }
    }
  }

  // 2. MONUMEN FINDER PATTERN
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && isFinderPattern(r, c, size)) {
        const x = c - center;
        const z = r - center;
        const finderRole = getFinderRole(r, c, size);
        const h = coordHash(x, z, 55);

        if (finderRole === "hedge") {
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 1.0,
            color: pickRandom(theme.finderOuter, h),
            role: "hedge",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        } else if (finderRole === "flower") {
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 1.0,
            color: theme.finderOuter[0],
            role: "flower",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
          voxels.push({
            x,
            y: 0.85,
            z,
            size: 1.0,
            color: pickRandom(theme.finderInner, h),
            role: "flower",
            isQrDark: true,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        }
      }
    }
  }

  // 3. GOLDEN CONFETTI / SPARKS ON COURTYARD FLOOR
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] !== 1 || isFinderPattern(r, c, size)) continue;
      const x = c - center;
      const z = r - center;
      if (Math.abs(x) > 12.0 || Math.abs(z) > 6.0) {
        const h = coordHash(x, z, 777);
        if (h > 0.65) {
          voxels.push({
            x: x + (coordHash(x, z, 81) - 0.5) * 0.45,
            y: 0.95,
            z: z + (coordHash(x, z, 92) - 0.5) * 0.45,
            size: 0.35 + h * 0.15,
            color: pickRandom(theme.petalFloor, h),
            role: "petal",
            isQrDark: false,
            part: -99,
            u: 0,
            ang: 0,
            phase: 0,
          });
        }
      }
    }
  }

  // 4. MODEL HERO & CLOUD (untuk export JSON / CSV / count voxel)
  const charData = buildHeroCharacterRaw();
  const scale = 0.24;
  const yBase = 0.35;

  for (const cv of charData.cloud) {
    voxels.push({
      x: +(cv.x * scale).toFixed(3),
      y: +(yBase + cv.y * scale).toFixed(3),
      z: +(cv.z * scale).toFixed(3),
      size: scale,
      color: "#" + cv.c.toString(16).padStart(6, "0"),
      role: "person",
      isQrDark: false,
      part: 31,
    });
  }

  for (const [partName, cells] of Object.entries(charData.parts)) {
    const p = heroWorldPivot(partName);
    for (const v of cells) {
      voxels.push({
        x: +((v.x + p[0]) * scale).toFixed(3),
        y: +(yBase + (v.y + p[1]) * scale).toFixed(3),
        z: +((v.z + p[2]) * scale).toFixed(3),
        size: scale,
        color: "#" + v.c.toString(16).padStart(6, "0"),
        role: "person",
        isQrDark: false,
        part: 30,
      });
    }
  }

  return voxels;
}

/**
 * Model voxel orang duduk bersandar di batang ("nyender").
 */
export function generateSittingPersonVoxels(): VoxelItem[] {
  const person: VoxelItem[] = [];

  const skin = "#F5CBA7";
  const skinShadow = "#E0B28C";
  const hair = "#3E2723";
  const hairDark = "#271810";
  const hairHighlight = "#4E342E";
  const shirt = "#0284C7";
  const shirtLight = "#38BDF8";
  const shirtShadow = "#0369A1";
  const pants = "#1E3A8A";
  const pantsLight = "#2563EB";
  const pantsDark = "#172554";
  const shoe = "#0F172A";
  const shoeSole = "#FFFFFF";

  person.push(
    { x: 0.9, y: 0.02, z: 2.2, size: 1.3, color: "#D8CDBA", role: "person" },
    { x: 1.3, y: 0.02, z: 3.2, size: 1.2, color: "#D8CDBA", role: "person" },
    { x: 0.65, y: 0.02, z: 3.2, size: 1.0, color: "#D8CDBA", role: "person" }
  );

  person.push(
    { x: 0.65, y: 0.35, z: 1.55, size: 0.52, color: pantsDark, role: "person" },
    { x: 1.15, y: 0.35, z: 1.55, size: 0.52, color: pants, role: "person" }
  );

  person.push(
    { x: 0.65, y: 0.34, z: 2.05, size: 0.50, color: pants, role: "person" },
    { x: 0.65, y: 0.32, z: 2.55, size: 0.48, color: pants, role: "person" },
    { x: 0.65, y: 0.30, z: 3.05, size: 0.46, color: pantsDark, role: "person" },
    { x: 0.65, y: 0.28, z: 3.55, size: 0.44, color: pants, role: "person" },
    { x: 0.65, y: 0.24, z: 4.05, size: 0.42, color: shoe, role: "person" },
    { x: 0.65, y: 0.08, z: 4.05, size: 0.42, color: shoeSole, role: "person" }
  );

  person.push(
    { x: 1.25, y: 0.55, z: 2.05, size: 0.50, color: pants, role: "person" },
    { x: 1.28, y: 0.95, z: 2.50, size: 0.50, color: pantsLight, role: "person" },
    { x: 1.28, y: 1.45, z: 2.90, size: 0.52, color: pants, role: "person" },
    { x: 1.28, y: 1.85, z: 3.10, size: 0.50, color: pantsLight, role: "person" },
    { x: 1.28, y: 1.35, z: 3.40, size: 0.48, color: pantsDark, role: "person" },
    { x: 1.28, y: 0.85, z: 3.70, size: 0.46, color: pants, role: "person" },
    { x: 1.28, y: 0.35, z: 3.95, size: 0.44, color: pantsDark, role: "person" },
    { x: 1.28, y: 0.24, z: 4.25, size: 0.42, color: shoe, role: "person" },
    { x: 1.28, y: 0.08, z: 4.25, size: 0.42, color: shoeSole, role: "person" }
  );

  person.push(
    { x: 0.65, y: 0.85, z: 1.55, size: 0.52, color: shirtShadow, role: "person" },
    { x: 1.15, y: 0.85, z: 1.55, size: 0.52, color: shirt, role: "person" }
  );
  person.push(
    { x: 0.65, y: 1.35, z: 1.45, size: 0.52, color: shirtShadow, role: "person" },
    { x: 1.15, y: 1.35, z: 1.45, size: 0.52, color: shirt, role: "person" },
    { x: 0.90, y: 1.35, z: 1.68, size: 0.48, color: shirtLight, role: "person" }
  );
  person.push(
    { x: 0.48, y: 1.85, z: 1.35, size: 0.50, color: shirtShadow, role: "person" },
    { x: 0.90, y: 1.85, z: 1.35, size: 0.52, color: shirtLight, role: "person" },
    { x: 1.32, y: 1.85, z: 1.35, size: 0.50, color: shirt, role: "person" }
  );

  person.push(
    { x: 0.22, y: 1.65, z: 1.35, size: 0.44, color: shirtShadow, role: "person" },
    { x: 0.18, y: 1.15, z: 1.45, size: 0.40, color: skin, role: "person" },
    { x: 0.14, y: 0.65, z: 1.55, size: 0.38, color: skinShadow, role: "person" },
    { x: 0.10, y: 0.25, z: 1.65, size: 0.38, color: skin, role: "person" }
  );
  person.push(
    { x: 1.55, y: 1.65, z: 1.45, size: 0.44, color: shirt, role: "person" },
    { x: 1.50, y: 1.45, z: 1.95, size: 0.40, color: skin, role: "person" },
    { x: 1.42, y: 1.65, z: 2.45, size: 0.38, color: skin, role: "person" },
    { x: 1.35, y: 1.95, z: 2.95, size: 0.38, color: skin, role: "person" }
  );

  person.push({ x: 0.90, y: 2.30, z: 1.25, size: 0.40, color: skinShadow, role: "person" });
  person.push(
    { x: 0.70, y: 2.75, z: 1.20, size: 0.48, color: skin, role: "person" },
    { x: 1.10, y: 2.75, z: 1.20, size: 0.48, color: skin, role: "person" },
    { x: 0.90, y: 2.75, z: 1.45, size: 0.44, color: skin, role: "person" }
  );
  person.push(
    { x: 0.70, y: 3.20, z: 1.18, size: 0.50, color: hair, role: "person" },
    { x: 1.10, y: 3.20, z: 1.18, size: 0.50, color: hair, role: "person" },
    { x: 0.90, y: 3.25, z: 1.38, size: 0.46, color: hairHighlight, role: "person" },
    { x: 0.65, y: 2.75, z: 0.95, size: 0.42, color: hairDark, role: "person" },
    { x: 1.15, y: 2.75, z: 0.95, size: 0.42, color: hairDark, role: "person" },
    { x: 0.90, y: 3.55, z: 1.15, size: 0.44, color: hair, role: "person" }
  );

  return person;
}

export function generateParticles(count = 65, season: SeasonType = "summer") {
  const theme = SEASONS[season];
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: (Math.random() - 0.5) * 32,
      y: 8 + Math.random() * 26,
      z: (Math.random() - 0.5) * 32,
      speed: 0.015 + Math.random() * 0.035,
      swaySpeed: 1 + Math.random() * 1.5,
      swayPhase: Math.random() * Math.PI * 2,
      color: theme.particleColors[i % theme.particleColors.length],
      size: 0.28 + Math.random() * 0.15,
    });
  }
  return particles;
}

export function exportVoxelsToJson(voxels: VoxelItem[], metadata: { title: string; url: string }) {
  return JSON.stringify(
    {
      format: "goxel-compatible-voxels",
      version: "1.0.0",
      generator: "official.id 3D Voxel Magic Tree Engine",
      created: new Date().toISOString(),
      metadata,
      voxelCount: voxels.length,
      voxels: voxels.map((v) => ({
        x: Math.round(v.x * 100) / 100,
        y: Math.round(v.y * 100) / 100,
        z: Math.round(v.z * 100) / 100,
        size: v.size ?? 1,
        color: v.color,
        role: v.role,
      })),
    },
    null,
    2
  );
}

export function exportVoxelsToCsv(voxels: VoxelItem[]): string {
  let csv = "x,y,z,size,color,role\n";
  for (const v of voxels) {
    csv += `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)},${(v.size ?? 1).toFixed(2)},${v.color},${v.role}\n`;
  }
  return csv;
}

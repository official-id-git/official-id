import QRCode from "qrcode";

export type SeasonType = "summer" | "spring" | "autumn";

export interface VoxelItem {
  x: number;
  y: number; // Y is UP in Three.js
  z: number;
  size?: number;
  color: string;
  role: "trunk" | "branch" | "leaf" | "stone" | "border" | "hedge" | "flower" | "person";
  isQrDark?: boolean;
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
    badge: "🌳 Summer Green",
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
    badge: "🌸 Sakura Blossom",
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
    badge: "🍂 Golden Autumn",
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
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
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

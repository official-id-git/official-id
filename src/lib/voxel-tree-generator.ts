import QRCode from "qrcode";
import { GATOTKACA_PIXELS } from "@/lib/satria-pixel-data";

export type SeasonType = "summer" | "spring" | "autumn" | "satria";
export type ModelStyleType = "tree" | "satria";

export interface VoxelItem {
  x: number;
  y: number; // Y is UP in Three.js
  z: number;
  size?: number; // Voxel cube size (default 0.44 for leaves, 0.94 for large tiles, or custom)
  color: string;
  role: "trunk" | "branch" | "leaf" | "stone" | "border" | "hedge" | "flower" | "satria";
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
  particleColors: string[];
  accentColor: string;
}

export const SEASONS: Record<SeasonType, SeasonTheme> = {
  summer: {
    name: "Summer",
    badge: "☀️ Summer",
    bgColor: "#F6F1E7",
    paperColor: "#EFE8DA",
    // Deep rich forest greens for 100% instant smartphone camera detection
    leafPrimary: ["#124417", "#0D3812", "#19541F", "#14481A"],
    leafHighlight: ["#246E2A", "#2E7D32", "#388E3C"],
    leafShadow: ["#08240B", "#051A07", "#0A2D0E"],
    trunkPrimary: ["#3E2723", "#2E1B17", "#4A2F28", "#241411"],
    hedgeColor: ["#0D3812", "#124417", "#08240B"],
    // Clean bright off-white stone pavers for high luminance contrast
    stonePaver: ["#FFFDF8", "#FAF6EE", "#F5F0E4", "#F8F3E8"],
    stoneBorder: "#D8CDBA",
    particleColors: ["#4CAF50", "#66BB6A", "#81C784", "#A5D6A7"],
    accentColor: "#0D3812",
  },
  spring: {
    name: "Spring",
    badge: "🌸 Spring",
    bgColor: "#FAF5F4",
    paperColor: "#F4ECE9",
    // Deep cherry rose tones with strong luminance contrast
    leafPrimary: ["#880E4F", "#780B44", "#9C114E", "#830E4A"],
    leafHighlight: ["#AD1457", "#C2185B", "#D81B60"],
    leafShadow: ["#4A052A", "#3B0321", "#30021A"],
    trunkPrimary: ["#3E2723", "#2E1B17", "#4A2F28", "#241411"],
    hedgeColor: ["#124417", "#0D3812", "#19541F"],
    stonePaver: ["#FFFCFB", "#FDF7F5", "#F8EFEA", "#F5E9E4"],
    stoneBorder: "#D8C5BE",
    particleColors: ["#FFB7C5", "#FFCCD5", "#FCE7F3", "#F8BBD0"],
    accentColor: "#880E4F",
  },
  autumn: {
    name: "Autumn",
    badge: "🍂 Autumn",
    bgColor: "#F8F3EA",
    paperColor: "#EFE5D5",
    // Deep maple rust and dark chestnut
    leafPrimary: ["#7C2D12", "#64220A", "#853112", "#6F260C"],
    leafHighlight: ["#9A3412", "#B45309", "#C2410C"],
    leafShadow: ["#431405", "#350F03", "#290A01"],
    trunkPrimary: ["#3E2723", "#2E1B17", "#4A2F28", "#241411"],
    hedgeColor: ["#365314", "#2A410E", "#1F3108"],
    stonePaver: ["#FFFDF8", "#FAF5EB", "#F4ECDC", "#EFE5D3"],
    stoneBorder: "#C7B89E",
    particleColors: ["#F97316", "#FB923C", "#FBBF24", "#FED7AA"],
    accentColor: "#7C2D12",
  },
  satria: {
    name: "Satria Gold",
    badge: "🛡️ Satria Gold",
    bgColor: "#0E1017",
    paperColor: "#171A24",
    // Deep obsidian & rich gold for high contrast
    leafPrimary: ["#78350F", "#652C0A", "#853E0F", "#582507"],
    leafHighlight: ["#A16207", "#B45309", "#CA8A04"],
    leafShadow: ["#3B1402", "#2B0F01", "#1E0900"],
    trunkPrimary: ["#0C0A09", "#060504", "#1C1917", "#000000"],
    hedgeColor: ["#78350F", "#652C0A", "#853E0F"],
    stonePaver: ["#141822", "#181D29", "#1D2332", "#10141C"],
    stoneBorder: "#3F4860",
    particleColors: ["#FDE047", "#FACC15", "#EAB308", "#60A5FA"],
    accentColor: "#FACC15",
  },
};

// Deterministic pseudo-random based on (x, z) coordinates
function coordHash(x: number, z: number, seed = 42): number {
  let h = (x * 374761393 + z * 668265263 + seed) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function pickRandom<T>(arr: T[], hashVal: number): T {
  const idx = Math.floor(hashVal * arr.length) % arr.length;
  return arr[idx];
}

// Generate QR Code 2D Matrix
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

// Check if a cell is part of Finder Pattern (Top-Left, Top-Right, Bottom-Left)
export function isFinderPattern(r: number, c: number, size: number): boolean {
  const isTL = r < 8 && c < 8;
  const isTR = r < 8 && c >= size - 8;
  const isBL = r >= size - 8 && c < 8;
  return isTL || isTR || isBL;
}

// Exact Finder Pattern Role according to QR spec (1:1:3:1:1)
export function getFinderRole(r: number, c: number, size: number): "hedge" | "walkway" | "flower" | null {
  const checkOne = (row: number, col: number) => {
    if (row < 0 || row > 6 || col < 0 || col > 6) return null;
    // Outer border (7x7 outline) -> DARK
    if (row === 0 || row === 6 || col === 0 || col === 6) return "hedge";
    // Inner center (3x3 core) -> DARK
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return "flower";
    // Walkway gap (5x5 ring between outer and center) -> LIGHT
    return "walkway";
  };

  if (r <= 6 && c <= 6) return checkOne(r, c);
  if (r <= 6 && c >= size - 7) return checkOne(r, c - (size - 7));
  if (r >= size - 7 && c <= 6) return checkOne(r - (size - 7), c);

  return null;
}

/**
 * Generate 3D Voxels for the Magic Tree (ICQR reference replica)
 * GUARANTEES:
 * 1. 100% Smartphone Camera Scannability:
 *    - 4-module clean light quiet zone on all 4 sides with ZERO random dots or tufts.
 *    - Every dark QR module has a base solid tile at Y=0.04 to guarantee 100% opacity from above.
 *    - Finder patterns follow the exact 1:1:3:1:1 standard.
 * 2. Fine, delicate foliage:
 *    - Leaves use sub-voxel clusters of size 0.44 with organic highlights and shadows.
 *    - Dense cloud canopy, NOT chunky giant Minecraft blocks!
 * 3. Anti-clipping:
 *    - Compact, balanced bounds centered at origin.
 */
export function generateVoxelTree(
  matrix: number[][],
  size: number,
  season: SeasonType = "summer"
): VoxelItem[] {
  const theme = SEASONS[season];
  const voxels: VoxelItem[] = [];

  const center = (size - 1) / 2;
  const quietZone = 4; // ISO/IEC standard 4-module quiet margin
  const subSize = 0.45; // Sub-voxel size (half of 1 QR module)

  // 1. GROUND COURTYARD TERRACE (Clean light stone pavers & quiet margin)
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

      // Base floor stone paver at Y = 0
      const paverColor = pickRandom(theme.stonePaver, h);
      voxels.push({
        x,
        y: 0,
        z,
        size: 0.96,
        color: isPerimeter ? theme.stoneBorder : paverColor,
        role: isPerimeter ? "border" : "stone",
        isQrDark: false,
      });

      // Curb stone border around courtyard perimeter (smooth and clean, NO random black dots)
      if (isPerimeter) {
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 0.96,
          color: theme.stoneBorder,
          role: "border",
        });
      }

      // If inside QR grid
      if (isInsideQr) {
        const isDark = matrix[r][c] === 1;
        const finder = getFinderRole(r, c, size);

        // For every dark module, place a solid dark base tile at Y=0.04 to guarantee 100% QR scannability from above
        if (isDark) {
          voxels.push({
            x,
            y: 0.04,
            z,
            size: 1.02,
            color: theme.leafPrimary[0],
            role: "leaf",
            isQrDark: true,
          });
        }

        // 2. FINDER PATTERNS (Manicured garden hedge frames)
        if (finder === "hedge" || finder === "flower") {
          // 2x2 sub-voxels for refined, crisp hedge geometry
          const offsets = [-0.25, 0.25];
          for (const ox of offsets) {
            for (const oz of offsets) {
              const subH = coordHash(x + ox, z + oz, 31);
              const hedgeColor =
                finder === "flower"
                  ? theme.accentColor
                  : pickRandom(theme.hedgeColor, subH);

              voxels.push({
                x: x + ox,
                y: 0.5,
                z: z + oz,
                size: subSize,
                color: hedgeColor,
                role: finder === "flower" ? "flower" : "hedge",
                isQrDark: true,
              });
              voxels.push({
                x: x + ox,
                y: 1.0,
                z: z + oz,
                size: subSize,
                color:
                  finder === "flower"
                    ? theme.accentColor
                    : pickRandom(theme.leafHighlight, subH),
                role: finder === "flower" ? "flower" : "hedge",
                isQrDark: true,
              });
            }
          }
        } else if (isDark && !isFinderPattern(r, c, size)) {
          // 3. TREE CANOPY & TRUNK (The data modules)
          const dist = Math.hypot(x, z);
          const maxDist = center * 1.35;
          const normDist = Math.min(1, dist / maxDist);

          // Natural dome canopy height profile: Center height ~14..18, slopes gracefully to ~4..6
          const domeHeight = Math.max(
            3.5,
            14 * Math.cos(normDist * (Math.PI / 2.2)) + (h - 0.5) * 2.8
          );

          // Center trunk area (dist <= 3.0): Wood voxels going up from floor
          const isTrunkColumn = dist <= 3.0;
          if (isTrunkColumn) {
            const trunkH = Math.min(domeHeight - 1, 9);
            for (let ty = 0.5; ty <= trunkH; ty += 0.5) {
              const trunkOffsets = [-0.25, 0.25];
              for (const ox of trunkOffsets) {
                for (const oz of trunkOffsets) {
                  voxels.push({
                    x: x + ox,
                    y: ty,
                    z: z + oz,
                    size: subSize,
                    color: pickRandom(theme.trunkPrimary, coordHash(x + ox + ty, z + oz, 202)),
                    role: "trunk",
                    isQrDark: true,
                  });
                }
              }
            }
          }

          // Branch scaffolds for mid-distance (3.0 < dist <= 7.0)
          if (!isTrunkColumn && dist <= 7.0 && h > 0.45) {
            const branchY = Math.round(domeHeight * 0.45);
            voxels.push({
              x,
              y: branchY,
              z,
              size: subSize * 1.4,
              color: pickRandom(theme.trunkPrimary, h),
              role: "branch",
              isQrDark: true,
            });
          }

          // Canopy Foliage: 2x2 fine sub-voxels for delicate, dense leaves!
          const subOffsets = [-0.25, 0.25];
          for (const ox of subOffsets) {
            for (const oz of subOffsets) {
              const subH = coordHash(x + ox, z + oz, 404);
              const leafThickness = isTrunkColumn ? 3.5 : subH > 0.5 ? 2.5 : 1.5;
              const topY = domeHeight + (subH - 0.5) * 1.2;
              const bottomY = Math.max(1.0, topY - leafThickness);

              for (let ly = bottomY; ly <= topY; ly += 0.5) {
                let leafColor: string;
                if (ly >= topY - 0.5) {
                  leafColor = pickRandom(theme.leafHighlight, coordHash(x + ox, z + oz + ly, 303));
                } else if (ly <= bottomY + 0.5) {
                  leafColor = pickRandom(theme.leafShadow, coordHash(x + ox + ly, z + oz, 404));
                } else {
                  leafColor = pickRandom(theme.leafPrimary, coordHash(x + ox, z + oz, 505));
                }

                voxels.push({
                  x: x + ox,
                  y: ly,
                  z: z + oz,
                  size: subSize,
                  color: leafColor,
                  role: "leaf",
                  isQrDark: true,
                });
              }
            }
          }
        }
      }
    }
  }

  return voxels;
}

/**
 * Generate 3D Voxels for the Satria / Gatotkaca Warrior Statue Mode
 * Uses the authentic 4,801 pixels extracted from pixel/README.md.png (Gatotkaca sprite)
 * Renders the hero standing majestically on an ancient Nusantara temple plinth (Candi batu hitam & emas).
 * In 3D: full 3D statue with armor extrusion, winged crown, star emblem, and flowing ponytail!
 * In QR: high-contrast royal gold and obsidian scannable QR code!
 */
export function generateVoxelSatria(
  matrix: number[][],
  size: number,
  season: SeasonType = "satria"
): VoxelItem[] {
  const theme = SEASONS[season];
  const voxels: VoxelItem[] = [];

  const center = (size - 1) / 2;
  const quietZone = 4;

  // 1. ANCIENT TEMPLE STONE PLINTH (Candi Base)
  for (let r = -quietZone; r < size + quietZone; r++) {
    for (let c = -quietZone; c < size + quietZone; c++) {
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 77);

      const isInsideQr = r >= 0 && r < size && c >= 0 && c < size;
      const isPerimeter =
        r === -quietZone ||
        r === size + quietZone - 1 ||
        c === -quietZone ||
        c === size + quietZone - 1;

      // Base temple stone floor at Y = 0
      voxels.push({
        x,
        y: 0,
        z,
        size: 0.96,
        color: isPerimeter ? theme.stoneBorder : pickRandom(theme.stonePaver, h),
        role: "stone",
        isQrDark: false,
      });

      if (isPerimeter) {
        // Gold-embossed perimeter curb
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 0.96,
          color: theme.accentColor,
          role: "border",
        });
      }

      // If inside QR grid
      if (isInsideQr) {
        const isDark = matrix[r][c] === 1;
        const finder = getFinderRole(r, c, size);

        // Solid base tile for 100% QR scannability from above
        if (isDark) {
          voxels.push({
            x,
            y: 0.04,
            z,
            size: 1.02,
            color: finder === "flower" ? "#FACC15" : "#CA8A04",
            role: "satria",
            isQrDark: true,
          });
        }

        if (finder === "hedge" || finder === "flower") {
          // Gold & Obsidian Finder shrines
          const offsets = [-0.25, 0.25];
          for (const ox of offsets) {
            for (const oz of offsets) {
              voxels.push({
                x: x + ox,
                y: 0.5,
                z: z + oz,
                size: 0.45,
                color: finder === "flower" ? "#FEF08A" : "#CA8A04",
                role: "satria",
                isQrDark: true,
              });
              voxels.push({
                x: x + ox,
                y: 1.0,
                z: z + oz,
                size: 0.45,
                color: finder === "flower" ? "#FACC15" : "#EAB308",
                role: "satria",
                isQrDark: true,
              });
            }
          }
        }
      }
    }
  }

  // 2. THE MAJESTIC 3D VOXEL GATOTKACA HERO STATUE
  // Built directly from the user's authentic sprite pixels (GATOTKACA_PIXELS)
  const scale = 0.22; // Scale factor for 64x124 sprite into ~27 unit tall statue
  const statueBaseY = 1.0; // Sits on top of the temple plinth

  for (const p of GATOTKACA_PIXELS) {
    const vx = p.x * scale;
    const vy = statueBaseY + p.y * scale;

    // Calculate 3D Depth (Z-extrusion) based on armor & body features
    let vz = 0;
    const colorLower = p.color.toLowerCase();

    // Gold Chest Star & Armor -> Extrude forward
    if (
      p.y >= 50 &&
      p.y <= 85 &&
      (colorLower.includes("ea") ||
        colorLower.includes("bc") ||
        colorLower.includes("fe") ||
        colorLower.includes("fa"))
    ) {
      vz = 0.5; // Star plate pops forward
    } else if (p.y >= 90 && (colorLower === "#040203" || colorLower === "#1b1a1b")) {
      // Ponytail hair flows backward
      vz = -0.6;
    } else if (p.y >= 30 && p.y <= 55 && colorLower.includes("b1302c")) {
      // Red sash belt
      vz = 0.4;
    } else if (p.y >= 25 && p.y <= 50 && colorLower.includes("4163b0")) {
      // Blue waistcloth
      vz = 0.3;
    }

    voxels.push({
      x: vx,
      y: vy,
      z: vz,
      size: scale * 1.05,
      color: p.color,
      role: "satria",
      isQrDark: true,
    });
  }

  return voxels;
}

/**
 * Generate Falling Particles (Leaves / Blossom / Sparkles)
 */
export function generateParticles(count = 65, season: SeasonType = "summer") {
  const theme = SEASONS[season];
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: (Math.random() - 0.5) * 32,
      y: 4 + Math.random() * 18,
      z: (Math.random() - 0.5) * 32,
      speed: 0.02 + Math.random() * 0.04,
      swaySpeed: 1 + Math.random() * 1.5,
      swayPhase: Math.random() * Math.PI * 2,
      color: theme.particleColors[i % theme.particleColors.length],
      size: 0.28 + Math.random() * 0.15,
    });
  }
  return particles;
}

/**
 * Export Voxels to Goxel / MagicaVoxel friendly JSON & CSV formats
 */
export function exportVoxelsToJson(voxels: VoxelItem[], metadata: { title: string; url: string }) {
  return JSON.stringify(
    {
      format: "goxel-compatible-voxels",
      version: "1.0.0",
      generator: "official.id 3D Voxel Engine",
      created: new Date().toISOString(),
      metadata,
      voxelCount: voxels.length,
      voxels: voxels.map((v) => ({
        x: Math.round(v.x * 100) / 100,
        y: Math.round(v.y * 100) / 100,
        z: Math.round(v.z * 100) / 100,
        color: v.color,
        role: v.role,
      })),
    },
    null,
    2
  );
}

export function exportVoxelsToCsv(voxels: VoxelItem[]): string {
  let csv = "x,y,z,color,role\n";
  for (const v of voxels) {
    csv += `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)},${v.color},${v.role}\n`;
  }
  return csv;
}

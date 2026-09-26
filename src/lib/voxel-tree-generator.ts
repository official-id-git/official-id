import QRCode from "qrcode";

export type SeasonType = "summer" | "spring" | "autumn" | "satria";
export type ModelStyleType = "tree" | "satria" | "city";

export interface VoxelItem {
  x: number;
  y: number; // Y is UP in Three.js
  z: number;
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
    leafPrimary: ["#3FA34D", "#2E7D32", "#43A047", "#388E3C"],
    leafHighlight: ["#66BB6A", "#81C784", "#A5D6A7"],
    leafShadow: ["#1B5E20", "#256029", "#1E4620"],
    trunkPrimary: ["#5D4037", "#4E342E", "#6D4C41", "#3E2723"],
    hedgeColor: ["#2E7D32", "#388E3C", "#1B5E20"],
    stonePaver: ["#F9F6F0", "#F0EAE1", "#E6DFD3", "#DDD6C7"],
    stoneBorder: "#C8BEAB",
    particleColors: ["#66BB6A", "#81C784", "#C8E6C9", "#E8F5E9"],
    accentColor: "#3FA34D",
  },
  spring: {
    name: "Spring",
    badge: "🌸 Spring",
    bgColor: "#FDF8F7",
    paperColor: "#F5ECEB",
    leafPrimary: ["#FF8DA1", "#F472B6", "#EC4899", "#FB7185"],
    leafHighlight: ["#FFB7C5", "#FFCCD5", "#FCE7F3"],
    leafShadow: ["#DB2777", "#BE185D", "#9D174D"],
    trunkPrimary: ["#63473D", "#543C34", "#7A5A4E", "#422E27"],
    hedgeColor: ["#4ADE80", "#22C55E", "#16A34A"],
    stonePaver: ["#FFFBF9", "#F7F0ED", "#EFE5E1", "#E5D9D4"],
    stoneBorder: "#D8C5BE",
    particleColors: ["#FFB7C5", "#FFCCD5", "#FFF0F3", "#FCE7F3"],
    accentColor: "#EC4899",
  },
  autumn: {
    name: "Autumn",
    badge: "🍂 Autumn",
    bgColor: "#F9F4EB",
    paperColor: "#EFE5D3",
    leafPrimary: ["#EA580C", "#D97706", "#C2410C", "#B45309"],
    leafHighlight: ["#F97316", "#FBBF24", "#F59E0B"],
    leafShadow: ["#9A3412", "#78350F", "#7C2D12"],
    trunkPrimary: ["#452B20", "#382015", "#523528", "#2E1A10"],
    hedgeColor: ["#65A30D", "#4D7C0F", "#3F6212"],
    stonePaver: ["#FAF5EC", "#EFE7D8", "#E3D9C5", "#D8CCB5"],
    stoneBorder: "#C0B298",
    particleColors: ["#F97316", "#FB923C", "#FBBF24", "#FED7AA"],
    accentColor: "#EA580C",
  },
  satria: {
    name: "Satria Gold",
    badge: "🛡️ Satria Gold",
    bgColor: "#12141C",
    paperColor: "#1A1D27",
    leafPrimary: ["#EAB308", "#CA8A04", "#A16207", "#D97706"],
    leafHighlight: ["#FDE047", "#FEF08A", "#FACC15"],
    leafShadow: ["#854D0E", "#713F12", "#583008"],
    trunkPrimary: ["#292524", "#1C1917", "#44403C", "#0C0A09"],
    hedgeColor: ["#2563EB", "#1D4ED8", "#1E40AF"],
    stonePaver: ["#1E2230", "#242938", "#2B3245", "#161922"],
    stoneBorder: "#3E4760",
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
    // Fallback minimal 25x25 matrix
    const size = 25;
    const matrix = Array.from({ length: size }, () => Array(size).fill(0));
    return { matrix, size };
  }
}

// Check if a cell is part of Finder Pattern (Top-Left, Top-Right, Bottom-Left)
export function isFinderPattern(r: number, c: number, size: number): boolean {
  // 7x7 outer square + 1 separator quiet margin (8x8)
  const isTL = r < 8 && c < 8;
  const isTR = r < 8 && c >= size - 8;
  const isBL = r >= size - 8 && c < 8;
  return isTL || isTR || isBL;
}

// Check if a cell is on the 7x7 finder border (1) or inner center (1)
export function getFinderRole(r: number, c: number, size: number): "hedge" | "walkway" | "flower" | null {
  const checkOne = (row: number, col: number) => {
    if (row < 0 || row > 6 || col < 0 || col > 6) return null;
    // Outer border (7x7 rim)
    if (row === 0 || row === 6 || col === 0 || col === 6) return "hedge";
    // Inner center (3x3 core)
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return "flower";
    // Walkway gap
    return "walkway";
  };

  if (r <= 6 && c <= 6) return checkOne(r, c);
  if (r <= 6 && c >= size - 7) return checkOne(r, c - (size - 7));
  if (r >= size - 7 && c <= 6) return checkOne(r - (size - 7), c);

  return null;
}

/**
 * Generate 3D Voxels for the Magic Tree (ICQR reference replica)
 * Guarantee: When viewed straight from top-down (orthographic projection along Y-axis),
 * every dark cell contains a foliage/wood/hedge voxel and every light cell shows the light paver floor.
 */
export function generateVoxelTree(
  matrix: number[][],
  size: number,
  season: SeasonType = "summer"
): VoxelItem[] {
  const theme = SEASONS[season];
  const voxels: VoxelItem[] = [];

  const center = (size - 1) / 2;
  const padding = 2; // Courtyard extension beyond QR grid
  const totalGrid = size + padding * 2;

  // 1. GROUND COURTYARD (Light stone pavers & border plinth)
  for (let r = -padding; r < size + padding; r++) {
    for (let c = -padding; c < size + padding; c++) {
      const x = c - center;
      const z = r - center;
      const h = coordHash(x, z, 101);

      const isOutside = r < 0 || r >= size || c < 0 || c >= size;
      if (isOutside) {
        // Courtyard perimeter plinth & grass fringe
        if (
          r === -padding ||
          r === size + padding - 1 ||
          c === -padding ||
          c === size + padding - 1
        ) {
          // Curb border
          voxels.push({
            x,
            y: 0,
            z,
            color: theme.stoneBorder,
            role: "border",
          });
          // Occasional grass blade tuft on edge
          if (h > 0.65) {
            voxels.push({
              x,
              y: 1,
              z,
              color: pickRandom(theme.hedgeColor, h),
              role: "hedge",
            });
          }
        } else {
          // Outer patio walkway
          voxels.push({
            x,
            y: 0,
            z,
            color: pickRandom(theme.stonePaver, h),
            role: "stone",
          });
        }
      } else {
        // Inside QR boundary: Ground tile at Y = 0
        const isDark = matrix[r][c] === 1;
        const finder = getFinderRole(r, c, size);

        // Ground stone paver for light modules and walkways
        voxels.push({
          x,
          y: 0,
          z,
          color: pickRandom(theme.stonePaver, h),
          role: "stone",
          isQrDark: isDark,
        });

        // 2. FINDER PATTERNS (Styled as manicured garden hedges & stone plinths)
        if (finder === "hedge") {
          // 7x7 outer square hedge wall (height 1 to 2)
          voxels.push({
            x,
            y: 1,
            z,
            color: pickRandom(theme.hedgeColor, h),
            role: "hedge",
            isQrDark: true,
          });
          if (h > 0.4) {
            voxels.push({
              x,
              y: 2,
              z,
              color: pickRandom(theme.leafHighlight, h),
              role: "hedge",
              isQrDark: true,
            });
          }
        } else if (finder === "flower") {
          // 3x3 center garden planter
          voxels.push({
            x,
            y: 1,
            z,
            color: pickRandom(theme.hedgeColor, h),
            role: "flower",
            isQrDark: true,
          });
          voxels.push({
            x,
            y: 2,
            z,
            color: theme.accentColor,
            role: "flower",
            isQrDark: true,
          });
        } else if (isDark && !isFinderPattern(r, c, size)) {
          // 3. TREE CANOPY & TRUNK (The data modules)
          const dist = Math.hypot(x, z);
          const maxDist = center * 1.35;
          const normDist = Math.min(1, dist / maxDist);

          // Dome height formula: Center is tall (Y ~ 14..18), slopes gracefully to edges (Y ~ 4..7)
          const domeHeight = Math.max(
            3,
            Math.round(16 * Math.cos(normDist * (Math.PI / 2.2)) + (h - 0.5) * 4)
          );

          // Center trunk area (dist <= 3.2): Wood voxels going up from floor
          const isTrunkColumn = dist <= 3.2;
          if (isTrunkColumn) {
            // Full vertical wood trunk column
            const trunkH = Math.min(domeHeight - 1, 10);
            for (let ty = 1; ty <= trunkH; ty++) {
              voxels.push({
                x,
                y: ty,
                z,
                color: pickRandom(theme.trunkPrimary, coordHash(x + ty, z + ty, 202)),
                role: "trunk",
                isQrDark: true,
              });
            }
          }

          // Branch scaffolds for mid-distance (3.2 < dist <= 7.5)
          if (!isTrunkColumn && dist <= 7.5 && h > 0.45) {
            const branchY = Math.round(domeHeight * 0.45);
            voxels.push({
              x,
              y: branchY,
              z,
              color: pickRandom(theme.trunkPrimary, h),
              role: "branch",
              isQrDark: true,
            });
          }

          // Canopy Foliage: Layered organic leaf clusters
          // Place leaf voxels from (domeHeight - thickness) up to domeHeight
          const thickness = isTrunkColumn ? 4 : h > 0.5 ? 3 : 2;
          const startY = Math.max(1, domeHeight - thickness + 1);

          for (let ly = startY; ly <= domeHeight; ly++) {
            let leafColor: string;
            if (ly === domeHeight) {
              // Top sun-lit highlight
              leafColor = pickRandom(theme.leafHighlight, coordHash(x, z + ly, 303));
            } else if (ly === startY) {
              // Underside deep shadow
              leafColor = pickRandom(theme.leafShadow, coordHash(x + ly, z, 404));
            } else {
              // Core lush body
              leafColor = pickRandom(theme.leafPrimary, coordHash(x, z, 505));
            }

            voxels.push({
              x,
              y: ly,
              z,
              color: leafColor,
              role: "leaf",
              isQrDark: true,
            });
          }
        }
      }
    }
  }

  return voxels;
}

/**
 * Generate 3D Voxels for the Satria / Gatotkaca Warrior Statue Mode
 * Uses the user-provided pixel art character (/pixel/README.md.png) concept:
 * Golden winged crown, star chest emblem, black ponytail, blue sash, red scarf!
 */
export function generateVoxelSatria(
  matrix: number[][],
  size: number,
  season: SeasonType = "satria"
): VoxelItem[] {
  // First get base courtyard & tree/temple structure
  const voxels = generateVoxelTree(matrix, size, season);

  // Satria Gatotkaca 3D Voxel Hero placed on top of the central plinth
  const satriaHeroVoxels: { dx: number; dy: number; dz: number; color: string }[] = [
    // Legs & Sandals (Y: 1..4)
    { dx: -1, dy: 1, dz: 0, color: "#78350F" },
    { dx: 1, dy: 1, dz: 0, color: "#78350F" },
    { dx: -1, dy: 2, dz: 0, color: "#1C1917" },
    { dx: 1, dy: 2, dz: 0, color: "#1C1917" },
    { dx: -1, dy: 3, dz: 0, color: "#1C1917" },
    { dx: 1, dy: 3, dz: 0, color: "#1C1917" },
    { dx: -1, dy: 4, dz: 0, color: "#2563EB" }, // Blue Sarong
    { dx: 0, dy: 4, dz: 0, color: "#DC2626" },  // Red Center Sash
    { dx: 1, dy: 4, dz: 0, color: "#2563EB" },

    // Torso & Gold Star Armor (Y: 5..8)
    { dx: -1, dy: 5, dz: 0, color: "#EAB308" },
    { dx: 0, dy: 5, dz: 0, color: "#EAB308" },
    { dx: 1, dy: 5, dz: 0, color: "#EAB308" },
    { dx: -1, dy: 6, dz: 0, color: "#18181B" },
    { dx: 0, dy: 6, dz: 0, color: "#FEF08A" }, // Bintang Emas Pusat
    { dx: 1, dy: 6, dz: 0, color: "#18181B" },
    { dx: -1, dy: 7, dz: 0, color: "#EAB308" },
    { dx: 0, dy: 7, dz: 0, color: "#FEF08A" },
    { dx: 1, dy: 7, dz: 0, color: "#EAB308" },

    // Gold Shoulder Plates & Gauntlets
    { dx: -2, dy: 7, dz: 0, color: "#FACC15" },
    { dx: 2, dy: 7, dz: 0, color: "#FACC15" },
    { dx: -2, dy: 6, dz: 0, color: "#CA8A04" },
    { dx: 2, dy: 6, dz: 0, color: "#CA8A04" },
    { dx: -2, dy: 5, dz: 0, color: "#F59E0B" },
    { dx: 2, dy: 5, dz: 0, color: "#F59E0B" },

    // Head, Face & Mustache (Y: 9..10)
    { dx: 0, dy: 8, dz: 0, color: "#D97706" }, // Leher
    { dx: -1, dy: 9, dz: 0, color: "#FDE68A" },
    { dx: 0, dy: 9, dz: 0, color: "#FDE68A" },
    { dx: 1, dy: 9, dz: 0, color: "#FDE68A" },
    { dx: 0, dy: 9, dz: 1, color: "#18181B" }, // Kumis / Mata

    // Mahkota / Winged Golden Headdress & Ponytail (Y: 10..13)
    { dx: -1, dy: 10, dz: 0, color: "#EAB308" },
    { dx: 0, dy: 10, dz: 0, color: "#FACC15" },
    { dx: 1, dy: 10, dz: 0, color: "#EAB308" },
    { dx: -2, dy: 11, dz: 0, color: "#FEF08A" }, // Sayap Mahkota Kiri
    { dx: 0, dy: 11, dz: 0, color: "#FACC15" },
    { dx: 2, dy: 11, dz: 0, color: "#FEF08A" }, // Sayap Mahkota Kanan
    { dx: 0, dy: 12, dz: 0, color: "#CA8A04" }, // Puncak Mahkota
    { dx: 0, dy: 11, dz: -1, color: "#09090B" }, // Kuncir Rambut Hitam Belakang
    { dx: 0, dy: 10, dz: -1, color: "#09090B" },
    { dx: 0, dy: 9, dz: -1, color: "#09090B" },
  ];

  // Base height offset for Satria statue
  const satriaBaseY = 8;
  for (const s of satriaHeroVoxels) {
    voxels.push({
      x: s.dx,
      y: satriaBaseY + s.dy,
      z: s.dz,
      color: s.color,
      role: "satria",
      isQrDark: true,
    });
  }

  return voxels;
}

/**
 * Generate Falling Particles (Leaves / Blossom / Sparkles)
 */
export function generateParticles(count = 60, season: SeasonType = "summer") {
  const theme = SEASONS[season];
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: (Math.random() - 0.5) * 28,
      y: 6 + Math.random() * 16,
      z: (Math.random() - 0.5) * 28,
      speed: 0.04 + Math.random() * 0.05,
      swaySpeed: 1 + Math.random() * 1.5,
      swayPhase: Math.random() * Math.PI * 2,
      color: theme.particleColors[i % theme.particleColors.length],
      size: 0.35 + Math.random() * 0.25,
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
        x: v.x,
        y: v.y,
        z: v.z,
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
    csv += `${v.x},${v.y},${v.z},${v.color},${v.role}\n`;
  }
  return csv;
}

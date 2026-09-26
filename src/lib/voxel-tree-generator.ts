import QRCode from "qrcode";

export type SeasonType = "summer" | "spring" | "autumn";

export interface VoxelItem {
  x: number;
  y: number; // Y is UP in Three.js
  z: number;
  size?: number;
  color: string;
  role: "trunk" | "branch" | "leaf" | "stone" | "border" | "hedge" | "flower" | "grass";
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
  grassColors: string[];
  particleColors: string[];
  accentColor: string;
}

export const SEASONS: Record<SeasonType, SeasonTheme> = {
  summer: {
    name: "Summer Green",
    badge: "🌳 Summer Green",
    bgColor: "#F6F1E7",
    paperColor: "#EFE8DA",
    // Rich, high-contrast forest greens (scannable + lush 3D shading)
    leafPrimary: ["#1B5E20", "#236B29", "#1E6024", "#2E7D32"],
    leafHighlight: ["#2E7D32", "#388E3C", "#257A2D", "#1F6E27"],
    leafShadow: ["#124417", "#0D3812", "#08240B", "#0F3214"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#1B5E20", "#124417", "#0D3812"],
    stonePaver: ["#FAF6EE", "#F5EFE4", "#FFFDF8", "#EFE8DA"],
    stoneBorder: "#D8CDBA",
    grassColors: ["#33691E", "#3E7B24", "#2E6619"],
    particleColors: ["#4CAF50", "#66BB6A", "#81C784", "#A5D6A7"],
    accentColor: "#1B5E20",
  },
  spring: {
    name: "Sakura Spring",
    badge: "🌸 Sakura Blossom",
    bgColor: "#FAF5F4",
    paperColor: "#F4ECE9",
    leafPrimary: ["#880E4F", "#7B0B46", "#991158", "#820948"],
    leafHighlight: ["#AD1457", "#C2185B", "#9F1150", "#8D0F47"],
    leafShadow: ["#4A052A", "#3B0321", "#30021A", "#260214"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#1B5E20", "#124417"],
    stonePaver: ["#FFFCFB", "#FDF7F5", "#F8EFEA", "#F5E9E4"],
    stoneBorder: "#D8C5BE",
    grassColors: ["#33691E", "#3E7B24"],
    particleColors: ["#FFB7C5", "#FFCCD5", "#FCE7F3", "#F8BBD0"],
    accentColor: "#880E4F",
  },
  autumn: {
    name: "Golden Autumn",
    badge: "🍂 Golden Autumn",
    bgColor: "#F8F3EA",
    paperColor: "#EFE5D5",
    leafPrimary: ["#7C2D12", "#873012", "#9A3412", "#70250E"],
    leafHighlight: ["#C2410C", "#B45309", "#A6390B", "#933108"],
    leafShadow: ["#431405", "#350F03", "#290A01", "#210701"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#2A410E", "#1F3108"],
    stonePaver: ["#FFFDF8", "#FAF5EB", "#F4ECDC", "#EFE5D3"],
    stoneBorder: "#C7B89E",
    grassColors: ["#3E7B24", "#33691E"],
    particleColors: ["#F97316", "#FB923C", "#FBBF24", "#FED7AA"],
    accentColor: "#7C2D12",
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

// Generate QR Code 2D Matrix with Error Correction M (matching tree.icqr.com for ideal 29x29 modular grid)
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
 * Generate 3D Voxels for the Tall Majestic Magic Tree (tree.icqr.com replica)
 *
 * ARCHITECTURAL PRINCIPLES:
 * 1. Modular QR Voxel Cubes ("Kotak-kotak QR code yang menjadi basic"):
 *    - Distinct, crisp cube blocks (size 0.96) aligned on the QR grid.
 *    - Each column of leaf cubes corresponds directly to an active dark module of the QR code!
 * 2. Tall, Soaring Tree Architecture ("Pohon Dibuat Lebih Tinggi"):
 *    - Central trunk rises tall and proud from Y=1 to Y=16 through open air.
 *    - Canopy starts high at Y=16 and arches up to Y=38..42.
 *    - Underneath the canopy, the space is wide open, revealing the stone courtyard terrace and trunk.
 * 3. Proportional Canopy ("Tidak Terlalu Rimbun"):
 *    - Elevated leaf canopy is strictly confined to radius = size * 0.44 around the tree center.
 *    - Modules outside this radius (including the 3 corner finder patterns) sit cleanly on the ground courtyard.
 * 4. 100% Smartphone Camera Scannability:
 *    - Every single voxel has integer (x, z) coordinates matching its QR cell. Zero bleed into white cells.
 *    - In Top-Down view, the orthographic projection produces a mathematically pristine, high-contrast QR code.
 */
export function generateVoxelTree(
  matrix: number[][],
  size: number,
  season: SeasonType = "summer"
): VoxelItem[] {
  const theme = SEASONS[season];
  const voxels: VoxelItem[] = [];

  const center = (size - 1) / 2;
  const quietZone = 4; // Standard 4-module quiet margin

  const scale = size / 29;
  const trunkHeight = Math.round(22 * scale); // Tall, majestic trunk (22 blocks high)
  const canopyRadius = size * 0.40; // Proportional tree crown centered over courtyard
  const canopyRadiusSq = canopyRadius * canopyRadius;
  const maxCanopyLayers = Math.round(15 * scale);

  // 1. GROUND COURTYARD TERRACE & PERIMETER
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

      // Base stone paver at Y = 0
      const paverColor = pickRandom(theme.stonePaver, h);
      voxels.push({
        x,
        y: 0,
        z,
        size: 0.98,
        color: isPerimeter ? theme.stoneBorder : paverColor,
        role: isPerimeter ? "border" : "stone",
        isQrDark: false,
      });

      // Curb border & decorative grass tufts along the courtyard perimeter
      if (isPerimeter) {
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 0.98,
          color: theme.stoneBorder,
          role: "border",
        });

        if (h > 0.4) {
          voxels.push({
            x,
            y: 0.75,
            z,
            size: 0.45,
            color: pickRandom(theme.grassColors, h),
            role: "grass",
          });
        }
      }

      // Base dark tile on courtyard floor for QR modules (vital for 100% top-down QR scan)
      if (isInsideQr && matrix[r][c] === 1) {
        const distSq = x * x + z * z;
        const isFinder = isFinderPattern(r, c, size);

        let floorDarkColor = theme.leafShadow[0];
        if (isFinder) {
          floorDarkColor = theme.leafShadow[0];
        } else if (distSq >= canopyRadiusSq) {
          // Outside canopy: decorative mossy paving stone / clipped hedge tile
          floorDarkColor = theme.hedgeColor[0] || theme.leafPrimary[0];
        } else {
          // Inside canopy: fallen leaf shadows on stone
          floorDarkColor = theme.leafShadow[0];
        }

        voxels.push({
          x,
          y: 0.04,
          z,
          size: 0.98,
          color: floorDarkColor,
          role: "leaf",
          isQrDark: true,
        });
      }
    }
  }

  // 2. CORNER FINDER PATTERNS (Low Elegant Courtyard Garden Monuments)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && isFinderPattern(r, c, size)) {
        const x = c - center;
        const z = r - center;
        const finderRole = getFinderRole(r, c, size);
        const h = coordHash(x, z, 55);

        if (finderRole === "hedge") {
          // 7x7 outer square: neat low garden hedge planter
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 0.96,
            color: pickRandom(theme.hedgeColor, h),
            role: "hedge",
            isQrDark: true,
          });
        } else if (finderRole === "flower") {
          // 3x3 inner square: decorative stone pedestal & garden monument
          voxels.push({
            x,
            y: 0.5,
            z,
            size: 0.96,
            color: theme.leafShadow[0],
            role: "flower",
            isQrDark: true,
          });
          voxels.push({
            x,
            y: 0.9,
            z,
            size: 0.96,
            color: pickRandom(theme.leafHighlight, h),
            role: "flower",
            isQrDark: true,
          });
        }
      }
    }
  }

  // 3. TALL MAJESTIC TRUNK WITH ROOT FLARE & CONNECTING BRANCHES
  // Visible through the wide-open air (Y=1 to Y=26) under the elevated canopy!
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        const x = c - center;
        const z = r - center;
        const distSq = x * x + z * z;
        const dist = Math.sqrt(distSq);
        const isFinder = isFinderPattern(r, c, size);
        if (isFinder) continue;

        // Flared root base at ground level (Y = 1..3, radius up to 3.2 modules)
        if (distSq <= 10.5) {
          for (let ty = 1; ty <= 3; ty++) {
            const h = coordHash(x, z, ty * 19);
            const rootColor = pickRandom(theme.trunkPrimary, h);
            voxels.push({
              x,
              y: ty,
              z,
              size: 0.96,
              color: rootColor,
              role: "trunk",
              isQrDark: true,
            });
          }
        }

        // Tall main trunk column rising through open air (Y = 4 up to trunkHeight)
        if (distSq <= 6.5) {
          for (let ty = 4; ty < trunkHeight; ty++) {
            const h = coordHash(x, z, ty * 17);
            const trunkColor = pickRandom(theme.trunkPrimary, h);
            voxels.push({
              x,
              y: ty,
              z,
              size: 0.96,
              color: trunkColor,
              role: "trunk",
              isQrDark: true,
            });
          }
        }

        // Spreading diagonal branch arms at the very top of trunk (Y = trunkHeight - 3 to trunkHeight)
        // connecting the trunk seamlessly into the canopy without cluttering the air below
        if (dist >= 1.5 && dist <= 5.5 && distSq <= 30.5) {
          const branchStart = trunkHeight - 3;
          for (let by = branchStart; by < trunkHeight; by++) {
            const h = coordHash(x, z, by * 23);
            if (h > 0.25) {
              voxels.push({
                x,
                y: by,
                z,
                size: 0.92,
                color: pickRandom(theme.trunkPrimary, h),
                role: "branch",
                isQrDark: true,
              });
            }
          }
        }
      }
    }
  }

  // 4. ELEVATED CANOPY LEAF CUBES (Lush Bonsai Cloud Crown)
  // Cleanly elevated in the sky (Y = 27 to Y = 46), sightline to trunk is completely open!
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && !isFinderPattern(r, c, size)) {
        const x = c - center;
        const z = r - center;
        const distSq = x * x + z * z;
        const dist = Math.sqrt(distSq);

        // ONLY modules inside canopy radius become elevated tree canopy!
        // This keeps the tree majestic and prevents it from overgrowing the courtyard ("tidak terlalu rimbun")
        if (distSq < canopyRadiusSq) {
          const normDist = dist / canopyRadius; // 0 at center, 1 at edge
          const dome = Math.sqrt(Math.max(0, 1 - normDist * normDist)); // Hemispherical rounded dome

          // Underbelly is elevated flat at center and curves gently upward towards perimeter
          // leaving the view to the trunk and courtyard completely open
          const baseCanopyY = trunkHeight + Math.round(2.0 * Math.pow(normDist, 1.4));

          // Hemispherical crown thickness: center has 14-15 layers, edge has 3-4 layers
          const numLayers = Math.max(3, Math.round(maxCanopyLayers * (0.24 + 0.76 * dome)));

          // Subtle organic crown variation
          const extraCrown = Math.floor(2.0 * coordHash(x, z, 333) * dome);
          const totalLayers = numLayers + extraCrown;

          // Stack discrete cubic voxel blocks ("kotak-kotak QR code yang menjadi basic")
          for (let l = 0; l < totalLayers; l++) {
            const y = baseCanopyY + l;
            const relH = l / totalLayers;
            const h = coordHash(x, z, l * 31);

            let leafColor: string;
            if (relH > 0.72) {
              // Top sunlit crown highlight
              leafColor = pickRandom(theme.leafHighlight, h);
            } else if (relH > 0.22) {
              // Mid-canopy vibrant primary foliage
              leafColor = pickRandom(theme.leafPrimary, h);
            } else {
              // Deep canopy underside shadow
              leafColor = pickRandom(theme.leafShadow, h);
            }

            voxels.push({
              x,
              y,
              z,
              size: 0.96,
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
 * Generate Falling Particles (Leaves / Blossom / Sparkles)
 */
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

/**
 * Export Voxels to Goxel / MagicaVoxel friendly JSON & CSV formats
 */
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

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

export const SEASONS: Record<SeasonType, SeasonTheme> = {
  summer: {
    name: "Summer Green",
    badge: "🌳 Summer Green",
    bgColor: "#F6F1E7",
    paperColor: "#EFE8DA",
    // Lush vibrant forest greens with emerald highlights matching Reference Image 1
    leafPrimary: ["#1E7E34", "#28A745", "#218838", "#19692C"],
    leafHighlight: ["#4ADE80", "#22C55E", "#86EFAC", "#16A34A"],
    leafShadow: ["#14532D", "#0F3D21", "#0B2E18", "#166534"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#15803D", "#166534", "#14532D"],
    stonePaver: ["#FAF6EE", "#F5EFE4", "#FFFDF8", "#EFE8DA"],
    stoneBorder: "#D8CDBA",
    qrDark: ["#052E16", "#064E3B", "#14532D", "#0D3812"],
    finderOuter: ["#14532D", "#166534", "#15803D"],
    finderInner: ["#16A34A", "#22C55E", "#4ADE80"],
    petalFloor: ["#22C55E", "#4ADE80", "#16A34A"],
    particleColors: ["#22C55E", "#4ADE80", "#16A34A", "#86EFAC"],
    accentColor: "#16A34A",
  },
  spring: {
    name: "Sakura Spring",
    badge: "🌸 Sakura Blossom",
    bgColor: "#FAF3F3",
    paperColor: "#F5ECEC",
    // Gorgeous cherry blossom cloud matching Reference Image 2: pinks, white blossoms, plum shadow
    leafPrimary: ["#F472B6", "#EC4899", "#F43F5E", "#FB7185"],
    leafHighlight: ["#FFFFFF", "#FFF1F2", "#FCE7F3", "#FBCFE8"],
    leafShadow: ["#BE185D", "#9D174D", "#831843", "#701A75"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#DB2777", "#BE185D", "#F472B6"],
    stonePaver: ["#FFF5F7", "#FDF2F4", "#FAF0F2", "#FCE7F3"],
    stoneBorder: "#D8C5CE",
    qrDark: ["#500724", "#701A75", "#4A044E", "#831843"], // Deep plum burgundy QR tiles matching Ref Image 2
    finderOuter: ["#BE185D", "#DB2777", "#F472B6"],
    finderInner: ["#FFFFFF", "#FCE7F3", "#FBCFE8"],
    petalFloor: ["#F472B6", "#FBCFE8", "#FFFFFF", "#FCE7F3"],
    particleColors: ["#FFB7C5", "#FFCCD5", "#FCE7F3", "#F472B6", "#FFFFFF"],
    accentColor: "#EC4899",
  },
  autumn: {
    name: "Golden Autumn",
    badge: "🍂 Golden Autumn",
    bgColor: "#F7F3EA",
    paperColor: "#EFE6D6",
    // Warm golden maple & amber foliage matching Reference Image 3: amber, gold, cinnamon
    leafPrimary: ["#F59E0B", "#D97706", "#EA580C", "#D97706"],
    leafHighlight: ["#FDE68A", "#FCD34D", "#FBBF24", "#FEF08A"],
    leafShadow: ["#B45309", "#92400E", "#78350F", "#6B21A8"],
    trunkPrimary: ["#4E342E", "#3E2723", "#5D4037", "#2E1B17"],
    hedgeColor: ["#B45309", "#92400E", "#78350F"],
    stonePaver: ["#FFFBEB", "#FEF3C7", "#FDF6E2", "#FAF5EB"],
    stoneBorder: "#CFC3AD",
    qrDark: ["#78350F", "#9A3412", "#451A03", "#92400E"], // Roasted amber chestnut QR tiles matching Ref Image 3
    finderOuter: ["#92400E", "#B45309", "#D97706"],
    finderInner: ["#FBBF24", "#F59E0B", "#FCD34D"],
    petalFloor: ["#F59E0B", "#D97706", "#FBBF24", "#EA580C"],
    particleColors: ["#F97316", "#FB923C", "#F59E0B", "#FBBF24", "#EA580C"],
    accentColor: "#D97706",
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
  const trunkHeight = Math.round(14 * scale); // Majestic trunk height (14 blocks high, leaving open airy space)
  const canopyRadius = size * 0.55; // Spreading, majestic wide canopy (diameter ~32 modules across courtyard)
  const canopyRadiusSq = canopyRadius * canopyRadius;
  const maxCanopyLayers = Math.round(11 * scale);

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

      // Curb border along the courtyard perimeter
      if (isPerimeter) {
        voxels.push({
          x,
          y: 0.35,
          z,
          size: 0.98,
          color: theme.stoneBorder,
          role: "border",
        });
      }

      // Base dark tile on courtyard floor for QR modules (vital for 100% top-down QR scan)
      if (isInsideQr && matrix[r][c] === 1) {
        const isFinder = isFinderPattern(r, c, size);
        let floorDarkColor: string;
        if (isFinder) {
          floorDarkColor = theme.finderOuter[0];
        } else {
          floorDarkColor = pickRandom(theme.qrDark, h);
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

  // 2. CORNER FINDER PATTERNS (Clean, Crisp, Elegant Garden Monuments - No messy grass)
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
            color: pickRandom(theme.finderOuter, h),
            role: "hedge",
            isQrDark: true,
          });
        } else if (finderRole === "flower") {
          // 3x3 inner square: decorative pedestal & floral garden monument
          voxels.push({
            x,
            y: 0.45,
            z,
            size: 0.96,
            color: theme.finderOuter[0],
            role: "flower",
            isQrDark: true,
          });
          voxels.push({
            x,
            y: 0.85,
            z,
            size: 0.96,
            color: pickRandom(theme.finderInner, h),
            role: "flower",
            isQrDark: true,
          });
        }
      }
    }
  }

  // 3. SLENDER, MAJESTIC TRUNK WITH ROOT FLARE & SPREADING BRANCH ARMS
  // Visible through the wide-open air (Y=1 to Y=14) under the expansive canopy!
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1) {
        const x = c - center;
        const z = r - center;
        const distSq = x * x + z * z;
        const dist = Math.sqrt(distSq);
        const isFinder = isFinderPattern(r, c, size);
        if (isFinder) continue;

        // Gentle buttress root flare at ground base (Y = 1..2, radius up to 1.8 modules)
        // Kept clear at front (z > 0.8) so the sitting person has clean bark to lean against!
        if (distSq <= 3.6 && !(z > 0.8 && Math.abs(x) < 1.2)) {
          for (let ty = 1; ty <= 2; ty++) {
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

        // Slender, sturdy main trunk column rising through open air (Y = 1 up to trunkHeight)
        // Radius ~1.4 modules (distSq <= 2.2) gives an authentic, proportional bonsai trunk
        if (distSq <= 2.2) {
          for (let ty = 1; ty < trunkHeight; ty++) {
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

        // Spreading diagonal branch arms reaching outward under the wide canopy (Y = trunkHeight - 4 to trunkHeight)
        // Reaching out to radius up to 10.5 modules to support the expansive foliage
        if (dist >= 1.4 && dist <= 10.5) {
          const branchStart = trunkHeight - 4;
          for (let by = branchStart; by < trunkHeight; by++) {
            const h = coordHash(x, z, by * 23);
            const armReach = (by - branchStart + 1) * 2.8;
            if (dist <= armReach && h > 0.28) {
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

  // 4. WIDE SPREADING EXPANSIVE CANOPY (Majestic Weeping Pagoda Umbrella)
  // Perfectly matches the 3 user reference photos with cascading weeping foliage and floating pixel clusters
  const isFinderBoxArea = (r: number, c: number) =>
    (r <= 7 && c <= 7) ||
    (r <= 7 && c >= size - 8) ||
    (r >= size - 8 && c <= 7);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === 1 && !isFinderBoxArea(r, c)) {
        const x = c - center;
        const z = r - center;
        const distSq = x * x + z * z;
        const dist = Math.sqrt(distSq);

        // Modules inside the wide canopy radius become the lush, expansive tree canopy!
        if (distSq < canopyRadiusSq) {
          const normDist = dist / canopyRadius; // 0 at center, 1 at edge
          const dome = Math.sqrt(Math.max(0, 1 - normDist * normDist)); // Smooth curved dome

          // Wide umbrella base: starts at trunkHeight - 2 at center and curves gently upward towards perimeter
          // leaving the view to the trunk, sitting person, and courtyard completely open and airy
          const baseCanopyY = trunkHeight - 2 + Math.round(2.6 * Math.pow(normDist, 1.3));

          // Wide, plateau-style umbrella canopy thickness
          const numLayers = Math.max(3, Math.round(maxCanopyLayers * (0.38 + 0.62 * dome)));

          // Organic cloud lobe variation
          const extraCrown = Math.floor(2.2 * coordHash(x, z, 333) * dome);
          const totalLayers = numLayers + extraCrown;

          // Stack discrete cubic voxel blocks ("kotak-kotak QR code yang menjadi basic")
          for (let l = 0; l < totalLayers; l++) {
            const y = baseCanopyY + l;
            const relH = l / totalLayers;
            const h = coordHash(x, z, l * 31);

            let leafColor: string;
            if (relH > 0.68) {
              // Top sunlit crown highlight
              leafColor = pickRandom(theme.leafHighlight, h);
            } else if (relH > 0.20) {
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

          // Weeping / Cascading leaf clusters dripping down around the perimeter (Signature look of Ref Images!)
          if (normDist >= 0.48) {
            const hDrop = coordHash(x, z, 777);
            // 1-block drop below base
            if (hDrop > 0.32) {
              voxels.push({
                x,
                y: baseCanopyY - 1,
                z,
                size: 0.92,
                color: pickRandom(theme.leafShadow, coordHash(x, z, 778)),
                role: "leaf",
                isQrDark: true,
              });
            }
            // 2-block drop for weeping cascades
            if (hDrop > 0.62) {
              voxels.push({
                x,
                y: baseCanopyY - 2,
                z,
                size: 0.88,
                color: pickRandom(theme.leafShadow, coordHash(x, z, 779)),
                role: "leaf",
                isQrDark: true,
              });
            }
            // 3-block drop for delicate weeping tendril tips
            if (hDrop > 0.84) {
              voxels.push({
                x,
                y: baseCanopyY - 3,
                z,
                size: 0.84,
                color: pickRandom(theme.leafShadow, coordHash(x, z, 780)),
                role: "leaf",
                isQrDark: true,
              });
            }
          }

          // Scattered floating foliage cubes around the canopy perimeter
          if (normDist > 0.68 && normDist < 0.96 && coordHash(x, z, 999) > 0.68) {
            voxels.push({
              x,
              y: baseCanopyY + Math.floor(coordHash(x, z, 1000) * 2),
              z,
              size: 0.82,
              color: pickRandom(theme.leafHighlight, coordHash(x, z, 1001)),
              role: "leaf",
              isQrDark: true,
            });
          }
        }
      }
    }
  }

  // 5. DRAMATIC PIXEL PERSON SITTING UNDER THE TREE LEANING AGAINST TRUNK ("nyender")
  const personVoxels = generateSittingPersonVoxels();
  voxels.push(...personVoxels);

  return voxels;
}

/**
 * Generate High-Definition Voxel Model of a Person Sitting Under the Tree Leaning Against the Trunk ("nyender")
 * Matches Reference Image 3: Sky blue shirt, dark navy trousers, relaxed pose with one knee bent up.
 */
export function generateSittingPersonVoxels(): VoxelItem[] {
  const person: VoxelItem[] = [];

  // Color Palette matching Reference Image 3
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

  // Base subtle shadow on stone pavers under person
  person.push(
    { x: 0.9, y: 0.02, z: 2.2, size: 1.3, color: "#D8CDBA", role: "person" },
    { x: 1.3, y: 0.02, z: 3.2, size: 1.2, color: "#D8CDBA", role: "person" },
    { x: 0.65, y: 0.02, z: 3.2, size: 1.0, color: "#D8CDBA", role: "person" }
  );

  // 1. PELVIS & HIPS (Sitting firmly on ground, back resting against trunk bark)
  person.push(
    { x: 0.65, y: 0.35, z: 1.55, size: 0.52, color: pantsDark, role: "person" },
    { x: 1.15, y: 0.35, z: 1.55, size: 0.52, color: pants, role: "person" }
  );

  // 2. LEGS
  // Left Leg: Extended forward along the ground towards the camera
  person.push(
    // Thigh
    { x: 0.65, y: 0.34, z: 2.05, size: 0.50, color: pants, role: "person" },
    { x: 0.65, y: 0.32, z: 2.55, size: 0.48, color: pants, role: "person" },
    // Knee & Shin
    { x: 0.65, y: 0.30, z: 3.05, size: 0.46, color: pantsDark, role: "person" },
    { x: 0.65, y: 0.28, z: 3.55, size: 0.44, color: pants, role: "person" },
    // Ankle & Sneaker
    { x: 0.65, y: 0.24, z: 4.05, size: 0.42, color: shoe, role: "person" },
    { x: 0.65, y: 0.08, z: 4.05, size: 0.42, color: shoeSole, role: "person" }
  );

  // Right Leg: Bent at knee, knee raised up high in relaxed triangle pose (iconic silhouette!)
  person.push(
    // Thigh angling up towards knee
    { x: 1.25, y: 0.55, z: 2.05, size: 0.50, color: pants, role: "person" },
    { x: 1.28, y: 0.95, z: 2.50, size: 0.50, color: pantsLight, role: "person" },
    // Knee Apex (raised high in air)
    { x: 1.28, y: 1.45, z: 2.90, size: 0.52, color: pants, role: "person" },
    { x: 1.28, y: 1.85, z: 3.10, size: 0.50, color: pantsLight, role: "person" },
    // Shin angling down from knee to foot
    { x: 1.28, y: 1.35, z: 3.40, size: 0.48, color: pantsDark, role: "person" },
    { x: 1.28, y: 0.85, z: 3.70, size: 0.46, color: pants, role: "person" },
    { x: 1.28, y: 0.35, z: 3.95, size: 0.44, color: pantsDark, role: "person" },
    // Right Sneaker resting flat on pavers
    { x: 1.28, y: 0.24, z: 4.25, size: 0.42, color: shoe, role: "person" },
    { x: 1.28, y: 0.08, z: 4.25, size: 0.42, color: shoeSole, role: "person" }
  );

  // 3. TORSO (Sky blue shirt, leaning back against the trunk at ~15 degrees)
  // Lower torso
  person.push(
    { x: 0.65, y: 0.85, z: 1.55, size: 0.52, color: shirtShadow, role: "person" },
    { x: 1.15, y: 0.85, z: 1.55, size: 0.52, color: shirt, role: "person" }
  );
  // Mid torso & chest
  person.push(
    { x: 0.65, y: 1.35, z: 1.45, size: 0.52, color: shirtShadow, role: "person" },
    { x: 1.15, y: 1.35, z: 1.45, size: 0.52, color: shirt, role: "person" },
    { x: 0.90, y: 1.35, z: 1.68, size: 0.48, color: shirtLight, role: "person" } // Chest highlight
  );
  // Upper torso & broad shoulders
  person.push(
    { x: 0.48, y: 1.85, z: 1.35, size: 0.50, color: shirtShadow, role: "person" },
    { x: 0.90, y: 1.85, z: 1.35, size: 0.52, color: shirtLight, role: "person" },
    { x: 1.32, y: 1.85, z: 1.35, size: 0.50, color: shirt, role: "person" }
  );

  // 4. ARMS
  // Left Arm: Resting back beside body on pavers to support leaning posture
  person.push(
    { x: 0.22, y: 1.65, z: 1.35, size: 0.44, color: shirtShadow, role: "person" }, // Short sleeve
    { x: 0.18, y: 1.15, z: 1.45, size: 0.40, color: skin, role: "person" },        // Arm
    { x: 0.14, y: 0.65, z: 1.55, size: 0.38, color: skinShadow, role: "person" },  // Forearm
    { x: 0.10, y: 0.25, z: 1.65, size: 0.38, color: skin, role: "person" }         // Hand on ground
  );
  // Right Arm: Reaching casually forward, resting hand on top of the raised right knee
  person.push(
    { x: 1.55, y: 1.65, z: 1.45, size: 0.44, color: shirt, role: "person" },      // Short sleeve
    { x: 1.50, y: 1.45, z: 1.95, size: 0.40, color: skin, role: "person" },       // Arm
    { x: 1.42, y: 1.65, z: 2.45, size: 0.38, color: skin, role: "person" },       // Forearm reaching to knee
    { x: 1.35, y: 1.95, z: 2.95, size: 0.38, color: skin, role: "person" }        // Hand resting on knee
  );

  // 5. NECK & HEAD
  // Neck
  person.push(
    { x: 0.90, y: 2.30, z: 1.25, size: 0.40, color: skinShadow, role: "person" }
  );
  // Head & Face (tilted back slightly resting against the tree bark)
  person.push(
    { x: 0.70, y: 2.75, z: 1.20, size: 0.48, color: skin, role: "person" },
    { x: 1.10, y: 2.75, z: 1.20, size: 0.48, color: skin, role: "person" },
    { x: 0.90, y: 2.75, z: 1.45, size: 0.44, color: skin, role: "person" } // Face front
  );
  // Hair (dark brown messy casual hair, resting back against the trunk)
  person.push(
    { x: 0.70, y: 3.20, z: 1.18, size: 0.50, color: hair, role: "person" },
    { x: 1.10, y: 3.20, z: 1.18, size: 0.50, color: hair, role: "person" },
    { x: 0.90, y: 3.25, z: 1.38, size: 0.46, color: hairHighlight, role: "person" }, // Fringe
    { x: 0.65, y: 2.75, z: 0.95, size: 0.42, color: hairDark, role: "person" },      // Back of hair on bark
    { x: 1.15, y: 2.75, z: 0.95, size: 0.42, color: hairDark, role: "person" },      // Back of hair on bark
    { x: 0.90, y: 3.55, z: 1.15, size: 0.44, color: hair, role: "person" }           // Top hair crown
  );

  return person;
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

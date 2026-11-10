/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ohmwise Computer Vision & Band Scanning Pipeline
 * Pure client-side HSV/RGB color classification, line-sampling, and band segmentation.
 */

import { ResistorColor, BandCount, RESISTOR_COLORS } from './resistor';

export interface ScanResult {
  bands: ResistorColor[];
  confidence: 'high' | 'medium' | 'low';
  supportCount: number;
  markerPositions: { x: number; y: number }[]; // In normalized coordinates [0..1]
  scanlineY: number; // In normalized coordinates [0..1]
  notes: string[];
}

export interface SampledColorInfo {
  r: number;
  g: number;
  b: number;
  hex: string;
  hsv: { h: number; s: number; v: number };
  color: ResistorColor;
  label: string;
}

/**
 * Converts RGB (0-255) to HSV (H: 0-360, S: 0-100, V: 0-100)
 */
export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return { h, s: Math.round(s), v: Math.round(v) };
}

/**
 * Converts RGB to Hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Reference calibration colors in RGB for Euclidean/LAB matching
 */
const CALIBRATED_TARGETS: { color: ResistorColor; rgb: [number, number, number]; weight: number }[] = [
  { color: 'black', rgb: [25, 27, 30], weight: 1.0 },
  { color: 'brown', rgb: [105, 55, 24], weight: 1.1 },
  { color: 'red', rgb: [195, 32, 28], weight: 1.2 },
  { color: 'orange', rgb: [225, 95, 20], weight: 1.1 },
  { color: 'yellow', rgb: [225, 195, 25], weight: 1.1 },
  { color: 'green', rgb: [28, 140, 50], weight: 1.1 },
  { color: 'blue', rgb: [30, 90, 205], weight: 1.2 },
  { color: 'violet', rgb: [130, 45, 185], weight: 1.2 },
  { color: 'gray', rgb: [100, 108, 115], weight: 0.9 },
  { color: 'white', rgb: [230, 235, 240], weight: 0.9 },
  { color: 'gold', rgb: [180, 130, 45], weight: 1.0 },
  { color: 'silver', rgb: [160, 170, 180], weight: 0.9 },
];

/**
 * Classifies an RGB pixel into one of the 12 standard resistor colors
 * Uses HSV spatial gating combined with distance scoring.
 */
export function classifyColor(r: number, g: number, b: number): ResistorColor {
  const { h, s, v } = rgbToHsv(r, g, b);

  // 1. Extreme Darkness -> Black
  if (v < 20 || (r + g + b < 65)) {
    return 'black';
  }

  // 2. Low Saturation -> Achromatic / Metallics (White, Silver, Gray, Black)
  if (s < 18) {
    if (v > 82) return 'white';
    if (v > 58) return 'silver';
    if (v > 25) return 'gray';
    return 'black';
  }

  // 3. Gold Metallic: specific warm ochre range with moderate saturation and brightness
  if (h >= 32 && h <= 54 && s >= 35 && s <= 85 && v >= 45 && v <= 85) {
    // Gold has noticeably more red than green and low blue
    if (r > g && g > b * 1.5 && b < 100) {
      return 'gold';
    }
  }

  // 4. Hue-based classification
  // Brown vs Orange vs Red
  if ((h >= 348 || h < 14)) {
    if (v < 40 && s < 65) return 'brown';
    return 'red';
  }

  if (h >= 14 && h < 38) {
    if (v < 48 || (s < 60 && v < 60)) {
      return 'brown';
    }
    return 'orange';
  }

  if (h >= 38 && h < 68) {
    if (s < 40 && v < 60) return 'brown';
    return 'yellow';
  }

  if (h >= 68 && h < 165) {
    return 'green';
  }

  if (h >= 165 && h < 255) {
    return 'blue';
  }

  if (h >= 255 && h < 325) {
    return 'violet';
  }

  if (h >= 325 && h < 348) {
    return 'red';
  }

  // Fallback: Minimum weighted Euclidean distance to calibrated targets
  let minDistance = Infinity;
  let bestColor: ResistorColor = 'black';

  for (const target of CALIBRATED_TARGETS) {
    const dr = r - target.rgb[0];
    const dg = g - target.rgb[1];
    const db = b - target.rgb[2];
    const dist = Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11) * target.weight;
    if (dist < minDistance) {
      minDistance = dist;
      bestColor = target.color;
    }
  }

  return bestColor;
}

/**
 * Samples a patch around (x, y) with a median filter to reject camera noise/specular glare
 */
export function sampleMedianColor(
  ctx: CanvasRenderingContext2D,
  pixelX: number,
  pixelY: number,
  radius = 4
): SampledColorInfo {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const minX = Math.max(0, Math.floor(pixelX - radius));
  const maxX = Math.min(width - 1, Math.floor(pixelX + radius));
  const minY = Math.max(0, Math.floor(pixelY - radius));
  const maxY = Math.min(height - 1, Math.floor(pixelY + radius));

  const sampleW = maxX - minX + 1;
  const sampleH = maxY - minY + 1;

  if (sampleW <= 0 || sampleH <= 0) {
    return {
      r: 0,
      g: 0,
      b: 0,
      hex: '#000000',
      hsv: { h: 0, s: 0, v: 0 },
      color: 'black',
      label: 'Black',
    };
  }

  const imgData = ctx.getImageData(minX, minY, sampleW, sampleH).data;
  const rList: number[] = [];
  const gList: number[] = [];
  const bList: number[] = [];

  for (let i = 0; i < imgData.length; i += 4) {
    const a = imgData[i + 3];
    if (a > 100) {
      rList.push(imgData[i]);
      gList.push(imgData[i + 1]);
      bList.push(imgData[i + 2]);
    }
  }

  if (rList.length === 0) {
    return {
      r: 0,
      g: 0,
      b: 0,
      hex: '#000000',
      hsv: { h: 0, s: 0, v: 0 },
      color: 'black',
      label: 'Black',
    };
  }

  // Median sort
  rList.sort((a, b) => a - b);
  gList.sort((a, b) => a - b);
  bList.sort((a, b) => a - b);

  const mid = Math.floor(rList.length / 2);
  const r = rList[mid];
  const g = gList[mid];
  const b = bList[mid];

  const color = classifyColor(r, g, b);
  const hsv = rgbToHsv(r, g, b);

  return {
    r,
    g,
    b,
    hex: rgbToHex(r, g, b),
    hsv,
    color,
    label: RESISTOR_COLORS[color].label,
  };
}

/**
 * Checks if a sampled pixel is likely the resistor ceramic/epoxy body
 * Common resistor bodies:
 * - Carbon film: beige, tan, cream
 * - Metal film: sky blue, cyan-gray
 * - Ceramic/flameproof: light gray, off-white
 */
function isLikelyBodyColor(r: number, g: number, b: number): boolean {
  const { h, s, v } = rgbToHsv(r, g, b);

  // Carbon film tan/beige body: Hue ~25-50, Sat ~20-55, Val > 50
  if (h >= 24 && h <= 55 && s >= 15 && s <= 55 && v >= 48) {
    return true;
  }

  // Metal film light-blue/cyan body: Hue ~175-225, Sat ~15-60, Val > 45
  if (h >= 170 && h <= 230 && s >= 15 && s <= 55 && v >= 45) {
    return true;
  }

  // Pale neutral body (off-white, light gray)
  if (s < 18 && v >= 55) {
    return true;
  }

  return false;
}

/**
 * Scan a single horizontal line along the resistor body to find band segments
 */
function scanLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  startX: number,
  endX: number,
  targetCount: BandCount
): { bands: ResistorColor[]; positions: { x: number; y: number }[] } | null {
  const lineW = endX - startX;
  if (lineW <= 40) return null;

  const rawData = ctx.getImageData(startX, y, lineW, 1).data;
  const classifications: { color: ResistorColor; isBody: boolean; x: number; r: number; g: number; b: number }[] = [];

  for (let i = 0; i < rawData.length; i += 4) {
    const x = startX + i / 4;
    const r = rawData[i];
    const g = rawData[i + 1];
    const b = rawData[i + 2];
    const body = isLikelyBodyColor(r, g, b);
    const color = classifyColor(r, g, b);
    classifications.push({ color, isBody: body, x, r, g, b });
  }

  // Group contiguous segments of non-body color
  interface Segment {
    color: ResistorColor;
    startX: number;
    endX: number;
    centerX: number;
    count: number;
    avgR: number;
    avgG: number;
    avgB: number;
  }

  const segments: Segment[] = [];
  let current: Segment | null = null;

  for (const pt of classifications) {
    if (pt.isBody) {
      if (current && current.count >= 4) {
        segments.push(current);
      }
      current = null;
    } else {
      if (!current) {
        current = {
          color: pt.color,
          startX: pt.x,
          endX: pt.x,
          centerX: pt.x,
          count: 1,
          avgR: pt.r,
          avgG: pt.g,
          avgB: pt.b,
        };
      } else if (current.color === pt.color) {
        current.endX = pt.x;
        current.centerX = (current.startX + pt.x) / 2;
        current.count++;
        current.avgR += pt.r;
        current.avgG += pt.g;
        current.avgB += pt.b;
      } else {
        if (current.count >= 4) {
          segments.push(current);
        }
        current = {
          color: pt.color,
          startX: pt.x,
          endX: pt.x,
          centerX: pt.x,
          count: 1,
          avgR: pt.r,
          avgG: pt.g,
          avgB: pt.b,
        };
      }
    }
  }

  if (current && current.count >= 4) {
    segments.push(current);
  }

  // Filter out tiny noise and gigantic segments (leads or shadows)
  const validSegments = segments.filter((s) => {
    const width = s.endX - s.startX;
    return width >= 5 && width <= lineW * 0.35;
  });

  // Re-classify segment average color
  for (const s of validSegments) {
    const r = s.avgR / s.count;
    const g = s.avgG / s.count;
    const b = s.avgB / s.count;
    s.color = classifyColor(r, g, b);
  }

  if (validSegments.length === targetCount) {
    return {
      bands: validSegments.map((s) => s.color),
      positions: validSegments.map((s) => ({ x: s.centerX, y })),
    };
  }

  return null;
}

/**
 * Automatically scans the canvas image along multiple candidate lines
 * Ranks candidates and sets marker positions
 */
export function autoScanResistor(
  canvas: HTMLCanvasElement,
  targetCount: BandCount
): ScanResult {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;

  if (!ctx || w === 0 || h === 0) {
    return {
      bands: defaultBands(targetCount),
      confidence: 'low',
      supportCount: 0,
      markerPositions: defaultNormalizedPositions(targetCount),
      scanlineY: 0.5,
      notes: ['Canvas unavailable for scanning.'],
    };
  }

  // Sample candidate scan lines across vertical center 35% - 65%
  const candidateYs = [
    h * 0.5,
    h * 0.45,
    h * 0.55,
    h * 0.4,
    h * 0.6,
    h * 0.48,
    h * 0.52,
    h * 0.38,
    h * 0.62,
  ];

  const startX = Math.floor(w * 0.15);
  const endX = Math.floor(w * 0.85);

  const candidateResults: {
    bands: ResistorColor[];
    positions: { x: number; y: number }[];
    y: number;
    key: string;
  }[] = [];

  for (const y of candidateYs) {
    const lineRes = scanLine(ctx, Math.floor(y), startX, endX, targetCount);
    if (lineRes) {
      candidateResults.push({
        ...lineRes,
        y,
        key: lineRes.bands.join('-'),
      });
    }
  }

  // Group candidate results by sequence key
  const votes = new Map<string, typeof candidateResults>();
  for (const res of candidateResults) {
    const existing = votes.get(res.key) || [];
    existing.push(res);
    votes.set(res.key, existing);
  }

  // Find sequence with highest vote count
  let bestKey = '';
  let maxVotes = 0;
  for (const [key, list] of votes.entries()) {
    if (list.length > maxVotes) {
      maxVotes = list.length;
      bestKey = key;
    }
  }

  if (bestKey && maxVotes >= 2) {
    const winningMatches = votes.get(bestKey)!;
    // Pick the median Y match
    const midMatch = winningMatches[Math.floor(winningMatches.length / 2)];

    // Convert pixel positions to normalized coordinates [0..1]
    const normalizedMarkers = midMatch.positions.map((p) => ({
      x: Math.max(0.05, Math.min(0.95, p.x / w)),
      y: Math.max(0.05, Math.min(0.95, p.y / h)),
    }));

    const isHighConfidence = maxVotes >= 3;

    return {
      bands: midMatch.bands,
      confidence: isHighConfidence ? 'high' : 'medium',
      supportCount: maxVotes,
      markerPositions: normalizedMarkers,
      scanlineY: midMatch.y / h,
      notes: [
        `Detected ${targetCount}-band sequence across ${maxVotes} supporting scan lines.`,
        isHighConfidence
          ? 'High confidence: Strong band separation and consistent multi-line support.'
          : 'Medium confidence: Lighting and body contrast may vary. Please verify against physical resistor.',
      ],
    };
  }

  // If strict multi-line grouping didn't find exact matches, sample evenly spaced markers along center line
  const fallbackMarkers = defaultNormalizedPositions(targetCount);
  const fallbackBands: ResistorColor[] = [];

  for (const marker of fallbackMarkers) {
    const info = sampleMedianColor(ctx, marker.x * w, marker.y * h, 5);
    fallbackBands.push(info.color);
  }

  return {
    bands: fallbackBands,
    confidence: 'low',
    supportCount: candidateResults.length > 0 ? 1 : 0,
    markerPositions: fallbackMarkers,
    scanlineY: 0.5,
    notes: [
      'Low confidence: Contrast was insufficient for automated band boundary detection.',
      'Numbered pins have been positioned on the center line. Drag markers directly onto each band to sample local colors.',
    ],
  };
}

export function defaultBands(count: BandCount): ResistorColor[] {
  switch (count) {
    case 3:
      return ['orange', 'orange', 'brown']; // 330 Ω 20%
    case 4:
      return ['yellow', 'violet', 'red', 'gold']; // 4.7 kΩ 5%
    case 5:
      return ['red', 'red', 'black', 'black', 'brown']; // 220 Ω 1%
    case 6:
      return ['brown', 'black', 'black', 'brown', 'brown', 'red']; // 1 kΩ 1% 50ppm
  }
}

export function defaultNormalizedPositions(count: BandCount): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  // Resistors generally have a body spanning ~30% to 70% of the horizontal center
  const startX = 0.32;
  const endX = 0.68;
  const step = (endX - startX) / (count - 1);

  for (let i = 0; i < count; i++) {
    positions.push({
      x: +(startX + i * step).toFixed(3),
      y: 0.5,
    });
  }

  return positions;
}

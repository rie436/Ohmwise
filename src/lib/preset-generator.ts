/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ohmwise Benchmark Resistor Canvas Generator
 * Generates realistic benchmark resistor images for instant testing without camera or file upload.
 */

import { ResistorColor, RESISTOR_COLORS, BandCount } from './resistor';

export interface ResistorPreset {
  id: string;
  name: string;
  bandCount: BandCount;
  bands: ResistorColor[];
  bodyType: 'carbon-film' | 'metal-film';
  description: string;
}

export const BENCHMARK_PRESETS: ResistorPreset[] = [
  {
    id: '4k7-4band',
    name: '4.7 kΩ ±5%',
    bandCount: 4,
    bands: ['yellow', 'violet', 'red', 'gold'],
    bodyType: 'carbon-film',
    description: 'Standard 4-band carbon film resistor on beige ceramic epoxy.',
  },
  {
    id: '220r-5band',
    name: '220 Ω ±1%',
    bandCount: 5,
    bands: ['red', 'red', 'black', 'black', 'brown'],
    bodyType: 'metal-film',
    description: 'Precision 5-band metal film resistor on light-blue body.',
  },
  {
    id: '10k-4band',
    name: '10 kΩ ±5%',
    bandCount: 4,
    bands: ['brown', 'black', 'orange', 'gold'],
    bodyType: 'carbon-film',
    description: 'Ubiquitous pull-up 10k resistor with 5% gold tolerance.',
  },
  {
    id: '1k-5band',
    name: '1.0 kΩ ±1%',
    bandCount: 5,
    bands: ['brown', 'black', 'black', 'brown', 'brown'],
    bodyType: 'metal-film',
    description: 'Precision 1k metal film resistor with 1% brown tolerance.',
  },
  {
    id: '470k-4band',
    name: '470 kΩ ±5%',
    bandCount: 4,
    bands: ['yellow', 'violet', 'yellow', 'gold'],
    bodyType: 'carbon-film',
    description: 'High-value 470k carbon film resistor.',
  },
  {
    id: '100r-6band',
    name: '100 Ω ±1% 50ppm',
    bandCount: 6,
    bands: ['brown', 'black', 'black', 'black', 'brown', 'red'],
    bodyType: 'metal-film',
    description: '6-band precision resistor with 50ppm/K temperature coefficient.',
  },
  {
    id: '330r-3band',
    name: '330 Ω ±20%',
    bandCount: 3,
    bands: ['orange', 'orange', 'brown'],
    bodyType: 'carbon-film',
    description: '3-band vintage style resistor without tolerance band (±20%).',
  },
];

/**
 * Renders an authentic realistic resistor photo onto an offscreen canvas
 */
export function generateResistorImage(preset: ResistorPreset): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d')!;

  // 1. Electronic workbench background: dark anti-static mat texture with subtle grid
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700);
  bgGrad.addColorStop(0, '#131b26');
  bgGrad.addColorStop(1, '#0b1118');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 700);

  // Subtle PCB / ESD mat grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 700);
    ctx.stroke();
  }
  for (let y = 0; y <= 700; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }

  // 2. Drop shadow under resistor body & leads
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 26;

  const centerY = 350;
  const bodyLeft = 360;
  const bodyRight = 840;
  const bodyWidth = bodyRight - bodyLeft; // 480px
  const bodyHeight = 110;

  // 3. Axial tinned copper wire leads
  const leadGrad = ctx.createLinearGradient(0, centerY - 6, 0, centerY + 6);
  leadGrad.addColorStop(0, '#e2e8f0');
  leadGrad.addColorStop(0.3, '#94a3b8');
  leadGrad.addColorStop(0.7, '#cbd5e1');
  leadGrad.addColorStop(1, '#475569');

  ctx.fillStyle = leadGrad;
  // Left lead
  ctx.fillRect(40, centerY - 5, bodyLeft - 40, 10);
  // Right lead
  ctx.fillRect(bodyRight, centerY - 5, 1200 - bodyRight - 40, 10);

  // 4. Resistor Ceramic/Epoxy Body
  // Body colors:
  // Carbon film: tan / cream (#eed9b3 to #cbb28d)
  // Metal film: light cyan blue (#88c2d8 to #5498b2)
  const isCarbon = preset.bodyType === 'carbon-film';
  const bodyTop = centerY - bodyHeight / 2;
  const bodyBottom = centerY + bodyHeight / 2;

  // Resistor dumbbell shape: wider caps at left/right ends, slightly tapered center
  ctx.beginPath();
  const capW = 55;
  const capH = bodyHeight + 14;

  // Draw smooth path for resistor body
  ctx.moveTo(bodyLeft + capW, bodyTop);
  ctx.lineTo(bodyRight - capW, bodyTop);
  // Right cap bulge
  ctx.bezierCurveTo(bodyRight - 10, bodyTop - 7, bodyRight, centerY - capH / 2, bodyRight, centerY);
  ctx.bezierCurveTo(bodyRight, centerY + capH / 2, bodyRight - 10, bodyBottom + 7, bodyRight - capW, bodyBottom);
  ctx.lineTo(bodyLeft + capW, bodyBottom);
  // Left cap bulge
  ctx.bezierCurveTo(bodyLeft + 10, bodyBottom + 7, bodyLeft, centerY + capH / 2, bodyLeft, centerY);
  ctx.bezierCurveTo(bodyLeft, centerY - capH / 2, bodyLeft + 10, bodyTop - 7, bodyLeft + capW, bodyTop);
  ctx.closePath();

  // Cylindrical body gradient with realistic top specular highlight
  const bodyGrad = ctx.createLinearGradient(0, bodyTop - 10, 0, bodyBottom + 10);
  if (isCarbon) {
    bodyGrad.addColorStop(0, '#ecd7b2');
    bodyGrad.addColorStop(0.18, '#f7ead4'); // top highlight
    bodyGrad.addColorStop(0.5, '#deb887');
    bodyGrad.addColorStop(0.85, '#b98f58');
    bodyGrad.addColorStop(1, '#7a5b32'); // bottom shadow
  } else {
    bodyGrad.addColorStop(0, '#93cee3');
    bodyGrad.addColorStop(0.18, '#d4edf7'); // top highlight
    bodyGrad.addColorStop(0.5, '#68b4ce');
    bodyGrad.addColorStop(0.85, '#3b8ba7');
    bodyGrad.addColorStop(1, '#1e5a70'); // bottom shadow
  }

  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.restore(); // restores shadow

  // 5. Draw color bands
  const count = preset.bands.length;
  const bandWidth = 26;

  // Real resistors have bands placed with a distinct gap before the tolerance band (last band)!
  const bandPositions: number[] = [];
  if (count === 4) {
    // 4 bands: 3 digit/multiplier bands clustered on left, tolerance band offset to right
    bandPositions.push(bodyLeft + 85);
    bandPositions.push(bodyLeft + 155);
    bandPositions.push(bodyLeft + 225);
    bandPositions.push(bodyRight - 85); // gap before tolerance
  } else if (count === 5) {
    // 5 bands: 4 bands clustered on left, tolerance band offset on right
    bandPositions.push(bodyLeft + 80);
    bandPositions.push(bodyLeft + 140);
    bandPositions.push(bodyLeft + 200);
    bandPositions.push(bodyLeft + 260);
    bandPositions.push(bodyRight - 80);
  } else if (count === 6) {
    // 6 bands: 4 bands, tolerance, tempco
    bandPositions.push(bodyLeft + 75);
    bandPositions.push(bodyLeft + 130);
    bandPositions.push(bodyLeft + 185);
    bandPositions.push(bodyLeft + 240);
    bandPositions.push(bodyRight - 110);
    bandPositions.push(bodyRight - 65);
  } else {
    // 3 bands
    bandPositions.push(bodyLeft + 90);
    bandPositions.push(bodyLeft + 180);
    bandPositions.push(bodyLeft + 270);
  }

  // Band colors calibration for painting
  const BAND_PAINT_COLORS: Record<ResistorColor, { base: string; highlight: string; shadow: string }> = {
    black: { base: '#181b20', highlight: '#3a3f47', shadow: '#080a0c' },
    brown: { base: '#6e3814', highlight: '#9c5424', shadow: '#3f1c05' },
    red: { base: '#c91f1b', highlight: '#f04e4a', shadow: '#780c09' },
    orange: { base: '#df580a', highlight: '#fa8037', shadow: '#883103' },
    yellow: { base: '#d8aa08', highlight: '#fde047', shadow: '#826502' },
    green: { base: '#16993c', highlight: '#3dd269', shadow: '#0b5620' },
    blue: { base: '#1b63d6', highlight: '#5594f7', shadow: '#0c3882' },
    violet: { base: '#7c25c9', highlight: '#ad5ef0', shadow: '#461175' },
    gray: { base: '#667382', highlight: '#9ba7b5', shadow: '#373f48' },
    white: { base: '#e8edf2', highlight: '#ffffff', shadow: '#9ca9b6' },
    gold: { base: '#b88220', highlight: '#ebd074', shadow: '#6e4c0d' },
    silver: { base: '#a1acb8', highlight: '#e1e7ed', shadow: '#596470' },
  };

  preset.bands.forEach((colorName, idx) => {
    const bandX = bandPositions[idx] || (bodyLeft + 80 + idx * 60);
    const paint = BAND_PAINT_COLORS[colorName] || BAND_PAINT_COLORS.black;

    // Draw band with cylindrical curvature
    const bandGrad = ctx.createLinearGradient(0, bodyTop - 5, 0, bodyBottom + 5);
    bandGrad.addColorStop(0, paint.base);
    bandGrad.addColorStop(0.2, paint.highlight);
    bandGrad.addColorStop(0.6, paint.base);
    bandGrad.addColorStop(1, paint.shadow);

    ctx.save();
    // Clip inside the resistor body
    ctx.beginPath();
    ctx.moveTo(bodyLeft + capW, bodyTop);
    ctx.lineTo(bodyRight - capW, bodyTop);
    ctx.bezierCurveTo(bodyRight - 10, bodyTop - 7, bodyRight, centerY - capH / 2, bodyRight, centerY);
    ctx.bezierCurveTo(bodyRight, centerY + capH / 2, bodyRight - 10, bodyBottom + 7, bodyRight - capW, bodyBottom);
    ctx.lineTo(bodyLeft + capW, bodyBottom);
    ctx.bezierCurveTo(bodyLeft + 10, bodyBottom + 7, bodyLeft, centerY + capH / 2, bodyLeft, centerY);
    ctx.bezierCurveTo(bodyLeft, centerY - capH / 2, bodyLeft + 10, bodyTop - 7, bodyLeft + capW, bodyTop);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = bandGrad;
    ctx.fillRect(bandX - bandWidth / 2, bodyTop - 20, bandWidth, bodyHeight + 40);

    // Subtle edge blur / ring paint bleed
    ctx.strokeStyle = paint.shadow;
    ctx.lineWidth = 1;
    ctx.strokeRect(bandX - bandWidth / 2, bodyTop - 20, bandWidth, bodyHeight + 40);

    ctx.restore();
  });

  // 6. Natural surface noise and camera grain simulation
  const imgData = ctx.getImageData(0, 0, 1200, 700);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 8;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

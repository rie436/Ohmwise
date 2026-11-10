/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ohmwise Resistor Reader shared module
 * Dual ESM / Browser / CommonJS export
 */

export const RESISTOR_COLORS = {
  black: { digit: 0, multiplier: 1, tolerance: null, tempCo: 250, label: 'Black' },
  brown: { digit: 1, multiplier: 10, tolerance: 1, tempCo: 100, label: 'Brown' },
  red: { digit: 2, multiplier: 100, tolerance: 2, tempCo: 50, label: 'Red' },
  orange: { digit: 3, multiplier: 1000, tolerance: 0.05, tempCo: 15, label: 'Orange' },
  yellow: { digit: 4, multiplier: 10000, tolerance: 0.02, tempCo: 25, label: 'Yellow' },
  green: { digit: 5, multiplier: 100000, tolerance: 0.5, tempCo: 20, label: 'Green' },
  blue: { digit: 6, multiplier: 1000000, tolerance: 0.25, tempCo: 10, label: 'Blue' },
  violet: { digit: 7, multiplier: 10000000, tolerance: 0.1, tempCo: 5, label: 'Violet' },
  gray: { digit: 8, multiplier: 100000000, tolerance: 0.05, tempCo: 1, label: 'Gray' },
  white: { digit: 9, multiplier: 1000000000, tolerance: null, tempCo: null, label: 'White' },
  gold: { digit: null, multiplier: 0.1, tolerance: 5, tempCo: null, label: 'Gold' },
  silver: { digit: null, multiplier: 0.01, tolerance: 10, tempCo: null, label: 'Silver' },
};

export function rgbToHsv(r, g, b) {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  if (delta !== 0) {
    if (max === rN) {
      h = ((gN - bN) / delta) % 6;
    } else if (max === gN) {
      h = (bN - rN) / delta + 2;
    } else {
      h = (rN - gN) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s: Math.round(s), v: Math.round(v) };
}

export function classifyColor(r, g, b) {
  const { h, s, v } = rgbToHsv(r, g, b);

  if (v < 20 || (r + g + b < 65)) return 'black';
  if (s < 18) {
    if (v > 82) return 'white';
    if (v > 58) return 'silver';
    if (v > 25) return 'gray';
    return 'black';
  }

  if (h >= 32 && h <= 54 && s >= 35 && s <= 85 && v >= 45 && v <= 85) {
    if (r > g && g > b * 1.5 && b < 100) return 'gold';
  }

  if (h >= 348 || h < 14) {
    if (v < 40 && s < 65) return 'brown';
    return 'red';
  }
  if (h >= 14 && h < 38) {
    if (v < 48 || (s < 60 && v < 60)) return 'brown';
    return 'orange';
  }
  if (h >= 38 && h < 68) {
    if (s < 40 && v < 60) return 'brown';
    return 'yellow';
  }
  if (h >= 68 && h < 165) return 'green';
  if (h >= 165 && h < 255) return 'blue';
  if (h >= 255 && h < 325) return 'violet';
  if (h >= 325 && h < 348) return 'red';

  return 'black';
}

export function formatResistance(ohms) {
  if (ohms >= 1000000000) {
    const val = ohms / 1000000000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')} GΩ`;
  }
  if (ohms >= 1000000) {
    const val = ohms / 1000000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')} MΩ`;
  }
  if (ohms >= 1000) {
    const val = ohms / 1000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')} kΩ`;
  }
  return `${ohms % 1 === 0 ? ohms : ohms.toFixed(2).replace(/\.?0+$/, '')} Ω`;
}

export function decode(bands) {
  const count = bands.length;
  if (count < 3 || count > 6) {
    return { nominalOhms: 0, isValid: false, error: 'Band count must be 3-6' };
  }

  const first = bands[0];
  const isReversedSuspect = first === 'gold' || first === 'silver';

  let nominalOhms = 0;
  let tolerancePercent = 20;
  let tempCoPpm = null;

  if (count === 3) {
    const d1 = RESISTOR_COLORS[bands[0]].digit;
    const d2 = RESISTOR_COLORS[bands[1]].digit;
    const mult = RESISTOR_COLORS[bands[2]].multiplier;
    nominalOhms = (d1 * 10 + d2) * mult;
    tolerancePercent = 20;
  } else if (count === 4) {
    const d1 = RESISTOR_COLORS[bands[0]].digit;
    const d2 = RESISTOR_COLORS[bands[1]].digit;
    const mult = RESISTOR_COLORS[bands[2]].multiplier;
    const tol = RESISTOR_COLORS[bands[3]].tolerance;
    nominalOhms = (d1 * 10 + d2) * mult;
    tolerancePercent = tol ?? 20;
  } else if (count === 5) {
    const d1 = RESISTOR_COLORS[bands[0]].digit;
    const d2 = RESISTOR_COLORS[bands[1]].digit;
    const d3 = RESISTOR_COLORS[bands[2]].digit;
    const mult = RESISTOR_COLORS[bands[3]].multiplier;
    const tol = RESISTOR_COLORS[bands[4]].tolerance;
    nominalOhms = (d1 * 100 + d2 * 10 + d3) * mult;
    tolerancePercent = tol ?? 1;
  } else if (count === 6) {
    const d1 = RESISTOR_COLORS[bands[0]].digit;
    const d2 = RESISTOR_COLORS[bands[1]].digit;
    const d3 = RESISTOR_COLORS[bands[2]].digit;
    const mult = RESISTOR_COLORS[bands[3]].multiplier;
    const tol = RESISTOR_COLORS[bands[4]].tolerance;
    const tcr = RESISTOR_COLORS[bands[5]].tempCo;
    nominalOhms = (d1 * 100 + d2 * 10 + d3) * mult;
    tolerancePercent = tol ?? 1;
    tempCoPpm = tcr;
  }

  const minOhms = nominalOhms * (1 - tolerancePercent / 100);
  const maxOhms = nominalOhms * (1 + tolerancePercent / 100);

  return {
    nominalOhms,
    formattedResistance: formatResistance(nominalOhms),
    tolerancePercent,
    minOhms,
    maxOhms,
    tempCoPpm,
    isValid: true,
    isReversedSuspect,
  };
}

const ResistorReader = {
  RESISTOR_COLORS,
  rgbToHsv,
  classifyColor,
  formatResistance,
  decode,
};

export default ResistorReader;

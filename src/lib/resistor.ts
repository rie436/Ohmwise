/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ohmwise Resistor Decoding Engine
 * Implements EIA-60062 / IEC 60062 standard color code for 3, 4, 5, and 6-band resistors.
 */

export type ResistorColor =
  | 'black'
  | 'brown'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'gray'
  | 'white'
  | 'gold'
  | 'silver';

export type BandCount = 3 | 4 | 5 | 6;

export interface ColorDefinition {
  name: ResistorColor;
  label: string;
  hex: string;
  textColor: string;
  digit: number | null;
  multiplier: number | null;
  tolerance: number | null; // percentage e.g. 5 for 5%
  tempCo: number | null; // ppm/K
  hsvRange: {
    hMin: number;
    hMax: number;
    sMin: number;
    sMax: number;
    vMin: number;
    vMax: number;
  };
}

export const RESISTOR_COLORS: Record<ResistorColor, ColorDefinition> = {
  black: {
    name: 'black',
    label: 'Black',
    hex: '#1e293b',
    textColor: '#f8fafc',
    digit: 0,
    multiplier: 1, // 10^0
    tolerance: null,
    tempCo: 250,
    hsvRange: { hMin: 0, hMax: 360, sMin: 0, sMax: 100, vMin: 0, vMax: 22 },
  },
  brown: {
    name: 'brown',
    label: 'Brown',
    hex: '#854d0e',
    textColor: '#fef08a',
    digit: 1,
    multiplier: 10, // 10^1
    tolerance: 1,
    tempCo: 100,
    hsvRange: { hMin: 12, hMax: 35, sMin: 35, sMax: 90, vMin: 20, vMax: 55 },
  },
  red: {
    name: 'red',
    label: 'Red',
    hex: '#dc2626',
    textColor: '#fee2e2',
    digit: 2,
    multiplier: 100, // 10^2
    tolerance: 2,
    tempCo: 50,
    hsvRange: { hMin: 350, hMax: 14, sMin: 60, sMax: 100, vMin: 45, vMax: 95 },
  },
  orange: {
    name: 'orange',
    label: 'Orange',
    hex: '#ea580c',
    textColor: '#ffedd5',
    digit: 3,
    multiplier: 1000, // 10^3
    tolerance: 0.05,
    tempCo: 15,
    hsvRange: { hMin: 15, hMax: 40, sMin: 65, sMax: 100, vMin: 60, vMax: 100 },
  },
  yellow: {
    name: 'yellow',
    label: 'Yellow',
    hex: '#eab308',
    textColor: '#713f12',
    digit: 4,
    multiplier: 10000, // 10^4
    tolerance: 0.02,
    tempCo: 25,
    hsvRange: { hMin: 42, hMax: 68, sMin: 55, sMax: 100, vMin: 65, vMax: 100 },
  },
  green: {
    name: 'green',
    label: 'Green',
    hex: '#16a34a',
    textColor: '#dcfce7',
    digit: 5,
    multiplier: 100000, // 10^5
    tolerance: 0.5,
    tempCo: 20,
    hsvRange: { hMin: 75, hMax: 165, sMin: 40, sMax: 100, vMin: 30, vMax: 90 },
  },
  blue: {
    name: 'blue',
    label: 'Blue',
    hex: '#2563eb',
    textColor: '#dbeafe',
    digit: 6,
    multiplier: 1000000, // 10^6
    tolerance: 0.25,
    tempCo: 10,
    hsvRange: { hMin: 185, hMax: 245, sMin: 45, sMax: 100, vMin: 35, vMax: 95 },
  },
  violet: {
    name: 'violet',
    label: 'Violet',
    hex: '#9333ea',
    textColor: '#f3e8ff',
    digit: 7,
    multiplier: 10000000, // 10^7
    tolerance: 0.1,
    tempCo: 5,
    hsvRange: { hMin: 255, hMax: 320, sMin: 35, sMax: 100, vMin: 30, vMax: 90 },
  },
  gray: {
    name: 'gray',
    label: 'Gray',
    hex: '#64748b',
    textColor: '#f1f5f9',
    digit: 8,
    multiplier: 100000000, // 10^8
    tolerance: 0.05,
    tempCo: 1,
    hsvRange: { hMin: 0, hMax: 360, sMin: 0, sMax: 20, vMin: 30, vMax: 70 },
  },
  white: {
    name: 'white',
    label: 'White',
    hex: '#f8fafc',
    textColor: '#0f172a',
    digit: 9,
    multiplier: 1000000000, // 10^9
    tolerance: null,
    tempCo: null,
    hsvRange: { hMin: 0, hMax: 360, sMin: 0, sMax: 18, vMin: 80, vMax: 100 },
  },
  gold: {
    name: 'gold',
    label: 'Gold',
    hex: '#d97706',
    textColor: '#fef3c7',
    digit: null,
    multiplier: 0.1, // 10^-1
    tolerance: 5,
    tempCo: null,
    hsvRange: { hMin: 35, hMax: 50, sMin: 45, sMax: 90, vMin: 50, vMax: 88 },
  },
  silver: {
    name: 'silver',
    label: 'Silver',
    hex: '#94a3b8',
    textColor: '#0f172a',
    digit: null,
    multiplier: 0.01, // 10^-2
    tolerance: 10,
    tempCo: null,
    hsvRange: { hMin: 0, hMax: 360, sMin: 0, sMax: 25, vMin: 65, vMax: 92 },
  },
};

export const COLOR_LIST: ResistorColor[] = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'gray',
  'white',
  'gold',
  'silver',
];

export interface BandRole {
  role: 'digit-1' | 'digit-2' | 'digit-3' | 'multiplier' | 'tolerance' | 'tempco';
  label: string;
  value: string;
}

export interface DecodeResult {
  nominalOhms: number;
  formattedResistance: string;
  tolerancePercent: number;
  minOhms: number;
  maxOhms: number;
  tempCoPpm: number | null;
  roles: BandRole[];
  isValid: boolean;
  validationError?: string;
  isReversedSuspect: boolean;
  reversedBands: ResistorColor[];
  matchedSeries?: string;
  notes: string[];
}

/**
 * Standard E-series preferred value decade bases
 */
const E12_BASES = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
const E24_BASES = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];
const E96_BASES = [
  1.00, 1.02, 1.05, 1.07, 1.10, 1.13, 1.15, 1.18, 1.21, 1.24, 1.27, 1.30,
  1.33, 1.37, 1.40, 1.43, 1.47, 1.50, 1.54, 1.58, 1.62, 1.65, 1.69, 1.74,
  1.78, 1.82, 1.87, 1.91, 1.96, 2.00, 2.05, 2.10, 2.15, 2.21, 2.26, 2.32,
  2.37, 2.43, 2.49, 2.55, 2.61, 2.67, 2.74, 2.80, 2.87, 2.94, 3.01, 3.09,
  3.16, 3.24, 3.32, 3.40, 3.48, 3.57, 3.65, 3.74, 3.83, 3.92, 4.02, 4.12,
  4.22, 4.32, 4.42, 4.53, 4.64, 4.75, 4.87, 4.99, 5.11, 5.23, 5.36, 5.49,
  5.62, 5.76, 5.90, 6.04, 6.19, 6.34, 6.49, 6.65, 6.81, 6.98, 7.15, 7.32,
  7.50, 7.68, 7.87, 8.06, 8.25, 8.45, 8.66, 8.87, 9.09, 9.31, 9.53, 9.76,
];

function checkESeries(ohms: number): string | undefined {
  if (ohms <= 0) return undefined;
  // Normalize to 1.0 - 10.0 range
  let norm = ohms;
  while (norm >= 10.0) norm /= 10.0;
  while (norm < 1.0) norm *= 10.0;

  const epsilon = 0.02; // 2% tolerance for rounding in normalized base

  if (E12_BASES.some((b) => Math.abs(b - norm) / b < epsilon)) {
    return 'Standard E12 / E24 value';
  }
  if (E24_BASES.some((b) => Math.abs(b - norm) / b < epsilon)) {
    return 'Standard E24 value';
  }
  if (E96_BASES.some((b) => Math.abs(b - norm) / b < 0.01)) {
    return 'Standard E96 precision value';
  }
  return undefined;
}

/**
 * Format nominal ohms to readable engineering units (Ω, kΩ, MΩ, GΩ)
 */
export function formatResistance(ohms: number): string {
  if (ohms >= 1_000_000_000) {
    const val = ohms / 1_000_000_000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')} GΩ`;
  }
  if (ohms >= 1_000_000) {
    const val = ohms / 1_000_000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')} MΩ`;
  }
  if (ohms >= 1_000) {
    const val = ohms / 1_000;
    return `${val % 1 === 0 ? val : val.toFixed(2).replace(/\.?0+$/, '')} kΩ`;
  }
  return `${ohms % 1 === 0 ? ohms : ohms.toFixed(2).replace(/\.?0+$/, '')} Ω`;
}

/**
 * Decodes a sequence of resistor band colors
 */
export function decodeResistor(bands: ResistorColor[]): DecodeResult {
  const count = bands.length;
  const reversedBands = [...bands].reverse();
  const notes: string[] = [];

  if (count < 3 || count > 6) {
    return {
      nominalOhms: 0,
      formattedResistance: 'Invalid',
      tolerancePercent: 20,
      minOhms: 0,
      maxOhms: 0,
      tempCoPpm: null,
      roles: [],
      isValid: false,
      validationError: `Unsupported band count (${count}). Expected 3, 4, 5, or 6 bands.`,
      isReversedSuspect: false,
      reversedBands,
      notes: ['Band count must be between 3 and 6.'],
    };
  }

  // Check if first band is Gold or Silver (Gold and Silver are multipliers/tolerances, NEVER leading digits)
  const firstColor = bands[0];
  const lastColor = bands[bands.length - 1];
  let isReversedSuspect = firstColor === 'gold' || firstColor === 'silver';

  // Also check if last band is gold/silver while first band is not: that confirms standard reading order!
  // If first is digit but last is not a valid tolerance color, it could be flipped.
  const lastDef = RESISTOR_COLORS[lastColor];
  if (lastDef.tolerance === null && RESISTOR_COLORS[firstColor].tolerance !== null) {
    isReversedSuspect = true;
  }

  let nominalOhms = 0;
  let tolerancePercent = 20; // Default for 3-band
  let tempCoPpm: number | null = null;
  const roles: BandRole[] = [];

  try {
    if (count === 3) {
      // 3 Bands: Digit 1, Digit 2, Multiplier. Default tolerance ±20%
      const d1 = RESISTOR_COLORS[bands[0]].digit;
      const d2 = RESISTOR_COLORS[bands[1]].digit;
      const mult = RESISTOR_COLORS[bands[2]].multiplier;

      if (d1 === null || d2 === null || mult === null) {
        throw new Error('Invalid color for 3-band configuration');
      }

      nominalOhms = (d1 * 10 + d2) * mult;
      tolerancePercent = 20;

      roles.push({ role: 'digit-1', label: '1st Digit', value: String(d1) });
      roles.push({ role: 'digit-2', label: '2nd Digit', value: String(d2) });
      roles.push({ role: 'multiplier', label: 'Multiplier', value: `×${mult}` });
      roles.push({ role: 'tolerance', label: 'Default Tolerance', value: '±20%' });
    } else if (count === 4) {
      // 4 Bands: Digit 1, Digit 2, Multiplier, Tolerance
      const d1 = RESISTOR_COLORS[bands[0]].digit;
      const d2 = RESISTOR_COLORS[bands[1]].digit;
      const mult = RESISTOR_COLORS[bands[2]].multiplier;
      const tol = RESISTOR_COLORS[bands[3]].tolerance;

      if (d1 === null || d2 === null || mult === null) {
        throw new Error('Invalid digit or multiplier in 4-band configuration');
      }
      if (tol === null) {
        notes.push(`${RESISTOR_COLORS[bands[3]].label} is rarely used as a 4-band tolerance. Verify direction.`);
      }

      nominalOhms = (d1 * 10 + d2) * mult;
      tolerancePercent = tol ?? 20;

      roles.push({ role: 'digit-1', label: '1st Digit', value: String(d1) });
      roles.push({ role: 'digit-2', label: '2nd Digit', value: String(d2) });
      roles.push({ role: 'multiplier', label: 'Multiplier', value: `×${mult}` });
      roles.push({ role: 'tolerance', label: 'Tolerance', value: `±${tolerancePercent}%` });
    } else if (count === 5) {
      // 5 Bands: Digit 1, Digit 2, Digit 3, Multiplier, Tolerance
      const d1 = RESISTOR_COLORS[bands[0]].digit;
      const d2 = RESISTOR_COLORS[bands[1]].digit;
      const d3 = RESISTOR_COLORS[bands[2]].digit;
      const mult = RESISTOR_COLORS[bands[3]].multiplier;
      const tol = RESISTOR_COLORS[bands[4]].tolerance;

      if (d1 === null || d2 === null || d3 === null || mult === null) {
        throw new Error('Invalid digit or multiplier in 5-band configuration');
      }
      if (tol === null) {
        notes.push(`${RESISTOR_COLORS[bands[4]].label} is rarely used as a tolerance band.`);
      }

      nominalOhms = (d1 * 100 + d2 * 10 + d3) * mult;
      tolerancePercent = tol ?? 1;

      roles.push({ role: 'digit-1', label: '1st Digit', value: String(d1) });
      roles.push({ role: 'digit-2', label: '2nd Digit', value: String(d2) });
      roles.push({ role: 'digit-3', label: '3rd Digit', value: String(d3) });
      roles.push({ role: 'multiplier', label: 'Multiplier', value: `×${mult}` });
      roles.push({ role: 'tolerance', label: 'Tolerance', value: `±${tolerancePercent}%` });
    } else if (count === 6) {
      // 6 Bands: Digit 1, Digit 2, Digit 3, Multiplier, Tolerance, TempCo
      const d1 = RESISTOR_COLORS[bands[0]].digit;
      const d2 = RESISTOR_COLORS[bands[1]].digit;
      const d3 = RESISTOR_COLORS[bands[2]].digit;
      const mult = RESISTOR_COLORS[bands[3]].multiplier;
      const tol = RESISTOR_COLORS[bands[4]].tolerance;
      const tcr = RESISTOR_COLORS[bands[5]].tempCo;

      if (d1 === null || d2 === null || d3 === null || mult === null) {
        throw new Error('Invalid digit or multiplier in 6-band configuration');
      }

      nominalOhms = (d1 * 100 + d2 * 10 + d3) * mult;
      tolerancePercent = tol ?? 1;
      tempCoPpm = tcr;

      roles.push({ role: 'digit-1', label: '1st Digit', value: String(d1) });
      roles.push({ role: 'digit-2', label: '2nd Digit', value: String(d2) });
      roles.push({ role: 'digit-3', label: '3rd Digit', value: String(d3) });
      roles.push({ role: 'multiplier', label: 'Multiplier', value: `×${mult}` });
      roles.push({ role: 'tolerance', label: 'Tolerance', value: `±${tolerancePercent}%` });
      roles.push({ role: 'tempco', label: 'Temp Coefficient', value: tcr ? `${tcr} ppm/K` : 'Unknown' });
    }

    const minOhms = nominalOhms * (1 - tolerancePercent / 100);
    const maxOhms = nominalOhms * (1 + tolerancePercent / 100);
    const matchedSeries = checkESeries(nominalOhms);

    if (isReversedSuspect) {
      notes.push('Reading order may be reversed. Gold/Silver usually mark tolerance (end of resistor). Try flipping reading direction.');
    }

    return {
      nominalOhms,
      formattedResistance: formatResistance(nominalOhms),
      tolerancePercent,
      minOhms,
      maxOhms,
      tempCoPpm,
      roles,
      isValid: true,
      isReversedSuspect,
      reversedBands,
      matchedSeries,
      notes,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Decoding error';
    return {
      nominalOhms: 0,
      formattedResistance: 'Invalid Code',
      tolerancePercent: 0,
      minOhms: 0,
      maxOhms: 0,
      tempCoPpm: null,
      roles: [],
      isValid: false,
      validationError: message,
      isReversedSuspect,
      reversedBands,
      notes: [message],
    };
  }
}

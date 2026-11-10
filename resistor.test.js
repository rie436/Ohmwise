/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Resistor reader test suite (ESM)
 */

import assert from 'node:assert';
import test from 'node:test';
import ResistorReader from './resistor-reader.js';

test('Decoder: 4-band 4.7k 5%', () => {
  const result = ResistorReader.decode(['yellow', 'violet', 'red', 'gold']);
  assert.strictEqual(result.nominalOhms, 4700);
  assert.strictEqual(result.formattedResistance, '4.7 kΩ');
  assert.strictEqual(result.tolerancePercent, 5);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.isReversedSuspect, false);
});

test('Decoder: 5-band 220 ohm 1%', () => {
  const result = ResistorReader.decode(['red', 'red', 'black', 'black', 'brown']);
  assert.strictEqual(result.nominalOhms, 220);
  assert.strictEqual(result.formattedResistance, '220 Ω');
  assert.strictEqual(result.tolerancePercent, 1);
  assert.strictEqual(result.isValid, true);
});

test('Decoder: 6-band 100 ohm 1% 50ppm', () => {
  const result = ResistorReader.decode(['brown', 'black', 'black', 'black', 'brown', 'red']);
  assert.strictEqual(result.nominalOhms, 100);
  assert.strictEqual(result.formattedResistance, '100 Ω');
  assert.strictEqual(result.tempCoPpm, 50);
});

test('Decoder: 3-band vintage 330 ohm 20%', () => {
  const result = ResistorReader.decode(['orange', 'orange', 'brown']);
  assert.strictEqual(result.nominalOhms, 330);
  assert.strictEqual(result.tolerancePercent, 20);
});

test('Decoder: Detects suspected reversed reading order', () => {
  const result = ResistorReader.decode(['gold', 'red', 'violet', 'yellow']);
  assert.strictEqual(result.isReversedSuspect, true);
});

test('Color Classifier: Recognizes primary band colors', () => {
  // Red
  assert.strictEqual(ResistorReader.classifyColor(210, 30, 25), 'red');
  // Green
  assert.strictEqual(ResistorReader.classifyColor(25, 160, 45), 'green');
  // Blue
  assert.strictEqual(ResistorReader.classifyColor(20, 80, 220), 'blue');
  // Black
  assert.strictEqual(ResistorReader.classifyColor(15, 15, 18), 'black');
  // White
  assert.strictEqual(ResistorReader.classifyColor(240, 242, 245), 'white');
});

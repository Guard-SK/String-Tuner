// src/audio/pitch.js

// Hann window cached per size
const hannCache = new Map();

function getHannWindow(size) {
  if (hannCache.has(size)) return hannCache.get(size);
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  hannCache.set(size, w);
  return w;
}

/**
 * McLeod Pitch Method (MPM) with:
 * - DC offset removal
 * - Hann window
 * - min/max frequency bounds
 * Returns { frequency, clarity, rms } or null
 */
export function detectPitchMPM(
  input,
  sampleRate,
  minFreq = 40,
  maxFreq = 1500,
  rmsThreshold = 0.01,
) {
  const size = input.length;
  if (!size || !sampleRate) return null;

  const window = getHannWindow(size);
  const buffer = new Float32Array(size);

  // Remove DC + apply window
  let mean = 0;
  for (let i = 0; i < size; i++) mean += input[i];
  mean /= size;

  let rms = 0;
  for (let i = 0; i < size; i++) {
    const v = (input[i] - mean) * window[i];
    buffer[i] = v;
    rms += v * v;
  }
  rms = Math.sqrt(rms / size);

  if (rms < rmsThreshold) return null;

  const maxTau = Math.min(
    Math.floor(sampleRate / minFreq),
    size - 1,
  );
  const minTau = Math.max(
    2,
    Math.floor(sampleRate / maxFreq),
  );

  if (maxTau <= minTau) return null;

  const nsdf = new Float32Array(maxTau + 1);

  for (let tau = minTau; tau <= maxTau; tau++) {
    let acf = 0;
    let divisor = 0;
    for (let i = 0; i < size - tau; i++) {
      const x = buffer[i];
      const y = buffer[i + tau];
      acf += x * y * 2;
      divisor += x * x + y * y;
    }
    nsdf[tau] = divisor > 0 ? acf / divisor : 0;
  }

  // Find maximum NSDF peak above threshold
  let bestTau = -1;
  let bestValue = 0;
  const clarityThreshold = 0.6;

  for (let tau = minTau + 1; tau < maxTau - 1; tau++) {
    const value = nsdf[tau];
    if (
      value > clarityThreshold &&
      value > nsdf[tau - 1] &&
      value >= nsdf[tau + 1] &&
      value > bestValue
    ) {
      bestValue = value;
      bestTau = tau;
    }
  }

  if (bestTau < 0) return null;

  // Parabolic interpolation
  const s0 = nsdf[bestTau - 1];
  const s1 = nsdf[bestTau];
  const s2 = nsdf[bestTau + 1];
  const denom = 2 * (2 * s1 - s0 - s2);
  let refinedTau = bestTau;
  if (denom !== 0) {
    const delta = (s2 - s0) / denom;
    refinedTau = bestTau + delta;
  }

  const frequency = sampleRate / refinedTau;

  if (frequency < minFreq || frequency > maxFreq) return null;

  return {
    frequency,
    clarity: bestValue,
    rms,
  };
}

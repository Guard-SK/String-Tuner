<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 flex justify-center items-start px-3 py-4 sm:px-4"
  >
    <main class="w-full max-w-md mt-2 mb-6">
      <!-- Header row: title + language switcher -->
      <div class="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 class="text-lg font-semibold tracking-tight">
            {{ t('appTitle') }}
          </h1>
          <p class="text-[11px] text-slate-400">
            {{ t('subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-1 text-[11px]">
          <button
            v-for="lng in ['sk', 'en']"
            :key="lng"
            type="button"
            @click="language = lng"
            class="rounded-full px-2 py-1 font-medium uppercase tracking-[0.16em] transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
            :class="language === lng
              ? 'bg-slate-800 text-emerald-300 border border-emerald-500/70'
              : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-800'"
          >
            {{ lng === 'sk' ? 'SK' : 'EN' }}
          </button>
        </div>
      </div>

      <!-- Main card (mobile-first) -->
      <section
        class="rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-xl px-3 py-4 sm:px-5 sm:py-6 space-y-4"
      >
        <!-- Big central Start/Stop + status -->
        <div class="flex flex-col items-center gap-3">
          <button
            type="button"
            @click="toggleTuner"
            class="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-tight
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
            :class="isRunning
              ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_40px_rgba(16,185,129,0.8)] hover:bg-emerald-400'
              : 'bg-slate-800 text-slate-100 hover:bg-slate-700'"
          >
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="isRunning ? 'bg-emerald-900' : 'bg-slate-500'"
            />
            <span>{{ isRunning ? t('stopTuner') : t('startTuner') }}</span>
          </button>

          <p class="text-[11px] text-center text-slate-400 max-w-xs">
            {{ t('tapHint') }}
          </p>
        </div>

        <!-- Tuner display -->
        <div
          class="flex flex-col items-stretch gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-4 shadow-inner"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p
                class="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400/90"
              >
                {{ t('liveTuner') }}
              </p>
              <p
                class="text-[11px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {{ instrumentLabel }} •
                <span class="inline-block min-h-[1.2rem] align-middle">
                  <span v-if="hasStableNote">
                    {{ statusLabel }}
                  </span>
                  <span v-else>
                    {{ t('waiting') }}
                  </span>
                </span>
              </p>
              <!-- Mode pill: Auto vs locked string -->
              <div class="mt-1">
                <span
                  v-if="isAutoStringMode"
                  class="inline-flex items-center rounded-full bg-slate-800/80 border border-slate-600/80 px-2 py-0.5 text-[10px] text-slate-300 uppercase tracking-[0.16em]"
                >
                  {{ t('modeAutoShort') }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center rounded-full bg-emerald-900/30 border border-emerald-500/70 px-2 py-0.5 text-[10px] text-emerald-200 uppercase tracking-[0.16em]"
                >
                  {{ t('modeStringShort') }}:
                  <span class="ml-1 font-semibold">
                    {{ selectedString ? selectedString.label : stringMode }}
                  </span>
                </span>
              </div>
            </div>
            <div class="flex flex-col items-end text-[11px] text-slate-400">
              <span class="flex items-center gap-1">
                <span
                  class="inline-flex h-2 w-2 rounded-full"
                  :class="isRunning ? 'bg-emerald-400' : 'bg-slate-500'"
                />
                <span>
                  {{ isRunning ? t('listening') : t('idle') }}
                </span>
              </span>
              <span class="mt-0.5">
                {{ t('a4RefShort') }}: {{ a4Ref.toFixed(1) }} Hz
              </span>
            </div>
          </div>

          <!-- Note + meter -->
          <div class="flex items-center gap-3">
            <div
              class="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/80 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
            >
              <div class="text-center">
                <div class="text-[10px] uppercase tracking-[0.26em] text-slate-500">
                  {{ t('note') }}
                </div>
                <div class="mt-1 flex items-baseline justify-center gap-1">
                  <span class="text-4xl font-semibold leading-none">
                    {{ hasStableNote ? currentNote.name : '—' }}
                  </span>
                  <span
                    class="text-lg font-medium text-slate-400"
                    :class="hasStableNote ? 'opacity-100' : 'opacity-0'"
                  >
                    {{ hasStableNote ? currentNote.octave : '0' }}
                  </span>
                </div>
                <div class="mt-1 text-[10px] text-slate-400 min-h-[1.1rem]">
                  {{ hasStableNote ? freqLabel : '\u00A0' }}
                </div>
              </div>
            </div>

            <!-- Meter: big cents readout + sliding puck -->
            <div class="flex flex-1 flex-col gap-2">
              <!-- Big cents number + text -->
              <div class="flex items-baseline justify-between">
                <span class="text-[10px] text-slate-400">
                  {{ t('tuneDown') }}
                </span>

                <div class="flex flex-col items-center">
                  <span
                    class="text-xl font-semibold tracking-tight"
                    :class="hasStableNote && Math.abs(tuningCents || 0) < 3
                      ? 'text-emerald-300'
                      : 'text-slate-100'"
                  >
                    {{ hasStableNote && tuningCents != null ? tuningCents.toFixed(1) + '¢' : '—' }}
                  </span>
                  <div class="text-[10px] text-slate-500 min-h-[1.1rem]">
                    {{ centsLabel }}
                  </div>
                </div>

                <span class="text-[10px] text-slate-400">
                  {{ t('tuneUp') }}
                </span>
              </div>

              <!-- Sliding puck meter -->
              <div class="relative h-8 mt-1">
                <!-- Background zones -->
                <div
                  class="absolute inset-x-3 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-slate-900/90 ring-1 ring-slate-800/80 overflow-hidden"
                >
                  <div class="absolute inset-y-0 left-0 w-1/3 bg-rose-500/20"></div>
                  <div class="absolute inset-y-0 left-1/3 w-1/3 bg-emerald-500/25"></div>
                  <div class="absolute inset-y-0 left-2/3 w-1/3 bg-rose-500/20"></div>
                </div>

                <!-- Center tick -->
                <div
                  class="absolute left-1/2 top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-slate-500"
                ></div>

                <!-- Puck -->
                <div
                  class="absolute top-1/2 -translate-y-1/2 transition-all duration-150"
                  :style="{ left: `calc(${needleOffsetPercent}% - 12px)` }"
                >
                  <div
                    class="h-6 w-6 rounded-full border border-slate-900"
                    :class="needleColorClass"
                  ></div>
                </div>
              </div>

              <!-- Scale labels -->
              <div
                class="flex items-center justify-between text-[10px] text-slate-500 mt-1"
              >
                <span>-50¢</span>
                <span>-25¢</span>
                <span>0¢</span>
                <span>+25¢</span>
                <span>+50¢</span>
              </div>

              <!-- Signal / clarity row -->
              <div
                class="flex items-center justify-between text-[10px] text-slate-500 mt-1"
              >
                <span>
                  {{ t('signal') }}:
                  <span
                    :class="signalLevel > 0.04 ? 'text-emerald-300' : 'text-slate-300'"
                  >
                    {{ Math.round(signalPercent) }}%
                  </span>
                </span>
                <span>
                  {{ t('clarity') }}:
                  <span
                    :class="clarity > 0.7 ? 'text-emerald-300' : 'text-slate-300'"
                  >
                    {{ Math.round(clarity * 100) }}%
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Strings row -->
          <div
            v-if="currentInstrumentStrings.length"
            class="mt-1 flex flex-col gap-2"
          >
            <div
              class="flex items-center justify-between text-[10px] text-slate-500"
            >
              <span>{{ t('openStrings') }}</span>
              <span>{{ t('a4RefShort') }}: {{ a4Ref.toFixed(1) }} Hz</span>
            </div>
            <div class="grid grid-cols-4 gap-2 text-xs">
              <button
                v-for="s in currentInstrumentStrings"
                :key="s.id"
                type="button"
                @click="selectString(s.id)"
                class="relative overflow-hidden rounded-xl border px-2 py-1.5 text-center transition"
                :class="stringMode === s.id
                  ? 'border-emerald-500/80 bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : bestString && bestString.id === s.id
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-900/80 hover:border-slate-500 hover:bg-slate-800/80'"
              >
                <!-- Selected badge -->
                <div
                  class="absolute top-1 left-1 text-[9px] px-1 py-[1px] rounded-full border"
                  :class="stringMode === s.id
                    ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-100'
                    : 'border-transparent text-transparent'"
                >
                  {{ t('selectedShort') }}
                </div>

                <div
                  class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  {{ s.label }}
                </div>
                <div class="text-sm font-medium text-slate-100">
                  {{ s.freq.toFixed(1) }} Hz
                </div>
                <div class="mt-0.5 text-[10px] min-h-[1.1rem]">
                  <span
                    v-if="hasStableNote && bestString && bestString.id === s.id"
                    :class="Math.abs(bestString.cents) < 5
                      ? 'text-emerald-300'
                      : 'text-slate-300'"
                  >
                    {{
                      Math.abs(bestString.cents) < 3
                        ? t('inTune')
                        : bestString.cents > 0
                          ? '+' + bestString.cents.toFixed(1) + '¢ (' + t('sharp') + ')'
                          : bestString.cents.toFixed(1) + '¢ (' + t('flat') + ')'
                    }}
                  </span>
                  <span v-else class="opacity-0">
                    placeholder
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Settings (instrument & A4) below the tuner for thumb reach -->
        <div class="space-y-4">
          <!-- Instrument -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-semibold text-slate-100">
                {{ t('instrument') }}
              </span>
              <button
                type="button"
                @click="stringMode = 'auto'; resetSmoothing();"
                class="text-[10px] text-emerald-300 underline decoration-dotted underline-offset-2"
              >
                {{ t('autoString') }}
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="ins in instruments"
                :key="ins.id"
                type="button"
                @click="selectedInstrumentId = ins.id; stringMode = 'auto'; resetSmoothing();"
                class="flex flex-col rounded-xl border px-3 py-2 text-left text-[11px] transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
                :class="ins.id === selectedInstrumentId
                  ? 'border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.4)]'
                  : 'border-slate-700/80 bg-slate-900/80 hover:border-slate-600 hover:bg-slate-800/80'"
              >
                <span class="text-xs font-medium text-slate-100">
                  {{ language === 'sk' ? ins.nameSk : ins.nameEn }}
                </span>
                <span class="text-[10px] text-slate-400">
                  {{ language === 'sk' ? ins.descSk : ins.descEn }}
                </span>
              </button>
            </div>
          </div>

          <!-- A4 ref -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-semibold text-slate-100">
                {{ t('a4Ref') }}
              </span>
              <span class="text-slate-400">
                {{ a4Ref.toFixed(1) }} Hz
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="opt in quickA4Options"
                :key="opt"
                type="button"
                @click="setA4(opt)"
                class="rounded-full border px-3 py-1 text-[11px] font-medium transition
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
                :class="Math.round(a4Ref) === opt
                  ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200'
                  : 'border-slate-700/80 bg-slate-900/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800/80'"
              >
                {{ opt }} Hz
              </button>
            </div>
            <div class="space-y-1">
              <input
                type="range"
                min="430"
                max="450"
                step="0.5"
                v-model.number="a4Ref"
                @input="resetSmoothing"
                class="w-full accent-emerald-500"
              />
              <div
                class="flex items-center justify-between text-[10px] text-slate-500"
              >
                <span>430 Hz</span>
                <span>450 Hz</span>
              </div>
              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <span>{{ t('fineTune') }}</span>
                <input
                  type="number"
                  min="430"
                  max="450"
                  step="0.1"
                  v-model.number="a4Ref"
                  @change="clampA4"
                  class="w-20 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/80"
                />
                <span>Hz</span>
              </div>
            </div>
          </div>

          <p class="text-[10px] text-slate-500 leading-relaxed">
            {{ t('usageHint') }}
          </p>

          <p
            v-if="errorMessage"
            class="rounded-xl border border-rose-500/60 bg-rose-500/10 p-2 text-[10px] text-rose-100"
          >
            {{ errorMessage }}
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { detectPitchMPM } from './audio/pitch.js';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToFreq(midi, a4) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

function freqToMidi(f, a4) {
  return 69 + 12 * (Math.log(f / a4) / Math.log(2));
}

function midiToNote(midi) {
  const idx = (midi % 12 + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return { name: NOTE_NAMES[idx], octave, midi };
}

export default {
  name: 'App',
  data() {
    return {
      language: 'sk',

      instruments: [
        {
          id: 'violin',
          nameSk: 'Husle',
          nameEn: 'Violin',
          descSk: 'G – D – A – E',
          descEn: 'G – D – A – E',
          strings: [
            { id: 'g', label: 'G', midi: 55 },
            { id: 'd', label: 'D', midi: 62 },
            { id: 'a', label: 'A', midi: 69 },
            { id: 'e', label: 'E', midi: 76 },
          ],
          minMidi: 52,
          maxMidi: 80,
        },
        {
          id: 'viola',
          nameSk: 'Viola',
          nameEn: 'Viola',
          descSk: 'C – G – D – A',
          descEn: 'C – G – D – A',
          strings: [
            { id: 'c', label: 'C', midi: 48 },
            { id: 'g', label: 'G', midi: 55 },
            { id: 'd', label: 'D', midi: 62 },
            { id: 'a', label: 'A', midi: 69 },
          ],
          minMidi: 45,
          maxMidi: 74,
        },
        {
          id: 'cello',
          nameSk: 'Violončelo',
          nameEn: 'Cello',
          descSk: 'C – G – D – A',
          descEn: 'C – G – D – A',
          strings: [
            { id: 'c', label: 'C', midi: 36 },
            { id: 'g', label: 'G', midi: 43 },
            { id: 'd', label: 'D', midi: 50 },
            { id: 'a', label: 'A', midi: 57 },
          ],
          minMidi: 33,
          maxMidi: 69,
        },
        {
          id: 'bass',
          nameSk: 'Kontrabas',
          nameEn: 'Double bass',
          descSk: 'E – A – D – G',
          descEn: 'E – A – D – G',
          strings: [
            { id: 'e', label: 'E', midi: 28 },
            { id: 'a', label: 'A', midi: 33 },
            { id: 'd', label: 'D', midi: 38 },
            { id: 'g', label: 'G', midi: 43 },
          ],
          minMidi: 28,
          maxMidi: 60,
        },
      ],

      selectedInstrumentId: 'viola',
      stringMode: 'auto', // 'auto' or string id
      a4Ref: 442,
      quickA4Options: [440, 441, 442],

      isRunning: false,
      audioContext: null,
      analyser: null,
      mediaStream: null,
      timeData: null,
      rafId: null,

      currentFrequency: null,
      currentNote: null,
      currentCents: null,
      bestString: null,
      clarity: 0,
      signalLevel: 0,

      frequencyHistory: [],
      maxHistory: 7,

      errorMessage: '',
    };
  },
  computed: {
    currentInstrument() {
      return (
        this.instruments.find((i) => i.id === this.selectedInstrumentId) ||
        this.instruments[0]
      );
    },
    currentInstrumentStrings() {
      if (!this.currentInstrument) return [];
      return this.currentInstrument.strings.map((s) => ({
        ...s,
        freq: midiToFreq(s.midi, this.a4Ref),
      }));
    },
    hasStableNote() {
      return !!(this.currentNote && this.currentFrequency && this.clarity > 0.6);
    },
    instrumentLabel() {
      if (!this.currentInstrument) return '';
      return this.language === 'sk'
        ? this.currentInstrument.nameSk
        : this.currentInstrument.nameEn;
    },
    freqLabel() {
      if (!this.currentFrequency) return '';
      return this.currentFrequency.toFixed(2) + ' Hz';
    },
    isAutoStringMode() {
      return this.stringMode === 'auto';
    },
    selectedString() {
      if (this.isAutoStringMode) return null;
      return this.currentInstrumentStrings.find((s) => s.id === this.stringMode) || null;
    },
    // What the tuner should actually show: relative to target string if available
    tuningCents() {
      if (this.bestString && typeof this.bestString.cents === 'number') {
        return this.bestString.cents;
      }
      return this.currentCents;
    },
    centsLabel() {
      const c = this.tuningCents;
      if (!this.hasStableNote || c == null) {
        return this.t('centerNeedle');
      }
      if (Math.abs(c) < 3) return this.t('inTune');
      if (c > 0) return '+' + c.toFixed(1) + '¢ ' + this.t('sharp');
      return c.toFixed(1) + '¢ ' + this.t('flat');
    },
    signalPercent() {
      // rough mapping RMS -> 0–100%
      return Math.min(1, this.signalLevel / 0.12) * 100;
    },
    // 0% = -50¢, 50% = 0¢, 100% = +50¢
    needleOffsetPercent() {
      const maxCents = 50;
      const c = this.tuningCents || 0;
      const clamped = Math.max(-maxCents, Math.min(maxCents, c));
      return ((clamped + maxCents) / (2 * maxCents)) * 100;
    },
    needleColorClass() {
      const c = this.tuningCents || 0;
      if (!this.hasStableNote) return 'bg-slate-400';
      if (Math.abs(c) < 3) {
        return 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]';
      }
      if (Math.abs(c) < 10) {
        return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]';
      }
      return 'bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.7)]';
    },
    statusLabel() {
      const c = Math.abs(this.tuningCents || 0);
      if (c < 3) return this.t('perfectlyInTune');
      if (c < 10) return this.t('veryClose');
      return this.t('adjust');
    },
  },
  methods: {
    t(key) {
      const dict = {
        sk: {
          appTitle: 'Ladič sláčikových nástrojov',
          subtitle: 'Husle, viola, violončelo, kontrabas',
          startTuner: 'Spustiť ladič',
          stopTuner: 'Zastaviť ladič',
          tapHint:
            'Ťukni na tlačidlo, povol mikrofón a hraj prázdnu strunu čo najbližšie pri telefóne.',
          liveTuner: 'Ladič',
          waiting: 'Čakám na stabilný tón…',
          listening: 'Počúvam',
          idle: 'Neaktívny',
          a4Ref: 'Referenčné A',
          a4RefShort: 'A4',
          note: 'Tón',
          tuneDown: 'Ladiť nižšie',
          tuneUp: 'Ladiť vyššie',
          signal: 'Signál',
          clarity: 'Čistota tónu',
          openStrings: 'Prázdne struny',
          inTune: 'Naladené',
          sharp: 'vyššie',
          flat: 'nižšie',
          instrument: 'Nástroj',
          autoString: 'Automatická struna',
          fineTune: 'Jemné doladenie',
          usageHint:
            'Pre čo najlepšie výsledky drž telefón blízko nástroja, hraj iba jednu prázdnu strunu a ladič maj v popredí. V hlučnej sále skús ladiť, keď ostatní nehrajú.',
          centerNeedle: 'Vycentruj ručičku do stredu',
          perfectlyInTune: 'Perfektne naladené',
          veryClose: 'Veľmi blízko',
          adjust: 'Dolaďuj, kým sa ručička ustáli',
          modeAutoShort: 'AUTO',
          modeStringShort: 'STRUNA',
          selectedShort: 'ZVOLENÁ',
        },
        en: {
          appTitle: 'String Tuner',
          subtitle: 'Violin, viola, cello, double bass',
          startTuner: 'Start tuner',
          stopTuner: 'Stop tuner',
          tapHint:
            'Tap the button, allow microphone and play a single open string close to your phone.',
          liveTuner: 'Live tuner',
          waiting: 'Waiting for a stable tone…',
          listening: 'Listening',
          idle: 'Idle',
          a4Ref: 'Reference A',
          a4RefShort: 'A4',
          note: 'Note',
          tuneDown: 'Tune down',
          tuneUp: 'Tune up',
          signal: 'Signal',
          clarity: 'Tone clarity',
          openStrings: 'Open strings',
          inTune: 'In tune',
          sharp: 'sharp',
          flat: 'flat',
          instrument: 'Instrument',
          autoString: 'Auto string',
          fineTune: 'Fine adjust',
          usageHint:
            'For best results hold your phone close to the instrument, play a single open string, and keep the tuner in the foreground. In a noisy room, tune when others are quiet.',
          centerNeedle: 'Center the needle to tune',
          perfectlyInTune: 'Perfectly in tune',
          veryClose: 'Very close',
          adjust: 'Adjust until the needle stabilises',
          modeAutoShort: 'AUTO',
          modeStringShort: 'STRING',
          selectedShort: 'SELECTED',
        },
      };
      return (dict[this.language] && dict[this.language][key]) || key;
    },

    toggleTuner() {
      if (this.isRunning) {
        this.stopTuner();
      } else {
        this.startTuner();
      }
    },

    async startTuner() {
      this.errorMessage = '';
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          this.errorMessage =
            this.language === 'sk'
              ? 'Tento prehliadač nepodporuje prístup k mikrofónu.'
              : 'This browser does not support microphone access.';
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        this.mediaStream = stream;

        if (!this.audioContext) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createMediaStreamSource(stream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.0;

        source.connect(analyser);
        this.analyser = analyser;
        this.timeData = new Float32Array(analyser.fftSize);

        this.isRunning = true;
        this.resetSmoothing();
        this.loop();
      } catch (err) {
        console.error(err);
        this.errorMessage =
          this.language === 'sk'
            ? 'Nepodarilo sa získať prístup k mikrofónu. Skontroluj oprávnenia prehliadača.'
            : 'Could not access the microphone. Check your browser permissions and try again.';
      }
    },

    stopTuner() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
      }
      this.analyser = null;
      this.timeData = null;
      this.currentFrequency = null;
      this.currentNote = null;
      this.currentCents = null;
      this.bestString = null;
      this.clarity = 0;
      this.signalLevel = 0;
      this.frequencyHistory = [];
    },

    loop() {
      if (!this.isRunning || !this.analyser || !this.timeData) return;

      this.analyser.getFloatTimeDomainData(this.timeData);

      const len = this.timeData.length;
      let rms = 0;
      for (let i = 0; i < len; i++) {
        const v = this.timeData[i];
        rms += v * v;
      }
      rms = Math.sqrt(rms / len);
      this.signalLevel = rms;

      const { minFreq, maxFreq } = this.currentFreqRange();

      if (rms > 0.01) {
        const result = detectPitchMPM(
          this.timeData,
          this.audioContext.sampleRate,
          minFreq,
          maxFreq,
          0.01,
        );
        if (result && result.frequency && result.clarity > 0.65) {
          this.clarity = result.clarity;
          this.pushFrequency(result.frequency);
          this.updateFromFrequency();
        } else {
          // decay clarity a bit when unsure
          this.clarity *= 0.9;
        }
      } else {
        this.clarity *= 0.9;
      }

      this.rafId = requestAnimationFrame(this.loop);
    },

    currentFreqRange() {
      const ins = this.currentInstrument;
      if (!ins) return { minFreq: 40, maxFreq: 1500 };
      const padding = 6; // semitones
      const minMidi = ins.minMidi - padding;
      const maxMidi = ins.maxMidi + padding;
      const minFreq = midiToFreq(minMidi, this.a4Ref);
      const maxFreq = midiToFreq(maxMidi, this.a4Ref);
      return { minFreq, maxFreq };
    },

    pushFrequency(freq) {
      this.frequencyHistory.push(freq);
      if (this.frequencyHistory.length > this.maxHistory) {
        this.frequencyHistory.shift();
      }
    },

    getSmoothedFrequency() {
      if (!this.frequencyHistory.length) return null;
      // median smoothing for stability
      const arr = [...this.frequencyHistory].sort((a, b) => a - b);
      const mid = Math.floor(arr.length / 2);
      if (arr.length % 2 === 1) return arr[mid];
      return (arr[mid - 1] + arr[mid]) / 2;
    },

    updateFromFrequency() {
      const freq = this.getSmoothedFrequency();
      if (!freq) return;

      this.currentFrequency = freq;

      const midiFloat = freqToMidi(freq, this.a4Ref);
      const midiRounded = Math.round(midiFloat);
      const note = midiToNote(midiRounded);
      const noteFreq = midiToFreq(midiRounded, this.a4Ref);
      const cents = 1200 * (Math.log(freq / noteFreq) / Math.log(2));

      this.currentNote = note;
      this.currentCents = cents;

      // Nearest / selected string
      const strings = this.currentInstrumentStrings;
      if (!strings.length) {
        this.bestString = null;
        return;
      }

      let chosen = null;
      if (this.stringMode !== 'auto') {
        chosen = strings.find((s) => s.id === this.stringMode) || null;
      }

      if (!chosen) {
        let best = null;
        let bestAbs = Infinity;
        strings.forEach((s) => {
          const centsDiff =
            1200 * (Math.log(freq / s.freq) / Math.log(2));
          const abs = Math.abs(centsDiff);
          if (abs < bestAbs) {
            bestAbs = abs;
            best = { ...s, cents: centsDiff };
          }
        });
        this.bestString = best;
      } else {
        const centsDiff =
          1200 * (Math.log(freq / chosen.freq) / Math.log(2));
        this.bestString = { ...chosen, cents: centsDiff };
      }
    },

    selectString(stringId) {
      this.stringMode = stringId;
      this.resetSmoothing();
    },

    setA4(value) {
      this.a4Ref = value;
      this.resetSmoothing();
    },

    clampA4() {
      if (this.a4Ref < 430) this.a4Ref = 430;
      if (this.a4Ref > 450) this.a4Ref = 450;
      this.resetSmoothing();
    },

    resetSmoothing() {
      this.frequencyHistory = [];
      this.currentFrequency = null;
      this.currentNote = null;
      this.currentCents = null;
      this.bestString = null;
    },
  },
  mounted() {
    // Restore language from browser preference
    const lang = navigator.language || navigator.userLanguage;
    if (lang && lang.toLowerCase().startsWith('en')) {
      this.language = 'en';
    } else {
      this.language = 'sk';
    }
  },
  beforeUnmount() {
    this.stopTuner();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  },
};
</script>

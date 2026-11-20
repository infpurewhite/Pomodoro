/**
 * Calendar-based menstrual cycle phase estimation.
 *
 * Pure functions with no DOM access. Loaded as a classic script in the browser
 * (exposes `window.Cycle`) and as a CommonJS module in the Node test suite.
 *
 * The model is a deliberate simplification:
 *   - ovulation is placed LUTEAL_DAYS before the next expected period;
 *   - the days around it are shown as an "ovulatory" window;
 *   - the last PREMENSTRUAL_DAYS of the cycle are flagged as the premenstrual week.
 * Real cycles vary, so every result is an estimate, never a measurement.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.Cycle = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Accepted input ranges. Outside them a calendar estimate is not offered. */
  var LIMITS = Object.freeze({ minCycle: 21, maxCycle: 35, minPeriod: 2, maxPeriod: 8 });

  /** Values used for the example shown before the reader enters their own. */
  var DEFAULTS = Object.freeze({ cycleLength: 28, periodLength: 5 });

  /** Assumed number of days from ovulation to the day before the next period. */
  var LUTEAL_DAYS = 14;

  /** Days shown either side of the estimated ovulation day. */
  var OVULATION_WINDOW = 1;

  /** Length of the premenstrual window at the end of the luteal phase. */
  var PREMENSTRUAL_DAYS = 7;

  /** Schematic progesterone curve: resting level and rise to its peak (no units). */
  var PROGESTERONE_BASE = 0.05;
  var PROGESTERONE_RISE = 0.86;

  var MS_PER_DAY = 86400000;
  var ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

  /** Phase identifiers in cycle order. */
  var PHASE_IDS = Object.freeze(['menstrual', 'follicular', 'ovulatory', 'luteal']);

  /**
   * Parse a calendar date written as YYYY-MM-DD.
   * Dates are handled as UTC midnights so daylight-saving changes cannot shift a day count.
   * @param {string} iso
   * @returns {number} UTC milliseconds, or NaN when the string is not a real date.
   */
  function parseISODate(iso) {
    var match = ISO_DATE.exec(String(iso == null ? '' : iso));
    if (!match) {
      return NaN;
    }
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var ms = Date.UTC(year, month - 1, day);
    var check = new Date(ms);
    var isReal =
      check.getUTCFullYear() === year &&
      check.getUTCMonth() === month - 1 &&
      check.getUTCDate() === day;
    return isReal ? ms : NaN;
  }

  /**
   * Format UTC milliseconds as YYYY-MM-DD.
   * @param {number} ms
   * @returns {string}
   */
  function toISODate(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  /**
   * Today's calendar date in the reader's own time zone, as YYYY-MM-DD.
   * @param {Date} [now]
   * @returns {string}
   */
  function localTodayISO(now) {
    var d = now instanceof Date ? now : new Date();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + month + '-' + day;
  }

  /**
   * Whole days from one ISO date to another (positive when `to` is later).
   * @param {string} from
   * @param {string} to
   * @returns {number} NaN if either date is invalid.
   */
  function daysBetween(from, to) {
    return Math.round((parseISODate(to) - parseISODate(from)) / MS_PER_DAY);
  }

  /**
   * Add a number of days to an ISO date.
   * @param {string} iso
   * @param {number} days
   * @returns {string}
   */
  function addDays(iso, days) {
    return toISODate(parseISODate(iso) + days * MS_PER_DAY);
  }

  function isWholeNumber(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  }

  /**
   * Check reader input and report every problem found.
   * @param {{lastPeriodStart: string, cycleLength: number, periodLength: number, today: string}} input
   * @returns {string[]} Error codes: 'date-required', 'date-invalid', 'date-future',
   *   'cycle-range', 'period-range'. Empty when the input is usable.
   */
  function validateInputs(input) {
    var errors = [];
    var data = input || {};

    if (!data.lastPeriodStart) {
      errors.push('date-required');
    } else if (isNaN(parseISODate(data.lastPeriodStart))) {
      errors.push('date-invalid');
    } else if (daysBetween(data.lastPeriodStart, data.today) < 0) {
      errors.push('date-future');
    }

    var cycleOk =
      isWholeNumber(data.cycleLength) &&
      data.cycleLength >= LIMITS.minCycle &&
      data.cycleLength <= LIMITS.maxCycle;
    if (!cycleOk) {
      errors.push('cycle-range');
    }

    var periodOk =
      isWholeNumber(data.periodLength) &&
      data.periodLength >= LIMITS.minPeriod &&
      data.periodLength <= LIMITS.maxPeriod;
    if (!periodOk) {
      errors.push('period-range');
    }

    return errors;
  }

  /**
   * Estimated ovulation day for a cycle of the given length.
   * @param {number} cycleLength
   * @returns {number} Cycle day (day 1 is the first day of bleeding).
   */
  function estimateOvulationDay(cycleLength) {
    return cycleLength - LUTEAL_DAYS;
  }

  /**
   * Split a cycle into its displayed phases.
   *
   * Segments are contiguous, do not overlap and together cover day 1 to `cycleLength`.
   * In short cycles the bleeding days can run into the ovulatory window; bleeding is
   * then cut short at the window and the follicular segment is omitted.
   *
   * @param {number} cycleLength
   * @param {number} periodLength
   * @returns {{id: string, start: number, end: number}[]}
   */
  function getPhaseSegments(cycleLength, periodLength) {
    var ovulation = estimateOvulationDay(cycleLength);
    var ovulatoryStart = ovulation - OVULATION_WINDOW;
    var ovulatoryEnd = ovulation + OVULATION_WINDOW;
    var menstrualEnd = Math.min(periodLength, ovulatoryStart - 1);

    var segments = [
      { id: 'menstrual', start: 1, end: menstrualEnd },
      { id: 'follicular', start: menstrualEnd + 1, end: ovulatoryStart - 1 },
      { id: 'ovulatory', start: ovulatoryStart, end: ovulatoryEnd },
      { id: 'luteal', start: ovulatoryEnd + 1, end: cycleLength }
    ];

    return segments.filter(function (segment) {
      return segment.end >= segment.start;
    });
  }

  /**
   * The premenstrual window: the final days of the luteal phase.
   * @param {number} cycleLength
   * @returns {{start: number, end: number}}
   */
  function getPremenstrualWindow(cycleLength) {
    var lutealStart = estimateOvulationDay(cycleLength) + OVULATION_WINDOW + 1;
    var start = Math.max(lutealStart, cycleLength - PREMENSTRUAL_DAYS + 1);
    return { start: start, end: cycleLength };
  }

  /**
   * Which phase a cycle day falls in.
   * @param {number} day
   * @param {number} cycleLength
   * @param {number} periodLength
   * @returns {{id: string, premenstrual: boolean}}
   * @throws {RangeError} When `day` is outside the cycle.
   */
  function getPhaseForDay(day, cycleLength, periodLength) {
    if (!isWholeNumber(day) || day < 1 || day > cycleLength) {
      throw new RangeError('Cycle day ' + day + ' is outside 1..' + cycleLength);
    }
    var segments = getPhaseSegments(cycleLength, periodLength);
    var match = segments.filter(function (segment) {
      return day >= segment.start && day <= segment.end;
    })[0];
    var window = getPremenstrualWindow(cycleLength);
    return {
      id: match.id,
      premenstrual: day >= window.start && day <= window.end
    };
  }

  /**
   * Estimate where the reader is in their cycle today.
   *
   * When the entered date is more than one cycle old, later periods are assumed to
   * have arrived exactly on schedule; `cyclesElapsed` reports how many were assumed.
   *
   * @param {{lastPeriodStart: string, cycleLength: number, periodLength: number, today: string}} input
   * @returns {{day: number, cycleLength: number, periodLength: number, phase: string,
   *   premenstrual: boolean, cyclesElapsed: number, daysUntilNextPeriod: number,
   *   nextPeriodStart: string, ovulationDay: number,
   *   segments: {id: string, start: number, end: number}[],
   *   premenstrualWindow: {start: number, end: number}}}
   * @throws {Error} With a `codes` array when the input fails validation.
   */
  function getCycleStatus(input) {
    var codes = validateInputs(input);
    if (codes.length > 0) {
      var error = new Error('Invalid cycle input: ' + codes.join(', '));
      error.codes = codes;
      throw error;
    }

    var elapsed = daysBetween(input.lastPeriodStart, input.today);
    var cyclesElapsed = Math.floor(elapsed / input.cycleLength);
    var day = (elapsed % input.cycleLength) + 1;
    var phase = getPhaseForDay(day, input.cycleLength, input.periodLength);

    return {
      day: day,
      cycleLength: input.cycleLength,
      periodLength: input.periodLength,
      phase: phase.id,
      premenstrual: phase.premenstrual,
      cyclesElapsed: cyclesElapsed,
      daysUntilNextPeriod: input.cycleLength - day + 1,
      nextPeriodStart: addDays(input.lastPeriodStart, (cyclesElapsed + 1) * input.cycleLength),
      ovulationDay: estimateOvulationDay(input.cycleLength),
      segments: getPhaseSegments(input.cycleLength, input.periodLength),
      premenstrualWindow: getPremenstrualWindow(input.cycleLength)
    };
  }

  function gaussian(x, centre, spread) {
    var z = (x - centre) / spread;
    return Math.exp(-0.5 * z * z);
  }

  /**
   * Schematic relative hormone levels (0 to about 1) on a cycle day.
   *
   * Illustrative shapes only: oestrogen peaks just before ovulation and rises again
   * after it; progesterone rises after ovulation and falls before the next period.
   * These are not measurements and carry no units.
   *
   * @param {number} day Cycle day; fractions are allowed for drawing smooth curves.
   * @param {number} cycleLength
   * @returns {{oestrogen: number, progesterone: number}}
   */
  function hormoneLevels(day, cycleLength) {
    var ovulation = estimateOvulationDay(cycleLength);
    var lutealPeak = ovulation + LUTEAL_DAYS / 2;
    return {
      oestrogen:
        0.12 + 0.74 * gaussian(day, ovulation - 1, 2.4) + 0.36 * gaussian(day, lutealPeak, 3.4),
      progesterone: PROGESTERONE_BASE + PROGESTERONE_RISE * gaussian(day, lutealPeak, 3.2)
    };
  }

  function smoothstep(t) {
    var x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  /**
   * Schematic state of the ovary and the womb lining on a cycle day, for the
   * "Inside your body" diagram. Like the hormone curves, these are illustrative
   * shapes from 0 to 1 with no units, not measurements.
   *
   *   follicle      size of the maturing follicle; 0 once the egg has been released;
   *   egg           0 while the egg is inside the follicle, 0.5 on the estimated ovulation
   *                 day and 1 the day after, as it moves away; 0 again after that;
   *   corpusLuteum  size of the empty follicle that makes progesterone; it follows the
   *                 schematic progesterone curve, so it shrinks before the next period;
   *   lining        thickness of the womb lining: thinnest as bleeding ends, thickest in
   *                 the second half of the cycle;
   *   shedding      true on the bleeding days shown in the menstrual segment.
   *
   * @param {number} day Cycle day, a whole number from 1 to `cycleLength`.
   * @param {number} cycleLength
   * @param {number} periodLength
   * @returns {{follicle: number, egg: number, corpusLuteum: number, lining: number, shedding: boolean}}
   * @throws {RangeError} When `day` is outside the cycle.
   */
  function anatomyForDay(day, cycleLength, periodLength) {
    if (!isWholeNumber(day) || day < 1 || day > cycleLength) {
      throw new RangeError('Cycle day ' + day + ' is outside 1..' + cycleLength);
    }
    var ovulation = estimateOvulationDay(cycleLength);
    var bleedingEnd = getPhaseSegments(cycleLength, periodLength)[0].end;

    var follicle = 0;
    if (day < ovulation) {
      follicle = 0.2 + 0.8 * smoothstep((day - 1) / (ovulation - 1));
    } else if (day === ovulation) {
      follicle = 1;
    }

    var egg = 0;
    if (day === ovulation) {
      egg = 0.5;
    } else if (day === ovulation + OVULATION_WINDOW) {
      egg = 1;
    }

    var corpusLuteum = 0;
    if (day > ovulation) {
      var progesterone = hormoneLevels(day, cycleLength).progesterone;
      corpusLuteum = Math.max(0, Math.min(1, (progesterone - PROGESTERONE_BASE) / PROGESTERONE_RISE));
    }

    var lining;
    if (day <= bleedingEnd) {
      lining = 0.8 - (0.6 * (day - 1)) / Math.max(1, bleedingEnd - 1);
    } else if (day <= ovulation) {
      lining = 0.2 + (0.5 * (day - bleedingEnd)) / Math.max(1, ovulation - bleedingEnd);
    } else {
      lining = 0.7 + 0.3 * Math.min(1, (day - ovulation) / (LUTEAL_DAYS / 2));
    }

    return {
      follicle: follicle,
      egg: egg,
      corpusLuteum: corpusLuteum,
      lining: lining,
      shedding: day <= bleedingEnd
    };
  }

  /**
   * Describe a hormone's schematic level on a day in words.
   * @param {'oestrogen'|'progesterone'} hormone
   * @param {number} day
   * @param {number} cycleLength
   * @returns {'low'|'rising'|'high'|'falling'}
   */
  function describeHormone(hormone, day, cycleLength) {
    var level = hormoneLevels(day, cycleLength)[hormone];
    var slope =
      hormoneLevels(day + 0.5, cycleLength)[hormone] -
      hormoneLevels(day - 0.5, cycleLength)[hormone];
    if (level < 0.22) {
      return 'low';
    }
    if (Math.abs(slope) <= 0.03 && level >= 0.6) {
      return 'high';
    }
    return slope > 0 ? 'rising' : 'falling';
  }

  return {
    LIMITS: LIMITS,
    DEFAULTS: DEFAULTS,
    LUTEAL_DAYS: LUTEAL_DAYS,
    OVULATION_WINDOW: OVULATION_WINDOW,
    PREMENSTRUAL_DAYS: PREMENSTRUAL_DAYS,
    PHASE_IDS: PHASE_IDS,
    parseISODate: parseISODate,
    toISODate: toISODate,
    localTodayISO: localTodayISO,
    daysBetween: daysBetween,
    addDays: addDays,
    validateInputs: validateInputs,
    estimateOvulationDay: estimateOvulationDay,
    getPhaseSegments: getPhaseSegments,
    getPremenstrualWindow: getPremenstrualWindow,
    getPhaseForDay: getPhaseForDay,
    getCycleStatus: getCycleStatus,
    hormoneLevels: hormoneLevels,
    describeHormone: describeHormone,
    anatomyForDay: anatomyForDay
  };
});

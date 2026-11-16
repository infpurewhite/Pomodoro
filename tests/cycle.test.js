'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Cycle = require('../assets/js/cycle.js');

const byId = (segments) => Object.fromEntries(segments.map((s) => [s.id, [s.start, s.end]]));

test('28-day cycle with 5 days of bleeding splits into the expected phases', () => {
  assert.deepEqual(byId(Cycle.getPhaseSegments(28, 5)), {
    menstrual: [1, 5],
    follicular: [6, 12],
    ovulatory: [13, 15],
    luteal: [16, 28]
  });
  assert.equal(Cycle.estimateOvulationDay(28), 14);
  assert.deepEqual(Cycle.getPremenstrualWindow(28), { start: 22, end: 28 });
});

test('35-day cycle lengthens the follicular phase, not the luteal phase', () => {
  assert.deepEqual(byId(Cycle.getPhaseSegments(35, 5)), {
    menstrual: [1, 5],
    follicular: [6, 19],
    ovulatory: [20, 22],
    luteal: [23, 35]
  });
  assert.deepEqual(Cycle.getPremenstrualWindow(35), { start: 29, end: 35 });
});

test('short cycle keeps a follicular segment when bleeding is short', () => {
  assert.deepEqual(byId(Cycle.getPhaseSegments(21, 3)), {
    menstrual: [1, 3],
    follicular: [4, 5],
    ovulatory: [6, 8],
    luteal: [9, 21]
  });
});

test('short cycle with long bleeding cuts bleeding at the ovulatory window', () => {
  const segments = Cycle.getPhaseSegments(21, 8);
  assert.deepEqual(byId(segments), {
    menstrual: [1, 5],
    ovulatory: [6, 8],
    luteal: [9, 21]
  });
  assert.equal(segments.some((s) => s.id === 'follicular'), false);
});

test('segments are contiguous and cover the whole cycle for every accepted input', () => {
  const { minCycle, maxCycle, minPeriod, maxPeriod } = Cycle.LIMITS;
  for (let length = minCycle; length <= maxCycle; length += 1) {
    for (let period = minPeriod; period <= maxPeriod; period += 1) {
      const segments = Cycle.getPhaseSegments(length, period);
      assert.equal(segments[0].start, 1, `starts on day 1 (${length}/${period})`);
      assert.equal(segments[segments.length - 1].end, length, `ends on day ${length}`);
      for (let i = 1; i < segments.length; i += 1) {
        assert.equal(
          segments[i].start,
          segments[i - 1].end + 1,
          `no gap or overlap (${length}/${period})`
        );
      }
      const window = Cycle.getPremenstrualWindow(length);
      const luteal = segments.find((s) => s.id === 'luteal');
      assert.ok(window.start >= luteal.start, 'premenstrual window sits inside the luteal phase');
      assert.equal(window.end, length);
    }
  }
});

test('getPhaseForDay reports the phase and the premenstrual flag', () => {
  assert.deepEqual(Cycle.getPhaseForDay(1, 28, 5), { id: 'menstrual', premenstrual: false });
  assert.deepEqual(Cycle.getPhaseForDay(9, 28, 5), { id: 'follicular', premenstrual: false });
  assert.deepEqual(Cycle.getPhaseForDay(14, 28, 5), { id: 'ovulatory', premenstrual: false });
  assert.deepEqual(Cycle.getPhaseForDay(18, 28, 5), { id: 'luteal', premenstrual: false });
  assert.deepEqual(Cycle.getPhaseForDay(22, 28, 5), { id: 'luteal', premenstrual: true });
  assert.deepEqual(Cycle.getPhaseForDay(28, 28, 5), { id: 'luteal', premenstrual: true });
});

test('getPhaseForDay rejects days outside the cycle', () => {
  assert.throws(() => Cycle.getPhaseForDay(0, 28, 5), RangeError);
  assert.throws(() => Cycle.getPhaseForDay(29, 28, 5), RangeError);
  assert.throws(() => Cycle.getPhaseForDay(2.5, 28, 5), RangeError);
});

test('getCycleStatus counts the first day of bleeding as day 1', () => {
  const status = Cycle.getCycleStatus({
    lastPeriodStart: '2026-11-01',
    cycleLength: 28,
    periodLength: 5,
    today: '2026-11-01'
  });
  assert.equal(status.day, 1);
  assert.equal(status.phase, 'menstrual');
  assert.equal(status.cyclesElapsed, 0);
  assert.equal(status.daysUntilNextPeriod, 28);
  assert.equal(status.nextPeriodStart, '2026-11-29');
});

test('getCycleStatus reports mid-cycle position and the next period date', () => {
  const status = Cycle.getCycleStatus({
    lastPeriodStart: '2026-11-01',
    cycleLength: 28,
    periodLength: 5,
    today: '2026-11-16'
  });
  assert.equal(status.day, 16);
  assert.equal(status.phase, 'luteal');
  assert.equal(status.premenstrual, false);
  assert.equal(status.daysUntilNextPeriod, 13);
  assert.equal(status.nextPeriodStart, '2026-11-29');
  assert.equal(status.ovulationDay, 14);
});

test('getCycleStatus wraps into later cycles and reports how many were assumed', () => {
  const status = Cycle.getCycleStatus({
    lastPeriodStart: '2026-11-01',
    cycleLength: 28,
    periodLength: 5,
    today: '2026-12-30'
  });
  assert.equal(status.cyclesElapsed, 2);
  assert.equal(status.day, 4);
  assert.equal(status.phase, 'menstrual');
  assert.equal(status.nextPeriodStart, '2027-01-24');
});

test('day counts are not shifted by daylight-saving changes', () => {
  assert.equal(Cycle.daysBetween('2026-03-20', '2026-04-05'), 16);
  assert.equal(Cycle.daysBetween('2026-10-20', '2026-11-05'), 16);
  assert.equal(Cycle.addDays('2026-03-28', 2), '2026-03-30');
});

test('date helpers handle month ends and leap years', () => {
  assert.equal(Cycle.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(Cycle.addDays('2027-02-28', 1), '2027-03-01');
  assert.equal(Cycle.daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.ok(Number.isNaN(Cycle.parseISODate('2026-02-30')));
  assert.ok(Number.isNaN(Cycle.parseISODate('16/11/2026')));
  assert.ok(Number.isNaN(Cycle.parseISODate('')));
});

test('localTodayISO uses the local calendar date', () => {
  assert.equal(Cycle.localTodayISO(new Date(2026, 10, 6, 23, 59)), '2026-11-06');
  assert.equal(Cycle.localTodayISO(new Date(2026, 0, 1, 0, 0)), '2026-01-01');
});

test('validateInputs reports every problem', () => {
  const base = { lastPeriodStart: '2026-11-01', cycleLength: 28, periodLength: 5, today: '2026-11-16' };
  assert.deepEqual(Cycle.validateInputs(base), []);
  assert.deepEqual(Cycle.validateInputs({ ...base, lastPeriodStart: '' }), ['date-required']);
  assert.deepEqual(Cycle.validateInputs({ ...base, lastPeriodStart: '2026-02-30' }), ['date-invalid']);
  assert.deepEqual(Cycle.validateInputs({ ...base, lastPeriodStart: '2026-11-17' }), ['date-future']);
  assert.deepEqual(Cycle.validateInputs({ ...base, cycleLength: 20 }), ['cycle-range']);
  assert.deepEqual(Cycle.validateInputs({ ...base, cycleLength: 36 }), ['cycle-range']);
  assert.deepEqual(Cycle.validateInputs({ ...base, cycleLength: 28.5 }), ['cycle-range']);
  assert.deepEqual(Cycle.validateInputs({ ...base, cycleLength: NaN }), ['cycle-range']);
  assert.deepEqual(Cycle.validateInputs({ ...base, periodLength: 1 }), ['period-range']);
  assert.deepEqual(Cycle.validateInputs({ ...base, periodLength: 9 }), ['period-range']);
  assert.deepEqual(
    Cycle.validateInputs({ lastPeriodStart: '', cycleLength: 50, periodLength: 0, today: '2026-11-16' }),
    ['date-required', 'cycle-range', 'period-range']
  );
});

test('getCycleStatus throws with error codes on invalid input', () => {
  assert.throws(
    () =>
      Cycle.getCycleStatus({
        lastPeriodStart: '2026-11-20',
        cycleLength: 40,
        periodLength: 5,
        today: '2026-11-16'
      }),
    (error) => {
      assert.deepEqual(error.codes, ['date-future', 'cycle-range']);
      return true;
    }
  );
});

test('schematic hormone curves have the expected shape', () => {
  const length = 28;
  const ovulation = Cycle.estimateOvulationDay(length);
  const at = (day) => Cycle.hormoneLevels(day, length);

  // Both hormones are low during bleeding.
  assert.ok(at(2).oestrogen < 0.25);
  assert.ok(at(2).progesterone < 0.25);
  // Oestrogen peaks just before ovulation; progesterone is still low there.
  assert.ok(at(ovulation - 1).oestrogen > at(ovulation - 5).oestrogen);
  assert.ok(at(ovulation - 1).oestrogen > at(ovulation + 2).oestrogen);
  assert.ok(at(ovulation - 1).progesterone < 0.25);
  // Progesterone peaks in the middle of the luteal phase and falls before the next period.
  assert.ok(at(ovulation + 7).progesterone > at(ovulation + 2).progesterone);
  assert.ok(at(ovulation + 7).progesterone > at(length).progesterone);
  // Levels stay inside the plotted range for every accepted cycle length.
  for (let l = Cycle.LIMITS.minCycle; l <= Cycle.LIMITS.maxCycle; l += 1) {
    for (let day = 1; day <= l; day += 1) {
      const levels = Cycle.hormoneLevels(day, l);
      assert.ok(levels.oestrogen > 0 && levels.oestrogen <= 1);
      assert.ok(levels.progesterone > 0 && levels.progesterone <= 1);
    }
  }
});

test('describeHormone turns the curves into words', () => {
  assert.equal(Cycle.describeHormone('oestrogen', 2, 28), 'low');
  assert.equal(Cycle.describeHormone('progesterone', 2, 28), 'low');
  assert.equal(Cycle.describeHormone('oestrogen', 11, 28), 'rising');
  assert.equal(Cycle.describeHormone('oestrogen', 13, 28), 'high');
  assert.equal(Cycle.describeHormone('progesterone', 18, 28), 'rising');
  assert.equal(Cycle.describeHormone('progesterone', 21, 28), 'high');
  assert.equal(Cycle.describeHormone('progesterone', 25, 28), 'falling');
});

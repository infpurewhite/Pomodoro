/**
 * "Myth or fact?" deck logic: seeded random numbers, shuffling, dealing a balanced
 * deck and scoring.
 *
 * Pure functions with no DOM access. Loaded as a classic script in the browser
 * (exposes `window.Quiz`) and as a CommonJS module in the Node test suite.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.Quiz = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Cards dealt per game. */
  var DECK_SIZE = 10;

  /** How far the number of myths may stray from half, so players cannot count on a 5/5 split. */
  var MAX_IMBALANCE = 1;

  /** Possible answers, in the order the buttons show them. */
  var ANSWERS = Object.freeze(['myth', 'fact']);

  /**
   * Seeded pseudo-random numbers in [0, 1) (the mulberry32 generator).
   * Tests pass a fixed seed; the page seeds it from Math.random.
   * @param {number} seed
   * @returns {() => number}
   */
  function createRandom(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Fisher–Yates shuffle. Runs in O(n) and leaves the input unchanged.
   * @template T
   * @param {T[]} items
   * @param {() => number} random
   * @returns {T[]} A new, shuffled array.
   */
  function shuffle(items, random) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(random() * (i + 1));
      var swap = copy[i];
      copy[i] = copy[j];
      copy[j] = swap;
    }
    return copy;
  }

  /**
   * Deal a deck of card ids: about half myths and half facts, in random order.
   * @param {{id: string, answer: string}[]} cards The whole pool.
   * @param {number} size Cards to deal.
   * @param {() => number} random
   * @returns {string[]}
   * @throws {RangeError} When the pool cannot supply a balanced deck of this size.
   */
  function deal(cards, size, random) {
    var myths = shuffle(
      cards.filter(function (card) {
        return card.answer === 'myth';
      }),
      random
    );
    var facts = shuffle(
      cards.filter(function (card) {
        return card.answer === 'fact';
      }),
      random
    );

    var centre = size / 2;
    var low = Math.max(Math.ceil(centre - MAX_IMBALANCE), size - facts.length, 0);
    var high = Math.min(Math.floor(centre + MAX_IMBALANCE), myths.length, size);
    if (low > high) {
      throw new RangeError(
        'Cannot deal ' + size + ' balanced cards from ' + myths.length + ' myths and ' +
          facts.length + ' facts'
      );
    }

    var mythCount = low + Math.floor(random() * (high - low + 1));
    var picked = myths.slice(0, mythCount).concat(facts.slice(0, size - mythCount));
    return shuffle(picked, random).map(function (card) {
      return card.id;
    });
  }

  /**
   * Summarise the answers given so far.
   * @param {{guess: string, answer: string}[]} answers In the order they were given.
   * @returns {{correct: number, total: number, streak: number, bestStreak: number}}
   *   `streak` is the current run of correct answers; `bestStreak` the longest run.
   */
  function score(answers) {
    var correct = 0;
    var run = 0;
    var best = 0;
    answers.forEach(function (entry) {
      if (entry.guess === entry.answer) {
        correct += 1;
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    });
    return { correct: correct, total: answers.length, streak: run, bestStreak: best };
  }

  /**
   * Which closing message to show for a score.
   * @param {number} correct
   * @param {number} total
   * @returns {'high'|'mid'|'low'} high is 90% or more, mid is 60% or more.
   */
  function resultBand(correct, total) {
    var share = total > 0 ? correct / total : 0;
    if (share >= 0.9) {
      return 'high';
    }
    return share >= 0.6 ? 'mid' : 'low';
  }

  return {
    DECK_SIZE: DECK_SIZE,
    MAX_IMBALANCE: MAX_IMBALANCE,
    ANSWERS: ANSWERS,
    createRandom: createRandom,
    shuffle: shuffle,
    deal: deal,
    score: score,
    resultBand: resultBand
  };
});

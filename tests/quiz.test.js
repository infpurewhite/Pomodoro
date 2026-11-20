'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Quiz = require('../assets/js/quiz.js');

/** A pool shaped like the real one: 8 myths and 8 facts. */
const pool = Array.from({ length: 16 }, (_, index) => ({
  id: `card-${index}`,
  answer: index % 2 === 0 ? 'myth' : 'fact'
}));
const answerOf = Object.fromEntries(pool.map((card) => [card.id, card.answer]));

test('createRandom is repeatable for a seed and stays in [0, 1)', () => {
  const a = Quiz.createRandom(42);
  const b = Quiz.createRandom(42);
  const values = Array.from({ length: 200 }, () => a());
  assert.deepEqual(values, Array.from({ length: 200 }, () => b()));
  for (const value of values) {
    assert.ok(value >= 0 && value < 1, `${value} is in [0, 1)`);
  }
  assert.notDeepEqual(values.slice(0, 5), Array.from({ length: 5 }, Quiz.createRandom(43)));
});

test('shuffle returns a permutation and leaves the input unchanged', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const shuffled = Quiz.shuffle(items, Quiz.createRandom(7));
  assert.deepEqual(items, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual([...shuffled].sort((x, y) => x - y), items);
});

test('deal gives unique cards with a near-even split of myths and facts', () => {
  const splits = new Set();
  for (let seed = 1; seed <= 300; seed += 1) {
    const deck = Quiz.deal(pool, Quiz.DECK_SIZE, Quiz.createRandom(seed));
    assert.equal(deck.length, Quiz.DECK_SIZE);
    assert.equal(new Set(deck).size, deck.length, 'no card is dealt twice');
    const myths = deck.filter((id) => answerOf[id] === 'myth').length;
    assert.ok(myths >= 4 && myths <= 6, `seed ${seed}: ${myths} myths`);
    splits.add(myths);
  }
  assert.deepEqual([...splits].sort(), [4, 5, 6], 'every allowed split occurs');
});

test('deal is repeatable for a seed and varies between seeds', () => {
  const first = Quiz.deal(pool, 10, Quiz.createRandom(5));
  assert.deepEqual(Quiz.deal(pool, 10, Quiz.createRandom(5)), first);
  assert.notDeepEqual(Quiz.deal(pool, 10, Quiz.createRandom(6)), first);
});

test('deal refuses a pool that cannot give a balanced deck', () => {
  const lopsided = pool.map((card) => ({ ...card, answer: 'myth' }));
  assert.throws(() => Quiz.deal(lopsided, 10, Quiz.createRandom(1)), RangeError);
  assert.throws(() => Quiz.deal(pool.slice(0, 6), 10, Quiz.createRandom(1)), RangeError);
});

test('score counts correct answers and streaks', () => {
  const answers = ['myth', 'fact', 'fact', 'myth', 'myth', 'fact'].map((answer, i) => ({
    answer,
    guess: [0, 1, 2, 4, 5].includes(i) ? answer : 'wrong'
  }));
  assert.deepEqual(Quiz.score(answers), { correct: 5, total: 6, streak: 2, bestStreak: 3 });
  assert.deepEqual(Quiz.score([]), { correct: 0, total: 0, streak: 0, bestStreak: 0 });
});

test('resultBand splits scores into three messages', () => {
  assert.equal(Quiz.resultBand(10, 10), 'high');
  assert.equal(Quiz.resultBand(9, 10), 'high');
  assert.equal(Quiz.resultBand(8, 10), 'mid');
  assert.equal(Quiz.resultBand(6, 10), 'mid');
  assert.equal(Quiz.resultBand(5, 10), 'low');
  assert.equal(Quiz.resultBand(0, 0), 'low');
});

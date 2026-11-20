'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const C = require('../assets/js/content.js');
const Cycle = require('../assets/js/cycle.js');
const Quiz = require('../assets/js/quiz.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
/** Browser scripts that look up interface strings with ui('key'). */
const UI_SCRIPTS = ['ui.js', 'explorer.js', 'game.js', 'infographics.js', 'app.js'];
const uiSource = UI_SCRIPTS.map((name) =>
  fs.readFileSync(path.join(root, 'assets', 'js', name), 'utf8')
).join('\n');

/** Walk the content tree and collect every English/Spanish pair with its path. */
function collectPairs(node, trail, found) {
  if (Array.isArray(node)) {
    node.forEach((child, index) => collectPairs(child, `${trail}[${index}]`, found));
  } else if (node && typeof node === 'object') {
    const keys = Object.keys(node);
    if (keys.includes('en') || keys.includes('es')) {
      found.push({ trail, pair: node });
    } else {
      keys.forEach((key) => collectPairs(node[key], `${trail}.${key}`, found));
    }
  }
  return found;
}

/** Collect every object that lists sources, with its path. */
function collectCited(node, trail, found) {
  if (Array.isArray(node)) {
    node.forEach((child, index) => collectCited(child, `${trail}[${index}]`, found));
  } else if (node && typeof node === 'object') {
    if (Array.isArray(node.sources) && trail !== 'content') {
      found.push({ trail, item: node });
    }
    Object.keys(node)
      .filter((key) => key !== 'sources')
      .forEach((key) => collectCited(node[key], `${trail}.${key}`, found));
  }
  return found;
}

const translatable = { ...C, sources: undefined };
const pairs = collectPairs(translatable, 'content', []);
const cited = collectCited(translatable, 'content', []);
const sourceIds = C.sources.map((source) => source.id);

test('every text pair has non-empty English and Spanish', () => {
  assert.ok(pairs.length > 150, `expected many text pairs, found ${pairs.length}`);
  for (const { trail, pair } of pairs) {
    assert.deepEqual(Object.keys(pair).sort(), ['en', 'es'], `${trail} has exactly en and es`);
    for (const lang of C.LANGUAGES) {
      assert.equal(typeof pair[lang], 'string', `${trail}.${lang} is a string`);
      assert.ok(pair[lang].trim().length > 0, `${trail}.${lang} is not empty`);
      assert.equal(pair[lang], pair[lang].trim(), `${trail}.${lang} has no stray whitespace`);
    }
  }
});

test('English and Spanish versions use the same placeholders', () => {
  const placeholders = (text) => (text.match(/\{\w+\}/g) || []).sort();
  for (const { trail, pair } of pairs) {
    assert.deepEqual(placeholders(pair.es), placeholders(pair.en), `${trail} placeholders match`);
  }
});

test('every cited source id exists', () => {
  assert.ok(cited.length > 40, `expected many cited items, found ${cited.length}`);
  for (const { trail, item } of cited) {
    for (const id of item.sources) {
      assert.ok(sourceIds.includes(id), `${trail} cites unknown source "${id}"`);
    }
    assert.equal(new Set(item.sources).size, item.sources.length, `${trail} repeats a source`);
  }
});

test('every source is cited at least once and is well formed', () => {
  const used = new Set(cited.flatMap(({ item }) => item.sources));
  assert.equal(new Set(sourceIds).size, sourceIds.length, 'source ids are unique');
  for (const source of C.sources) {
    assert.ok(used.has(source.id), `source "${source.id}" is never cited`);
    assert.ok(['guidance', 'review', 'study'].includes(source.kind), `${source.id} has a valid kind`);
    assert.ok(C.ui[`sources.${source.kind}`], `${source.id} kind has a label`);
    assert.ok(source.cite.trim().length > 10, `${source.id} has a citation`);
    assert.ok(Boolean(source.doi) !== Boolean(source.url), `${source.id} has a DOI or a URL, not both`);
    if (source.doi) {
      assert.match(source.doi, /^10\.\d{4,9}\/\S+$/, `${source.id} DOI looks valid`);
    } else {
      assert.match(source.url, /^https:\/\/\S+$/, `${source.id} URL is https`);
    }
  }
});

test('every recommendation carries a valid evidence level', () => {
  const graded = [];
  for (const phase of C.phases) {
    graded.push({ trail: `${phase.id}.feel`, item: phase.feel });
    for (const category of ['nutrition', 'exercise', 'productivity']) {
      assert.ok(phase[category].length > 0, `${phase.id} has ${category} advice`);
      phase[category].forEach((item, index) =>
        graded.push({ trail: `${phase.id}.${category}[${index}]`, item })
      );
    }
  }
  C.basics.forEach((item, index) => graded.push({ trail: `basics[${index}]`, item }));

  for (const { trail, item } of graded) {
    assert.ok(C.EVIDENCE_LEVELS.includes(item.evidence), `${trail} has a valid evidence level`);
    if (item.evidence !== 'limited') {
      assert.ok(item.sources.length > 0, `${trail} is rated ${item.evidence} so it needs a source`);
    }
  }
  for (const level of C.EVIDENCE_LEVELS) {
    assert.ok(C.evidence[level].label && C.evidence[level].description, `${level} is described`);
  }
});

test('phases match the cycle model and carry "today" advice', () => {
  assert.deepEqual(
    C.phases.map((phase) => phase.id),
    [...Cycle.PHASE_IDS]
  );
  const categories = ['exercise', 'mood', 'nutrition', 'productivity'];
  for (const phase of C.phases) {
    assert.deepEqual(Object.keys(phase.today).sort(), categories, `${phase.id}.today is complete`);
  }
  const luteal = C.phases.find((phase) => phase.id === 'luteal');
  assert.deepEqual(Object.keys(luteal.todayPremenstrual).sort(), categories);
  assert.deepEqual(
    C.hormones.table.map((row) => row.phase),
    [...Cycle.PHASE_IDS]
  );
});

test('every interface string referenced by index.html exists', () => {
  const keys = new Set();
  for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) {
    keys.add(match[1]);
  }
  for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    match[1].split(';').forEach((entry) => keys.add(entry.split(':')[1].trim()));
  }
  assert.ok(keys.size > 25, `expected many keys in index.html, found ${keys.size}`);
  for (const key of keys) {
    assert.ok(C.ui[key], `index.html uses missing interface string "${key}"`);
  }
});

test('every interface string referenced by the scripts exists', () => {
  const literal = [...uiSource.matchAll(/\bui\('([^']+)'/g)].map((match) => match[1]);
  assert.ok(literal.length > 80, `expected many ui() calls, found ${literal.length}`);
  const prefixes = new Set();
  for (const key of literal) {
    if (key.endsWith('.')) {
      prefixes.add(key);
    } else {
      assert.ok(C.ui[key], `a script uses missing interface string "${key}"`);
    }
  }
  // Keys built at run time: ui('cat.' + category), ui('err.' + code) and so on.
  const dynamic = {
    'cat.': ['mood', 'nutrition', 'exercise', 'productivity'],
    'chart.': ['oestrogen', 'progesterone'],
    'level.': ['low', 'rising', 'high', 'falling'],
    'sources.': ['guidance', 'review', 'study'],
    'err.': ['date-required', 'date-invalid', 'date-future', 'cycle-range', 'period-range'],
    'quiz.verdict.': Quiz.ANSWERS,
    'quiz.said.': Quiz.ANSWERS,
    'quiz.result.': ['high', 'mid', 'low'],
    'sources.sample.': ['women', 'adults'],
    'stat.unit.': ['country', 'person', 'study']
  };
  for (const prefix of prefixes) {
    assert.ok(dynamic[prefix], `test knows the run-time keys built from "${prefix}"`);
    for (const suffix of dynamic[prefix]) {
      assert.ok(C.ui[prefix + suffix], `missing interface string "${prefix + suffix}"`);
    }
  }
});

test('the page loads nothing from other sites', () => {
  const external = [...html.matchAll(/(?:src|href)="(https?:)?\/\/[^"]+"/g)].map((m) => m[0]);
  assert.deepEqual(external, [], 'index.html has no external src or href');
  assert.match(html, /Content-Security-Policy/, 'a Content-Security-Policy is declared');
});

test('the game has 16 sourced cards, half myths and half facts', () => {
  const cards = C.quiz.cards;
  assert.equal(cards.length, 16);
  assert.equal(new Set(cards.map((card) => card.id)).size, cards.length, 'card ids are unique');
  for (const answer of Quiz.ANSWERS) {
    assert.equal(cards.filter((card) => card.answer === answer).length, 8, `8 cards are ${answer}s`);
  }
  for (const card of cards) {
    assert.ok(Quiz.ANSWERS.includes(card.answer), `${card.id} has a valid answer`);
    assert.ok(C.EVIDENCE_LEVELS.includes(card.evidence), `${card.id} has a valid evidence level`);
    assert.ok(card.sources.length > 0, `${card.id} cites at least one source`);
    assert.ok(card.claim.en && card.explanation.en, `${card.id} has a claim and an explanation`);
  }
});

test('every deal from the real pool works and every card can come up', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed += 1) {
    const deck = Quiz.deal(C.quiz.cards, Quiz.DECK_SIZE, Quiz.createRandom(seed));
    assert.equal(deck.length, Quiz.DECK_SIZE);
    deck.forEach((id) => seen.add(id));
  }
  assert.equal(seen.size, C.quiz.cards.length);
});

test('every finding has a headline figure with a known kind of visual', () => {
  const kinds = ['range', 'dots', 'squares', 'plate'];
  assert.equal(new Set(C.findings.map((item) => item.id)).size, C.findings.length);
  for (const item of C.findings) {
    const { stat } = item;
    assert.ok(stat && stat.figure.en && stat.caption.en, `${item.id} has a figure and a caption`);
    assert.ok(kinds.includes(stat.visual.kind), `${item.id} has a known visual`);
    if (stat.visual.kind === 'dots' || stat.visual.kind === 'squares') {
      assert.ok(Number.isInteger(stat.visual.count) && stat.visual.count > 0, `${item.id} count`);
      assert.ok(C.ui[`stat.unit.${stat.visual.unit}`], `${item.id} unit has a label`);
      assert.ok((stat.visual.filled || 0) + (stat.visual.partial || 0) <= stat.visual.count);
    }
    if (stat.visual.kind === 'range') {
      assert.ok(stat.visual.min < stat.visual.mark && stat.visual.mark < stat.visual.max);
    }
  }
});

test('the diagram has ovary and womb labels for every phase', () => {
  assert.deepEqual(Object.keys(C.anatomy.phases), [...Cycle.PHASE_IDS]);
  for (const id of Cycle.PHASE_IDS) {
    assert.ok(C.anatomy.phases[id].ovary.en && C.anatomy.phases[id].womb.en, `${id} labels`);
  }
  assert.ok(C.anatomy.caption.sources.length > 0, 'the diagram cites its sources');
});

test('the evidence chart takeaway matches the labels on the page', () => {
  const tally = (items) =>
    items.reduce((counts, item) => ({ ...counts, [item.evidence]: (counts[item.evidence] || 0) + 1 }), {});
  const phaseTips = C.phases.flatMap((phase) =>
    ['nutrition', 'exercise', 'productivity'].flatMap((category) => phase[category])
  );
  const tips = tally(phaseTips);
  const basics = tally(C.basics);
  assert.ok(
    (tips.moderate || 0) + (tips.limited || 0) > phaseTips.length / 2,
    'most phase-specific tips are rated moderate or limited'
  );
  assert.equal(basics.limited || 0, 0, 'none of the everyday basics is rated limited');
});

test('every study and review says who was studied, and only the WHO guideline covers all adults', () => {
  for (const source of C.sources) {
    if (source.kind === 'guidance' || source.id === 'statpearls') {
      assert.equal(source.sample, undefined, `${source.id} carries no sample label`);
    } else {
      assert.ok(['women', 'adults'].includes(source.sample), `${source.id} says who was studied`);
    }
  }
  // The sources introduction states this, so keep it true.
  assert.deepEqual(
    C.sources.filter((source) => source.sample === 'adults').map((source) => source.id),
    ['who2020']
  );
});

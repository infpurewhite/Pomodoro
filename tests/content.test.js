'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const C = require('../assets/js/content.js');
const Cycle = require('../assets/js/cycle.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');

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

test('every interface string referenced by app.js exists', () => {
  const literal = [...appSource.matchAll(/\bui\('([^']+)'/g)].map((match) => match[1]);
  assert.ok(literal.length > 40, `expected many ui() calls, found ${literal.length}`);
  const prefixes = new Set();
  for (const key of literal) {
    if (key.endsWith('.')) {
      prefixes.add(key);
    } else {
      assert.ok(C.ui[key], `app.js uses missing interface string "${key}"`);
    }
  }
  // Keys built at run time: ui('cat.' + category), ui('err.' + code) and so on.
  const dynamic = {
    'cat.': ['mood', 'nutrition', 'exercise', 'productivity'],
    'chart.': ['oestrogen', 'progesterone'],
    'level.': ['low', 'rising', 'high', 'falling'],
    'sources.': ['guidance', 'review', 'study'],
    'err.': ['date-required', 'date-invalid', 'date-future', 'cycle-range', 'period-range']
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

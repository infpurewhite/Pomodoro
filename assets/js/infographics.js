/**
 * Infographics built from content.js, so they stay in step with the text:
 * the headline-figure tiles in "The short version" and the "How strong is the
 * advice?" unit chart.
 *
 * Exposes `window.InPhaseInfographics`. Depends on `window.CONTENT` and
 * `window.InPhaseUI`. The drawings are decorative: every figure is also given
 * in text, and the chart has a sentence per row for screen readers.
 */
(function (root) {
  'use strict';

  var C = root.CONTENT;
  var UI = root.InPhaseUI;
  var el = UI.el;
  var svgEl = UI.svgEl;
  var clear = UI.clear;
  var tr = UI.tr;
  var ui = UI.ui;

  var LEVELS = ['strong', 'moderate', 'limited'];
  var CATEGORIES = ['nutrition', 'exercise', 'productivity'];
  /** Width of every figure drawing, in SVG units. */
  var WIDTH = 240;
  /** Distance between the centres of neighbouring dots or squares. */
  var PITCH = 10;

  function drawing(height, children) {
    return svgEl(
      'svg',
      {
        class: 'stat-svg',
        viewBox: '0 0 ' + WIDTH + ' ' + height,
        'aria-hidden': 'true',
        focusable: 'false'
      },
      children
    );
  }

  /**
   * One mark per unit, filled column by column. `filled` marks are highlighted and
   * `partial` marks half highlighted; with neither given, every mark is highlighted.
   */
  function unitGrid(visual) {
    var isDots = visual.kind === 'dots';
    var rows = isDots ? 5 : 6;
    var cols = Math.ceil(visual.count / rows);
    var left = (WIDTH - cols * PITCH) / 2 + PITCH / 2;
    var highlighted = visual.filled === undefined ? visual.count : visual.filled;
    var partial = visual.partial || 0;
    var marks = [];

    for (var i = 0; i < visual.count; i += 1) {
      var cx = left + Math.floor(i / rows) * PITCH;
      var cy = 4 + PITCH / 2 + (i % rows) * PITCH;
      var tone = i < highlighted ? 'on' : i < highlighted + partial ? 'half' : 'off';
      marks.push(
        isDots
          ? svgEl('circle', { class: 'u u-' + tone, cx: cx, cy: cy, r: 3.4 })
          : svgEl('rect', {
              class: 'u u-' + tone,
              x: (cx - 3.6).toFixed(1),
              y: (cy - 3.6).toFixed(1),
              width: 7.2,
              height: 7.2,
              rx: 1.6
            })
      );
    }
    return drawing(rows * PITCH + 8, marks);
  }

  /** One bar per day of the normal range, with the average picked out. */
  function rangeBars(visual) {
    var days = visual.max - visual.min + 1;
    var pitch = 13;
    var bar = 8;
    var left = (WIDTH - days * pitch) / 2 + (pitch - bar) / 2;
    var marks = [];

    for (var d = visual.min; d <= visual.max; d += 1) {
      var isMark = d === visual.mark;
      marks.push(
        svgEl('rect', {
          class: isMark ? 'r-mark' : 'r-day',
          x: (left + (d - visual.min) * pitch).toFixed(1),
          y: isMark ? 18 : 28,
          width: bar,
          height: isMark ? 34 : 24,
          rx: 3
        })
      );
    }

    var centreOf = function (d) {
      return (left + (d - visual.min) * pitch + bar / 2).toFixed(1);
    };
    marks.push(svgEl('text', { class: 'r-label', x: centreOf(visual.min), y: 66, 'text-anchor': 'middle', text: visual.min }));
    marks.push(svgEl('text', { class: 'r-label', x: centreOf(visual.max), y: 66, 'text-anchor': 'middle', text: visual.max }));
    marks.push(
      svgEl('text', {
        class: 'r-label r-label-mark',
        x: centreOf(visual.mark),
        y: 10,
        'text-anchor': 'middle',
        text: '≈' + visual.mark + ' ' + ui('stat.average')
      })
    );
    return drawing(72, marks);
  }

  /** A plate with cutlery and a plus sign. */
  function plate() {
    return drawing(72, [
      svgEl('circle', { class: 'p-plate', cx: 120, cy: 36, r: 29 }),
      svgEl('circle', { class: 'p-rim', cx: 120, cy: 36, r: 20 }),
      svgEl('path', { class: 'p-plus', d: 'M120 28v16M112 36h16' }),
      svgEl('path', { class: 'p-cutlery', d: 'M74 12v13a5 5 0 0 0 10 0V12M79 12v50' }),
      svgEl('path', { class: 'p-cutlery', d: 'M166 62V12c-5 4-8 13-8 24h8' })
    ]);
  }

  function drawVisual(visual) {
    if (visual.kind === 'range') {
      return rangeBars(visual);
    }
    if (visual.kind === 'plate') {
      return plate();
    }
    return unitGrid(visual);
  }

  /** "The short version": one tile per finding, figure first. */
  function renderFindings(host) {
    clear(host);
    C.findings.forEach(function (item) {
      var stat = item.stat;
      var visual = stat.visual;
      host.appendChild(
        el('article', { class: 'finding', 'data-kind': visual.kind }, [
          el('h3', { class: 'finding-title' }, [UI.icon(item.icon), el('span', { text: tr(item.title) })]),
          el('p', { class: 'finding-figure' }, [
            el('span', { class: 'figure', text: tr(stat.figure) }),
            ' ',
            el('span', { class: 'figure-caption', text: tr(stat.caption) })
          ]),
          el('div', { class: 'finding-visual', 'aria-hidden': 'true' }, [
            drawVisual(visual),
            visual.unit ? el('p', { class: 'stat-unit', text: ui('stat.unit.' + visual.unit) }) : null
          ]),
          UI.paragraph(item, { class: 'finding-text' })
        ])
      );
    });
  }

  function tally(items) {
    var counts = { strong: 0, moderate: 0, limited: 0 };
    items.forEach(function (item) {
      counts[item.evidence] += 1;
    });
    return counts;
  }

  function unit(level) {
    var mark = el('i', { class: 'unit', 'data-level': level });
    for (var dot = 0; dot < UI.evidenceDots(level); dot += 1) {
      mark.appendChild(el('b'));
    }
    return mark;
  }

  /** "How strong is the advice?": one square per tip, grouped by evidence label. */
  function renderStrength(host) {
    clear(host);
    var rows = CATEGORIES.map(function (category) {
      return {
        name: ui('cat.' + category),
        items: C.phases.reduce(function (all, phase) {
          return all.concat(phase[category]);
        }, [])
      };
    }).concat([{ name: ui('strength.basics'), items: C.basics }]);

    host.appendChild(el('h3', { class: 'strength-title', text: ui('strength.title') }));
    host.appendChild(el('p', { class: 'strength-intro', text: ui('strength.intro') }));
    host.appendChild(
      el(
        'ul',
        { class: 'strength-rows' },
        rows.map(function (row) {
          var counts = tally(row.items);
          var units = el('span', { class: 'strength-units', 'aria-hidden': 'true' });
          LEVELS.forEach(function (level) {
            for (var i = 0; i < counts[level]; i += 1) {
              units.appendChild(unit(level));
            }
          });
          return el('li', { class: 'strength-row' }, [
            el('span', { class: 'strength-name', 'aria-hidden': 'true', text: row.name }),
            units,
            el('span', {
              class: 'strength-total',
              'aria-hidden': 'true',
              text: ui('strength.tips', { n: row.items.length })
            }),
            el('span', {
              class: 'visually-hidden',
              text: ui('strength.row', {
                name: row.name,
                strong: counts.strong,
                moderate: counts.moderate,
                limited: counts.limited,
                total: row.items.length
              })
            })
          ]);
        })
      )
    );
    host.appendChild(
      el(
        'ul',
        { class: 'strength-legend', 'aria-hidden': 'true' },
        LEVELS.map(function (level) {
          return el('li', {}, [unit(level), tr(C.evidence[level].label)]);
        })
      )
    );
    host.appendChild(el('p', { class: 'strength-takeaway', text: ui('strength.takeaway') }));
  }

  root.InPhaseInfographics = {
    renderFindings: renderFindings,
    renderStrength: renderStrength
  };
})(window);

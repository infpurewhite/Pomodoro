/**
 * Shared browser helpers: element builders, the current language, citation
 * numbering, icons, evidence chips and phase emblems.
 *
 * Exposes `window.InPhaseUI`. Depends on `window.Cycle` and `window.CONTENT`.
 * All text reaches the DOM through textContent, never innerHTML, and styles are
 * set only through the CSSOM, so the strict Content-Security-Policy holds.
 */
(function (root) {
  'use strict';

  var Cycle = root.Cycle;
  var C = root.CONTENT;
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /** Icon shapes on a 24 x 24 grid, drawn as strokes. */
  var ICONS = {
    mood: [
      ['path', { d: 'M12 20.5s-7.2-4.4-8.9-8.8C1.9 8.4 3.8 5 7.2 5c1.9 0 3.5 1 4.8 2.9C13.3 6 14.9 5 16.8 5c3.4 0 5.3 3.4 4.1 6.7C19.2 16.1 12 20.5 12 20.5z' }]
    ],
    care: [
      ['path', { d: 'M12 20.5s-7.2-4.4-8.9-8.8C1.9 8.4 3.8 5 7.2 5c1.9 0 3.5 1 4.8 2.9C13.3 6 14.9 5 16.8 5c3.4 0 5.3 3.4 4.1 6.7C19.2 16.1 12 20.5 12 20.5z' }],
      ['path', { d: 'M12 9.6v5.2M9.4 12.2h5.2' }]
    ],
    happening: [['path', { d: 'M3 12h4l2.5-6.5 4 13 2.5-6.5H21' }]],
    nutrition: [
      ['path', { d: 'M12 8.3c-1.6-1.3-3.6-1.6-5.1-.7-1.7 1-2.4 3-2.1 5.5.4 3.3 2.3 6.4 4.3 6.4 1 0 1.7-.6 2.9-.6s1.9.6 2.9.6c2 0 3.9-3.1 4.3-6.4.3-2.5-.4-4.5-2.1-5.5-1.5-.9-3.5-.6-5.1.7z' }],
      ['path', { d: 'M12 8.3c0-2 .9-3.5 2.7-4.3' }]
    ],
    exercise: [['path', { d: 'M6.5 8.5v7M17.5 8.5v7M3.5 10.5v3M20.5 10.5v3M6.5 12h11' }]],
    productivity: [
      ['circle', { cx: 12, cy: 12, r: 8.5 }],
      ['path', { d: 'M12 7.5V12l3 2' }]
    ],
    sleep: [['path', { d: 'M20.3 14.3A8.5 8.5 0 0 1 9.7 3.7a8.5 8.5 0 1 0 10.6 10.6z' }]],
    track: [
      ['rect', { x: 4, y: 5, width: 16, height: 15, rx: 2 }],
      ['path', { d: 'M8 3v4M16 3v4M4 10h16M8.5 15l2.2 2.2 4.6-4.6' }]
    ],
    check: [['path', { d: 'M5 12.5l4.2 4.2L19 7' }]],
    cross: [['path', { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }]],
    prev: [['path', { d: 'M14.5 6l-6 6 6 6' }]],
    next: [['path', { d: 'M9.5 6l6 6-6 6' }]],
    play: [['path', { d: 'M8.5 5.8v12.4L18.5 12z' }]],
    again: [['path', { d: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4' }]],
    today: [
      ['circle', { cx: 12, cy: 12, r: 8 }],
      ['circle', { cx: 12, cy: 12, r: 2.6 }]
    ],
    spark: [['path', { d: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9z' }]]
  };

  /**
   * Phase emblems on a 24 x 24 grid. Classes set the paint: em-solid and em-soft
   * use the phase colour, em-line strokes it and em-cut knocks a detail out.
   */
  var EMBLEMS = {
    menstrual: [
      ['path', { class: 'em-solid', d: 'M12 2.8C10.5 5.2 5.9 10.7 5.9 14.9a6.1 6.1 0 0 0 12.2 0c0-4.2-4.6-9.7-6.1-12.1z' }],
      ['path', { class: 'em-glint', d: 'M9.1 15.2a3 3 0 0 0 2.6 2.7' }]
    ],
    follicular: [
      ['circle', { class: 'em-soft', cx: 12, cy: 12, r: 9 }],
      ['circle', { class: 'em-line', cx: 12, cy: 12, r: 9 }],
      ['circle', { class: 'em-solid', cx: 14.3, cy: 10.2, r: 3.4 }]
    ],
    ovulatory: [
      ['circle', { class: 'em-soft', cx: 10, cy: 14, r: 7 }],
      ['path', { class: 'em-line', d: 'M16.58 11.61A7 7 0 1 1 12.39 7.42' }],
      ['circle', { class: 'em-solid', cx: 18, cy: 6, r: 2.9 }]
    ],
    luteal: [
      ['circle', { class: 'em-soft', cx: 12, cy: 12, r: 10.4 }],
      ['circle', { class: 'em-solid', cx: 12, cy: 12, r: 7.4 }],
      ['circle', { class: 'em-cut', cx: 9.8, cy: 10.4, r: 1.3 }],
      ['circle', { class: 'em-cut', cx: 14.3, cy: 11.6, r: 1.1 }],
      ['circle', { class: 'em-cut', cx: 11.4, cy: 14.4, r: 1.2 }]
    ]
  };

  var state = {
    lang: 'en',
    /** Source ids in order of first appearance; a source's number is its index + 1. */
    citations: []
  };

  /* ------------------------------------------------------------------ */
  /* Elements                                                            */
  /* ------------------------------------------------------------------ */

  function setAttrs(node, attrs) {
    Object.keys(attrs || {}).forEach(function (name) {
      var value = attrs[name];
      if (value === null || value === undefined || value === false) {
        return;
      }
      if (name === 'text') {
        node.textContent = String(value);
      } else if (value === true) {
        node.setAttribute(name, '');
      } else {
        node.setAttribute(name, String(value));
      }
    });
  }

  function append(node, children) {
    (Array.isArray(children) ? children : [children]).forEach(function (child) {
      if (child === null || child === undefined || child === false) {
        return;
      }
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  /** Create an HTML element. `attrs.text` sets textContent. */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    setAttrs(node, attrs);
    return children === undefined ? node : append(node, children);
  }

  /** Create an SVG element. */
  function svgEl(tag, attrs, children) {
    var node = document.createElementNS(SVG_NS, tag);
    setAttrs(node, attrs);
    return children === undefined ? node : append(node, children);
  }

  function clear(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    return node;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  /* ------------------------------------------------------------------ */
  /* Language                                                            */
  /* ------------------------------------------------------------------ */

  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
    });
  }

  function setLang(lang) {
    state.lang = lang;
  }

  function getLang() {
    return state.lang;
  }

  /** Pick the current language from an English/Spanish pair. */
  function tr(pair) {
    return typeof pair === 'string' ? pair : pair[state.lang];
  }

  /** Look up an interface string and fill its {placeholders}. */
  function ui(key, values) {
    var pair = C.ui[key];
    if (!pair) {
      console.warn('In Phase: missing interface string "' + key + '".');
      return key;
    }
    return values ? fill(pair[state.lang], values) : pair[state.lang];
  }

  function phaseById(id) {
    return C.phases.filter(function (phase) {
      return phase.id === id;
    })[0];
  }

  function sourceById(id) {
    return C.sources.filter(function (source) {
      return source.id === id;
    })[0];
  }

  /** "Days 6–12", "Day 13" or the note for a phase this cycle length does not show. */
  function daysLabel(range) {
    if (!range) {
      return ui('days.none');
    }
    return range.start === range.end ? ui('days.single', range) : ui('days.range', range);
  }

  /** "5 days", joined by a non-breaking space so the number never ends a line alone. */
  function dayCount(n) {
    var text = n === 1 ? ui('unit.day.one') : ui('unit.day.other', { n: n });
    return text.replace(/ /g, ' ');
  }

  function formatDate(iso) {
    var date = new Date(Cycle.parseISODate(iso));
    try {
      return new Intl.DateTimeFormat(state.lang === 'es' ? 'es' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC'
      })
        .format(date)
        .replace(/ /g, ' ');
    } catch (error) {
      return iso;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Citations                                                           */
  /* ------------------------------------------------------------------ */

  function resetCitations() {
    state.citations = [];
  }

  function citations() {
    return state.citations.slice();
  }

  function citeNumber(id) {
    var index = state.citations.indexOf(id);
    if (index === -1) {
      state.citations.push(id);
      index = state.citations.length - 1;
    }
    return index + 1;
  }

  /** Number sources now, for content that is shown later (such as game answers). */
  function registerCitations(ids) {
    ids.forEach(citeNumber);
  }

  /** Superscript links to the numbered source list. */
  function cite(ids) {
    if (!ids || ids.length === 0) {
      return null;
    }
    var sup = el('sup', { class: 'cite' });
    ids
      .map(citeNumber)
      .sort(function (a, b) {
        return a - b;
      })
      .forEach(function (number, position) {
        if (position > 0) {
          sup.appendChild(document.createTextNode(','));
        }
        sup.appendChild(
          el('a', {
            href: '#source-' + number,
            'aria-label': ui('sources.cite', { n: number }),
            text: number
          })
        );
      });
    return sup;
  }

  /** A paragraph of bilingual text followed by its citations. */
  function paragraph(item, attrs) {
    return el('p', attrs || {}, [tr(item.text), cite(item.sources)]);
  }

  /* ------------------------------------------------------------------ */
  /* Icons, emblems and chips                                            */
  /* ------------------------------------------------------------------ */

  function shapes(list) {
    return (list || []).map(function (shape) {
      return svgEl(shape[0], shape[1]);
    });
  }

  function icon(name, className) {
    return svgEl(
      'svg',
      {
        class: 'icon' + (className ? ' ' + className : ''),
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false'
      },
      shapes(ICONS[name])
    );
  }

  /** A phase symbol as its own SVG. */
  function emblem(phaseId, className) {
    return svgEl(
      'svg',
      {
        class: 'emblem' + (className ? ' ' + className : ''),
        'data-phase': phaseId,
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false'
      },
      shapes(EMBLEMS[phaseId])
    );
  }

  /** A phase symbol as a group, for placing inside another SVG. */
  function emblemGroup(phaseId, x, y, size, className) {
    var scale = size / 24;
    return svgEl(
      'g',
      {
        class: 'emblem' + (className ? ' ' + className : ''),
        'data-phase': phaseId,
        transform:
          'translate(' + (x - size / 2).toFixed(2) + ' ' + (y - size / 2).toFixed(2) + ') scale(' +
          scale.toFixed(3) + ')'
      },
      shapes(EMBLEMS[phaseId])
    );
  }

  /** Number of filled dots for an evidence level. */
  function evidenceDots(level) {
    return { strong: 3, moderate: 2, limited: 1 }[level];
  }

  /** Evidence label: filled dots plus words, so it never relies on colour. */
  function chip(level) {
    var filled = evidenceDots(level);
    var dots = el('span', { class: 'chip-dots', 'aria-hidden': 'true' });
    for (var i = 0; i < 3; i += 1) {
      dots.appendChild(el('i', { class: i < filled ? 'on' : null }));
    }
    return el('span', { class: 'chip', 'data-level': level }, [dots, tr(C.evidence[level].label)]);
  }

  /* ------------------------------------------------------------------ */
  /* Environment                                                         */
  /* ------------------------------------------------------------------ */

  function reducedMotion() {
    try {
      return root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (error) {
      return false;
    }
  }

  /* Storage can be unavailable (private browsing, blocked site data). The page
     must work without it, so failures are expected and handled quietly. */

  function readStore(key) {
    try {
      return root.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      root.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function removeStore(key) {
    try {
      root.localStorage.removeItem(key);
    } catch (error) {
      /* Nothing was stored, so there is nothing to remove. */
    }
  }

  root.InPhaseUI = {
    el: el,
    svgEl: svgEl,
    append: append,
    clear: clear,
    byId: byId,
    fill: fill,
    setLang: setLang,
    getLang: getLang,
    tr: tr,
    ui: ui,
    phaseById: phaseById,
    sourceById: sourceById,
    daysLabel: daysLabel,
    dayCount: dayCount,
    formatDate: formatDate,
    resetCitations: resetCitations,
    citations: citations,
    registerCitations: registerCitations,
    cite: cite,
    paragraph: paragraph,
    icon: icon,
    emblem: emblem,
    emblemGroup: emblemGroup,
    evidenceDots: evidenceDots,
    chip: chip,
    reducedMotion: reducedMotion,
    store: { read: readStore, write: writeStore, remove: removeStore }
  };
})(window);

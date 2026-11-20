/**
 * Page set-up: language switching, the phase calculator form, the phase tabs
 * and the rendering of every section in page order, so sources are numbered as
 * they first appear.
 *
 * Depends on cycle.js, quiz.js, content.js, ui.js, explorer.js, game.js and
 * infographics.js, loaded in that order.
 */
(function (root) {
  'use strict';

  var Cycle = root.Cycle;
  var C = root.CONTENT;
  var UI = root.InPhaseUI;
  if (!Cycle || !C || !UI || !root.Quiz || !root.InPhaseExplorer || !root.InPhaseGame || !root.InPhaseInfographics) {
    console.error('In Phase: a script did not load, so the page cannot start.');
    return;
  }

  var el = UI.el;
  var append = UI.append;
  var clear = UI.clear;
  var byId = UI.byId;
  var tr = UI.tr;
  var ui = UI.ui;

  var STORAGE_KEYS = { lang: 'inphase.lang', cycle: 'inphase.cycle' };
  var CATEGORIES = ['nutrition', 'exercise', 'productivity'];
  var HORMONES = ['oestrogen', 'progesterone'];
  var ERROR_FIELDS = {
    'date-required': 'last-start',
    'date-invalid': 'last-start',
    'date-future': 'last-start',
    'cycle-range': 'cycle-length',
    'period-range': 'period-length'
  };
  var FIELD_IDS = ['last-start', 'cycle-length', 'period-length'];

  var state = {
    lang: 'en',
    /** Reader input, or null while the 28-day example is shown. */
    inputs: null,
    /** Result of Cycle.getCycleStatus for the reader's input, or null. */
    status: null,
    /** Error codes currently shown on the form. */
    errors: [],
    /** Day selected in the explorer. */
    day: 1,
    /** Phase tab that is open. */
    tab: null
  };

  var explorer = null;
  var game = null;

  /* ------------------------------------------------------------------ */
  /* Cycle helpers                                                       */
  /* ------------------------------------------------------------------ */

  /** Cycle parameters in use: the reader's, or the 28-day example. */
  function currentCycle() {
    if (state.status) {
      return { cycleLength: state.status.cycleLength, periodLength: state.status.periodLength };
    }
    return { cycleLength: Cycle.DEFAULTS.cycleLength, periodLength: Cycle.DEFAULTS.periodLength };
  }

  function segmentMap() {
    var cycle = currentCycle();
    var map = {};
    Cycle.getPhaseSegments(cycle.cycleLength, cycle.periodLength).forEach(function (segment) {
      map[segment.id] = segment;
    });
    return map;
  }

  function phaseOfDay(day) {
    var cycle = currentCycle();
    return Cycle.getPhaseForDay(day, cycle.cycleLength, cycle.periodLength).id;
  }

  function announce(message) {
    byId('result-status').textContent = message;
  }

  function announceGame(message) {
    byId('game-status').textContent = message;
  }

  function statusSentence() {
    var status = state.status;
    return ui('result.status', {
      day: status.day,
      length: status.cycleLength,
      phase: tr(UI.phaseById(status.phase).name),
      count: UI.dayCount(status.daysUntilNextPeriod)
    });
  }

  /* ------------------------------------------------------------------ */
  /* Static text                                                         */
  /* ------------------------------------------------------------------ */

  function renderStatic() {
    document.documentElement.lang = state.lang;
    document.title = ui('meta.title');
    var description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', ui('meta.description'));
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      node.textContent = ui(node.getAttribute('data-i18n'));
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (node) {
      node.getAttribute('data-i18n-attr').split(';').forEach(function (entry) {
        var parts = entry.split(':');
        node.setAttribute(parts[0].trim(), ui(parts[1].trim()));
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.lang-btn'), function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-lang') === state.lang));
    });
  }

  function renderToolNote() {
    var note = clear(byId('tool-note'));
    append(note, [tr(C.toolNotes.estimate.text), UI.cite(C.toolNotes.estimate.sources)]);
    if (state.status && state.status.periodLength > 7) {
      append(note, [' ', tr(C.toolNotes.longPeriod.text), UI.cite(C.toolNotes.longPeriod.sources)]);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Hormones: prose, chart legend and table (the chart is the explorer's) */
  /* ------------------------------------------------------------------ */

  function renderHormones() {
    var prose = clear(byId('hormones-prose'));
    C.hormones.paragraphs.forEach(function (item) {
      prose.appendChild(UI.paragraph(item));
    });

    var legend = clear(byId('chart-legend'));
    HORMONES.forEach(function (hormone) {
      legend.appendChild(
        el('li', { class: 'series-' + hormone }, [el('span', { class: 'line-key' }), ui('chart.' + hormone)])
      );
    });

    var host = clear(byId('hormone-table'));
    var ranges = segmentMap();
    var headerCell = function (text) {
      return el('th', { scope: 'col', text: text });
    };
    var rows = C.hormones.table
      .filter(function (row) {
        return Boolean(ranges[row.phase]);
      })
      .map(function (row) {
        return el('tr', {}, [
          el('th', { scope: 'row' }, [
            tr(UI.phaseById(row.phase).name),
            el('br'),
            el('span', { class: 'legend-days', text: UI.daysLabel(ranges[row.phase]) })
          ]),
          el('td', { text: tr(row.oestrogen) }),
          el('td', { text: tr(row.progesterone) })
        ]);
      });
    host.appendChild(
      el('table', {}, [
        el('thead', {}, [
          el('tr', {}, [
            headerCell(ui('chart.tablePhase')),
            headerCell(ui('chart.oestrogen')),
            headerCell(ui('chart.progesterone'))
          ])
        ]),
        el('tbody', {}, rows)
      ])
    );
  }

  function renderBodyCaption() {
    append(clear(byId('body-caption')), [tr(C.anatomy.caption.text), UI.cite(C.anatomy.caption.sources)]);
  }

  function renderEvidenceKey() {
    var key = clear(byId('evidence-key'));
    C.EVIDENCE_LEVELS.forEach(function (level) {
      key.appendChild(
        el('div', {}, [el('dt', {}, [UI.chip(level)]), el('dd', { text: tr(C.evidence[level].description) })])
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* Phases: tabs and panels                                             */
  /* ------------------------------------------------------------------ */

  function label(iconName, text) {
    return el('h4', { class: 'label' }, [UI.icon(iconName), text]);
  }

  function renderPhase(phase, range, isToday) {
    var head = el('header', { class: 'phase-head' }, [
      UI.emblem(phase.id, 'phase-emblem'),
      el('div', { class: 'phase-head-text' }, [
        el('p', { class: 'phase-days', text: UI.daysLabel(range) }),
        el('h3', { text: tr(phase.name) }),
        el('p', { class: 'phase-tagline', text: tr(phase.tagline) })
      ]),
      isToday ? el('span', { class: 'here', text: ui('phase.here') }) : null
    ]);

    var intro = el('div', { class: 'phase-intro' }, [
      el('div', { class: 'block' }, [label('happening', ui('phase.happening')), UI.paragraph(phase.happening)]),
      el('div', { class: 'block' }, [
        label('mood', ui('phase.feel')),
        UI.paragraph(phase.feel),
        UI.chip(phase.feel.evidence)
      ])
    ]);

    var note = phase.note
      ? el('aside', { class: 'phase-note' }, [tr(phase.note.text), UI.cite(phase.note.sources)])
      : null;

    var columns = el(
      'div',
      { class: 'phase-cols' },
      CATEGORIES.map(function (category) {
        return el('section', { class: 'block' }, [
          label(category, ui('cat.' + category)),
          el(
            'ul',
            { class: 'tips' },
            phase[category].map(function (item) {
              return el('li', { class: 'tip', 'data-level': item.evidence }, [
                UI.paragraph(item),
                UI.chip(item.evidence)
              ]);
            })
          )
        ]);
      })
    );

    return el(
      'article',
      {
        class: 'phase',
        id: 'phase-' + phase.id,
        'data-phase': phase.id,
        role: 'tabpanel',
        'aria-labelledby': 'tab-' + phase.id
      },
      [head, el('div', { class: 'phase-body' }, [intro, note, columns])]
    );
  }

  function renderPhases() {
    var status = state.status;
    var ranges = segmentMap();
    var selected = state.tab || phaseOfDay(state.day);

    byId('phases-intro').textContent = status
      ? ui('phases.introYours', { length: status.cycleLength })
      : ui('phases.introExample');

    var tabs = clear(byId('phase-tabs'));
    var list = clear(byId('phase-list'));

    C.phases.forEach(function (phase) {
      var range = ranges[phase.id];
      var isToday = Boolean(status && status.phase === phase.id);
      var isSelected = phase.id === selected;
      var days = range ? (range.start === range.end ? String(range.start) : range.start + '–' + range.end) : '';

      tabs.appendChild(
        el(
          'button',
          {
            type: 'button',
            role: 'tab',
            class: 'phase-tab',
            id: 'tab-' + phase.id,
            'data-phase': phase.id,
            'aria-controls': 'phase-' + phase.id,
            'aria-selected': String(isSelected),
            tabindex: isSelected ? '0' : '-1'
          },
          [
            UI.emblem(phase.id, 'tab-emblem'),
            el('span', { class: 'tab-text' }, [
              el('span', { class: 'tab-name', text: tr(phase.short) }),
              days ? el('span', { class: 'tab-days', text: days }) : null
            ]),
            isToday ? el('span', { class: 'badge', text: ui('wheel.today') }) : null
          ]
        )
      );

      var panel = renderPhase(phase, range, isToday);
      panel.hidden = !isSelected;
      list.appendChild(panel);
    });
    state.tab = selected;
  }

  /** Open a phase tab. With `focus`, keyboard focus moves to the tab. */
  function selectTab(id, focus) {
    state.tab = id;
    Array.prototype.forEach.call(byId('phase-tabs').querySelectorAll('[role="tab"]'), function (tab) {
      var on = tab.getAttribute('data-phase') === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) {
        tab.focus();
      }
    });
    Array.prototype.forEach.call(byId('phase-list').querySelectorAll('[role="tabpanel"]'), function (panel) {
      panel.hidden = panel.getAttribute('data-phase') !== id;
    });
  }

  /**
   * Open a phase and, when asked, move the explorer to its first day (unless the
   * selected day is already in that phase).
   */
  function openPhase(id, options) {
    var opts = options || {};
    selectTab(id, opts.focus);
    if (opts.moveDay) {
      var range = segmentMap()[id];
      if (range && phaseOfDay(state.day) !== id) {
        explorer.setDay(range.start);
      }
    }
  }

  function onDayChange(day, phaseId) {
    state.day = day;
    if (phaseId !== state.tab) {
      selectTab(phaseId, false);
    }
  }

  function phaseFromHash(hash) {
    var match = /^#phase-(\w+)$/.exec(hash || '');
    return match && UI.phaseById(match[1]) ? match[1] : null;
  }

  function bindTabs() {
    var tablist = byId('phase-tabs');
    tablist.addEventListener('click', function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (tab) {
        openPhase(tab.getAttribute('data-phase'), { moveDay: true });
      }
    });
    tablist.addEventListener('keydown', function (event) {
      var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
      var index = tabs.indexOf(document.activeElement);
      var target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (index === -1 || target === undefined) {
        return;
      }
      event.preventDefault();
      var tab = tabs[(target + tabs.length) % tabs.length];
      openPhase(tab.getAttribute('data-phase'), { moveDay: true, focus: true });
    });

    /* Links to a phase open its tab before the browser scrolls to it. */
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#phase-"]');
      var id = link ? phaseFromHash(link.getAttribute('href')) : null;
      if (id) {
        openPhase(id);
      }
    });
    root.addEventListener('hashchange', function () {
      var id = phaseFromHash(root.location.hash);
      if (id) {
        openPhase(id);
      }
    });
  }

  function openInitialHash() {
    var id = phaseFromHash(root.location.hash);
    if (id) {
      openPhase(id);
      byId('phase-' + id).scrollIntoView();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Basics, fit, help, sources                                          */
  /* ------------------------------------------------------------------ */

  function renderBasics() {
    var host = clear(byId('basics-list'));
    C.basics.forEach(function (item) {
      host.appendChild(
        el('article', { class: 'basic', 'data-level': item.evidence }, [
          el('span', { class: 'basic-icon' }, [UI.icon(item.icon)]),
          el('h3', { text: tr(item.title) }),
          UI.paragraph(item),
          UI.chip(item.evidence)
        ])
      );
    });
  }

  function renderFit() {
    var host = clear(byId('fit-list'));
    C.fit.forEach(function (item) {
      host.appendChild(el('article', { class: 'fit-item' }, [el('h3', { text: tr(item.title) }), UI.paragraph(item)]));
    });
  }

  function renderHelp() {
    var list = clear(byId('help-list'));
    C.help.items.forEach(function (item) {
      list.appendChild(el('li', {}, [tr(item.text), UI.cite(item.sources)]));
    });
    append(clear(byId('help-treatments')), [tr(C.help.treatments.text), UI.cite(C.help.treatments.sources)]);
    append(clear(byId('help-urgent')), [tr(C.help.urgent.text), UI.cite(C.help.urgent.sources)]);
  }

  function renderSources() {
    var list = clear(byId('source-list'));
    UI.citations().forEach(function (id, index) {
      var source = UI.sourceById(id);
      var href = source.doi ? 'https://doi.org/' + source.doi : source.url;
      var linkText = source.doi ? 'doi:' + source.doi : source.url.replace(/^https:\/\//, '');
      list.appendChild(
        el('li', { id: 'source-' + (index + 1) }, [
          el('span', { class: 'source-kind' }, [
            ui('sources.' + source.kind),
            source.sample
              ? el('span', {
                  class: 'source-sample',
                  'data-sample': source.sample,
                  text: ui('sources.sample.' + source.sample)
                })
              : null
          ]),
          source.cite + ' ',
          el('a', { class: 'source-link', href: href, rel: 'noopener noreferrer', text: linkText })
        ])
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* Form                                                                */
  /* ------------------------------------------------------------------ */

  function renderErrors() {
    var messages = {};
    state.errors.forEach(function (code) {
      var field = ERROR_FIELDS[code];
      if (field && !messages[field]) {
        messages[field] = ui('err.' + code);
      }
    });

    FIELD_IDS.forEach(function (field) {
      var input = byId(field);
      var message = byId(field + '-error');
      if (messages[field]) {
        input.setAttribute('aria-invalid', 'true');
        message.textContent = messages[field];
        message.hidden = false;
      } else {
        input.removeAttribute('aria-invalid');
        message.textContent = '';
        message.hidden = true;
      }
    });
  }

  function readForm() {
    return {
      lastPeriodStart: byId('last-start').value,
      cycleLength: Number(byId('cycle-length').value),
      periodLength: Number(byId('period-length').value),
      today: Cycle.localTodayISO()
    };
  }

  function writeForm(inputs) {
    byId('last-start').value = inputs ? inputs.lastPeriodStart : '';
    byId('cycle-length').value = inputs ? inputs.cycleLength : Cycle.DEFAULTS.cycleLength;
    byId('period-length').value = inputs ? inputs.periodLength : Cycle.DEFAULTS.periodLength;
  }

  /** Point the explorer and the phase tabs at today. */
  function goToToday() {
    state.day = state.status ? state.status.day : 1;
    state.tab = phaseOfDay(state.day);
  }

  function onSubmit(event) {
    event.preventDefault();
    var input = readForm();
    state.errors = Cycle.validateInputs(input);

    if (state.errors.length > 0) {
      renderErrors();
      byId(ERROR_FIELDS[state.errors[0]]).focus();
      return;
    }

    state.inputs = {
      lastPeriodStart: input.lastPeriodStart,
      cycleLength: input.cycleLength,
      periodLength: input.periodLength
    };
    state.status = Cycle.getCycleStatus(input);
    goToToday();

    if (byId('remember').checked) {
      UI.store.write(STORAGE_KEYS.cycle, JSON.stringify(state.inputs));
    } else {
      UI.store.remove(STORAGE_KEYS.cycle);
    }

    renderAll();
    announce(statusSentence());
  }

  function onForget() {
    UI.store.remove(STORAGE_KEYS.cycle);
    state.inputs = null;
    state.status = null;
    state.errors = [];
    goToToday();
    writeForm(null);
    byId('remember').checked = false;
    renderAll();
    announce(ui('result.cleared'));
    byId('last-start').focus();
  }

  /** Load dates saved on this device, discarding anything unusable. */
  function restoreSaved() {
    var raw = UI.store.read(STORAGE_KEYS.cycle);
    if (!raw) {
      return;
    }
    try {
      var saved = JSON.parse(raw);
      var input = {
        lastPeriodStart: saved.lastPeriodStart,
        cycleLength: saved.cycleLength,
        periodLength: saved.periodLength,
        today: Cycle.localTodayISO()
      };
      state.status = Cycle.getCycleStatus(input);
      state.inputs = {
        lastPeriodStart: input.lastPeriodStart,
        cycleLength: input.cycleLength,
        periodLength: input.periodLength
      };
      writeForm(state.inputs);
      byId('remember').checked = true;
    } catch (error) {
      console.warn('In Phase: saved dates could not be used and were removed.', error);
      UI.store.remove(STORAGE_KEYS.cycle);
      state.status = null;
      state.inputs = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Language                                                            */
  /* ------------------------------------------------------------------ */

  function isSupported(code) {
    return C.LANGUAGES.indexOf(code) !== -1;
  }

  /** Order of preference: ?lang= in the address, a saved choice, the browser's languages. */
  function detectLanguage() {
    var requested = null;
    try {
      requested = new URLSearchParams(root.location.search).get('lang');
    } catch (error) {
      requested = null;
    }
    if (isSupported(requested)) {
      return requested;
    }

    var saved = UI.store.read(STORAGE_KEYS.lang);
    if (isSupported(saved)) {
      return saved;
    }

    var preferred =
      navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < preferred.length; i += 1) {
      var code = String(preferred[i]).slice(0, 2).toLowerCase();
      if (isSupported(code)) {
        return code;
      }
    }
    return 'en';
  }

  function setLanguage(lang) {
    if (!isSupported(lang) || lang === state.lang) {
      return;
    }
    state.lang = lang;
    UI.setLang(lang);
    UI.store.write(STORAGE_KEYS.lang, lang);
    try {
      var url = new URL(root.location.href);
      url.searchParams.set('lang', lang);
      root.history.replaceState(null, '', url.toString());
    } catch (error) {
      /* Pages opened straight from disk cannot rewrite their address; the choice is still applied. */
    }
    renderAll();
  }

  /* ------------------------------------------------------------------ */
  /* Start-up                                                            */
  /* ------------------------------------------------------------------ */

  /** Render every section in page order, so sources are numbered as they first appear. */
  function renderAll() {
    var cycle = currentCycle();
    UI.resetCitations();
    renderStatic();
    explorer.render({
      cycleLength: cycle.cycleLength,
      periodLength: cycle.periodLength,
      status: state.status,
      day: state.day
    });
    renderToolNote();
    renderHormones();
    renderBodyCaption();
    UI.registerCitations(game.sourceIds());
    game.render({ quiet: true });
    root.InPhaseInfographics.renderFindings(byId('findings'));
    root.InPhaseInfographics.renderStrength(byId('strength'));
    renderEvidenceKey();
    renderPhases();
    renderBasics();
    renderFit();
    renderHelp();
    renderSources();
    renderErrors();
    byId('forget').hidden = !state.inputs;
  }

  function init() {
    state.lang = detectLanguage();
    UI.setLang(state.lang);
    byId('last-start').setAttribute('max', Cycle.localTodayISO());
    restoreSaved();
    goToToday();

    explorer = root.InPhaseExplorer.create({ onDayChange: onDayChange });
    game = root.InPhaseGame.create(byId('game'), { announce: announceGame });

    byId('tool').addEventListener('submit', onSubmit);
    byId('forget').addEventListener('click', onForget);
    Array.prototype.forEach.call(document.querySelectorAll('.lang-btn'), function (button) {
      button.addEventListener('click', function () {
        setLanguage(button.getAttribute('data-lang'));
      });
    });
    bindTabs();

    renderAll();
    openInitialHash();
    explorer.startIntro();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);

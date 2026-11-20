/**
 * The cycle explorer. One selected day drives the draggable wheel, the day
 * slider, the legend, the "what to expect" panel, the "Inside your body"
 * diagram and the hormone chart.
 *
 * Exposes `window.InPhaseExplorer`. Depends on `window.Cycle`, `window.CONTENT`
 * and `window.InPhaseUI`.
 */
(function (root) {
  'use strict';

  var Cycle = root.Cycle;
  var C = root.CONTENT;
  var UI = root.InPhaseUI;
  var el = UI.el;
  var svgEl = UI.svgEl;
  var clear = UI.clear;
  var byId = UI.byId;
  var tr = UI.tr;
  var ui = UI.ui;

  var CATEGORIES = ['mood', 'nutrition', 'exercise', 'productivity'];
  var HORMONES = ['oestrogen', 'progesterone'];

  /** Wheel geometry in SVG units. */
  var WHEEL = { size: 300, cx: 150, cy: 150, radius: 104 };
  /** How far from the ring (in SVG units) a press may land and still move the marker. */
  var RING_REACH = 30;
  /** Duration of the one-off sweep round the wheel. */
  var SWEEP_MS = 2800;

  /** "Inside your body" geometry in SVG units. */
  var BODY = {
    follicle: [106, 132],
    eggStart: [124, 114],
    eggEnd: [131, 96],
    /* Width of the lining band at its thinnest, and how much it can add; half the
       band lies inside the cavity, whose inner radius is about 20 units. */
    liningMin: 5,
    liningRange: 26
  };

  /* ------------------------------------------------------------------ */
  /* Geometry                                                            */
  /* ------------------------------------------------------------------ */

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function polar(cx, cy, radius, fraction) {
    var angle = fraction * 2 * Math.PI - Math.PI / 2;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  /**
   * SVG path for a clockwise arc. `from` and `to` are fractions of a full turn
   * starting at twelve o'clock; `trim` shortens each end by that many units.
   */
  function arcPath(cx, cy, radius, from, to, trim) {
    var pad = trim / (2 * Math.PI * radius);
    var start = from + pad;
    var end = to - pad;
    var p0 = polar(cx, cy, radius, start);
    var p1 = polar(cx, cy, radius, end);
    var largeArc = end - start > 0.5 ? 1 : 0;
    return (
      'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) +
      'A' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' +
      p1[0].toFixed(2) + ' ' + p1[1].toFixed(2)
    );
  }

  /** Approximate rendered width of chart text, for placing labels without overlap. */
  function textWidth(text, fontSize) {
    return String(text).length * fontSize * 0.6;
  }

  function percent(fraction) {
    return (fraction * 100).toFixed(2) + '%';
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function overlaps(range, taken) {
    return taken.some(function (other) {
      return range[0] < other[1] && other[0] < range[1];
    });
  }

  /* ------------------------------------------------------------------ */
  /* Explorer                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * @param {{onDayChange?: function(number, string): void}} options
   *   `onDayChange(day, phaseId)` runs whenever the reader picks another day.
   */
  function create(options) {
    var onDayChange = (options && options.onDayChange) || function () {};

    /** Cycle being shown, or null before the first render. */
    var model = null;
    /** Selected cycle day. */
    var day = 1;
    var parts = { wheel: null, body: null };
    var chart = {};
    var drag = { wheel: false, chart: false, chartMoved: false };
    var sweep = { started: false, frame: 0, observer: null };

    function wrapDay(value) {
      var length = model.cycleLength;
      return ((((value - 1) % length) + length) % length) + 1;
    }

    function clampDay(value) {
      return clamp(Math.round(value), 1, model.cycleLength);
    }

    function phaseOf(value) {
      return Cycle.getPhaseForDay(value, model.cycleLength, model.periodLength);
    }

    function segmentFor(id) {
      return (
        model.segments.filter(function (segment) {
          return segment.id === id;
        })[0] || null
      );
    }

    /* ---------------- Public API ---------------- */

    /**
     * Draw everything for a cycle.
     * @param {{cycleLength: number, periodLength: number, status: ?object, day: number}} next
     */
    function render(next) {
      stopSweep();
      model = {
        cycleLength: next.cycleLength,
        periodLength: next.periodLength,
        status: next.status || null,
        segments: Cycle.getPhaseSegments(next.cycleLength, next.periodLength),
        premenstrual: Cycle.getPremenstrualWindow(next.cycleLength)
      };
      day = clampDay(next.day || 1);
      byId('result-kicker').textContent = model.status ? ui('result.yours') : ui('result.example');
      renderWheel();
      renderSliderTrack();
      renderLegend();
      renderBodyFrame();
      renderChart();
      paint(day, false);
    }

    /**
     * Select a day and show it everywhere.
     * @param {number} next
     * @param {{force?: boolean}} [opts] `force` repaints even when the day is unchanged.
     */
    function setDay(next, opts) {
      if (!model) {
        return;
      }
      var target = clampDay(next);
      if (target === day && !(opts && opts.force)) {
        return;
      }
      day = target;
      paint(day, false);
      onDayChange(day, phaseOf(day).id);
    }

    /** Move one day forwards or back, wrapping round the cycle. */
    function step(delta) {
      if (model) {
        stopSweep();
        setDay(wrapDay(day + delta));
      }
    }

    function getDay() {
      return day;
    }

    /* ---------------- Painting ---------------- */

    /**
     * Show a day in every view. Transient paints, used by the intro sweep, leave
     * the advice panel alone and may place the wheel marker between days.
     */
    function paint(shownDay, transient, markerDay) {
      var info = phaseOf(shownDay);
      paintWheel(shownDay, info, markerDay === undefined ? shownDay : markerDay);
      paintSlider(shownDay, info);
      paintLegend(info);
      paintBody(shownDay, info);
      paintChart(shownDay);
      if (!transient) {
        renderPanel(shownDay, info);
        byId('back-today').hidden = !(model.status && model.status.day !== shownDay);
      }
    }

    /* ---------------- Wheel ---------------- */

    function renderWheel() {
      var host = clear(byId('wheel'));
      var length = model.cycleLength;
      var cx = WHEEL.cx;
      var cy = WHEEL.cy;
      var radius = WHEEL.radius;
      var svg = svgEl('svg', { class: 'wheel-svg', viewBox: '0 0 300 300', role: 'img' });

      for (var d = 1; d <= length; d += 1) {
        var dot = polar(cx, cy, radius - 22, (d - 0.5) / length);
        svg.appendChild(
          svgEl('circle', { class: 'wheel-day', cx: dot[0].toFixed(2), cy: dot[1].toFixed(2), r: 1.3 })
        );
      }

      model.segments.forEach(function (segment) {
        var phase = UI.phaseById(segment.id);
        var arc = svgEl('path', {
          class: 'arc',
          'data-phase': segment.id,
          d: arcPath(cx, cy, radius, (segment.start - 1) / length, segment.end / length, 1)
        });
        arc.appendChild(svgEl('title', { text: tr(phase.name) + ' · ' + UI.daysLabel(segment) }));
        svg.appendChild(arc);

        var middle = polar(cx, cy, radius, (segment.start - 1 + segment.end) / 2 / length);
        svg.appendChild(UI.emblemGroup(segment.id, middle[0], middle[1], 15, 'arc-emblem'));

        var tick = polar(cx, cy, radius + 31, (segment.start - 0.5) / length);
        svg.appendChild(
          svgEl('text', {
            class: 'wheel-tick',
            x: tick[0].toFixed(1),
            y: tick[1].toFixed(1),
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            text: segment.start
          })
        );
      });

      var bracket = svgEl('path', {
        class: 'wheel-bracket',
        d: arcPath(
          cx,
          cy,
          radius + 19,
          (model.premenstrual.start - 1) / length,
          model.premenstrual.end / length,
          4
        )
      });
      bracket.appendChild(
        svgEl('title', {
          text: ui('legend.premenstrual') + ' · ' + UI.daysLabel(model.premenstrual)
        })
      );
      svg.appendChild(bracket);

      if (model.status) {
        var today = polar(cx, cy, radius, (model.status.day - 0.5) / length);
        svg.appendChild(
          svgEl('circle', {
            class: 'wheel-today',
            cx: today[0].toFixed(2),
            cy: today[1].toFixed(2),
            r: 6.5
          })
        );
      }

      function centreText(className, y, text) {
        var node = svgEl('text', {
          class: className,
          x: cx,
          y: y,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          text: text
        });
        svg.appendChild(node);
        return node;
      }

      var centre = {
        label: centreText('wheel-text', cy - 44, ui('wheel.day')),
        number: centreText('wheel-num', cy - 6, ''),
        of: centreText('wheel-text', cy + 28, ui('wheel.of', { length: length })),
        phase: centreText('wheel-phase', cy + 54, '')
      };

      var knob = el('div', { class: 'wheel-knob', 'aria-hidden': 'true' });
      host.appendChild(svg);
      host.appendChild(knob);
      parts.wheel = { svg: svg, knob: knob, centre: centre };
    }

    function paintWheel(shownDay, info, markerDay) {
      var wheel = parts.wheel;
      var length = model.cycleLength;
      var point = polar(WHEEL.cx, WHEEL.cy, WHEEL.radius, (markerDay - 0.5) / length);
      wheel.knob.style.left = percent(point[0] / WHEEL.size);
      wheel.knob.style.top = percent(point[1] / WHEEL.size);
      wheel.knob.setAttribute('data-phase', info.id);
      wheel.centre.number.textContent = String(shownDay);
      wheel.centre.phase.textContent = tr(UI.phaseById(info.id).short);

      var label = ui('wheel.aria', { length: length }) + ' ' + ui('wheel.ariaSelected', { day: shownDay });
      if (model.status) {
        label += ' ' + ui('wheel.ariaToday', { day: model.status.day });
      }
      wheel.svg.setAttribute('aria-label', label);
    }

    function wheelPoint(event) {
      var rect = byId('wheel').getBoundingClientRect();
      return [
        ((event.clientX - rect.left) / rect.width) * WHEEL.size,
        ((event.clientY - rect.top) / rect.height) * WHEEL.size
      ];
    }

    function nearRing(point) {
      var distance = Math.sqrt(
        Math.pow(point[0] - WHEEL.cx, 2) + Math.pow(point[1] - WHEEL.cy, 2)
      );
      return Math.abs(distance - WHEEL.radius) <= RING_REACH;
    }

    function dayAtPoint(point) {
      var angle = Math.atan2(point[1] - WHEEL.cy, point[0] - WHEEL.cx) + Math.PI / 2;
      var fraction = (((angle / (2 * Math.PI)) % 1) + 1) % 1;
      return clamp(Math.floor(fraction * model.cycleLength) + 1, 1, model.cycleLength);
    }

    /* Mouse and pen can drag anywhere on the ring. On touch screens only the marker
       drags, so a finger on the ring can still scroll the page; a tap jumps instead. */
    function bindWheel() {
      var host = byId('wheel');

      host.addEventListener('pointerdown', function (event) {
        if (!model || event.button > 0) {
          return;
        }
        var point = wheelPoint(event);
        var onKnob = event.target === parts.wheel.knob;
        if (!onKnob && (event.pointerType === 'touch' || !nearRing(point))) {
          return;
        }
        event.preventDefault();
        stopSweep();
        drag.wheel = true;
        host.classList.add('is-dragging');
        try {
          host.setPointerCapture(event.pointerId);
        } catch (error) {
          /* Without capture the drag still works while the pointer stays on the wheel. */
        }
        if (!onKnob) {
          setDay(dayAtPoint(point));
        }
      });

      host.addEventListener('pointermove', function (event) {
        if (drag.wheel) {
          setDay(dayAtPoint(wheelPoint(event)));
        }
      });

      function endDrag() {
        drag.wheel = false;
        host.classList.remove('is-dragging');
      }
      host.addEventListener('pointerup', endDrag);
      host.addEventListener('pointercancel', endDrag);
      host.addEventListener('lostpointercapture', endDrag);

      host.addEventListener('click', function (event) {
        if (!model || event.target === parts.wheel.knob) {
          return;
        }
        var point = wheelPoint(event);
        if (nearRing(point)) {
          stopSweep();
          setDay(dayAtPoint(point));
        }
      });
    }

    /* ---------------- Slider, steps, legend ---------------- */

    function renderSliderTrack() {
      var slider = byId('day-slider');
      var length = model.cycleLength;
      slider.min = '1';
      slider.max = String(length);
      var stops = model.segments.map(function (segment) {
        return (
          'var(--' + segment.id + ') ' + percent((segment.start - 1) / length) + ' ' +
          percent(segment.end / length)
        );
      });
      slider.style.setProperty('--track', 'linear-gradient(90deg, ' + stops.join(', ') + ')');
    }

    function paintSlider(shownDay, info) {
      var slider = byId('day-slider');
      var isToday = Boolean(model.status && model.status.day === shownDay);
      slider.value = String(shownDay);
      slider.setAttribute(
        'aria-valuetext',
        ui(isToday ? 'explore.valuetextToday' : 'explore.valuetext', {
          day: shownDay,
          length: model.cycleLength,
          phase: tr(UI.phaseById(info.id).name)
        })
      );
    }

    function renderLegend() {
      var list = clear(byId('wheel-legend'));
      var todayPhase = model.status ? model.status.phase : null;

      C.phases.forEach(function (phase) {
        var range = segmentFor(phase.id);
        if (!range) {
          return;
        }
        list.appendChild(
          el('li', { 'data-phase': phase.id }, [
            el('button', { type: 'button', class: 'legend-btn', 'data-day': range.start }, [
              UI.emblem(phase.id, 'legend-emblem'),
              el('span', { class: 'legend-name', text: tr(phase.name) }),
              phase.id === todayPhase ? el('span', { class: 'badge', text: ui('wheel.today') }) : null,
              el('span', { class: 'legend-days', text: UI.daysLabel(range) })
            ])
          ])
        );
      });

      list.appendChild(
        el('li', { class: 'legend-pms' }, [
          el('button', { type: 'button', class: 'legend-btn', 'data-day': model.premenstrual.start }, [
            el('span', { class: 'swatch-line', 'aria-hidden': 'true' }),
            el('span', { class: 'legend-name', text: ui('legend.premenstrual') }),
            el('span', { class: 'legend-days', text: UI.daysLabel(model.premenstrual) })
          ])
        ])
      );
    }

    function paintLegend(info) {
      var list = byId('wheel-legend');
      Array.prototype.forEach.call(list.querySelectorAll('li[data-phase]'), function (item) {
        var selected = item.getAttribute('data-phase') === info.id;
        item.classList.toggle('is-selected', selected);
        item.querySelector('button').setAttribute('aria-current', selected ? 'true' : 'false');
      });
      var pms = list.querySelector('.legend-pms');
      if (pms) {
        pms.classList.toggle('is-selected', info.premenstrual);
      }
    }

    function bindControls() {
      var slider = byId('day-slider');
      slider.addEventListener('input', function () {
        stopSweep();
        setDay(Number(slider.value));
      });

      [['day-prev', -1], ['day-next', 1], ['body-prev', -1], ['body-next', 1]].forEach(function (pair) {
        byId(pair[0]).addEventListener('click', function () {
          step(pair[1]);
        });
      });

      byId('back-today').addEventListener('click', function () {
        if (model && model.status) {
          stopSweep();
          setDay(model.status.day);
          slider.focus();
        }
      });

      byId('wheel-legend').addEventListener('click', function (event) {
        var button = event.target.closest('button[data-day]');
        if (button && model) {
          stopSweep();
          setDay(Number(button.getAttribute('data-day')));
        }
      });
    }

    /* ---------------- "What to expect" panel ---------------- */

    /** Calendar date of the next time the cycle reaches `shownDay`. */
    function dateForDay(shownDay) {
      var offset = shownDay - model.status.day;
      if (offset < 0) {
        offset += model.cycleLength;
      }
      return Cycle.addDays(Cycle.localTodayISO(), offset);
    }

    function renderPanel(shownDay, info) {
      var panel = clear(byId('today-panel'));
      var phase = UI.phaseById(info.id);
      var status = model.status;
      var isToday = Boolean(status && status.day === shownDay);
      var advice = info.premenstrual && phase.todayPremenstrual ? phase.todayPremenstrual : phase.today;
      panel.setAttribute('data-phase', phase.id);

      panel.appendChild(
        el('div', { class: 'today-phase' }, [
          UI.emblem(phase.id, 'today-emblem'),
          el('h3', { text: tr(phase.name) }),
          isToday ? el('span', { class: 'pill pill-strong', text: ui('wheel.today') }) : null,
          status ? el('span', { class: 'pill', text: ui('result.estimated') }) : null,
          info.premenstrual ? el('span', { class: 'pill', text: ui('legend.premenstrual') }) : null
        ])
      );

      var meta = el('p', { class: 'today-meta' }, [
        el('strong', { text: ui('result.dayOf', { day: shownDay, length: model.cycleLength }) })
      ]);
      if (isToday) {
        UI.append(meta, [
          ' · ',
          ui('result.next', {
            count: UI.dayCount(status.daysUntilNextPeriod),
            date: UI.formatDate(status.nextPeriodStart)
          })
        ]);
      } else if (status) {
        UI.append(meta, [' · ', ui('explore.expected', { date: UI.formatDate(dateForDay(shownDay)) })]);
      }
      panel.appendChild(meta);

      if (!status) {
        panel.appendChild(el('p', { class: 'prompt', text: ui('result.examplePrompt') }));
      } else if (status.cyclesElapsed >= 1) {
        panel.appendChild(el('p', { class: 'today-projected', text: ui('result.projected') }));
      }

      panel.appendChild(
        el('h4', {
          class: 'today-title',
          text: isToday ? ui('result.todayTitle') : ui('explore.dayTitle', { day: shownDay })
        })
      );
      panel.appendChild(
        el(
          'dl',
          { class: 'today-list' },
          CATEGORIES.map(function (category) {
            return el('div', { class: 'today-item' }, [
              el('dt', {}, [UI.icon(category), ui('cat.' + category)]),
              el('dd', { text: tr(advice[category]) })
            ]);
          })
        )
      );
      panel.appendChild(
        el('a', { class: 'more-link', href: '#phase-' + phase.id }, [
          ui('result.readMore') + ': ' + tr(phase.name)
        ])
      );
    }

    /* ---------------- "Inside your body" ---------------- */

    function renderBodyFrame() {
      var host = clear(byId('body-diagram'));
      var svg = svgEl('svg', {
        class: 'body-svg',
        viewBox: '0 0 340 232',
        'aria-hidden': 'true',
        focusable: 'false'
      });

      /* Womb: muscle wall, then the lining around the cavity, then the cavity itself. */
      svg.appendChild(
        svgEl('path', {
          class: 'b-tube',
          d: 'M204 72C186 42 146 46 132 86'
        })
      );
      svg.appendChild(
        svgEl('path', { class: 'b-fimbria', d: 'M132 86l-11 6M132 86l-5 11M132 86l3 12' })
      );
      svg.appendChild(
        svgEl('path', {
          class: 'b-wall',
          d: 'M196 78C196 46 312 46 312 78C312 116 288 150 270 170L268 198H240L238 170C220 150 196 116 196 78Z'
        })
      );
      svg.appendChild(svgEl('path', { class: 'b-canal', d: 'M254 150V198' }));
      /* The cavity is drawn empty; the lining is a band round it that thickens
         both into the wall and into the cavity. */
      svg.appendChild(svgEl('path', { class: 'b-lumen', d: 'M220 82H288L254 148Z' }));
      var lining = svgEl('path', { class: 'b-lining', d: 'M220 82H288L254 148Z' });
      svg.appendChild(lining);
      var drops = svgEl('g', { class: 'b-drops' }, [
        svgEl('path', { class: 'b-drop', d: 'M254 204c-1.4 2-3.6 4.6-3.6 6.6a3.6 3.6 0 0 0 7.2 0c0-2-2.2-4.6-3.6-6.6z' }),
        svgEl('path', { class: 'b-drop', d: 'M246 216c-1.1 1.6-2.8 3.6-2.8 5.2a2.8 2.8 0 0 0 5.6 0c0-1.6-1.7-3.6-2.8-5.2z' }),
        svgEl('path', { class: 'b-drop', d: 'M262 218c-1.1 1.6-2.8 3.6-2.8 5.2a2.8 2.8 0 0 0 5.6 0c0-1.6-1.7-3.6-2.8-5.2z' })
      ]);
      svg.appendChild(drops);

      /* Ovary: resting follicles, the growing follicle with its egg, and the empty follicle. */
      svg.appendChild(svgEl('ellipse', { class: 'b-ovary', cx: 92, cy: 140, rx: 56, ry: 40 }));
      [[60, 128, 5], [70, 156, 4], [118, 160, 4.5], [52, 148, 3.5], [84, 168, 3.5]].forEach(function (f) {
        svg.appendChild(svgEl('circle', { class: 'b-small', cx: f[0], cy: f[1], r: f[2] }));
      });
      var follicle = svgEl('circle', {
        class: 'b-follicle',
        cx: BODY.follicle[0],
        cy: BODY.follicle[1],
        r: 10,
        pathLength: 100
      });
      svg.appendChild(follicle);
      var luteum = svgEl('g', { class: 'b-luteum' }, [
        svgEl('circle', { class: 'b-luteum-body', cx: 0, cy: 0, r: 24 }),
        svgEl('circle', { class: 'b-luteum-spot', cx: -7, cy: -5, r: 3.2 }),
        svgEl('circle', { class: 'b-luteum-spot', cx: 8, cy: -1, r: 2.6 }),
        svgEl('circle', { class: 'b-luteum-spot', cx: -1, cy: 9, r: 2.9 })
      ]);
      svg.appendChild(luteum);
      var egg = svgEl('circle', { class: 'b-egg', cx: BODY.follicle[0], cy: BODY.follicle[1], r: 4.6 });
      svg.appendChild(egg);

      host.appendChild(svg);
      parts.body = { follicle: follicle, luteum: luteum, egg: egg, lining: lining, drops: drops };
    }

    function show(node, visible) {
      node.setAttribute('display', visible ? 'inline' : 'none');
    }

    function paintBody(shownDay, info) {
      var body = parts.body;
      var state = Cycle.anatomyForDay(shownDay, model.cycleLength, model.periodLength);
      var labels = C.anatomy.phases[info.id];

      var radius = 7 + 19 * state.follicle;
      body.follicle.setAttribute('r', radius.toFixed(1));
      body.follicle.classList.toggle('is-open', state.egg > 0);
      show(body.follicle, state.follicle > 0);

      var eggAt;
      if (state.egg > 0) {
        var t = (state.egg - 0.5) * 2;
        eggAt = [
          BODY.eggStart[0] + (BODY.eggEnd[0] - BODY.eggStart[0]) * t,
          BODY.eggStart[1] + (BODY.eggEnd[1] - BODY.eggStart[1]) * t
        ];
      } else {
        eggAt = [BODY.follicle[0] + 0.25 * radius, BODY.follicle[1] - 0.25 * radius];
      }
      body.egg.setAttribute('cx', eggAt[0].toFixed(1));
      body.egg.setAttribute('cy', eggAt[1].toFixed(1));
      show(body.egg, state.follicle > 0 || state.egg > 0);

      var luteumScale = (6 + 18 * state.corpusLuteum) / 24;
      body.luteum.setAttribute(
        'transform',
        'translate(' + BODY.follicle[0] + ' ' + BODY.follicle[1] + ') scale(' + luteumScale.toFixed(3) + ')'
      );
      show(body.luteum, state.corpusLuteum > 0);

      body.lining.setAttribute('stroke-width', (BODY.liningMin + BODY.liningRange * state.lining).toFixed(1));
      show(body.drops, state.shedding);

      byId('body-card').setAttribute('data-phase', info.id);
      byId('body-day').textContent = ui('body.day', {
        day: shownDay,
        phase: tr(UI.phaseById(info.id).name)
      });
      byId('body-ovary').textContent = tr(labels.ovary);
      byId('body-womb').textContent = tr(labels.womb);
    }

    /* ---------------- Hormone chart ---------------- */

    function renderChart() {
      var host = byId('hormone-chart');
      var measured = Math.round(host.clientWidth);
      var width = Math.max(280, measured || 640);
      var height = 262;
      var margin = { top: 38, right: 12, bottom: 50, left: 12 };
      var plotWidth = width - margin.left - margin.right;
      var plotBottom = height - margin.bottom;
      var plotHeight = plotBottom - margin.top;
      var length = model.cycleLength;
      var ovulation = Cycle.estimateOvulationDay(length);

      var x = function (d) {
        return margin.left + ((d - 0.5) / length) * plotWidth;
      };
      var y = function (level) {
        return margin.top + (1 - level) * plotHeight;
      };

      chart.width = measured;
      chart.size = { width: width, margin: margin, plotBottom: plotBottom };
      chart.x = x;
      chart.y = y;
      chart.invert = function (pixels) {
        return ((pixels - margin.left) / plotWidth) * length + 0.5;
      };

      clear(host);
      host.setAttribute('aria-label', ui('chart.aria'));
      var svg = svgEl('svg', {
        viewBox: '0 0 ' + width + ' ' + height,
        width: width,
        height: height,
        'aria-hidden': 'true',
        focusable: 'false'
      });

      /* Phase strip along the top, with names where they fit. */
      model.segments.forEach(function (segment) {
        var left = x(segment.start - 0.5) + 1;
        var right = x(segment.end + 0.5) - 1;
        svg.appendChild(
          svgEl('rect', {
            class: 'c-strip',
            'data-phase': segment.id,
            x: left.toFixed(1),
            y: 18,
            width: Math.max(1, right - left).toFixed(1),
            height: 6,
            rx: 3
          })
        );
        var name = tr(UI.phaseById(segment.id).short);
        if (textWidth(name, 11) + 6 <= right - left) {
          svg.appendChild(
            svgEl('text', {
              class: 'c-phase-label',
              x: ((left + right) / 2).toFixed(1),
              y: 11,
              'text-anchor': 'middle',
              text: name
            })
          );
        }
      });

      svg.appendChild(
        svgEl('line', { class: 'c-axis', x1: margin.left, x2: width - margin.right, y1: plotBottom, y2: plotBottom })
      );

      /* Ovulation marker, labelled under the axis. */
      var ovulationX = x(ovulation);
      svg.appendChild(
        svgEl('line', {
          class: 'c-ovulation',
          x1: ovulationX.toFixed(1),
          x2: ovulationX.toFixed(1),
          y1: margin.top,
          y2: plotBottom
        })
      );
      svg.appendChild(
        svgEl('path', {
          class: 'c-ovulation-mark',
          d: 'M' + ovulationX.toFixed(1) + ' ' + (plotBottom + 24) + 'l4 6h-8z'
        })
      );
      var ovulationText = ui('chart.ovulation');
      var ovulationHalf = textWidth(ovulationText, 11) / 2;
      svg.appendChild(
        svgEl('text', {
          class: 'c-axis-label',
          x: clamp(ovulationX, margin.left + ovulationHalf, width - margin.right - ovulationHalf).toFixed(1),
          y: plotBottom + 43,
          'text-anchor': 'middle',
          text: ovulationText
        })
      );
      var titleOnRight = ovulationX < width / 2;
      svg.appendChild(
        svgEl('text', {
          class: 'c-axis-label',
          x: titleOnRight ? width - margin.right : margin.left,
          y: plotBottom + 43,
          'text-anchor': titleOnRight ? 'end' : 'start',
          text: ui('chart.axis')
        })
      );

      /* Selection layer under the curves, so the lines and their labels stay on top. */
      chart.back = svgEl('g');
      svg.appendChild(chart.back);

      HORMONES.forEach(function (hormone) {
        var commands = [];
        for (var d = 0.5; d <= length + 0.5 + 1e-9; d += 0.25) {
          commands.push(
            (commands.length ? 'L' : 'M') +
              x(d).toFixed(1) + ' ' + y(Cycle.hormoneLevels(d, length)[hormone]).toFixed(1)
          );
        }
        svg.appendChild(svgEl('path', { class: 'c-line series-' + hormone, d: commands.join('') }));
      });

      /* Direct labels beside each peak, kept apart and inside the plot. */
      var oestrogenPeak = ovulation - 1;
      var progesteronePeak = ovulation + Cycle.LUTEAL_DAYS / 2;
      var oestrogenName = ui('chart.oestrogen');
      var progesteroneName = ui('chart.progesterone');
      var oestrogenEnd = clamp(
        Math.min(x(oestrogenPeak) + 14, ovulationX - 5),
        margin.left + textWidth(oestrogenName, 12),
        width - margin.right
      );
      var progesteroneStart = clamp(
        x(progesteronePeak) - 14,
        oestrogenEnd + 10,
        width - margin.right - textWidth(progesteroneName, 12)
      );
      svg.appendChild(
        svgEl('text', {
          class: 'c-label',
          x: oestrogenEnd.toFixed(1),
          y: (y(Cycle.hormoneLevels(oestrogenPeak, length).oestrogen) - 9).toFixed(1),
          'text-anchor': 'end',
          text: oestrogenName
        })
      );
      svg.appendChild(
        svgEl('text', {
          class: 'c-label',
          x: progesteroneStart.toFixed(1),
          y: (y(Cycle.hormoneLevels(progesteronePeak, length).progesterone) - 9).toFixed(1),
          'text-anchor': 'start',
          text: progesteroneName
        })
      );

      chart.front = svgEl('g');
      svg.appendChild(chart.front);

      /* Hover and keyboard read-out. */
      var crossLine = svgEl('line', { class: 'c-cross', y1: margin.top, y2: plotBottom });
      var crossDots = {};
      var cross = svgEl('g', { display: 'none' }, [crossLine]);
      HORMONES.forEach(function (hormone) {
        crossDots[hormone] = svgEl('circle', { class: 'c-dot series-' + hormone, r: 4.5 });
        cross.appendChild(crossDots[hormone]);
      });
      svg.appendChild(cross);

      var tip = el('div', { class: 'chart-tip', hidden: true });
      host.appendChild(svg);
      host.appendChild(tip);

      chart.showTip = function (rawDay) {
        var shown = clamp(Math.round(rawDay), 1, length);
        var levels = Cycle.hormoneLevels(shown, length);
        var position = phaseOf(shown);
        var px = x(shown);

        cross.removeAttribute('display');
        crossLine.setAttribute('x1', px.toFixed(1));
        crossLine.setAttribute('x2', px.toFixed(1));
        HORMONES.forEach(function (hormone) {
          crossDots[hormone].setAttribute('cx', px.toFixed(1));
          crossDots[hormone].setAttribute('cy', y(levels[hormone]).toFixed(1));
        });

        clear(tip);
        tip.appendChild(el('div', { class: 'tip-head', text: ui('chart.day', { day: shown }) }));
        tip.appendChild(
          el('div', {
            class: 'tip-phase',
            text:
              tr(UI.phaseById(position.id).name) +
              (position.premenstrual ? ' · ' + ui('legend.premenstrual') : '')
          })
        );
        HORMONES.forEach(function (hormone) {
          tip.appendChild(
            el('div', { class: 'tip-row series-' + hormone }, [
              el('span', { class: 'line-key' }),
              el('span', { class: 'tip-name', text: ui('chart.' + hormone) + ':' }),
              el('span', {
                class: 'tip-value',
                text: ui('level.' + Cycle.describeHormone(hormone, shown, length))
              })
            ])
          );
        });
        tip.hidden = false;

        var tipWidth = tip.offsetWidth;
        var left = px + 14;
        if (left + tipWidth > width) {
          left = px - tipWidth - 14;
        }
        tip.style.left = Math.max(0, left) + 'px';
      };

      chart.hideTip = function () {
        cross.setAttribute('display', 'none');
        tip.hidden = true;
      };
    }

    /** Draw the selected day, today and the day ticks, keeping their labels apart. */
    function paintChart(shownDay) {
      var x = chart.x;
      var y = chart.y;
      var size = chart.size;
      var length = model.cycleLength;
      var top = size.margin.top;
      var bottom = size.plotBottom;
      var labelY = bottom + 17;
      var today = model.status ? model.status.day : null;
      var taken = [];
      clear(chart.back);
      clear(chart.front);

      function bottomLabel(className, centreX, text, fontSize) {
        var half = textWidth(text, fontSize) / 2;
        var at = clamp(centreX, size.margin.left + half, size.width - size.margin.right - half);
        var range = [at - half - 6, at + half + 6];
        if (overlaps(range, taken)) {
          return;
        }
        taken.push(range);
        chart.front.appendChild(
          svgEl('text', { class: className, x: at.toFixed(1), y: labelY, 'text-anchor': 'middle', text: text })
        );
      }

      var selectedX = x(shownDay);
      chart.back.appendChild(
        svgEl('rect', {
          class: 'c-selected-band',
          x: (selectedX - (x(2) - x(1)) / 2).toFixed(1),
          y: top,
          width: (x(2) - x(1)).toFixed(1),
          height: bottom - top
        })
      );
      chart.back.appendChild(
        svgEl('line', { class: 'c-today', x1: selectedX.toFixed(1), x2: selectedX.toFixed(1), y1: top, y2: bottom })
      );
      if (today !== null && today !== shownDay) {
        chart.back.appendChild(
          svgEl('line', {
            class: 'c-today-ghost',
            x1: x(today).toFixed(1),
            x2: x(today).toFixed(1),
            y1: top,
            y2: bottom
          })
        );
      }

      var levels = Cycle.hormoneLevels(shownDay, length);
      HORMONES.forEach(function (hormone) {
        chart.front.appendChild(
          svgEl('circle', {
            class: 'c-dot series-' + hormone,
            cx: selectedX.toFixed(1),
            cy: y(levels[hormone]).toFixed(1),
            r: 4.5
          })
        );
      });

      bottomLabel(
        'c-today-label',
        selectedX,
        today === shownDay ? ui('chart.today') + ' · ' + shownDay : ui('chart.day', { day: shownDay }),
        12
      );
      if (today !== null && today !== shownDay) {
        bottomLabel('c-tick c-tick-today', x(today), ui('chart.today'), 11);
      }

      var ticks = [1];
      for (var d = 7; d <= length; d += 7) {
        ticks.push(d);
      }
      if (length - ticks[ticks.length - 1] >= 3) {
        ticks.push(length);
      }
      ticks.forEach(function (tickDay) {
        bottomLabel('c-tick', x(tickDay), String(tickDay), 11);
      });
    }

    function bindChart() {
      var host = byId('hormone-chart');

      function dayFromPointer(event) {
        var raw = chart.invert(event.clientX - host.getBoundingClientRect().left);
        return clamp(Math.round(raw), 1, model.cycleLength);
      }

      host.addEventListener('pointerdown', function (event) {
        if (!model || event.button > 0) {
          return;
        }
        stopSweep();
        drag.chart = true;
        drag.chartMoved = false;
        drag.chartTouch = event.pointerType === 'touch';
        var picked = dayFromPointer(event);
        /* On touch screens wait for a sideways move or a tap, so scrolling does not pick a day. */
        if (!drag.chartTouch) {
          try {
            host.setPointerCapture(event.pointerId);
          } catch (error) {
            /* Capture is optional. */
          }
          setDay(picked);
        }
        chart.showTip(picked);
      });

      host.addEventListener('pointermove', function (event) {
        if (!model || !chart.showTip) {
          return;
        }
        var picked = dayFromPointer(event);
        if (drag.chart) {
          drag.chartMoved = true;
          setDay(picked);
        }
        chart.showTip(picked);
      });

      host.addEventListener('pointerup', function (event) {
        if (drag.chart && drag.chartTouch && !drag.chartMoved && model) {
          setDay(dayFromPointer(event));
        }
        drag.chart = false;
      });
      host.addEventListener('pointercancel', function () {
        drag.chart = false;
      });
      host.addEventListener('pointerleave', function () {
        if (!drag.chart && document.activeElement !== host && chart.hideTip) {
          chart.hideTip();
        }
      });
      host.addEventListener('focus', function () {
        if (chart.showTip) {
          chart.showTip(day);
        }
      });
      host.addEventListener('blur', function () {
        if (chart.hideTip) {
          chart.hideTip();
        }
      });
      host.addEventListener('keydown', function (event) {
        if (!model) {
          return;
        }
        var target = {
          ArrowLeft: day - 1,
          ArrowRight: day + 1,
          Home: 1,
          End: model.cycleLength
        }[event.key];
        if (target !== undefined) {
          event.preventDefault();
          stopSweep();
          setDay(clamp(target, 1, model.cycleLength));
          chart.showTip(day);
        } else if (event.key === 'Escape') {
          chart.hideTip();
        }
      });

      if ('ResizeObserver' in root) {
        var queued = false;
        new root.ResizeObserver(function () {
          if (queued) {
            return;
          }
          queued = true;
          root.requestAnimationFrame(function () {
            queued = false;
            var width = Math.round(host.clientWidth);
            if (model && width && width !== chart.width) {
              renderChart();
              paintChart(day);
            }
          });
        }).observe(host);
      } else {
        root.addEventListener('resize', function () {
          if (model) {
            renderChart();
            paintChart(day);
          }
        });
      }
    }

    /* ---------------- Intro sweep ---------------- */

    /** Sweep the marker once round the wheel when it first comes into view. */
    function startIntro() {
      if (sweep.started || !model) {
        return;
      }
      sweep.started = true;
      if (UI.reducedMotion() || !('IntersectionObserver' in root)) {
        return;
      }
      sweep.observer = new root.IntersectionObserver(
        function (entries) {
          var visible = entries.some(function (entry) {
            return entry.isIntersecting;
          });
          if (visible) {
            sweep.observer.disconnect();
            sweep.observer = null;
            runSweep();
          }
        },
        { threshold: 0.6 }
      );
      sweep.observer.observe(byId('wheel'));
    }

    function runSweep() {
      var from = day;
      var length = model.cycleLength;
      var startTime = null;
      function frame(now) {
        if (startTime === null) {
          startTime = now;
        }
        var t = Math.min(1, (now - startTime) / SWEEP_MS);
        var position = from + easeInOut(t) * length;
        if (t < 1) {
          paint(wrapDay(Math.round(position)), true, position);
          sweep.frame = root.requestAnimationFrame(frame);
        } else {
          sweep.frame = 0;
          paint(day, false);
        }
      }
      sweep.frame = root.requestAnimationFrame(frame);
    }

    function stopSweep() {
      if (sweep.observer) {
        sweep.observer.disconnect();
        sweep.observer = null;
      }
      if (sweep.frame) {
        root.cancelAnimationFrame(sweep.frame);
        sweep.frame = 0;
        if (model) {
          paint(day, false);
        }
      }
    }

    bindWheel();
    bindControls();
    bindChart();

    return {
      render: render,
      setDay: setDay,
      getDay: getDay,
      step: step,
      startIntro: startIntro
    };
  }

  root.InPhaseExplorer = { create: create };
})(window);

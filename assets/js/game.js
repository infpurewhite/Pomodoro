/**
 * "Myth or fact?": a short card game. Each card is a claim; the reader answers
 * myth or fact with the buttons or a swipe, then sees the verdict, the
 * explanation, its evidence label and its sources. Nothing is stored.
 *
 * Exposes `window.InPhaseGame`. Depends on `window.Quiz`, `window.CONTENT` and
 * `window.InPhaseUI`.
 */
(function (root) {
  'use strict';

  var Quiz = root.Quiz;
  var C = root.CONTENT;
  var UI = root.InPhaseUI;
  var el = UI.el;
  var svgEl = UI.svgEl;
  var clear = UI.clear;
  var tr = UI.tr;
  var ui = UI.ui;

  /** Horizontal drag, in pixels, that counts as a swipe answer. */
  var SWIPE_DISTANCE = 90;
  /** Movement allowed before the card starts to follow the pointer. */
  var DRAG_SLOP = 8;
  /** Pieces in the small burst shown for a correct answer. */
  var BURST_PIECES = 10;

  function cardById(id) {
    return C.quiz.cards.filter(function (card) {
      return card.id === id;
    })[0];
  }

  /** Source ids used by the game, in pool order, so they can be numbered up front. */
  function sourceIds() {
    var ids = [];
    C.quiz.cards.forEach(function (card) {
      card.sources.forEach(function (id) {
        if (ids.indexOf(id) === -1) {
          ids.push(id);
        }
      });
    });
    return ids;
  }

  function quote(text) {
    return UI.getLang() === 'es' ? '«' + text + '»' : '“' + text + '”';
  }

  /**
   * @param {HTMLElement} host Element the game is drawn into.
   * @param {{announce: function(string): void}} options `announce` speaks results to screen readers.
   */
  function create(host, options) {
    var announce = options.announce;
    var random = Quiz.createRandom(Math.floor(Math.random() * 4294967296));
    var game = { stage: 'intro', deck: [], index: 0, answers: [] };
    var focusTarget = null;

    /* ---------------- State changes ---------------- */

    function start() {
      game.deck = Quiz.deal(C.quiz.cards, Quiz.DECK_SIZE, random);
      game.index = 0;
      game.answers = [];
      game.stage = 'question';
      focusTarget = 'claim';
      render();
    }

    function answer(guess) {
      if (game.stage !== 'question') {
        return;
      }
      var card = cardById(game.deck[game.index]);
      var correct = guess === card.answer;
      game.answers.push({ id: card.id, guess: guess, answer: card.answer });
      game.stage = 'revealed';
      focusTarget = 'result';
      render();
      announce(
        (correct ? ui('quiz.correct') : ui('quiz.incorrect')) + '. ' + ui('quiz.verdict.' + card.answer)
      );
    }

    function next() {
      game.index += 1;
      if (game.index >= game.deck.length) {
        game.stage = 'done';
        focusTarget = 'done';
      } else {
        game.stage = 'question';
        focusTarget = 'claim';
      }
      render();
    }

    /* ---------------- Rendering ---------------- */

    /**
     * Draw the current stage.
     * @param {{quiet?: boolean}} [opts] `quiet` skips entrance animations (used on language changes).
     */
    function render(opts) {
      var quiet = Boolean(opts && opts.quiet);
      clear(host);
      host.setAttribute('data-stage', game.stage);
      if (game.stage === 'intro') {
        host.appendChild(renderIntro());
      } else if (game.stage === 'done') {
        host.appendChild(renderDone(quiet));
      } else {
        host.appendChild(renderPlay(quiet));
      }
      if (focusTarget) {
        var target = host.querySelector('[data-focus="' + focusTarget + '"]');
        focusTarget = null;
        if (target) {
          target.focus();
        }
      }
    }

    function deckArt() {
      return el('div', { class: 'deck-art', 'aria-hidden': 'true' }, [
        el('span', { class: 'deck-card deck-myth' }, [UI.icon('cross'), ui('quiz.myth')]),
        el('span', { class: 'deck-card deck-fact' }, [UI.icon('check'), ui('quiz.fact')]),
        el('span', { class: 'deck-card deck-claim' }, [
          el('span', { class: 'deck-lines' }, [el('i'), el('i'), el('i')])
        ])
      ]);
    }

    function renderIntro() {
      return el('div', { class: 'game-card game-intro' }, [
        deckArt(),
        el('p', { class: 'game-facts', text: ui('quiz.facts') }),
        el('button', { type: 'button', class: 'btn btn-primary btn-icon', 'data-action': 'start' }, [
          UI.icon('play'),
          ui('quiz.start')
        ])
      ]);
    }

    function progress() {
      var list = el('ol', { class: 'game-progress', 'aria-hidden': 'true' });
      game.deck.forEach(function (id, index) {
        var entry = game.answers[index];
        var stateName = entry
          ? entry.guess === entry.answer
            ? 'correct'
            : 'incorrect'
          : index === game.index
            ? 'current'
            : 'todo';
        list.appendChild(el('li', { 'data-state': stateName }));
      });
      return list;
    }

    function burst() {
      var wrap = el('span', { class: 'burst', 'aria-hidden': 'true' });
      for (var i = 0; i < BURST_PIECES; i += 1) {
        var piece = el('i');
        piece.style.setProperty('--angle', (i * 360) / BURST_PIECES + 'deg');
        wrap.appendChild(piece);
      }
      return wrap;
    }

    function renderPlay(quiet) {
      var card = cardById(game.deck[game.index]);
      var revealed = game.stage === 'revealed';
      var last = game.answers[game.answers.length - 1];
      var correct = revealed && last.guess === card.answer;
      var tally = Quiz.score(game.answers);
      var isLast = game.index + 1 >= game.deck.length;

      var hud = el('div', { class: 'game-hud' }, [
        progress(),
        el('p', { class: 'game-score' }, [UI.icon('check'), ui('quiz.score', { correct: tally.correct })]),
        tally.streak >= 2
          ? el('p', { class: 'game-streak' }, [UI.icon('spark'), ui('quiz.streak', { count: tally.streak })])
          : null
      ]);

      var face = el(
        'article',
        {
          class:
            'game-card game-face' +
            (quiet ? '' : revealed ? ' is-flipping' : ' is-dealt'),
          'data-result': revealed ? (correct ? 'correct' : 'incorrect') : null,
          'aria-labelledby': 'game-claim'
        },
        [
          el('p', {
            class: 'game-label',
            text: ui('quiz.claim', { n: game.index + 1, total: game.deck.length })
          }),
          el('h3', {
            class: 'game-claim',
            id: 'game-claim',
            tabindex: '-1',
            'data-focus': 'claim',
            text: quote(tr(card.claim))
          })
        ]
      );

      if (revealed) {
        var badge = el('h4', { class: 'result-badge', tabindex: '-1', 'data-focus': 'result' }, [
          UI.icon(correct ? 'check' : 'cross'),
          correct ? ui('quiz.correct') : ui('quiz.incorrect')
        ]);
        if (correct && !quiet && !UI.reducedMotion()) {
          badge.appendChild(burst());
        }
        UI.append(face, [
          el('div', { class: 'game-result' }, [
            badge,
            el('p', {
              class: 'game-verdict',
              'data-answer': card.answer,
              text: ui('quiz.verdict.' + card.answer)
            })
          ]),
          el('p', { class: 'game-explanation' }, [tr(card.explanation), UI.cite(card.sources)]),
          el('div', { class: 'game-evidence' }, [
            el('span', { class: 'game-evidence-label', text: ui('quiz.evidence') }),
            UI.chip(card.evidence)
          ])
        ]);
      } else {
        UI.append(face, [
          el('p', { class: 'game-hint' }, [
            el('span', { class: 'hint-arrow', 'aria-hidden': 'true', text: '←' }),
            ui('quiz.hint'),
            el('span', { class: 'hint-arrow', 'aria-hidden': 'true', text: '→' })
          ]),
          el('span', { class: 'stamp stamp-myth', 'aria-hidden': 'true', text: ui('quiz.myth') }),
          el('span', { class: 'stamp stamp-fact', 'aria-hidden': 'true', text: ui('quiz.fact') })
        ]);
        bindSwipe(face);
      }

      var actions = revealed
        ? el('div', { class: 'game-actions' }, [
            el('button', { type: 'button', class: 'btn btn-primary btn-icon', 'data-action': 'next' }, [
              isLast ? ui('quiz.finish') : ui('quiz.next'),
              UI.icon('next')
            ])
          ])
        : el('div', { class: 'game-actions game-choices' }, [
            el('button', { type: 'button', class: 'btn btn-choice', 'data-answer': 'myth' }, [
              UI.icon('cross'),
              ui('quiz.myth')
            ]),
            el('button', { type: 'button', class: 'btn btn-choice', 'data-answer': 'fact' }, [
              UI.icon('check'),
              ui('quiz.fact')
            ])
          ]);

      return el('div', { class: 'game-board' }, [
        hud,
        el('div', { class: 'game-stage' }, [el('div', { class: 'game-stack', 'aria-hidden': 'true' }), face]),
        actions
      ]);
    }

    function scoreRing(correct, total) {
      var radius = 34;
      var circumference = 2 * Math.PI * radius;
      var share = total ? correct / total : 0;
      return svgEl('svg', { class: 'score-ring', viewBox: '0 0 84 84', 'aria-hidden': 'true', focusable: 'false' }, [
        svgEl('circle', { class: 'ring-track', cx: 42, cy: 42, r: radius }),
        svgEl('circle', {
          class: 'ring-value',
          cx: 42,
          cy: 42,
          r: radius,
          'stroke-dasharray': (circumference * share).toFixed(1) + ' ' + circumference.toFixed(1),
          transform: 'rotate(-90 42 42)'
        }),
        svgEl('text', {
          class: 'ring-text',
          x: 42,
          y: 42,
          'text-anchor': 'middle',
          'dominant-baseline': 'central',
          text: correct + '/' + total
        })
      ]);
    }

    function renderDone(quiet) {
      var tally = Quiz.score(game.answers);
      var band = Quiz.resultBand(tally.correct, tally.total);

      var recap = el(
        'ol',
        { class: 'game-recap' },
        game.answers.map(function (entry) {
          var card = cardById(entry.id);
          var correct = entry.guess === entry.answer;
          return el('li', { 'data-result': correct ? 'correct' : 'incorrect' }, [
            el('span', { class: 'recap-mark' }, [
              UI.icon(correct ? 'check' : 'cross'),
              el('span', { class: 'visually-hidden', text: correct ? ui('quiz.correct') : ui('quiz.incorrect') })
            ]),
            el('div', { class: 'recap-body' }, [
              el('p', { class: 'recap-claim', text: tr(card.claim) }),
              el('p', { class: 'recap-meta' }, [
                el('strong', { text: ui('quiz.verdict.' + card.answer) }),
                ' ' + ui('quiz.said.' + entry.guess) + '. ',
                UI.chip(card.evidence)
              ])
            ])
          ]);
        })
      );

      return el('div', { class: 'game-card game-done' + (quiet ? '' : ' is-dealt') }, [
        el('div', { class: 'game-done-head' }, [
          scoreRing(tally.correct, tally.total),
          el('div', { class: 'game-done-text' }, [
            el('h3', {
              class: 'game-result-title',
              tabindex: '-1',
              'data-focus': 'done',
              text: ui('quiz.resultTitle', { correct: tally.correct, total: tally.total })
            }),
            el('p', { class: 'game-result-text', text: ui('quiz.result.' + band) }),
            el('p', { class: 'game-best' }, [UI.icon('spark'), ui('quiz.bestStreak', { count: tally.bestStreak })])
          ])
        ]),
        el('button', { type: 'button', class: 'btn btn-primary btn-icon', 'data-action': 'again' }, [
          UI.icon('again'),
          ui('quiz.again')
        ]),
        el('h4', { class: 'game-recap-title', text: ui('quiz.recap') }),
        recap
      ]);
    }

    /* ---------------- Swipe ---------------- */

    function lean(face, dx) {
      face.style.transform = dx ? 'translateX(' + dx + 'px) rotate(' + (dx / 24).toFixed(2) + 'deg)' : '';
      face.style.setProperty('--myth', String(Math.min(1, Math.max(0, -dx / SWIPE_DISTANCE))));
      face.style.setProperty('--fact', String(Math.min(1, Math.max(0, dx / SWIPE_DISTANCE))));
    }

    /* The card follows a sideways drag; far enough left answers myth, right answers fact.
       touch-action: pan-y in the CSS keeps vertical scrolling with the browser. */
    function bindSwipe(face) {
      var drag = null;

      face.addEventListener('pointerdown', function (event) {
        if (event.button > 0 || event.target.closest('a, button')) {
          return;
        }
        drag = { x: event.clientX, y: event.clientY, id: event.pointerId, moving: false };
      });

      face.addEventListener('pointermove', function (event) {
        if (!drag || event.pointerId !== drag.id) {
          return;
        }
        var dx = event.clientX - drag.x;
        var dy = event.clientY - drag.y;
        if (!drag.moving) {
          if (Math.abs(dx) < DRAG_SLOP || Math.abs(dx) < Math.abs(dy)) {
            return;
          }
          drag.moving = true;
          face.classList.add('is-dragging');
          try {
            face.setPointerCapture(event.pointerId);
          } catch (error) {
            /* Capture is optional. */
          }
        }
        lean(face, dx);
      });

      face.addEventListener('pointerup', function (event) {
        if (!drag) {
          return;
        }
        var dx = event.clientX - drag.x;
        var moving = drag.moving;
        drag = null;
        face.classList.remove('is-dragging');
        if (moving && Math.abs(dx) >= SWIPE_DISTANCE) {
          answer(dx < 0 ? 'myth' : 'fact');
        } else {
          lean(face, 0);
        }
      });

      face.addEventListener('pointercancel', function () {
        drag = null;
        face.classList.remove('is-dragging');
        lean(face, 0);
      });
    }

    host.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button || !host.contains(button)) {
        return;
      }
      var choice = button.getAttribute('data-answer');
      var action = button.getAttribute('data-action');
      if (choice) {
        answer(choice);
      } else if (action === 'start' || action === 'again') {
        start();
      } else if (action === 'next') {
        next();
      }
    });

    return { render: render, sourceIds: sourceIds };
  }

  root.InPhaseGame = { create: create };
})(window);

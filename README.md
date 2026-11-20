# In Phase · En fase

A bilingual (English / Spanish) web page that explains the menstrual cycle phase by phase: what the hormones are doing, how mood can change, and what the research says about nutrition, exercise and productivity in each phase. Every recommendation carries an evidence label and a numbered source.

Una página web bilingüe (español / inglés) que explica el ciclo menstrual fase por fase: qué hacen las hormonas, cómo puede cambiar el ánimo y qué dice la investigación sobre alimentación, ejercicio y productividad en cada fase. Cada recomendación lleva una etiqueta de evidencia y una fuente numerada.

> General information, not medical advice. · Información general, no un consejo médico.

## What the page does

- **Phase calculator.** The reader enters the first day of their last period, cycle length (21–35 days) and days of bleeding (2–8). The page estimates the current cycle day and phase, the next period date, and shows short advice for today.
- **Cycle explorer.** One selected day drives everything: drag the marker round the wheel, tap a phase, use the slider or step buttons, or drag across the hormone chart. The "what to expect" panel, an "Inside your body" diagram (ovary and womb lining), the hormone chart and the open phase tab all follow. With dates entered, other days show their expected calendar date and a "Back to today" button appears. The marker sweeps once round the wheel when it first comes into view, unless the reader prefers reduced motion.
- **Myth or fact? game.** Ten cards dealt at random from a pool of 16 (8 myths, 8 facts, 4 to 6 myths per game). The reader taps or swipes; each answer reveals the verdict, a short explanation with numbered sources and the evidence label behind the answer. Score, streak and a recap close the game. Nothing is stored.
- **Infographics.** "The short version" opens each finding with its headline figure drawn as a small graphic (a 100-dot grid for PMDD, one square per study for the meta-analyses, the 21–35-day range). A unit chart counts every tip on the page by evidence label.
- **Four phase guides, as tabs.** Menstrual, follicular, around ovulation and luteal (with the premenstrual week flagged). Each has what is happening, how you may feel, and nutrition, exercise and productivity advice. Links such as `#phase-luteal` open the right tab; printing shows all four.
- **Evidence labels.** Strong, moderate or limited, shown as dots and words.
- **Safety content.** When the guide does not apply, when to see a health professional, and what to do in a crisis.
- **Language switch.** English and Spanish (neutral Latin American, informal "tú"). The language follows `?lang=es` or `?lang=en`, then a saved choice, then the browser language.

## Run it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

### Publish with GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Save. The site appears at `https://<user>.github.io/<repository>/` after a minute or two.

GitHub Pages needs a public repository on the free plan. A site published from a private repository on a paid plan is still public.

## Structure

```text
index.html                 Page shell: header, calculator form, empty section containers
assets/css/styles.css      All styles; light and dark themes from prefers-color-scheme or data-theme
assets/js/cycle.js         Phase estimation, schematic hormone curves and anatomy states (pure functions)
assets/js/quiz.js          Game deck logic: seeded shuffle, balanced deal, scoring (pure functions)
assets/js/content.js       Every English/Spanish string, the advice, the game cards and the source list
assets/js/ui.js            Shared DOM, language, citation, icon, emblem and chip helpers
assets/js/explorer.js      Wheel, slider, legend, "what to expect" panel, body diagram and hormone chart
assets/js/game.js          "Myth or fact?" game
assets/js/infographics.js  Figure tiles and the evidence unit chart
assets/js/app.js           Page set-up: language, form, phase tabs and rendering order
assets/img/favicon.svg     Icon
tests/cycle.test.js        Unit tests for the cycle and anatomy model
tests/quiz.test.js         Unit tests for dealing and scoring
tests/content.test.js      Checks on translations, evidence labels, sources, game cards and figures
tests/e2e/browser.e2e.js   Browser checks of the interactive parts (optional, needs Playwright)
```

Scripts load in that order as classic scripts, so the page still opens straight from disk.

## How the estimate works

`assets/js/cycle.js` places ovulation 14 days before the next expected period, shows one day either side as the ovulatory window, and flags the last 7 days as the premenstrual week. For a 28-day cycle with 5 days of bleeding this gives days 1–5 menstrual, 6–12 follicular, 13–15 around ovulation and 16–28 luteal.

This is a calendar estimate. Ovulation timing varies between people and between cycles, so the page says the result is not a measurement and must not be used to prevent or plan a pregnancy.

## Evidence policy

- Every factual claim in `content.js` lists the ids of its sources; every recommendation has an evidence level.
- **Strong**: consistent research findings, or guidelines built on them. **Moderate**: supported by reviews or health service advice, but effects are small, studies are low quality or results conflict. **Limited**: popular or plausible, with little direct research or no clear effect found.
- Advice rated strong or moderate must cite a source. `npm test` fails if a source id is unknown, a source is never cited, a translation is missing, or the two languages use different placeholders.
- The 26 sources are 13 reviews, meta-analyses and guidelines, 3 single studies and 10 NHS guidance pages. Journal sources carry DOIs.
- **Game cards** use only findings the 26 sources already back; none adds a new source. On a card, the label rates the evidence behind the *answer*, not the claim, so a myth is not automatically "limited". Every card must cite at least one source.
- **Infographics** are drawn from `content.js`: the figures are the numbers in the finding texts, and the evidence chart counts the labels on the page. A test checks that the chart's takeaway ("most phase tips are moderate or limited; no everyday basic is limited") still matches the labels.

### Limits to keep in mind

- Bibliographic details and headline findings of each source were checked against publisher, PubMed and repository records in November 2026. Full texts were not all read, and NHS wording was checked through search results because the pages could not be fetched directly from the build environment. Re-check before relying on any single figure.
- Guidance comes mostly from the UK National Health Service. Thresholds for seeking care can differ in other health systems.
- The hormone chart is a schematic. Its curves are illustrative shapes, not data. The "Inside your body" diagram is too: follicle, egg, empty follicle and lining sizes follow the same model, and the empty follicle tracks the schematic progesterone curve. Its labels (follicle, lining building up and thickest after ovulation) rest on StatPearls and NHS physiology.
- The PMDD figure (about 2 to 3 in 100) is now a headline graphic, so check it against Reilly et al. (2024) before publishing: their pooled estimate depends on how the diagnosis was confirmed.
- The four-phase view is a simplification of a two-phase cycle, and it does not describe people using hormonal contraception or those with irregular cycles.
- The content has not been reviewed by a clinician.

## Privacy

- Dates are stored only if the reader ticks "Remember this on this device", and then only in that browser's `localStorage`. "Forget my data" removes them.
- The page makes no network requests beyond its own files: no analytics, fonts, CDNs or cookies. A Content-Security-Policy in `index.html` enforces this.

## Accessibility

- Semantic landmarks, a skip link, labelled form fields with linked error messages, and a live region that announces the result.
- The wheel is a pointer shortcut; the labelled range slider (with a spoken value such as "Day 21 of 28: Luteal phase"), the step buttons, the legend buttons and the chart's arrow keys do the same job from the keyboard. On touch screens only the marker drags, so a finger on the ring still scrolls the page.
- The phase tabs follow the ARIA tabs pattern (arrow keys, Home, End). The game moves focus to each new claim and each result, announces results in a live region, and never relies on swiping: Myth and Fact are buttons.
- Evidence labels, phases, chart series, game results and evidence squares are never identified by colour alone; each has words, icons or dots, and the chart has a table alternative.
- Phase and chart colours were checked in both themes for contrast against the surface (at least 3:1) and for separation under simulated protanopia and deuteranopia. In November 2026 axe-core 4.10.2 found no WCAG 2.2 A or AA violations in light and dark themes, at desktop and phone widths, in every game stage and in Spanish.
- Respects `prefers-color-scheme` and `prefers-reduced-motion`; every animation stops within 4 seconds.

## Tests

```bash
npm test
```

Uses Node's built-in test runner (Node 18 or later). No packages are installed.

Browser checks of the explorer, tabs, game and language switch are separate, because they need Playwright:

```bash
npm install --no-save playwright && npx playwright install chromium
```

```bash
npm run test:e2e
```

The browser checks are skipped when Playwright is not installed.

## Editing the content

All text lives in `assets/js/content.js` as English/Spanish pairs made with `t(english, spanish)`. To add a recommendation, add an item with `text`, `evidence` and `sources` to the right phase and category, add any new source to the `sources` list with a DOI or URL, and run `npm test`.

To add a game card, add an item to `quiz.cards` with an `id`, `answer` (`'myth'` or `'fact'`), `claim`, `explanation`, `evidence` and at least one source. Keep the pool balanced: the tests expect 8 myths and 8 facts, so change that count in `tests/content.test.js` deliberately if the pool grows.

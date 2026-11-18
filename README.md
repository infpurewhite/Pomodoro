# In Phase · En fase

A bilingual (English / Spanish) web page that explains the menstrual cycle phase by phase: what the hormones are doing, how mood can change, and what the research says about nutrition, exercise and productivity in each phase. Every recommendation carries an evidence label and a numbered source.

Una página web bilingüe (español / inglés) que explica el ciclo menstrual fase por fase: qué hacen las hormonas, cómo puede cambiar el ánimo y qué dice la investigación sobre alimentación, ejercicio y productividad en cada fase. Cada recomendación lleva una etiqueta de evidencia y una fuente numerada.

> General information, not medical advice. · Información general, no un consejo médico.

## What the page does

- **Phase calculator.** The reader enters the first day of their last period, cycle length (21–35 days) and days of bleeding (2–8). The page estimates the current cycle day and phase, the next period date, and shows short advice for today.
- **Cycle wheel and hormone chart.** A ring of the four phases with a marker for today, and an illustrative chart of relative oestrogen and progesterone levels with a hover and keyboard read-out and a table alternative.
- **Day explorer.** A slider and play button under the chart step through the cycle day by day, showing the phase, its illustration and the hormone trend (low, rising, high, steady or falling).
- **Phase illustrations.** Inline SVG pictures for each phase (drop, sprout, egg, moon) in the wheel, the phase cards and the phase menu; clicking a wheel segment or legend entry jumps to that phase.
- **Your phase first.** Once dates are entered, the phases section shows only the reader's current phase; the other three appear as cards that open their full guidance in a window (`<dialog>`). Before dates are entered, all four phases are shown on the page.
- **Four phase guides.** Menstrual, follicular, around ovulation and luteal (with the premenstrual week flagged). Each has what is happening, how you may feel, and nutrition, exercise and productivity advice.
- **Evidence labels.** Strong, moderate or limited, shown as dots and words. A "short version" section states what research does and does not support.
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
index.html               Page shell: header, calculator form, empty section containers
assets/css/styles.css    All styles; light and dark themes from prefers-color-scheme
assets/js/cycle.js       Phase estimation and schematic hormone curves (pure functions)
assets/js/content.js     Every English/Spanish string, the advice and the source list
assets/js/app.js         Rendering, language switching, form handling, wheel and chart
assets/img/favicon.svg   Icon
tests/cycle.test.js      Unit tests for the cycle model
tests/content.test.js    Checks on translations, evidence labels and sources
```

## How the estimate works

`assets/js/cycle.js` places ovulation 14 days before the next expected period, shows one day either side as the ovulatory window, and flags the last 7 days as the premenstrual week. For a 28-day cycle with 5 days of bleeding this gives days 1–5 menstrual, 6–12 follicular, 13–15 around ovulation and 16–28 luteal.

This is a calendar estimate. Ovulation timing varies between people and between cycles, so the page says the result is not a measurement and must not be used to prevent or plan a pregnancy.

## Evidence policy

- Every factual claim in `content.js` lists the ids of its sources; every recommendation has an evidence level.
- **Strong**: consistent research findings, or guidelines built on them. **Moderate**: supported by reviews or health service advice, but effects are small, studies are low quality or results conflict. **Limited**: popular or plausible, with little direct research or no clear effect found.
- Advice rated strong or moderate must cite a source. `npm test` fails if a source id is unknown, a source is never cited, a translation is missing, or the two languages use different placeholders.
- The 26 sources are 13 reviews, meta-analyses and guidelines, 3 single studies and 10 NHS guidance pages. Journal sources carry DOIs.

### Limits to keep in mind

- Bibliographic details and headline findings of each source were checked against publisher, PubMed and repository records in November 2026. Full texts were not all read, and NHS wording was checked through search results because the pages could not be fetched directly from the build environment. Re-check before relying on any single figure.
- Guidance comes mostly from the UK National Health Service. Thresholds for seeking care can differ in other health systems.
- The hormone chart is a schematic. Its curves are illustrative shapes, not data.
- The four-phase view is a simplification of a two-phase cycle, and it does not describe people using hormonal contraception or those with irregular cycles.
- The content has not been reviewed by a clinician.

## Privacy

- Dates are stored only if the reader ticks "Remember this on this device", and then only in that browser's `localStorage`. "Forget my data" removes them.
- The page makes no network requests beyond its own files: no analytics, fonts, CDNs or cookies. A Content-Security-Policy in `index.html` enforces this.

## Accessibility

- Semantic landmarks, a skip link, labelled form fields with linked error messages, and a live region that announces the result.
- Evidence labels, phases and chart series are never identified by colour alone; each has a text label, and the chart has a table alternative.
- Phase and chart colours were checked in both themes for contrast against the surface (at least 3:1) and for separation under simulated protanopia and deuteranopia.
- Respects `prefers-color-scheme` and `prefers-reduced-motion`.

## Tests

```bash
npm test
```

Uses Node's built-in test runner (Node 18 or later). No packages are installed.

## Editing the content

All text lives in `assets/js/content.js` as English/Spanish pairs made with `t(english, spanish)`. To add a recommendation, add an item with `text`, `evidence` and `sources` to the right phase and category, add any new source to the `sources` list with a DOI or URL, and run `npm test`.

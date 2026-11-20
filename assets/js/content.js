/**
 * All reader-facing text, in English and Spanish, plus the source list.
 *
 * Editing rules:
 *   - every string is a pair made with t(english, spanish);
 *   - every factual claim lists the ids of the sources that support it;
 *   - every recommendation carries an evidence level: 'strong', 'moderate' or 'limited';
 *   - `npm test` checks that pairs are complete and that source ids resolve.
 *
 * Loaded as a classic script in the browser (exposes `window.CONTENT`) and as a
 * CommonJS module in the Node test suite.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.CONTENT = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** Build an English/Spanish pair. */
  function t(en, es) {
    return { en: en, es: es };
  }

  var LANGUAGES = ['en', 'es'];
  var EVIDENCE_LEVELS = ['strong', 'moderate', 'limited'];

  /* ------------------------------------------------------------------ */
  /* Interface strings                                                   */
  /* ------------------------------------------------------------------ */

  var ui = {
    'meta.title': t(
      'In Phase · Understand your cycle, phase by phase',
      'En fase · Entiende tu ciclo, fase a fase'
    ),
    'meta.description': t(
      'A plain-language guide to the menstrual cycle in English and Spanish: what your hormones are doing, how mood can change, and what the evidence says about nutrition, exercise and productivity in each phase.',
      'Una guía clara sobre el ciclo menstrual, en español e inglés: qué hacen tus hormonas, cómo puede cambiar el ánimo y qué dice la evidencia sobre alimentación, ejercicio y productividad en cada fase.'
    ),
    'site.name': t('In Phase', 'En fase'),
    skip: t('Skip to content', 'Saltar al contenido'),
    'nav.label': t('Sections', 'Secciones'),
    'nav.today': t('Your cycle today', 'Tu ciclo hoy'),
    'nav.hormones': t('Hormones', 'Hormonas'),
    'nav.quiz': t('Myth or fact?', '¿Mito o realidad?'),
    'nav.phases': t('Phases', 'Fases'),
    'nav.help': t('When to get help', 'Cuándo pedir ayuda'),
    'nav.sources': t('Sources', 'Fuentes'),
    'lang.label': t('Language', 'Idioma'),

    'hero.eyebrow': t(
      'A plain-language guide with evidence labels',
      'Una guía clara, con etiquetas de evidencia'
    ),
    'hero.title': t(
      'Understand your cycle, phase by phase',
      'Entiende tu ciclo, fase a fase'
    ),
    'hero.lead': t(
      'What your hormones are doing, how that can affect your mood and energy, and what is worth trying for food, movement and work in each phase. Every recommendation says how strong the research behind it is.',
      'Qué hacen tus hormonas, cómo pueden influir en tu ánimo y tu energía, y qué vale la pena probar en alimentación, movimiento y trabajo en cada fase. Cada recomendación indica qué tan sólida es la investigación que la respalda.'
    ),
    'hero.ctaGame': t('Myth or fact? Take the 2-minute test', '¿Mito o realidad? Haz la prueba de 2 minutos'),

    'tool.title': t('Where are you today?', '¿En qué fase estás hoy?'),
    'tool.lastStart': t('First day of your last period', 'Primer día de tu último periodo'),
    'tool.cycleLength': t('Cycle length (days)', 'Duración del ciclo (días)'),
    'tool.cycleHint': t(
      'From the first day of one period to the day before the next. Not sure? Use 28.',
      'Desde el primer día de un periodo hasta el día anterior al siguiente. ¿No lo sabes? Usa 28.'
    ),
    'tool.periodLength': t('Days of bleeding', 'Días de sangrado'),
    'tool.remember': t(
      'Remember this on this device',
      'Recordar estos datos en este dispositivo'
    ),
    'tool.submit': t('Show my phase', 'Ver mi fase'),
    'tool.forget': t('Forget my data', 'Borrar mis datos'),
    'tool.privacy': t(
      'Your dates never leave this browser. No account, no tracking, no cookies.',
      'Tus fechas nunca salen de este navegador. Sin cuenta, sin rastreo, sin cookies.'
    ),

    'err.date-required': t(
      'Enter the first day of your last period.',
      'Ingresa el primer día de tu último periodo.'
    ),
    'err.date-invalid': t('Enter a valid date.', 'Ingresa una fecha válida.'),
    'err.date-future': t(
      'That date is in the future. Enter today or an earlier date.',
      'Esa fecha está en el futuro. Ingresa la fecha de hoy o una anterior.'
    ),
    'err.cycle-range': t(
      'Enter a whole number from 21 to 35. Outside that range a calendar estimate is not reliable; see “If this guide does not fit you”.',
      'Ingresa un número entero entre 21 y 35. Fuera de ese rango la estimación por calendario no es confiable; consulta «Si esta guía no encaja contigo».'
    ),
    'err.period-range': t(
      'Enter a whole number from 2 to 8.',
      'Ingresa un número entero entre 2 y 8.'
    ),

    'result.example': t(
      'Example: a 28-day cycle with 5 days of bleeding',
      'Ejemplo: un ciclo de 28 días con 5 días de sangrado'
    ),
    'result.examplePrompt': t(
      'Enter your dates to see where you are today.',
      'Ingresa tus fechas para ver en qué punto estás hoy.'
    ),
    'result.yours': t('Your cycle today', 'Tu ciclo hoy'),
    'result.dayOf': t('Day {day} of {length}', 'Día {day} de {length}'),
    'result.estimated': t('estimated', 'estimación'),
    'result.next': t(
      'Next period expected in about {count} ({date}).',
      'Tu próximo periodo llegaría en unos {count} ({date}).'
    ),
    'unit.day.one': t('1 day', '1 día'),
    'unit.day.other': t('{n} days', '{n} días'),
    'result.projected': t(
      'The date you entered is more than one cycle old, so this assumes your periods have arrived on schedule since then. Update the date when your next period starts.',
      'La fecha que ingresaste es de hace más de un ciclo, así que esto supone que tus periodos llegaron puntuales desde entonces. Actualiza la fecha cuando empiece tu próximo periodo.'
    ),
    'result.todayTitle': t('What to expect today', 'Qué esperar hoy'),
    'result.readMore': t('Read the full section', 'Leer la sección completa'),
    'result.status': t(
      'Day {day} of {length}. {phase}, estimated. Next period expected in about {count}.',
      'Día {day} de {length}. {phase}, estimación. Tu próximo periodo llegaría en unos {count}.'
    ),
    'result.cleared': t(
      'Your data has been removed from this device.',
      'Tus datos se borraron de este dispositivo.'
    ),

    'cat.mood': t('Mood', 'Ánimo'),
    'cat.nutrition': t('Nutrition', 'Alimentación'),
    'cat.exercise': t('Exercise', 'Ejercicio'),
    'cat.productivity': t('Productivity', 'Productividad'),

    'wheel.aria': t(
      'A {length}-day cycle shown as a ring divided into phases.',
      'Un ciclo de {length} días representado como un anillo dividido en fases.'
    ),
    'wheel.ariaToday': t('Today is day {day}.', 'Hoy es el día {day}.'),
    'wheel.ariaSelected': t('Day {day} is selected.', 'Está seleccionado el día {day}.'),
    'wheel.day': t('Day', 'Día'),
    'wheel.of': t('of {length}', 'de {length}'),
    'wheel.today': t('Today', 'Hoy'),

    'explore.slider': t('Explore the cycle, day by day', 'Recorre el ciclo, día a día'),
    'explore.hint': t(
      'Drag the dot round the ring, tap a phase or use the slider.',
      'Arrastra el punto por el anillo, toca una fase o usa el control deslizante.'
    ),
    'explore.prev': t('Previous day', 'Día anterior'),
    'explore.next': t('Next day', 'Día siguiente'),
    'explore.backToday': t('Back to today', 'Volver a hoy'),
    'explore.valuetext': t('Day {day} of {length}: {phase}', 'Día {day} de {length}: {phase}'),
    'explore.valuetextToday': t(
      'Day {day} of {length}: {phase}, today',
      'Día {day} de {length}: {phase}, hoy'
    ),
    'explore.dayTitle': t('What to expect on day {day}', 'Qué esperar el día {day}'),
    'explore.expected': t('Expected around {date}.', 'Previsto alrededor del {date}.'),

    'body.title': t('Inside your body', 'Dentro de tu cuerpo'),
    'body.ovary': t('Ovary', 'Ovario'),
    'body.womb': t('Womb lining', 'Revestimiento del útero'),
    'body.day': t('Day {day} · {phase}', 'Día {day} · {phase}'),
    'legend.premenstrual': t('Premenstrual week', 'Semana premenstrual'),
    'days.range': t('Days {start}–{end}', 'Días {start}–{end}'),
    'days.single': t('Day {start}', 'Día {start}'),
    'days.none': t(
      'Not shown separately for this cycle length',
      'No se muestra por separado en un ciclo de esta duración'
    ),

    'hormones.title': t('What your hormones are doing', 'Qué hacen tus hormonas'),
    'chart.caption': t(
      'Illustrative sketch of relative hormone levels. It is not to scale and is not a measurement of your own hormones.',
      'Esquema ilustrativo de los niveles relativos de hormonas. No está a escala ni es una medición de tus propias hormonas.'
    ),
    'chart.aria': t(
      'Line chart of relative oestrogen and progesterone levels across the cycle. Oestrogen peaks just before ovulation and progesterone peaks in the second half. Use the left and right arrow keys, or drag across the chart, to move through the days.',
      'Gráfico de líneas de los niveles relativos de estrógeno y progesterona a lo largo del ciclo. El estrógeno alcanza su máximo justo antes de la ovulación y la progesterona, en la segunda mitad. Usa las flechas izquierda y derecha, o arrastra sobre el gráfico, para recorrer los días.'
    ),
    'chart.oestrogen': t('Oestrogen', 'Estrógeno'),
    'chart.progesterone': t('Progesterone', 'Progesterona'),
    'chart.ovulation': t('ovulation (estimated)', 'ovulación (estimada)'),
    'chart.today': t('Today', 'Hoy'),
    'chart.axis': t('Cycle day', 'Día del ciclo'),
    'chart.day': t('Day {day}', 'Día {day}'),
    'chart.tableSummary': t('Show this chart as a table', 'Ver este gráfico como tabla'),
    'chart.tablePhase': t('Phase', 'Fase'),
    'level.low': t('low', 'nivel bajo'),
    'level.rising': t('rising', 'subiendo'),
    'level.high': t('high', 'nivel alto'),
    'level.falling': t('falling', 'bajando'),

    'evidence.title': t('The short version', 'La versión corta'),
    'evidence.intro': t(
      'Much online advice about “syncing” food, training and work with your cycle goes further than the research does. This is what studies support so far.',
      'Muchos consejos en internet sobre «sincronizar» la comida, el entrenamiento y el trabajo con tu ciclo van más lejos que la investigación. Esto es lo que los estudios respaldan hasta ahora.'
    ),
    'key.title': t('How to read the labels', 'Cómo leer las etiquetas'),
    'key.intro': t(
      'Each recommendation below carries one of three labels.',
      'Cada recomendación de esta guía lleva una de estas tres etiquetas.'
    ),

    'stat.unit.country': t('Each dot is one country', 'Cada punto es un país'),
    'stat.unit.woman': t('Each dot is one woman in 100', 'Cada punto es una mujer de cada 100'),
    'stat.unit.study': t('Each square is one study', 'Cada cuadrado es un estudio'),
    'stat.average': t('average', 'promedio'),

    'strength.title': t(
      'How strong is the advice on this page?',
      '¿Qué tan sólidos son los consejos de esta página?'
    ),
    'strength.intro': t(
      'Every tip in the four phases and in the everyday basics, counted by its evidence label. Each square is one tip.',
      'Todos los consejos de las cuatro fases y de lo básico, contados según su etiqueta de evidencia. Cada cuadrado es un consejo.'
    ),
    'strength.basics': t('Everyday basics', 'Lo básico'),
    'strength.tips': t('{n} tips', '{n} consejos'),
    'strength.row': t(
      '{name}: {strong} strong, {moderate} moderate and {limited} limited, out of {total} tips.',
      '{name}: {strong} con evidencia sólida, {moderate} con evidencia moderada y {limited} con evidencia limitada, de {total} consejos.'
    ),
    'strength.takeaway': t(
      'Most phase-specific tips are rated moderate or limited. None of the everyday basics is rated limited.',
      'La mayoría de los consejos de cada fase tienen evidencia moderada o limitada. Ninguno de los consejos básicos tiene evidencia limitada.'
    ),

    'quiz.eyebrow': t('2-minute test', 'Prueba de 2 minutos'),
    'quiz.title': t('Myth or fact?', '¿Mito o realidad?'),
    'quiz.intro': t(
      'Ten claims you may have seen online. Decide which ones hold up, then see what the research says.',
      'Diez afirmaciones que quizá viste en internet. Decide cuáles se sostienen y luego mira qué dice la investigación.'
    ),
    'quiz.note': t(
      'Every answer is based on the sources listed at the end of this page.',
      'Cada respuesta se basa en las fuentes que aparecen al final de esta página.'
    ),
    'quiz.facts': t(
      '10 cards · about 2 minutes · nothing is saved',
      '10 tarjetas · unos 2 minutos · no se guarda nada'
    ),
    'quiz.start': t('Start the test', 'Empezar la prueba'),
    'quiz.myth': t('Myth', 'Mito'),
    'quiz.fact': t('Fact', 'Realidad'),
    'quiz.hint': t(
      'Swipe left for myth and right for fact, or use the buttons.',
      'Desliza a la izquierda para mito y a la derecha para realidad, o usa los botones.'
    ),
    'quiz.claim': t('Claim {n} of {total}', 'Afirmación {n} de {total}'),
    'quiz.score': t('{correct} correct', '{correct} correctas'),
    'quiz.streak': t('{count} in a row', '{count} seguidas'),
    'quiz.correct': t('Correct', 'Correcto'),
    'quiz.incorrect': t('Not quite', 'No exactamente'),
    'quiz.verdict.myth': t('This is a myth.', 'Es un mito.'),
    'quiz.verdict.fact': t('This is a fact.', 'Es una realidad.'),
    'quiz.said.myth': t('You said myth', 'Dijiste mito'),
    'quiz.said.fact': t('You said fact', 'Dijiste realidad'),
    'quiz.evidence': t('Evidence behind this answer', 'Evidencia detrás de esta respuesta'),
    'quiz.next': t('Next claim', 'Siguiente afirmación'),
    'quiz.finish': t('See my result', 'Ver mi resultado'),
    'quiz.resultTitle': t('{correct} out of {total}', '{correct} de {total}'),
    'quiz.result.high': t(
      'Excellent. You can tell which claims the research supports.',
      'Excelente. Sabes distinguir qué afirmaciones respalda la investigación.'
    ),
    'quiz.result.mid': t(
      'Good. A few popular claims go further than the research does.',
      'Bien. Algunas afirmaciones populares van más lejos que la investigación.'
    ),
    'quiz.result.low': t(
      'Plenty of online advice sounds convincing. The recap shows what the research actually found.',
      'Muchos consejos de internet suenan convincentes. El resumen muestra lo que encontró la investigación.'
    ),
    'quiz.bestStreak': t('Longest streak: {count}', 'Racha más larga: {count}'),
    'quiz.recap': t('Recap', 'Resumen'),
    'quiz.again': t('Play again with new cards', 'Jugar otra vez con otras tarjetas'),

    'phases.title': t('The four phases', 'Las cuatro fases'),
    'phases.introExample': t(
      'Day numbers are for a 28-day cycle. Enter your dates above to see your own.',
      'Los días corresponden a un ciclo de 28 días. Ingresa tus fechas arriba para ver los tuyos.'
    ),
    'phases.introYours': t(
      'Day numbers are estimated from your {length}-day cycle.',
      'Los días se estiman a partir de tu ciclo de {length} días.'
    ),
    'phases.nav': t('Choose a phase', 'Elige una fase'),
    'phase.happening': t('What is happening', 'Qué está pasando'),
    'phase.feel': t('How you may feel', 'Cómo puedes sentirte'),
    'phase.here': t('You are here', 'Estás aquí'),

    'basics.title': t('The basics, whatever the phase', 'Lo básico, sea cual sea la fase'),
    'basics.intro': t(
      'These have stronger evidence behind them than any phase-specific tip, so put them in place first.',
      'Esto tiene evidencia más sólida que cualquier consejo por fase, así que empieza por aquí.'
    ),

    'fit.title': t('If this guide does not fit you', 'Si esta guía no encaja contigo'),
    'fit.intro': t(
      'The four phases describe a natural cycle of 21 to 35 days. They are a poor fit in these situations.',
      'Las cuatro fases describen un ciclo natural de 21 a 35 días. En estas situaciones no encajan bien.'
    ),

    'help.title': t(
      'When to talk to a health professional',
      'Cuándo hablar con un profesional de la salud'
    ),
    'help.intro': t(
      'Painful, heavy or distressing periods are common, but that does not mean you have to put up with them. Book an appointment if any of these apply.',
      'Los periodos dolorosos, abundantes o que te angustian son frecuentes, pero eso no significa que tengas que aguantarlos. Pide una consulta si te pasa algo de esto.'
    ),
    'help.urgentTitle': t('Get help now', 'Busca ayuda ahora'),

    'sources.title': t('Sources', 'Fuentes'),
    'sources.intro': t(
      'Sources were last checked in November 2026. Every study and review cited here was carried out in women, except the World Health Organization activity guideline, which covers all adults. Many studies did not confirm cycle phase with hormone tests, which is one reason much of the evidence is rated moderate or limited. Where studies disagree or are weak, this guide says so.',
      'Las fuentes se revisaron por última vez en noviembre de 2026. Todos los estudios y revisiones citados aquí se hicieron con mujeres, salvo la guía de actividad física de la Organización Mundial de la Salud, que abarca a todas las personas adultas. Muchos estudios no confirmaron la fase del ciclo con análisis hormonales, y esa es una de las razones por las que gran parte de la evidencia es moderada o limitada. Cuando los estudios no coinciden o son débiles, esta guía lo indica.'
    ),
    'sources.cite': t('Source {n}', 'Fuente {n}'),
    'sources.guidance': t('Health service guidance', 'Guía de servicios de salud'),
    'sources.review': t('Review or guideline', 'Revisión o guía clínica'),
    'sources.study': t('Single study', 'Estudio individual'),
    'sources.sample.women': t('Studied in women', 'Estudiado en mujeres'),
    'sources.sample.adults': t('Studied in all adults', 'Estudiado en todas las personas adultas'),

    'footer.disclaimer': t(
      'This page offers general information and is not medical advice. It does not replace a consultation with a health professional.',
      'Esta página ofrece información general y no es un consejo médico. No reemplaza la consulta con un profesional de la salud.'
    ),
    'footer.audience': t('Written for women.', 'Escrita para mujeres.'),
    'footer.privacy': t(
      'This page makes no external requests and sets no cookies.',
      'Esta página no hace solicitudes externas ni usa cookies.'
    ),
    'footer.reviewed': t('Last reviewed: November 2026', 'Última revisión: noviembre de 2026')
  };

  /* ------------------------------------------------------------------ */
  /* Evidence labels                                                     */
  /* ------------------------------------------------------------------ */

  var evidence = {
    strong: {
      label: t('Strong evidence', 'Evidencia sólida'),
      description: t(
        'Consistent research findings, or guidelines built on them.',
        'Hallazgos consistentes de la investigación, o guías clínicas basadas en ellos.'
      )
    },
    moderate: {
      label: t('Moderate evidence', 'Evidencia moderada'),
      description: t(
        'Supported by reviews or health service advice, but effects are small, studies are low quality or results conflict.',
        'Respaldada por revisiones o por consejos de los servicios de salud, pero con efectos pequeños, estudios de baja calidad o resultados contradictorios.'
      )
    },
    limited: {
      label: t('Limited evidence', 'Evidencia limitada'),
      description: t(
        'Popular or plausible, with little direct research or no clear effect found. Something to try, not a rule.',
        'Popular o plausible, con poca investigación directa o sin un efecto claro. Algo para probar, no una regla.'
      )
    }
  };

  /* ------------------------------------------------------------------ */
  /* Notes shown with the phase calculator                               */
  /* ------------------------------------------------------------------ */

  var toolNotes = {
    estimate: {
      text: t(
        'This is a calendar estimate, not a measurement. Ovulation can move by several days from one cycle to the next, so do not use this to prevent or plan a pregnancy.',
        'Es una estimación por calendario, no una medición. La ovulación puede moverse varios días de un ciclo a otro, así que no uses esto para evitar ni para buscar un embarazo.'
      ),
      sources: ['nhsFertility', 'bull2019']
    },
    longPeriod: {
      text: t(
        'Bleeding for more than 7 days is worth mentioning to a health professional.',
        'Un sangrado de más de 7 días es algo que conviene comentar con un profesional de la salud.'
      ),
      sources: ['nhsIrregular']
    }
  };

  /* ------------------------------------------------------------------ */
  /* Hormones section                                                    */
  /* ------------------------------------------------------------------ */

  var hormones = {
    paragraphs: [
      {
        text: t(
          'A cycle runs from the first day of one period to the day before the next. The average is about 28 days, and anything from 21 to 35 days is normal.',
          'Un ciclo va desde el primer día de un periodo hasta el día anterior al siguiente. El promedio ronda los 28 días, y cualquier duración entre 21 y 35 días es normal.'
        ),
        sources: ['nhsFertility']
      },
      {
        text: t(
          'Two hormones do most of the work. Oestrogen rises through the first half and leads to ovulation, the release of an egg. Progesterone takes over in the second half. If there is no pregnancy, both fall and the next period begins.',
          'Dos hormonas hacen la mayor parte del trabajo. El estrógeno sube durante la primera mitad y conduce a la ovulación, es decir, la liberación de un óvulo. La progesterona toma el relevo en la segunda mitad. Si no hay embarazo, ambas bajan y comienza el siguiente periodo.'
        ),
        sources: ['nhsFertility', 'statpearls']
      },
      {
        text: t(
          'Biologically there are two phases, follicular and luteal, divided by ovulation. This guide uses the popular four-part view because it is easier to follow. The first half is the part that varies most in length. The second half is steadier at around two weeks, although it also differs between women.',
          'Biológicamente hay dos fases, la folicular y la lútea, separadas por la ovulación. Esta guía usa la división popular en cuatro partes porque es más fácil de seguir. La primera mitad es la que más varía en duración. La segunda es más estable, de unas dos semanas, aunque también cambia entre mujeres.'
        ),
        sources: ['statpearls', 'bull2019']
      }
    ],
    table: [
      {
        phase: 'menstrual',
        oestrogen: t('Low', 'Bajo'),
        progesterone: t('Low', 'Baja')
      },
      {
        phase: 'follicular',
        oestrogen: t('Rising steadily', 'Sube de forma sostenida'),
        progesterone: t('Low', 'Baja')
      },
      {
        phase: 'ovulatory',
        oestrogen: t('Peaks just before ovulation, then dips', 'Llega a su máximo justo antes de la ovulación y luego baja'),
        progesterone: t('Starts to rise', 'Empieza a subir')
      },
      {
        phase: 'luteal',
        oestrogen: t('Rises again, then falls before the next period', 'Vuelve a subir y luego baja antes del siguiente periodo'),
        progesterone: t('Rises to its peak, then falls before the next period', 'Sube hasta su máximo y luego baja antes del siguiente periodo')
      }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* "The short version": what research supports overall                 */
  /* ------------------------------------------------------------------ */

  /**
   * Each finding has a headline figure (`stat`) drawn as a small infographic.
   * Visual kinds: 'range' (a number line), 'dots' (one dot per unit, `filled` and
   * `partial` dots highlighted), 'squares' (one square per study) and 'plate'.
   */
  var findings = [
    {
      id: 'cycle',
      icon: 'track',
      title: t('Cycle length: a wide normal range', 'Duración del ciclo: un rango normal amplio'),
      text: t(
        'The average cycle is about 28 days, and anything from 21 to 35 days is normal. The first half is the part that varies most, between women and from month to month.',
        'El ciclo promedio dura unos 28 días, y cualquier duración entre 21 y 35 días es normal. La primera mitad es la que más varía, entre mujeres y de un mes a otro.'
      ),
      sources: ['nhsFertility', 'statpearls', 'bull2019'],
      stat: {
        figure: t('21–35 days', '21–35 días'),
        caption: t('is a normal cycle length', 'es una duración normal del ciclo'),
        visual: { kind: 'range', min: 21, max: 35, mark: 28 }
      }
    },
    {
      id: 'mood',
      icon: 'mood',
      stat: {
        figure: t('3 million+', 'Más de 3 millones'),
        caption: t('women in 109 countries', 'de mujeres en 109 países'),
        visual: { kind: 'dots', count: 109, unit: 'country' }
      },
      title: t('Mood: real, and very individual', 'Ánimo: real y muy individual'),
      text: t(
        'In app records from more than 3 million women in 109 countries, most measures of mood varied more across the menstrual cycle than across the day, the week or the seasons. Yet in a review of 47 studies using daily mood diaries, 18 found no link between mood and any phase, and only 7 linked low mood to the premenstrual phase alone. A minority have symptoms severe enough to need treatment.',
        'En registros de una aplicación con más de 3 millones de mujeres de 109 países, la mayoría de las medidas del ánimo variaron más a lo largo del ciclo menstrual que a lo largo del día, de la semana o de las estaciones. Sin embargo, en una revisión de 47 estudios con diarios de ánimo, 18 no encontraron relación entre el ánimo y ninguna fase, y solo 7 relacionaron el ánimo bajo únicamente con la fase premenstrual. Una minoría tiene síntomas lo bastante intensos como para necesitar tratamiento.'
      ),
      sources: ['pierson2021', 'romans2012', 'reilly2024']
    },
    {
      id: 'pmdd',
      icon: 'care',
      title: t(
        'Severe premenstrual symptoms: real and treatable',
        'Síntomas premenstruales intensos: reales y tratables'
      ),
      text: t(
        'Roughly 2 to 3 women in every 100 have premenstrual mood symptoms severe enough to be diagnosed as premenstrual dysphoric disorder (PMDD). That range comes from studies that confirmed the diagnosis with two cycles of daily symptom ratings: 1.6% in community samples and 3.2% across all such studies. Treatments include certain antidepressants (SSRIs), some hormonal contraceptives and cognitive behavioural therapy.',
        'Aproximadamente 2 o 3 de cada 100 mujeres tienen síntomas emocionales premenstruales tan intensos que se diagnostican como trastorno disfórico premenstrual (TDPM). Ese rango proviene de estudios que confirmaron el diagnóstico con dos ciclos de registros diarios de síntomas: 1,6 % en muestras de la población general y 3,2 % en el conjunto de esos estudios. Entre los tratamientos están ciertos antidepresivos (ISRS), algunos anticonceptivos hormonales y la terapia cognitivo-conductual.'
      ),
      sources: ['reilly2024', 'nhsPmdd', 'acog2023'],
      stat: {
        figure: t('2–3 in 100', '2–3 de cada 100'),
        caption: t('women have PMDD', 'mujeres tienen TDPM'),
        visual: { kind: 'dots', count: 100, filled: 2, partial: 1, unit: 'woman' }
      }
    },
    {
      id: 'thinking',
      icon: 'productivity',
      stat: {
        figure: t('102 studies', '102 estudios'),
        caption: t('and almost 4,000 participants', 'y casi 4000 participantes'),
        visual: { kind: 'squares', count: 102, unit: 'study' }
      },
      title: t('Thinking: no measurable change', 'Capacidad mental: sin cambios medibles'),
      text: t(
        'A 2025 meta-analysis of 102 studies and almost 4,000 participants found no robust evidence that attention, executive function, creativity, or spatial or verbal ability change across the cycle. How you feel can change. What you are capable of does not appear to.',
        'Un metaanálisis de 2025 con 102 estudios y casi 4000 participantes no encontró evidencia sólida de que la atención, las funciones ejecutivas, la creatividad ni la capacidad espacial o verbal cambien a lo largo del ciclo. Puede cambiar cómo te sientes. Lo que eres capaz de hacer, al parecer, no.'
      ),
      sources: ['jang2025']
    },
    {
      id: 'exercise',
      icon: 'exercise',
      stat: {
        figure: t('78 studies', '78 estudios'),
        caption: t('on performance across the cycle', 'sobre el rendimiento a lo largo del ciclo'),
        visual: { kind: 'squares', count: 78, unit: 'study' }
      },
      title: t('Exercise: train by how you feel', 'Ejercicio: entrena según cómo te sientas'),
      text: t(
        'A meta-analysis of 78 studies found that performance may dip very slightly in the first days of the period. The evidence was low quality, and the authors concluded that no general rules can be set. A 2023 review of reviews found no clear effect of cycle phase on strength or on gains from training, and a 2024 meta-analysis of 22 studies in 433 women found only small differences in maximal strength between phases, most of which could have been due to chance.',
        'Un metaanálisis de 78 estudios encontró que el rendimiento puede bajar muy levemente en los primeros días del periodo. La evidencia era de baja calidad y los autores concluyeron que no se pueden fijar reglas generales. Una revisión de revisiones de 2023 no halló un efecto claro de la fase del ciclo sobre la fuerza ni sobre los progresos del entrenamiento, y un metaanálisis de 2024 con 22 estudios y 433 mujeres encontró solo pequeñas diferencias de fuerza máxima entre fases, la mayoría de las cuales podrían deberse al azar.'
      ),
      sources: ['mcnulty2020', 'colenso2023', 'niering2024']
    },
    {
      id: 'appetite',
      icon: 'nutrition',
      stat: {
        figure: t('≈170 kcal', '≈170 kcal'),
        caption: t(
          'more a day in the second half, on average',
          'más al día en la segunda mitad, en promedio'
        ),
        visual: { kind: 'plate' }
      },
      title: t(
        'Appetite: a little higher before your period',
        'Apetito: un poco mayor antes del periodo'
      ),
      text: t(
        'Pooled studies show women eat more in the second half of the cycle, by roughly 170 kcal a day on average. Resting metabolism may be slightly higher too: recent studies put the rise at about 30 to 120 kcal a day, small enough that it may fall within normal day-to-day variation. The studies are small and their methods are inconsistent.',
        'Los estudios combinados muestran que las mujeres comen más en la segunda mitad del ciclo, unas 170 kcal diarias más en promedio. El metabolismo en reposo también podría ser algo mayor: estudios recientes estiman el aumento en unas 30 a 120 kcal al día, tan poco que podría quedar dentro de la variación normal de un día a otro. Son estudios pequeños y con métodos poco uniformes.'
      ),
      sources: ['tucker2025', 'benton2020', 'hurtova2026']
    }
  ];

  /* ------------------------------------------------------------------ */
  /* The four phases                                                     */
  /* ------------------------------------------------------------------ */

  var phases = [
    {
      id: 'menstrual',
      name: t('Menstrual phase', 'Fase menstrual'),
      short: t('Menstrual', 'Menstrual'),
      tagline: t(
        'Your period: hormones at their lowest',
        'Tu periodo: las hormonas en su punto más bajo'
      ),
      happening: {
        text: t(
          'Day 1 is the first day of bleeding. Oestrogen and progesterone have fallen, and the lining of the womb comes away as your period, which usually lasts 2 to 7 days.',
          'El día 1 es el primer día de sangrado. El estrógeno y la progesterona han bajado, y el revestimiento del útero se desprende en forma de periodo, que suele durar de 2 a 7 días.'
        ),
        sources: ['nhsFertility']
      },
      feel: {
        text: t(
          'Cramps are common in the first days, and you may feel more tired. Heat (a heat pad, a hot water bottle or a warm bath) and gentle movement help many women. If you had premenstrual symptoms, they usually ease within a few days of bleeding starting.',
          'Los cólicos son frecuentes en los primeros días y puede que te sientas más cansada. El calor (una almohadilla térmica, una bolsa de agua caliente o un baño tibio) y el movimiento suave ayudan a muchas mujeres. Si tuviste síntomas premenstruales, suelen aliviarse a los pocos días de empezar el sangrado.'
        ),
        evidence: 'strong',
        sources: ['nhsPain', 'nhsPeriods']
      },
      nutrition: [
        {
          text: t(
            'Keep iron-rich foods in regular rotation: beans and chickpeas, dark green leafy vegetables, meat and dried fruit. Heavy periods are a very common cause of iron deficiency.',
            'Incluye con regularidad alimentos ricos en hierro: legumbres como frijoles y garbanzos, verduras de hoja verde oscura, carne y fruta deshidratada. Los periodos abundantes son una causa muy frecuente de falta de hierro.'
          ),
          evidence: 'strong',
          sources: ['nhsIron', 'munro2023']
        },
        {
          text: t(
            'Tea, coffee, milk and dairy can make iron harder to absorb. If your iron is low, avoid having them with iron-rich meals.',
            'El té, el café, la leche y los lácteos pueden dificultar la absorción del hierro. Si tienes el hierro bajo, evita tomarlos junto con las comidas ricas en hierro.'
          ),
          evidence: 'moderate',
          sources: ['nhsIron']
        },
        {
          text: t(
            'If you are often very tired and your periods are heavy, ask for a blood test before you start taking iron supplements.',
            'Si a menudo estás muy cansada y tus periodos son abundantes, pide un análisis de sangre antes de empezar a tomar suplementos de hierro.'
          ),
          evidence: 'strong',
          sources: ['nhsIron', 'munro2023']
        }
      ],
      exercise: [
        {
          text: t(
            'Movement can ease cramps: try walking, swimming, cycling, yoga or relaxation exercises. A 2024 analysis of 29 randomised trials with 1,808 participants found that every type of exercise tested reduced period pain after 8 weeks, by about 3 to 4 points on a 10-point scale. Most trials had some risk of bias, and nearly all enrolled young women aged 15 to 26.',
            'Moverte puede aliviar los cólicos: prueba caminar, nadar, andar en bicicleta, hacer yoga o ejercicios de relajación. Un análisis de 2024 con 29 ensayos aleatorizados y 1808 participantes encontró que todos los tipos de ejercicio estudiados redujeron el dolor menstrual tras 8 semanas, en unos 3 a 4 puntos en una escala de 10. La mayoría de los ensayos tenía algún riesgo de sesgo, y casi todos incluían a mujeres jóvenes de 15 a 26 años.'
          ),
          evidence: 'moderate',
          sources: ['tsai2024', 'nhsPain']
        },
        {
          text: t(
            'You do not need to skip training. On average, performance is only trivially lower in the first days of the period. Go lighter if you feel rough and train as normal if you feel fine.',
            'No hace falta que dejes de entrenar. En promedio, el rendimiento baja de forma mínima en los primeros días del periodo. Reduce la intensidad si te sientes mal y entrena con normalidad si te sientes bien.'
          ),
          evidence: 'moderate',
          sources: ['mcnulty2020']
        }
      ],
      productivity: [
        {
          text: t(
            'Your ability to think and concentrate does not measurably change during your period. What can change is comfort: pain and tiredness make the same work feel harder.',
            'Tu capacidad de pensar y concentrarte no cambia de forma medible durante el periodo. Lo que sí puede cambiar es la comodidad: con dolor y cansancio, el mismo trabajo cuesta más.'
          ),
          evidence: 'moderate',
          sources: ['jang2025']
        },
        {
          text: t(
            'If your first day or two are reliably hard, protect them where you can: fewer meetings, flexible hours, tasks that tolerate breaks. In a Dutch survey of 32,748 women, most said they had worked below their usual level during a period, and two in three wanted more flexibility.',
            'Si tu primer o segundo día suelen ser difíciles, protégelos cuando puedas: menos reuniones, horario flexible, tareas que permitan pausas. En una encuesta neerlandesa a 32 748 mujeres, la mayoría dijo haber rendido por debajo de su nivel habitual durante el periodo, y dos de cada tres querían más flexibilidad.'
          ),
          evidence: 'limited',
          sources: ['schoep2019']
        }
      ],
      today: {
        mood: t(
          'Cramps or tiredness are common. Premenstrual symptoms usually lift now.',
          'Los cólicos o el cansancio son frecuentes. Los síntomas premenstruales suelen ceder ahora.'
        ),
        nutrition: t(
          'Include iron-rich foods such as beans, leafy greens or meat.',
          'Incluye alimentos ricos en hierro, como legumbres, hojas verdes o carne.'
        ),
        exercise: t(
          'Gentle movement can ease cramps. Train as normal if you feel fine.',
          'El movimiento suave puede aliviar los cólicos. Entrena con normalidad si te sientes bien.'
        ),
        productivity: t(
          'Your thinking is unchanged. Plan around comfort if days 1 and 2 are hard.',
          'Tu capacidad mental no cambia. Organiza el día según tu comodidad si los días 1 y 2 son difíciles.'
        )
      }
    },
    {
      id: 'follicular',
      name: t('Follicular phase', 'Fase folicular'),
      short: t('Follicular', 'Folicular'),
      tagline: t(
        'After your period: oestrogen on the rise',
        'Después del periodo: el estrógeno en ascenso'
      ),
      happening: {
        text: t(
          'Once bleeding stops, oestrogen keeps rising as an egg matures in the ovary. Strictly, the follicular phase starts on day 1 and includes your period; here it means the days between bleeding and ovulation. This is the part of the cycle that varies most in length, which is why cycles differ from woman to woman and from month to month.',
          'Cuando termina el sangrado, el estrógeno sigue subiendo mientras un óvulo madura en el ovario. En rigor, la fase folicular empieza el día 1 e incluye el periodo; aquí nos referimos a los días entre el sangrado y la ovulación. Es la parte del ciclo que más varía en duración, y por eso los ciclos difieren entre mujeres y de un mes a otro.'
        ),
        sources: ['nhsFertility', 'statpearls', 'bull2019']
      },
      feel: {
        text: t(
          'Many women describe a steadier mood and more energy in these days, often because premenstrual and period symptoms have passed. Research has not shown a dependable high in this phase, so treat it as a common experience, not a guarantee.',
          'Muchas mujeres describen un ánimo más estable y más energía en estos días, a menudo porque ya pasaron los síntomas premenstruales y del periodo. La investigación no ha demostrado un «pico» confiable en esta fase, así que tómalo como una experiencia común, no como una garantía.'
        ),
        evidence: 'limited',
        sources: ['romans2012']
      },
      nutrition: [
        {
          text: t(
            'No diet is proven to suit this phase in particular. Appetite tends to be a little lower than in the second half of the cycle, so eat to your hunger and keep meals balanced.',
            'No hay una dieta demostrada para esta fase en particular. El apetito suele ser algo menor que en la segunda mitad del ciclo, así que come según tu hambre y mantén comidas equilibradas.'
          ),
          evidence: 'moderate',
          sources: ['tucker2025']
        },
        {
          text: t(
            'After a heavy period, keep up the iron-rich foods for the rest of the month.',
            'Después de un periodo abundante, mantén los alimentos ricos en hierro durante el resto del mes.'
          ),
          evidence: 'strong',
          sources: ['nhsIron']
        }
      ],
      exercise: [
        {
          text: t(
            'You may read that this is the window for heavy lifting and intense sessions. A 2023 review of reviews found no clear effect of cycle phase on strength or on gains from training, and a 2024 meta-analysis of 22 studies found only small strength differences between phases, most of which could have been due to chance. A consistent programme matters more than timing.',
            'Quizá hayas leído que esta es la ventana ideal para levantar pesado y hacer sesiones intensas. Una revisión de revisiones de 2023 no halló un efecto claro de la fase del ciclo sobre la fuerza ni sobre los progresos del entrenamiento, y un metaanálisis de 2024 con 22 estudios encontró solo pequeñas diferencias de fuerza entre fases, la mayoría de las cuales podrían deberse al azar. Importa más la constancia del programa que el momento.'
          ),
          evidence: 'moderate',
          sources: ['colenso2023', 'niering2024']
        },
        {
          text: t(
            'If you do feel more energetic, use it. This is a good time for the sessions you enjoy pushing.',
            'Si de verdad te sientes con más energía, aprovéchala. Es buen momento para las sesiones en las que te gusta exigirte.'
          ),
          evidence: 'limited',
          sources: []
        }
      ],
      productivity: [
        {
          text: t(
            'Popular advice says to schedule demanding or creative work now. Studies do not show that thinking ability changes between phases, so this is about how you feel, not what you can do.',
            'El consejo popular dice que programes ahora el trabajo exigente o creativo. Los estudios no muestran que la capacidad mental cambie entre fases, así que se trata de cómo te sientes, no de lo que puedes hacer.'
          ),
          evidence: 'limited',
          sources: ['jang2025']
        },
        {
          text: t(
            'If your own notes show this is when you feel best, it is a sensible time for work that needs sustained effort.',
            'Si tus propios registros muestran que aquí es cuando mejor te sientes, es un momento razonable para el trabajo que exige esfuerzo sostenido.'
          ),
          evidence: 'limited',
          sources: []
        }
      ],
      today: {
        mood: t(
          'Often a steadier stretch, though not for every woman.',
          'Suele ser una etapa más estable, aunque no para todas las mujeres.'
        ),
        nutrition: t(
          'No special diet needed. Eat balanced meals to your hunger.',
          'No hace falta una dieta especial. Come equilibrado y según tu hambre.'
        ),
        exercise: t(
          'Train as planned. Consistency matters more than timing.',
          'Entrena según lo planeado. La constancia importa más que el momento.'
        ),
        productivity: t(
          'If you feel sharp, use it for work that needs sustained effort.',
          'Si te sientes despejada, aprovéchalo para el trabajo que exige esfuerzo sostenido.'
        )
      }
    },
    {
      id: 'ovulatory',
      name: t('Around ovulation', 'Alrededor de la ovulación'),
      short: t('Ovulation', 'Ovulación'),
      tagline: t(
        'Mid-cycle: oestrogen peaks and an egg is released',
        'Mitad del ciclo: el estrógeno llega a su máximo y se libera un óvulo'
      ),
      happening: {
        text: t(
          'Rising oestrogen sets off a surge of luteinising hormone (LH), and an ovary releases an egg. This usually happens around 10 to 16 days before the next period, but the exact day is hard to pinpoint.',
          'El aumento del estrógeno provoca un pico de hormona luteinizante (LH), y un ovario libera un óvulo. Suele ocurrir entre 10 y 16 días antes del siguiente periodo, pero el día exacto es difícil de precisar.'
        ),
        sources: ['statpearls', 'nhsFertility']
      },
      feel: {
        text: t(
          'Some women notice a brief twinge on one or both sides of the lower tummy, or clearer, slippery discharge that looks like raw egg white. Many notice nothing. Claims of a peak in mood or confidence are common online but are not established.',
          'Algunas mujeres notan una punzada breve en uno o ambos lados del bajo vientre, o un flujo más claro y resbaladizo, parecido a la clara de huevo cruda. Muchas no notan nada. En internet abundan las afirmaciones sobre un pico de ánimo o de confianza, pero no están demostradas.'
        ),
        evidence: 'limited',
        sources: ['uhbFertility']
      },
      note: {
        text: t(
          'Pregnancy is possible in the days around ovulation. A date-based estimate like this one is not reliable enough to prevent or plan a pregnancy.',
          'El embarazo es posible en los días cercanos a la ovulación. Una estimación por fechas como esta no es lo bastante confiable para evitar ni para planificar un embarazo.'
        ),
        sources: ['nhsFertility', 'bull2019']
      },
      nutrition: [
        {
          text: t(
            'Nothing specific is proven for these days. Keep to the everyday basics further down this page.',
            'No hay nada específico demostrado para estos días. Sigue con lo básico de todos los días, que encontrarás más abajo en esta página.'
          ),
          evidence: 'limited',
          sources: []
        }
      ],
      exercise: [
        {
          text: t(
            'Train as planned. Differences in performance between phases are trivial on average, and researchers recommend going by your own response.',
            'Entrena según lo planeado. Las diferencias de rendimiento entre fases son mínimas en promedio, y los investigadores recomiendan guiarte por tu propia respuesta.'
          ),
          evidence: 'moderate',
          sources: ['mcnulty2020']
        }
      ],
      productivity: [
        {
          text: t(
            'You may see this described as the best time for presentations and negotiations. A large meta-analysis found no robust change in verbal ability or other thinking skills across the cycle.',
            'Quizá lo veas descrito como el mejor momento para presentaciones y negociaciones. Un metaanálisis amplio no encontró cambios sólidos en la capacidad verbal ni en otras habilidades mentales a lo largo del ciclo.'
          ),
          evidence: 'limited',
          sources: ['jang2025']
        }
      ],
      today: {
        mood: t(
          'Some notice a mid-cycle twinge or clearer discharge. Many notice nothing.',
          'Algunas mujeres notan una punzada a mitad de ciclo o un flujo más claro. Muchas no notan nada.'
        ),
        nutrition: t(
          'Nothing specific is proven for these days. Keep to the basics.',
          'No hay nada específico demostrado para estos días. Sigue con lo básico.'
        ),
        exercise: t(
          'Train as planned and go by how you respond.',
          'Entrena según lo planeado y guíate por cómo respondes.'
        ),
        productivity: t(
          'There is no proven peak. Schedule by your own experience.',
          'No hay un pico demostrado. Organízate según tu propia experiencia.'
        )
      }
    },
    {
      id: 'luteal',
      name: t('Luteal phase', 'Fase lútea'),
      short: t('Luteal', 'Lútea'),
      tagline: t(
        'After ovulation: progesterone takes over',
        'Después de la ovulación: la progesterona toma el relevo'
      ),
      happening: {
        text: t(
          'After ovulation the ovary produces progesterone, along with some oestrogen, for about two weeks. If there is no pregnancy, both hormones fall in the final days and the next period begins.',
          'Después de la ovulación, el ovario produce progesterona, junto con algo de estrógeno, durante unas dos semanas. Si no hay embarazo, ambas hormonas bajan en los últimos días y comienza el siguiente periodo.'
        ),
        sources: ['statpearls', 'nhsFertility']
      },
      feel: {
        text: t(
          'The first week is often uneventful. The last week is when premenstrual symptoms appear for many women: mood swings, feeling low, anxious or irritable, tiredness, bloating, headaches and poorer sleep. They usually ease once bleeding starts.',
          'La primera semana suele transcurrir sin novedades. En la última semana aparecen, para muchas mujeres, los síntomas premenstruales: cambios de humor, sentirse decaída, ansiosa o irritable, cansancio, hinchazón, dolor de cabeza y peor sueño. Suelen aliviarse cuando empieza el sangrado.'
        ),
        evidence: 'strong',
        sources: ['nhsPeriods', 'nhsPmdd', 'baker2018']
      },
      note: {
        text: t(
          'If the mood symptoms are severe (intense anxiety, anger or depression, or thoughts of suicide), it may be premenstrual dysphoric disorder (PMDD). It affects roughly 2 to 3 women in every 100 and it is treatable.',
          'Si los síntomas emocionales son intensos (ansiedad, enojo o depresión muy marcados, o pensamientos suicidas), puede tratarse del trastorno disfórico premenstrual (TDPM). Afecta aproximadamente a 2 o 3 de cada 100 mujeres y tiene tratamiento.'
        ),
        sources: ['nhsPmdd', 'reilly2024']
      },
      nutrition: [
        {
          text: t(
            'Feeling hungrier is physiological. Studies find women eat about 170 kcal more per day in this phase, and resting metabolism may be slightly higher. Plan regular, filling meals instead of fighting your appetite.',
            'Tener más hambre es fisiológico. Los estudios encuentran que en esta fase las mujeres comen unas 170 kcal más al día, y el metabolismo en reposo podría ser algo mayor. Planifica comidas regulares y saciantes en lugar de luchar contra el apetito.'
          ),
          evidence: 'moderate',
          sources: ['tucker2025', 'benton2020', 'hurtova2026']
        },
        {
          text: t(
            'For premenstrual symptoms, health services advise a balanced diet and not drinking too much alcohol.',
            'Para los síntomas premenstruales, los servicios de salud aconsejan una alimentación equilibrada y no beber demasiado alcohol.'
          ),
          evidence: 'moderate',
          sources: ['nhsPms']
        }
      ],
      exercise: [
        {
          text: t(
            'Keep moving in the premenstrual week. Regular exercise is one of the first things health services recommend for premenstrual symptoms, and yoga or meditation can help with stress.',
            'Sigue moviéndote en la semana premenstrual. El ejercicio regular es una de las primeras cosas que los servicios de salud recomiendan para los síntomas premenstruales, y el yoga o la meditación pueden ayudar con el estrés.'
          ),
          evidence: 'moderate',
          sources: ['nhsPms']
        },
        {
          text: t(
            'Strength and performance are not reliably lower in this phase. If you feel heavy or tired before your period, reduce the intensity instead of stopping.',
            'La fuerza y el rendimiento no bajan de forma constante en esta fase. Si antes del periodo te sientes pesada o cansada, reduce la intensidad en lugar de dejar de entrenar.'
          ),
          evidence: 'moderate',
          sources: ['colenso2023', 'mcnulty2020', 'niering2024']
        }
      ],
      productivity: [
        {
          text: t(
            'Protect your sleep in the last week: keep a regular bedtime and wind down earlier. Poorer sleep before and during a period is common in women with premenstrual symptoms or painful cramps; a 2023 review of 35 studies linked both with shorter, less satisfying sleep and more daytime sleepiness.',
            'Cuida tu sueño en la última semana: mantén un horario regular y empieza a relajarte más temprano. Dormir peor antes y durante el periodo es frecuente en las mujeres que tienen síntomas premenstruales o cólicos dolorosos; una revisión de 2023 con 35 estudios relacionó ambos con un sueño más corto y menos satisfactorio, y con más somnolencia durante el día.'
          ),
          evidence: 'moderate',
          sources: ['jeon2023', 'baker2018', 'nhsPms']
        },
        {
          text: t(
            'If your notes show a difficult premenstrual stretch, plan for it: bring deadlines forward, add buffer time and move the tense conversations that can wait. Your thinking ability is unchanged, but your patience and energy may not be.',
            'Si tus registros muestran una etapa premenstrual difícil, planifica en consecuencia: adelanta entregas, deja márgenes de tiempo y cambia de fecha las conversaciones tensas que puedan esperar. Tu capacidad mental no cambia, pero tu paciencia y tu energía quizá sí.'
          ),
          evidence: 'limited',
          sources: ['jang2025']
        },
        {
          text: t(
            'Keep a symptom diary for at least two cycles. It shows your real pattern and is the first thing a health professional will ask for.',
            'Lleva un diario de síntomas durante al menos dos ciclos. Muestra tu patrón real y es lo primero que te pedirá un profesional de la salud.'
          ),
          evidence: 'strong',
          sources: ['nhsPms', 'nhsPmdd']
        }
      ],
      today: {
        mood: t(
          'Often a quiet week. Symptoms, if you get them, tend to come later.',
          'Suele ser una semana tranquila. Los síntomas, si los tienes, tienden a llegar más adelante.'
        ),
        nutrition: t(
          'A bigger appetite is normal in this phase. Plan filling meals.',
          'Es normal tener más apetito en esta fase. Planifica comidas saciantes.'
        ),
        exercise: t(
          'Train as planned. Strength is not reliably lower now.',
          'Entrena según lo planeado. La fuerza no baja de forma constante en esta fase.'
        ),
        productivity: t(
          'Use these days to get ahead if your premenstrual week is usually hard.',
          'Aprovecha estos días para adelantar trabajo si tu semana premenstrual suele ser difícil.'
        )
      },
      todayPremenstrual: {
        mood: t(
          'Mood swings, irritability or low mood are common this week and usually ease when bleeding starts.',
          'Los cambios de humor, la irritabilidad o el ánimo bajo son frecuentes esta semana y suelen aliviarse cuando empieza el sangrado.'
        ),
        nutrition: t(
          'Being hungrier than usual is normal. Eat regular meals and go easy on alcohol.',
          'Tener más hambre de lo habitual es normal. Come a horarios regulares y modera el alcohol.'
        ),
        exercise: t(
          'Keep moving, at a lower intensity if you need to. It helps with premenstrual symptoms.',
          'Sigue moviéndote, con menos intensidad si lo necesitas. Ayuda con los síntomas premenstruales.'
        ),
        productivity: t(
          'Protect your sleep and leave buffer time before deadlines.',
          'Cuida tu sueño y deja margen de tiempo antes de las entregas.'
        )
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Advice that applies in every phase                                  */
  /* ------------------------------------------------------------------ */

  var basics = [
    {
      icon: 'exercise',
      title: t('Move most days', 'Muévete casi todos los días'),
      text: t(
        'Aim for 150 to 300 minutes of moderate activity a week, or 75 to 150 minutes of vigorous activity, plus regular muscle-strengthening work.',
        'Apunta a entre 150 y 300 minutos semanales de actividad moderada, o entre 75 y 150 minutos de actividad intensa, además de ejercicios regulares de fortalecimiento muscular.'
      ),
      evidence: 'strong',
      sources: ['who2020']
    },
    {
      icon: 'nutrition',
      title: t('Eat regular, balanced meals', 'Come de forma regular y equilibrada'),
      text: t(
        'Include iron-rich foods. This is the dietary advice health services give for premenstrual symptoms and for heavy periods.',
        'Incluye alimentos ricos en hierro. Es el consejo de alimentación que dan los servicios de salud para los síntomas premenstruales y para los periodos abundantes.'
      ),
      evidence: 'moderate',
      sources: ['nhsPms', 'nhsIron']
    },
    {
      icon: 'sleep',
      title: t('Keep sleep regular', 'Mantén un sueño regular'),
      text: t(
        'Getting enough sleep is part of standard advice for premenstrual symptoms, and poorer sleep is common in the days before a period for women who have them.',
        'Dormir lo suficiente forma parte del consejo habitual para los síntomas premenstruales, y dormir peor en los días previos al periodo es frecuente en las mujeres que los tienen.'
      ),
      evidence: 'moderate',
      sources: ['nhsPms', 'baker2018', 'jeon2023']
    },
    {
      icon: 'track',
      title: t('Track your own pattern', 'Registra tu propio patrón'),
      text: t(
        'Note how you feel for at least two cycles. Averages hide large differences between women, so your own record is a better guide than any chart, including the ones on this page.',
        'Anota cómo te sientes durante al menos dos ciclos. Los promedios esconden grandes diferencias entre mujeres, así que tu propio registro es mejor guía que cualquier gráfico, incluidos los de esta página.'
      ),
      evidence: 'strong',
      sources: ['nhsPms', 'mcnulty2020']
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Situations the four-phase model does not describe                   */
  /* ------------------------------------------------------------------ */

  var fit = [
    {
      title: t('Hormonal contraception', 'Anticonceptivos hormonales'),
      text: t(
        'Methods such as the combined pill, the patch and the injection work by stopping ovulation, so the hormone pattern described here does not apply. Tracking how you feel is still useful.',
        'Métodos como la píldora combinada, el parche y la inyección actúan impidiendo la ovulación, así que el patrón hormonal descrito aquí no se aplica. Aun así, registrar cómo te sientes sigue siendo útil.'
      ),
      sources: ['nhsPeriods']
    },
    {
      title: t('Irregular cycles', 'Ciclos irregulares'),
      text: t(
        'Periods count as irregular when the gap between them is less than 21 days or more than 35 days. Date-based estimates will not work well. A doctor can check for causes such as polycystic ovary syndrome (PCOS, now also called PMOS) or a thyroid problem.',
        'Los periodos se consideran irregulares cuando el intervalo entre ellos es menor de 21 días o mayor de 35. Las estimaciones por fechas no funcionarán bien. Un profesional de la salud puede buscar causas como el síndrome de ovario poliquístico (SOP) o un problema de tiroides.'
      ),
      sources: ['nhsIrregular']
    },
    {
      title: t('Puberty and the approach of menopause', 'Pubertad y cercanía de la menopausia'),
      text: t(
        'Irregular periods are common at both ends of the reproductive years, so phase estimates are less dependable then. In a 2023 study of 12,608 women, cycle length varied most in those under 20 and over 45.',
        'Los periodos irregulares son frecuentes al principio y al final de los años reproductivos, así que en esas etapas las estimaciones por fase son menos confiables. En un estudio de 2023 con 12 608 mujeres, la duración del ciclo varió más en las menores de 20 años y en las mayores de 45.'
      ),
      sources: ['nhsIrregular', 'li2023']
    },
    {
      title: t('Pregnancy and after menopause', 'Embarazo y después de la menopausia'),
      text: t(
        'There is no menstrual cycle to follow, so this guide does not apply.',
        'No hay un ciclo menstrual que seguir, así que esta guía no se aplica.'
      ),
      sources: []
    }
  ];

  /* ------------------------------------------------------------------ */
  /* When to seek care                                                   */
  /* ------------------------------------------------------------------ */

  var help = {
    items: [
      {
        text: t(
          'You need to change your pad or tampon every 1 to 2 hours, you pass clots larger than about 2.5 cm, or you bleed for more than 7 days.',
          'Necesitas cambiar la toalla sanitaria o el tampón cada 1 o 2 horas, expulsas coágulos de más de unos 2,5 cm o sangras durante más de 7 días.'
        ),
        sources: ['nhsHeavy']
      },
      {
        text: t(
          'Period pain is severe or stops you doing your usual activities, or your periods have become heavier or irregular.',
          'El dolor menstrual es intenso o te impide hacer tus actividades habituales, o tus periodos se han vuelto más abundantes o irregulares.'
        ),
        sources: ['nhsPain']
      },
      {
        text: t(
          'You bleed between periods or after sex.',
          'Sangras entre periodos o después de tener relaciones sexuales.'
        ),
        sources: ['nhsHeavy']
      },
      {
        text: t(
          'Your cycles are regularly shorter than 21 days or longer than 35 days.',
          'Tus ciclos duran habitualmente menos de 21 días o más de 35.'
        ),
        sources: ['nhsIrregular']
      },
      {
        text: t(
          'You have missed three periods in a row and a pregnancy test is negative.',
          'Te han faltado tres periodos seguidos y la prueba de embarazo es negativa.'
        ),
        sources: ['nhsMissed', 'nhsPeriods']
      },
      {
        text: t(
          'Premenstrual symptoms affect your daily life, or self-care has not helped.',
          'Los síntomas premenstruales afectan tu vida diaria, o las medidas de autocuidado no han ayudado.'
        ),
        sources: ['nhsPms']
      },
      {
        text: t(
          'You are often very tired or short of breath and your periods are heavy. Ask about a blood test for iron.',
          'A menudo estás muy cansada o te falta el aire, y tus periodos son abundantes. Pregunta por un análisis de hierro en sangre.'
        ),
        sources: ['nhsIron', 'munro2023']
      }
    ],
    urgent: {
      text: t(
        'If you have thoughts of harming yourself or ending your life, at any point in your cycle, contact your local emergency number or a crisis line straight away. Severe premenstrual mood symptoms are a recognised condition, and you deserve support.',
        'Si tienes pensamientos de hacerte daño o de quitarte la vida, en cualquier momento del ciclo, contacta de inmediato al número de emergencias de tu país o a una línea de ayuda en crisis. Los síntomas emocionales premenstruales intensos son una condición reconocida, y mereces apoyo.'
      ),
      sources: ['nhsPmdd']
    },
    treatments: {
      text: t(
        'Treatments that help with severe premenstrual symptoms include certain antidepressants (SSRIs), some hormonal contraceptives and cognitive behavioural therapy.',
        'Entre los tratamientos que ayudan con los síntomas premenstruales intensos están ciertos antidepresivos (ISRS), algunos anticonceptivos hormonales y la terapia cognitivo-conductual.'
      ),
      sources: ['nhsPmdd', 'acog2023']
    }
  };

  /* ------------------------------------------------------------------ */
  /* "Inside your body" diagram                                          */
  /* ------------------------------------------------------------------ */

  var anatomy = {
    caption: {
      text: t(
        'Simplified diagram, not to scale. It shows a typical pattern, not your own body.',
        'Diagrama simplificado, no está a escala. Muestra un patrón típico, no tu propio cuerpo.'
      ),
      sources: ['statpearls', 'nhsFertility']
    },
    phases: {
      menstrual: {
        ovary: t('Hormones are at their lowest.', 'Las hormonas están en su punto más bajo.'),
        womb: t(
          'The lining comes away: this is your period.',
          'El revestimiento se desprende: es tu periodo.'
        )
      },
      follicular: {
        ovary: t(
          'An egg matures in a follicle, and oestrogen rises.',
          'Un óvulo madura dentro de un folículo y el estrógeno sube.'
        ),
        womb: t('The lining builds up again.', 'El revestimiento vuelve a engrosarse.')
      },
      ovulatory: {
        ovary: t('The follicle releases the egg.', 'El folículo libera el óvulo.'),
        womb: t('The lining is thick.', 'El revestimiento está grueso.')
      },
      luteal: {
        ovary: t(
          'The empty follicle makes progesterone. It shrinks if there is no pregnancy.',
          'El folículo vacío produce progesterona. Se reduce si no hay embarazo.'
        ),
        womb: t(
          'The lining is at its thickest. If there is no pregnancy, it comes away as the next period.',
          'El revestimiento está en su punto más grueso. Si no hay embarazo, se desprende con el siguiente periodo.'
        )
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* "Myth or fact?" game                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Claims use only findings already backed by the sources below. `evidence` rates
   * the research behind the answer, not the claim, so it does not give the answer away.
   */
  var quiz = {
    cards: [
      {
        id: 'lift-follicular',
        answer: 'myth',
        claim: t(
          'You should only lift heavy weights in your follicular phase.',
          'Solo deberías levantar pesado en tu fase folicular.'
        ),
        explanation: t(
          'A 2023 review of reviews found no clear effect of cycle phase on strength or on gains from training, and a 2024 meta-analysis of 22 studies found only small strength differences, most of which could have been due to chance. A consistent programme matters more than timing.',
          'Una revisión de revisiones de 2023 no halló un efecto claro de la fase del ciclo sobre la fuerza ni sobre los progresos del entrenamiento, y un metaanálisis de 2024 con 22 estudios encontró solo pequeñas diferencias de fuerza, la mayoría de las cuales podrían deberse al azar. Importa más la constancia del programa que el momento.'
        ),
        evidence: 'moderate',
        sources: ['colenso2023', 'niering2024']
      },
      {
        id: 'thinking-drops',
        answer: 'myth',
        claim: t(
          'Your ability to think and concentrate drops before your period.',
          'Tu capacidad de pensar y concentrarte baja antes del periodo.'
        ),
        explanation: t(
          'A 2025 meta-analysis of 102 studies and almost 4,000 participants found no robust change in attention, executive function, creativity, or spatial or verbal ability across the cycle. How you feel can change; what you are capable of does not appear to.',
          'Un metaanálisis de 2025 con 102 estudios y casi 4000 participantes no encontró cambios sólidos en la atención, las funciones ejecutivas, la creatividad ni la capacidad espacial o verbal a lo largo del ciclo. Puede cambiar cómo te sientes; lo que eres capaz de hacer, al parecer, no.'
        ),
        evidence: 'moderate',
        sources: ['jang2025']
      },
      {
        id: 'ovulation-presentations',
        answer: 'myth',
        claim: t(
          'Ovulation is the best time to give presentations and negotiate.',
          'La ovulación es el mejor momento para hacer presentaciones y negociar.'
        ),
        explanation: t(
          'There is little direct research on this. A large meta-analysis found no robust change in verbal ability or other thinking skills across the cycle, so there is no sign of a mid-cycle peak.',
          'Hay poca investigación directa sobre esto. Un metaanálisis amplio no encontró cambios sólidos en la capacidad verbal ni en otras habilidades mentales a lo largo del ciclo, así que no hay señales de un pico a mitad del ciclo.'
        ),
        evidence: 'limited',
        sources: ['jang2025']
      },
      {
        id: 'calendar-contraception',
        answer: 'myth',
        claim: t(
          'A period calculator like the one on this page can tell you which days you cannot get pregnant.',
          'Una calculadora de periodos como la de esta página puede decirte en qué días no puedes quedar embarazada.'
        ),
        explanation: t(
          'Ovulation can move by several days from one cycle to the next, so a date-based estimate is not reliable enough to prevent or plan a pregnancy. Pregnancy is possible in the days around ovulation.',
          'La ovulación puede moverse varios días de un ciclo a otro, así que una estimación por fechas no es lo bastante confiable para evitar ni para planificar un embarazo. El embarazo es posible en los días cercanos a la ovulación.'
        ),
        evidence: 'strong',
        sources: ['nhsFertility', 'bull2019']
      },
      {
        id: 'always-28',
        answer: 'myth',
        claim: t('A normal cycle always lasts 28 days.', 'Un ciclo normal siempre dura 28 días.'),
        explanation: t(
          'About 28 days is the average, but anything from 21 to 35 days is normal. The first half of the cycle is the part that varies most.',
          'Unos 28 días es el promedio, pero cualquier duración entre 21 y 35 días es normal. La primera mitad del ciclo es la que más varía.'
        ),
        evidence: 'strong',
        sources: ['nhsFertility', 'statpearls', 'bull2019']
      },
      {
        id: 'same-mood-pattern',
        answer: 'myth',
        claim: t(
          'Every woman goes through the same mood pattern across the cycle.',
          'Todas las mujeres tienen el mismo patrón de ánimo a lo largo del ciclo.'
        ),
        explanation: t(
          'Mood does vary across the cycle on average, but a review of 47 studies using daily mood diaries found no clear evidence of one premenstrual mood pattern in women in general. Your own record is the best guide.',
          'En promedio, el ánimo sí varía a lo largo del ciclo, pero una revisión de 47 estudios con diarios de ánimo no encontró evidencia clara de un único patrón premenstrual en las mujeres en general. Tu propio registro es la mejor guía.'
        ),
        evidence: 'moderate',
        sources: ['pierson2021', 'romans2012']
      },
      {
        id: 'appetite-willpower',
        answer: 'myth',
        claim: t(
          'Feeling hungrier before your period just means a lack of willpower.',
          'Tener más hambre antes del periodo es solo falta de fuerza de voluntad.'
        ),
        explanation: t(
          'Feeling hungrier is physiological. Pooled studies find women eat about 170 kcal more a day in the second half of the cycle, and resting metabolism may be slightly higher. Plan regular, filling meals.',
          'Tener más hambre es fisiológico. Los estudios combinados encuentran que en la segunda mitad del ciclo las mujeres comen unas 170 kcal más al día, y el metabolismo en reposo podría ser algo mayor. Planifica comidas regulares y saciantes.'
        ),
        evidence: 'moderate',
        sources: ['tucker2025', 'benton2020', 'hurtova2026']
      },
      {
        id: 'pain-normal',
        answer: 'myth',
        claim: t(
          'Period pain that stops you doing your usual activities is just something to put up with.',
          'El dolor menstrual que te impide hacer tus actividades habituales es algo que simplemente hay que aguantar.'
        ),
        explanation: t(
          'Painful periods are common, but that does not mean you have to put up with them. Pain that is severe or stops your usual activities is a reason to see a health professional.',
          'Los periodos dolorosos son frecuentes, pero eso no significa que tengas que aguantarlos. El dolor intenso o que te impide hacer tus actividades habituales es motivo para consultar a un profesional de la salud.'
        ),
        evidence: 'strong',
        sources: ['nhsPain']
      },
      {
        id: 'exercise-cramps',
        answer: 'fact',
        claim: t('Regular exercise can ease period pain.', 'El ejercicio regular puede aliviar el dolor menstrual.'),
        explanation: t(
          'A 2024 analysis of 29 randomised trials found that every type of exercise tested, from relaxation exercises to strength training and yoga, reduced period pain after 8 weeks. Most trials had some risk of bias.',
          'Un análisis de 2024 con 29 ensayos aleatorizados encontró que todos los tipos de ejercicio estudiados, desde los ejercicios de relajación hasta el entrenamiento de fuerza y el yoga, redujeron el dolor menstrual tras 8 semanas. La mayoría de los ensayos tenía algún riesgo de sesgo.'
        ),
        evidence: 'moderate',
        sources: ['tsai2024', 'nhsPain']
      },
      {
        id: 'heavy-iron',
        answer: 'fact',
        claim: t(
          'Heavy periods are a common cause of low iron.',
          'Los periodos abundantes son una causa frecuente de falta de hierro.'
        ),
        explanation: t(
          'Heavy periods are a very common cause of iron deficiency. If you are often very tired and your periods are heavy, ask for a blood test before you start taking iron supplements.',
          'Los periodos abundantes son una causa muy frecuente de falta de hierro. Si a menudo estás muy cansada y tus periodos son abundantes, pide un análisis de sangre antes de empezar a tomar suplementos de hierro.'
        ),
        evidence: 'strong',
        sources: ['nhsIron', 'munro2023']
      },
      {
        id: 'pms-common',
        answer: 'fact',
        claim: t(
          'Mood swings, irritability or low mood in the week before a period are common.',
          'Los cambios de humor, la irritabilidad o el ánimo bajo en la semana previa al periodo son frecuentes.'
        ),
        explanation: t(
          'For many women the last week of the cycle brings premenstrual symptoms: mood swings, feeling low, anxious or irritable, tiredness, bloating, headaches and poorer sleep. They usually ease once bleeding starts.',
          'Para muchas mujeres, la última semana del ciclo trae síntomas premenstruales: cambios de humor, sentirse decaída, ansiosa o irritable, cansancio, hinchazón, dolor de cabeza y peor sueño. Suelen aliviarse cuando empieza el sangrado.'
        ),
        evidence: 'strong',
        sources: ['nhsPeriods', 'nhsPmdd']
      },
      {
        id: 'pmdd-treatable',
        answer: 'fact',
        claim: t(
          'Very severe premenstrual mood symptoms can be a treatable medical condition.',
          'Los síntomas emocionales premenstruales muy intensos pueden ser una condición médica con tratamiento.'
        ),
        explanation: t(
          'Premenstrual dysphoric disorder (PMDD) affects roughly 2 to 3 women in every 100. Treatments include certain antidepressants (SSRIs), some hormonal contraceptives and cognitive behavioural therapy.',
          'El trastorno disfórico premenstrual (TDPM) afecta aproximadamente a 2 o 3 de cada 100 mujeres. Entre los tratamientos están ciertos antidepresivos (ISRS), algunos anticonceptivos hormonales y la terapia cognitivo-conductual.'
        ),
        evidence: 'strong',
        sources: ['nhsPmdd', 'reilly2024', 'acog2023']
      },
      {
        id: 'exercise-pms',
        answer: 'fact',
        claim: t(
          'Regular exercise is one of the first things recommended for premenstrual symptoms.',
          'El ejercicio regular es una de las primeras recomendaciones para los síntomas premenstruales.'
        ),
        explanation: t(
          'Health services list regular exercise, a balanced diet, enough sleep and not drinking too much alcohol among the first steps for premenstrual symptoms. Yoga or meditation can help with stress.',
          'Los servicios de salud mencionan el ejercicio regular, una alimentación equilibrada, dormir lo suficiente y no beber demasiado alcohol entre los primeros pasos para los síntomas premenstruales. El yoga o la meditación pueden ayudar con el estrés.'
        ),
        evidence: 'moderate',
        sources: ['nhsPms']
      },
      {
        id: 'symptom-diary',
        answer: 'fact',
        claim: t(
          'Tracking your own symptoms for two cycles tells you more than any general chart.',
          'Registrar tus propios síntomas durante dos ciclos te dice más que cualquier gráfico general.'
        ),
        explanation: t(
          'Averages hide large differences between women. A symptom diary kept for at least two cycles shows your real pattern, and it is the first thing a health professional will ask for.',
          'Los promedios esconden grandes diferencias entre mujeres. Un diario de síntomas de al menos dos ciclos muestra tu patrón real, y es lo primero que te pedirá un profesional de la salud.'
        ),
        evidence: 'strong',
        sources: ['nhsPms', 'nhsPmdd']
      },
      {
        id: 'sleep-premenstrual',
        answer: 'fact',
        claim: t(
          'Sleep often gets worse in the days before a period for women with premenstrual symptoms.',
          'En las mujeres con síntomas premenstruales, el sueño suele empeorar en los días previos al periodo.'
        ),
        explanation: t(
          'Poorer sleep before and during a period is common in women with premenstrual symptoms or painful cramps. A regular bedtime and winding down earlier can help.',
          'Dormir peor antes y durante el periodo es frecuente en las mujeres que tienen síntomas premenstruales o cólicos dolorosos. Mantener un horario regular y empezar a relajarte más temprano puede ayudar.'
        ),
        evidence: 'moderate',
        sources: ['jeon2023', 'baker2018', 'nhsPms']
      },
      {
        id: 'bleeding-7-days',
        answer: 'fact',
        claim: t(
          'Bleeding for more than 7 days is worth mentioning to a health professional.',
          'Un sangrado de más de 7 días es algo que conviene comentar con un profesional de la salud.'
        ),
        explanation: t(
          'Health services list bleeding for more than 7 days, needing to change a pad or tampon every 1 to 2 hours, and passing clots larger than about 2.5 cm as reasons to book an appointment.',
          'Los servicios de salud mencionan como motivos para pedir una consulta sangrar durante más de 7 días, necesitar cambiar la toalla sanitaria o el tampón cada 1 o 2 horas y expulsar coágulos de más de unos 2,5 cm.'
        ),
        evidence: 'strong',
        sources: ['nhsHeavy']
      }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* Sources                                                             */
  /* ------------------------------------------------------------------ */

  /**
   * `kind` is 'guidance' (health service page), 'review' (systematic review,
   * meta-analysis, narrative review or clinical guideline) or 'study' (single study).
   * `sample` says who was studied: 'women' (female participants only) or 'adults'
   * (all adults). Health service pages and the physiology reference have none.
   * Citations stay in their original language.
   */
  var sources = [
    {
      id: 'nhsFertility',
      kind: 'guidance',
      cite: 'NHS. Periods and fertility in the menstrual cycle.',
      url: 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/'
    },
    {
      id: 'nhsPeriods',
      kind: 'guidance',
      cite: 'NHS. Periods.',
      url: 'https://www.nhs.uk/conditions/periods/'
    },
    {
      id: 'statpearls',
      kind: 'review',
      cite: 'StatPearls. Physiology, menstrual cycle. NCBI Bookshelf, NBK500020.',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK500020/'
    },
    {
      id: 'bull2019',
      sample: 'women',
      kind: 'study',
      cite: 'Bull et al. (2019). Real-world menstrual cycle characteristics of more than 600,000 menstrual cycles. npj Digital Medicine, 2, 83.',
      doi: '10.1038/s41746-019-0152-7'
    },
    {
      id: 'pierson2021',
      sample: 'women',
      kind: 'study',
      cite: "Pierson et al. (2021). Daily, weekly, seasonal and menstrual cycles in women's mood, behaviour and vital signs. Nature Human Behaviour, 5, 716–725.",
      doi: '10.1038/s41562-020-01046-9'
    },
    {
      id: 'romans2012',
      sample: 'women',
      kind: 'review',
      cite: 'Romans et al. (2012). Mood and the menstrual cycle: a review of prospective data studies. Gender Medicine, 9(5), 361–384.',
      doi: '10.1016/j.genm.2012.07.003'
    },
    {
      id: 'reilly2024',
      sample: 'women',
      kind: 'review',
      cite: 'Reilly et al. (2024). The prevalence of premenstrual dysphoric disorder: systematic review and meta-analysis. Journal of Affective Disorders, 349, 534–540.',
      doi: '10.1016/j.jad.2024.01.066'
    },
    {
      id: 'nhsPms',
      kind: 'guidance',
      cite: 'NHS. PMS (premenstrual syndrome).',
      url: 'https://www.nhs.uk/conditions/pre-menstrual-syndrome/'
    },
    {
      id: 'nhsPmdd',
      kind: 'guidance',
      cite: 'NHS. PMDD (premenstrual dysphoric disorder).',
      url: 'https://www.nhs.uk/conditions/pmdd-premenstrual-dysphoric-disorder/'
    },
    {
      id: 'acog2023',
      sample: 'women',
      kind: 'review',
      cite: 'American College of Obstetricians and Gynecologists (2023). Management of premenstrual disorders: ACOG Clinical Practice Guideline No. 7. Obstetrics & Gynecology, 142(6), 1516–1533.',
      doi: '10.1097/AOG.0000000000005426'
    },
    {
      id: 'mcnulty2020',
      sample: 'women',
      kind: 'review',
      cite: 'McNulty et al. (2020). The effects of menstrual cycle phase on exercise performance in eumenorrheic women: a systematic review and meta-analysis. Sports Medicine, 50(10), 1813–1827.',
      doi: '10.1007/s40279-020-01319-3'
    },
    {
      id: 'colenso2023',
      sample: 'women',
      kind: 'review',
      cite: "Colenso-Semple et al. (2023). Current evidence shows no influence of women's menstrual cycle phase on acute strength performance or adaptations to resistance exercise training. Frontiers in Sports and Active Living, 5, 1054542.",
      doi: '10.3389/fspor.2023.1054542'
    },
    {
      id: 'niering2024',
      sample: 'women',
      kind: 'review',
      cite: 'Niering et al. (2024). The influence of menstrual cycle phases on maximal strength performance in healthy female adults: a systematic review with meta-analysis. Sports, 12(1), 31.',
      doi: '10.3390/sports12010031'
    },
    {
      id: 'tsai2024',
      sample: 'women',
      kind: 'review',
      cite: 'Tsai et al. (2024). Comparative effectiveness of different exercises for reducing pain intensity in primary dysmenorrhea: a systematic review and network meta-analysis of randomized controlled trials. Sports Medicine - Open, 10, 63.',
      doi: '10.1186/s40798-024-00718-4'
    },
    {
      id: 'who2020',
      sample: 'adults',
      kind: 'review',
      cite: 'Bull et al. (2020). World Health Organization 2020 guidelines on physical activity and sedentary behaviour. British Journal of Sports Medicine, 54(24), 1451–1462.',
      doi: '10.1136/bjsports-2020-102955'
    },
    {
      id: 'tucker2025',
      sample: 'women',
      kind: 'review',
      cite: 'Tucker et al. (2025). The effect of the menstrual cycle on energy intake: a systematic review and meta-analysis. Nutrition Reviews, 83(3), e866.',
      doi: '10.1093/nutrit/nuae093'
    },
    {
      id: 'benton2020',
      sample: 'women',
      kind: 'review',
      cite: 'Benton et al. (2020). Effect of menstrual cycle on resting metabolism: a systematic review and meta-analysis. PLOS ONE, 15(7), e0236025.',
      doi: '10.1371/journal.pone.0236025'
    },
    {
      id: 'munro2023',
      sample: 'women',
      kind: 'review',
      cite: 'Munro et al. (2023). The relationship between heavy menstrual bleeding, iron deficiency, and iron deficiency anemia. American Journal of Obstetrics and Gynecology, 229(1), 1–9.',
      doi: '10.1016/j.ajog.2023.01.017'
    },
    {
      id: 'nhsIron',
      kind: 'guidance',
      cite: 'NHS. Iron deficiency anaemia.',
      url: 'https://www.nhs.uk/conditions/iron-deficiency-anaemia/'
    },
    {
      id: 'jang2025',
      sample: 'women',
      kind: 'review',
      cite: 'Jang et al. (2025). Menstrual cycle effects on cognitive performance: a meta-analysis. PLOS ONE, 20(3), e0318576.',
      doi: '10.1371/journal.pone.0318576'
    },
    {
      id: 'schoep2019',
      sample: 'women',
      kind: 'study',
      cite: 'Schoep et al. (2019). Productivity loss due to menstruation-related symptoms: a nationwide cross-sectional survey among 32 748 women. BMJ Open, 9(6), e026186.',
      doi: '10.1136/bmjopen-2018-026186'
    },
    {
      id: 'baker2018',
      sample: 'women',
      kind: 'review',
      cite: 'Baker & Lee (2018). Menstrual cycle effects on sleep. Sleep Medicine Clinics, 13(3), 283–294.',
      doi: '10.1016/j.jsmc.2018.04.002'
    },
    {
      id: 'jeon2023',
      sample: 'women',
      kind: 'review',
      cite: "Jeon & Baek (2023). Menstrual disturbances and its association with sleep disturbances: a systematic review. BMC Women's Health, 23, 470.",
      doi: '10.1186/s12905-023-02629-0'
    },
    {
      id: 'li2023',
      sample: 'women',
      kind: 'study',
      cite: "Li et al. (2023). Menstrual cycle length variation by demographic characteristics from the Apple Women's Health Study. npj Digital Medicine, 6, 100.",
      doi: '10.1038/s41746-023-00848-1'
    },
    {
      id: 'hurtova2026',
      sample: 'women',
      kind: 'review',
      cite: 'Hurtová, Gimunová & Beníčková (2026). Resting metabolic rate fluctuations across the menstrual cycle: a systematic review. Frontiers in Physiology, 17, 1778735.',
      doi: '10.3389/fphys.2026.1778735'
    },
    {
      id: 'nhsHeavy',
      kind: 'guidance',
      cite: 'NHS. Heavy periods.',
      url: 'https://www.nhs.uk/conditions/heavy-periods/'
    },
    {
      id: 'nhsPain',
      kind: 'guidance',
      cite: 'NHS. Period pain.',
      url: 'https://www.nhs.uk/symptoms/period-pain/'
    },
    {
      id: 'nhsIrregular',
      kind: 'guidance',
      cite: 'NHS. Irregular periods.',
      url: 'https://www.nhs.uk/symptoms/irregular-periods/'
    },
    {
      id: 'nhsMissed',
      kind: 'guidance',
      cite: 'NHS. Missed or late periods.',
      url: 'https://www.nhs.uk/symptoms/missed-or-late-periods/'
    },
    {
      id: 'uhbFertility',
      kind: 'guidance',
      cite: 'University Hospitals Birmingham NHS Foundation Trust. Your fertility.',
      url: 'https://www.uhb.nhs.uk/services/fertility/your-fertility.htm'
    }
  ];

  return {
    LANGUAGES: LANGUAGES,
    EVIDENCE_LEVELS: EVIDENCE_LEVELS,
    ui: ui,
    evidence: evidence,
    toolNotes: toolNotes,
    hormones: hormones,
    findings: findings,
    phases: phases,
    basics: basics,
    fit: fit,
    help: help,
    anatomy: anatomy,
    quiz: quiz,
    sources: sources
  };
});

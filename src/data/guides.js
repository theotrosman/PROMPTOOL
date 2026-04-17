const GUIDE_LIBRARY = [
  {
    id: 'estructura-prompt',
    title: 'Estructura completa de un prompt',
    summary: 'Sistema PARTE + bloque visual para construir prompts claros y accionables.',
    accent: 'indigo',
    keywords: ['estructura', 'base', 'prompt', 'orden', 'claridad', 'precision'],
    lesson: {
      title: 'Lección: qué es un prompt y cómo se organiza',
      blocks: [
        {
          heading: 'Qué es un prompt',
          body:
            'Un prompt es la instrucción, pregunta o pedido que ingresás a una IA generativa para obtener una salida (texto, imagen, resumen, etc.). Si el prompt es vago, la salida suele ser vaga.',
        },
        {
          heading: 'PARTE para no olvidarte nada',
          bullets: [
            'Persona: definí el rol (ejemplo: “actuá como director/a de fotografía”).',
            'Aim: definí el objetivo en una frase.',
            'Receptores: para quién es la salida o qué nivel debe tener.',
            'Tono: estilo y registro (sobrio, técnico, cinematográfico).',
            'Estructura: formato exacto del resultado (lista, pasos, tabla, prompt final).',
          ],
        },
        {
          heading: 'Por qué importa',
          body:
            'Las herramientas suelen carecer de contexto. Instrucciones claras y específicas aumentan la probabilidad de que el resultado sea el que buscás.',
        },
      ],
      takeaway: 'Si tu prompt falla, primero corregí PARTE antes de cambiar todo lo demás.',
      quiz: {
        question: '¿Qué parte de PARTE define el formato exacto de la salida?',
        options: ['Persona', 'Aim', 'Receptores', 'Tono', 'Estructura'],
        correctIndex: 4,
        explanation: 'Estructura define el formato deseado: lista, pasos, campos, prompt final, etc.',
      },
    },
    steps: [
      'Persona: define el rol de la IA (ejemplo: "actua como director de fotografia").',
      'Aim: define el objetivo final en una frase medible.',
      'Receptores: aclara para quien es la salida o que nivel debe tener.',
      'Tono: indica estilo verbal y visual (sobrio, cinematico, tecnico).',
      'Estructura: pide formato concreto de salida.',
      'Bloque visual: sujeto + accion + entorno + camara + luz + estilo + negativos.',
    ],
    drills: [
      'Completa PARTE para una escena de cafeteria en 6 lineas.',
      'Reescribe un prompt vago y dejalo en formato PARTE + Bloque visual.',
    ],
    checkpoints: [
      'Defini rol, objetivo y receptor',
      'Defini tono y estructura de salida',
      'Agregue bloque visual completo',
    ],
    activity: {
      type: 'order',
      title: 'Ordena la estructura',
      prompt: 'Arrastra para ordenar un prompt base (de lo general a lo especifico).',
      items: ['Sujeto', 'Accion', 'Entorno', 'Camara', 'Luz', 'Estilo', 'Negativos'],
      solution: ['Sujeto', 'Accion', 'Entorno', 'Camara', 'Luz', 'Estilo', 'Negativos'],
    },
  },
  {
    id: 'analisis-imagen',
    title: 'Como analizar una imagen para convertirla en prompt',
    summary: 'Lectura visual por capas para pasar de imagen a prompt reproducible.',
    accent: 'cyan',
    keywords: ['analizar', 'imagen', 'referencia', 'lectura', 'observar', 'deconstruir'],
    lesson: {
      title: 'Lección: la IA no “adivina” lo que no escribís',
      blocks: [
        {
          heading: 'Regla base',
          body:
            'Si no describís la luz, la cámara y la jerarquía, el modelo completa con supuestos. Para replicar una imagen, convertí lo visual en texto explícito.',
        },
        {
          heading: 'Qué mirar primero',
          bullets: [
            'Sujeto: quién/qué es y qué hace.',
            'Composición: plano, ángulo, profundidad.',
            'Luz y color: dirección, contraste, temperatura, paleta.',
          ],
        },
      ],
      takeaway: 'No copies objetos: describí relaciones visuales (qué domina, qué acompaña, qué se pierde en el fondo).',
    },
    steps: [
      'Lectura rapida: genero, emocion y punto focal en 5 segundos.',
      'Sujeto: quien aparece, que hace, que detalle lo define.',
      'Composicion: plano, angulo, profundidad y jerarquia visual.',
      'Luz y color: direccion, contraste, temperatura y paleta dominante.',
      'Traduccion: arma prompt en orden sujeto > contexto > camara > luz > estilo > negativos.',
    ],
    drills: [
      'Mira una imagen 20 segundos y completa una ficha de 8 campos.',
      'Genera 3 variantes: fiel, cinematica y minimal.',
    ],
    checkpoints: ['Identifique foco principal', 'Defini luz y paleta', 'Convierti analisis en prompt'],
    activity: {
      type: 'order',
      title: 'Ordena el analisis',
      prompt: 'Arrastra para ordenar el flujo de observacion.',
      items: ['Lectura global', 'Sujeto', 'Composicion', 'Luz y color', 'Traduccion a prompt'],
      solution: ['Lectura global', 'Sujeto', 'Composicion', 'Luz y color', 'Traduccion a prompt'],
    },
  },
  {
    id: 'tipos-prompt',
    title: 'Tipos de prompt: zero, one, few y COT',
    summary: 'Cuando usar ejemplos para guiar mejor a la IA y mejorar consistencia.',
    accent: 'violet',
    keywords: ['ejemplo', 'zero shot', 'one shot', 'few shot', 'cot', 'paso a paso'],
    lesson: {
      title: 'Lección: usar ejemplos mejora el resultado',
      blocks: [
        {
          heading: 'Por qué',
          body:
            'Un buen enfoque es incluir ejemplos (“muestras”). Los ejemplos ayudan a la herramienta a entender mejor el resultado esperado, sobre todo si querés un formato o estilo específico.',
        },
        {
          heading: 'Cuándo usar cada uno',
          bullets: [
            'Zero-shot: respuestas simples o exploración rápida.',
            'One-shot: necesitás un estilo/formato puntual (un ejemplo).',
            'Few-shot: tarea compleja o consistencia alta (varios ejemplos).',
            'COT: pedís pensar paso a paso para análisis o diagnóstico.',
          ],
        },
      ],
      takeaway: 'Subí de nivel solo si la salida no cumple: zero → one → few → COT.',
      quiz: {
        question: '¿Cuándo conviene usar few-shot?',
        options: [
          'Cuando querés inspiración general rápida',
          'Cuando necesitás consistencia alta en tareas complejas',
          'Cuando solo querés una respuesta de una frase',
          'Cuando querés evitar ejemplos',
        ],
        correctIndex: 1,
        explanation: 'Los ejemplos extra le dan más contexto y mejoran consistencia para tareas complejas.',
      },
    },
    steps: [
      'Zero-shot: usa pedido directo cuando tarea es simple.',
      'One-shot: agrega un ejemplo cuando necesitas estilo o formato fijo.',
      'Few-shot: agrega 2 o 3 ejemplos para tareas complejas.',
      'COT: pide razonamiento paso a paso para diagnostico o analisis.',
      'Evalua salida y sube de nivel solo si hace falta.',
    ],
    drills: [
      'Escribe un prompt base y crea version zero/one/few.',
      'Convierte una correccion de prompt en COT con 4 pasos.',
    ],
    checkpoints: ['Probe zero-shot', 'Probe one o few-shot', 'Use COT para mejorar'],
    activity: {
      type: 'order',
      title: 'Escala de control',
      prompt: 'Ordena de menor a mayor control sobre la salida.',
      items: ['Zero-shot', 'One-shot', 'Few-shot', 'COT (paso a paso)'],
      solution: ['Zero-shot', 'One-shot', 'Few-shot', 'COT (paso a paso)'],
    },
  },
  {
    id: 'iluminacion',
    title: 'Iluminacion',
    summary: 'Control de direccion, calidad y temperatura de luz para resultados mas precisos.',
    accent: 'amber',
    keywords: ['luz', 'ilumin', 'contraluz', 'sombras', 'temperatura'],
    steps: [
      'Elige fuente principal: natural, artificial o mixta.',
      'Marca direccion: frontal, lateral, contraluz o cenital.',
      'Define calidad: suave o dura.',
      'Define temperatura: calida, neutra o fria.',
      'Agrega luces secundarias: fill, rim o practicals.',
    ],
    drills: ['Crea 3 versiones de la misma escena cambiando solo luz.', 'Detecta y corrige contradicciones de luz en un prompt.'],
    checkpoints: ['Defini direccion', 'Defini temperatura', 'Agregue luz secundaria'],
    activity: {
      type: 'order',
      title: 'Arma un esquema de luz',
      prompt: 'Ordena el armado: primero base, despues refinamiento.',
      items: ['Fuente principal', 'Direccion', 'Calidad', 'Temperatura', 'Luz secundaria'],
      solution: ['Fuente principal', 'Direccion', 'Calidad', 'Temperatura', 'Luz secundaria'],
    },
  },
  {
    id: 'estilo',
    title: 'Estilo Artistico',
    summary: 'Crear identidad visual consistente sin mezclar estilos incompatibles.',
    accent: 'rose',
    keywords: ['estilo', 'artistico', 'render', 'fotografico', 'cinematografico'],
    steps: [
      'Elige familia visual (foto, cine, ilustracion, 3D).',
      'Define nivel de realismo (alto, medio, estilizado).',
      'Define textura (limpio, film grain, painterly).',
      'Agrega epoca o referencia visual concreta.',
      'Cierra con un bloque fijo de estilo reutilizable.',
    ],
    drills: ['Diseña un bloque de estilo fijo de 20 palabras.', 'Haz una version compatible y otra incompatible para entrenar criterio.'],
    checkpoints: ['Defini familia visual', 'Defini textura', 'Cree bloque de estilo fijo'],
    activity: {
      type: 'order',
      title: 'Bloque de estilo',
      prompt: 'Ordena el bloque para que quede consistente.',
      items: ['Familia visual', 'Realismo', 'Textura', 'Epoca', 'Bloque fijo'],
      solution: ['Familia visual', 'Realismo', 'Textura', 'Epoca', 'Bloque fijo'],
    },
  },
  {
    id: 'composicion',
    title: 'Composicion y Encuadre',
    summary: 'Orden visual para que la imagen se entienda rapido y con impacto.',
    accent: 'emerald',
    keywords: ['compos', 'encuadre', 'angulo', 'plano', 'perspectiva'],
    steps: [
      'Define foco principal y dos apoyos visuales maximo.',
      'Elige tipo de plano segun objetivo narrativo.',
      'Elige angulo de camara segun sensacion.',
      'Aplica una regla: tercios, simetria o lineas guia.',
      'Controla profundidad: primer plano, sujeto y fondo.',
    ],
    drills: ['Reescribe un prompt saturado quitando elementos redundantes.', 'Haz una escena en plano medio y luego en plano general.'],
    checkpoints: ['Defini foco', 'Defini plano y angulo', 'Elimine ruido visual'],
    activity: {
      type: 'order',
      title: 'Jerarquia visual',
      prompt: 'Ordena como construis una composicion clara.',
      items: ['Foco', 'Plano', 'Angulo', 'Regla visual', 'Profundidad'],
      solution: ['Foco', 'Plano', 'Angulo', 'Regla visual', 'Profundidad'],
    },
  },
  {
    id: 'camara-lente',
    title: 'Camara, lente y parametros visuales',
    summary: 'Uso de distancia focal y profundidad para cambiar lectura visual.',
    accent: 'slate',
    keywords: ['camara', 'lente', 'focal', 'apertura', 'depth of field', 'bokeh'],
    steps: [
      'Selecciona focal principal: 24, 35, 50 u 85 equivalente.',
      'Define profundidad: shallow o deep focus.',
      'Define nitidez: limpia o con grano.',
      'Define movimiento: statico, handheld o dolly.',
      'Verifica coherencia entre focal y tipo de plano.',
    ],
    drills: ['Crea 1 retrato en 85 y 1 escena amplia en 24.', 'Corrige un prompt con focal contradictoria.'],
    checkpoints: ['Defini focal', 'Defini profundidad', 'Revise coherencia optica'],
    activity: {
      type: 'order',
      title: 'Seteo de camara',
      prompt: 'Ordena los parametros principales.',
      items: ['Focal', 'Profundidad', 'Nitidez', 'Movimiento', 'Chequeo coherencia'],
      solution: ['Focal', 'Profundidad', 'Nitidez', 'Movimiento', 'Chequeo coherencia'],
    },
  },
  {
    id: 'color-grading',
    title: 'Color y direccion cromatica',
    summary: 'Paletas simples con intencion narrativa y buen contraste.',
    accent: 'fuchsia',
    keywords: ['color', 'paleta', 'grading', 'tono', 'saturacion', 'contraste cromatico'],
    steps: [
      'Elige emocion dominante.',
      'Define paleta de 2 a 4 colores maximo.',
      'Marca color dominante y color acento.',
      'Controla saturacion global.',
      'Ajusta contraste de luminancia.',
    ],
    drills: ['Haz una paleta de tension y otra de calma para la misma escena.', 'Reduce una paleta sobrecargada a 3 colores.'],
    checkpoints: ['Defini paleta corta', 'Defini acento', 'Alinee color con emocion'],
    activity: {
      type: 'order',
      title: 'Construye una paleta',
      prompt: 'Ordena el proceso para no perder claridad.',
      items: ['Emocion', 'Paleta 2-4', 'Dominante', 'Acento', 'Saturacion'],
      solution: ['Emocion', 'Paleta 2-4', 'Dominante', 'Acento', 'Saturacion'],
    },
  },
  {
    id: 'microdetalles',
    title: 'Micro-detalles, materiales y acabados',
    summary: 'Realismo practico con materiales, textura e imperfecciones utiles.',
    accent: 'orange',
    keywords: ['detalle', 'micro', 'textura', 'material', 'acabado', 'imperfeccion'],
    steps: [
      'Define material principal por objeto clave.',
      'Describe como responde cada material a la luz.',
      'Agrega 2 o 3 imperfecciones reales maximo.',
      'Prioriza detalle en sujeto y deja fondo mas limpio.',
      'Evita "ultra detailed" en todo al mismo tiempo.',
    ],
    drills: ['Escribe solo el bloque de materiales para una escena de cafe.', 'Quita detalle redundante y mejora legibilidad.'],
    checkpoints: ['Defini materiales', 'Agregue imperfecciones utiles', 'Mantuve foco visual'],
    activity: {
      type: 'order',
      title: 'Detalle con control',
      prompt: 'Ordena para sumar realismo sin ensuciar.',
      items: ['Materiales', 'Respuesta a luz', 'Imperfecciones', 'Prioridad sujeto', 'Fondo limpio'],
      solution: ['Materiales', 'Respuesta a luz', 'Imperfecciones', 'Prioridad sujeto', 'Fondo limpio'],
    },
  },
  {
    id: 'negativos-control',
    title: 'Negative prompt y control de errores',
    summary: 'Bloques de negativos para prevenir errores frecuentes sin romper estilo.',
    accent: 'red',
    keywords: ['negative', 'sin', 'error', 'artefacto', 'deforme', 'watermark'],
    steps: [
      'Lista 5 errores que te pasan seguido.',
      'Crea bloque base con errores universales.',
      'Agrega bloque contextual segun tipo de imagen.',
      'Recorta negativos hasta dejar 5-8 importantes.',
      'Itera una variable por intento.',
    ],
    drills: ['Construye un bloque de negativos para retrato.', 'Construye otro para producto y compara.'],
    checkpoints: ['Cree bloque base', 'Cree bloque contextual', 'Recorte negativos excesivos'],
    activity: {
      type: 'order',
      title: 'Arma tu bloque de negativos',
      prompt: 'Ordena para que sea reutilizable.',
      items: ['Lista errores', 'Bloque base', 'Bloque contextual', 'Recorte', 'Iteracion'],
      solution: ['Lista errores', 'Bloque base', 'Bloque contextual', 'Recorte', 'Iteracion'],
    },
  },
  {
    id: 'atmosfera',
    title: 'Atmosfera y ambiente narrativo',
    summary: 'Construccion de mood visual con clima, particulas y consistencia emocional.',
    accent: 'teal',
    keywords: ['atm', 'ambiente', 'clima', 'mood', 'emocion', 'atmosfera'],
    steps: [
      'Define tono emocional en una palabra.',
      'Define clima fisico (lluvia, niebla, polvo, humedad).',
      'Agrega una capa atmosferica (haze, volumetric, etc).',
      'Alinea color y luz con la emocion elegida.',
      'Evita descriptores abstractos sin evidencia visual.',
    ],
    drills: ['Escribe 2 versiones de ambiente: nostalgia y tension.', 'Corrige una escena con mood contradictorio.'],
    checkpoints: ['Defini emocion', 'Defini clima', 'Alinee color y luz'],
    activity: {
      type: 'order',
      title: 'Construye el mood',
      prompt: 'Ordena el armado del ambiente.',
      items: ['Emocion', 'Clima', 'Capa atmosferica', 'Color', 'Luz'],
      solution: ['Emocion', 'Clima', 'Capa atmosferica', 'Color', 'Luz'],
    },
  },
  {
    id: 'iteracion-debug',
    title: 'Iteracion y debugging de prompts',
    summary: 'Metodo de mejora continua: medir, ajustar y comparar sin perder control.',
    accent: 'blue',
    keywords: ['iterar', 'mejorar', 'debug', 'ajustar', 'version', 'prueba'],
    lesson: {
      title: 'Lección: es normal no acertar al primer intento',
      blocks: [
        {
          heading: 'Por qué pasa',
          body:
            'Armar prompts suele ser un proceso iterativo. A veces no obtenés el resultado buscado incluso con instrucciones claras. La clave es revisar el prompt y mejorar una cosa por vez.',
        },
        {
          heading: 'Regla práctica',
          bullets: ['No cambies todo a la vez.', 'Medí con criterios fijos.', 'Guardá versiones para comparar.'],
        },
      ],
      takeaway: 'Iteración controlada: una variable por intento.',
    },
    steps: [
      'Crea V1 base.',
      'En V2 cambia solo una variable.',
      'Puntua resultado (fidelidad, luz, estilo, limpieza).',
      'Conserva mejoras y repite.',
      'Deten iteracion cuando objetivo ya se cumple.',
    ],
    drills: ['Haz 3 iteraciones controladas sobre el mismo prompt.', 'Documenta causa y efecto de cada cambio.'],
    checkpoints: ['Hice V1', 'Hice V2 con un solo cambio', 'Compare con metrica fija'],
    activity: {
      type: 'order',
      title: 'Itera bien',
      prompt: 'Ordena el ciclo para no perderte.',
      items: ['V1', 'Un cambio', 'Puntuar', 'Conservar', 'Repetir'],
      solution: ['V1', 'Un cambio', 'Puntuar', 'Conservar', 'Repetir'],
    },
  },
  {
    id: 'evaluacion-critica',
    title: 'Evaluacion critica y uso responsable',
    summary: 'Chequeos rapidos para detectar sesgo, alucinaciones y errores facticos.',
    accent: 'lime',
    keywords: ['sesgo', 'alucinacion', 'responsable', 'etica', 'verificar', 'exactitud'],
    lesson: {
      title: 'Lección: revisar exactitud, sesgos y privacidad',
      blocks: [
        {
          heading: 'Sesgos injustos',
          body:
            'La IA se entrena con información producida por humanos, por lo que puede reflejar o amplificar sesgos. Revisá si la salida representa de forma injusta o limitada.',
        },
        {
          heading: 'Alucinaciones',
          body:
            'A veces produce resultados inexactos o engañosos. No asumas que algo es verdadero solo porque suena convincente: pedí evidencia o verificá.',
        },
        {
          heading: 'Privacidad',
          body:
            'Evitá incluir datos sensibles. Si necesitás contexto, anonimizá y pedí formatos verificables (listas, campos, criterios).',
        },
      ],
      takeaway: 'No es “aceptar o rechazar”: es revisar, ajustar el prompt y volver a intentar.',
      quiz: {
        question: 'Una “alucinación” es…',
        options: [
          'Una respuesta siempre verdadera',
          'Una respuesta inexacta o engañosa que suena convincente',
          'Un error de ortografía',
          'Un prompt demasiado largo',
        ],
        correctIndex: 1,
        explanation: 'La IA puede inventar datos o relaciones; por eso conviene verificar o pedir evidencia.',
      },
    },
    steps: [
      'Verifica exactitud basica de la salida.',
      'Busca sesgos en representacion y lenguaje.',
      'Detecta alucinaciones o afirmaciones no respaldadas.',
      'Revisa privacidad y datos sensibles.',
      'Corrige prompt para pedir evidencia o formato verificable.',
    ],
    drills: ['Revisa una salida y marca 3 riesgos.', 'Reescribe prompt para reducir alucinaciones.'],
    checkpoints: ['Valide exactitud', 'Revise sesgo', 'Revise privacidad'],
    activity: {
      type: 'order',
      title: 'Checklist responsable',
      prompt: 'Ordena los chequeos (primero verdad, despues riesgos).',
      items: ['Exactitud', 'Sesgos', 'Alucinaciones', 'Privacidad', 'Reescritura'],
      solution: ['Exactitud', 'Sesgos', 'Alucinaciones', 'Privacidad', 'Reescritura'],
    },
  },
  {
    id: 'ia-vs-no-ia',
    title: 'IA vs no IA: entender la diferencia',
    summary: 'Cómo reconocer cuándo un sistema aprende/predice vs cuando solo ejecuta reglas.',
    accent: 'slate',
    keywords: ['es ia', 'no es ia', 'reglas', 'prediccion', 'aprendizaje automatico', 'modelo', 'herramienta'],
    lesson: {
      title: 'Lección: qué es IA (y qué no)',
      blocks: [
        {
          heading: 'Idea central',
          body:
            'Las herramientas de IA usan patrones de datos para predecir y elegir acciones: no son respuestas totalmente preprogramadas. Un sistema basado en reglas ejecuta instrucciones con resultados predecibles.',
        },
        {
          heading: 'Ejemplos rápidos',
          bullets: [
            'IA: navegación que sugiere rutas con datos de tráfico; streaming que recomienda por tus preferencias.',
            'No IA: calculadora básica; riego por cronograma; corrector ortográfico simple por diccionario.',
          ],
        },
        {
          heading: 'Herramienta vs modelo',
          body:
            'La herramienta es la interfaz donde escribís prompts. El modelo es el “motor” que hace el trabajo pesado y genera la respuesta.',
        },
      ],
      takeaway: 'Si pedís algo ambiguo, el modelo completa con probabilidad: por eso la especificidad es control.',
    },
    steps: [
      'Identifica si el sistema aprende con datos o solo ejecuta reglas.',
      'Si es IA generativa, asumí incertidumbre y pedí formato verificable.',
      'Separá: interfaz (herramienta) vs motor (modelo).',
    ],
    drills: ['Reescribe un pedido ambiguo en uno verificable con estructura y criterios.', 'Convierte una consigna en campos (entrada → salida).'],
    checkpoints: ['Distinguí IA vs reglas', 'Distinguí herramienta vs modelo', 'Escribí un pedido verificable'],
    activity: {
      type: 'order',
      title: 'De ambiguo a verificable',
      prompt: 'Ordena los pasos para convertir un pedido difuso en uno controlable.',
      items: ['Definir objetivo', 'Definir formato', 'Agregar criterios', 'Agregar ejemplo', 'Verificar salida'],
      solution: ['Definir objetivo', 'Definir formato', 'Agregar criterios', 'Agregar ejemplo', 'Verificar salida'],
    },
  },
]

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const getRecommendedGuides = (improvements = [], suggestions = '') => {
  const sourceText = normalize([...(improvements || []), suggestions].join(' '))

  if (!sourceText.trim()) return []

  const scored = GUIDE_LIBRARY.map((guide) => {
    const score = guide.keywords.reduce((acc, keyword) => (sourceText.includes(normalize(keyword)) ? acc + 1 : acc), 0)
    return { id: guide.id, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map((item) => item.id).slice(0, 3)
}

export default GUIDE_LIBRARY

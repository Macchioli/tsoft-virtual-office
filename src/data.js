export const WALL_HEIGHT = 3.5
export const WALL_THICKNESS = 0.2
export const DESK_HEIGHT = 0.75

// More: la anfitriona. Su posición depende de la oficina (está en cfg.npc).
export const NPC = { id: 'more', name: 'More' }

// Nico: un compañero que charla en el pasillo (modelo 3D en public/models/nico.glb).
// Su posición está en cfg.nico de cada oficina.
export const NICO = { id: 'nico', name: 'Nico' }

// Dari: Training & Learning Head (modelo 3D en public/models/dari.glb). Sentada en su lugar (cfg.dari).
export const DARI = { id: 'dari', name: 'Dari' }

// La hoja que entrega More (solo contenido: su posición es la de su mano)
export const PAPERS = [
  {
    id: 'p1',
    title: 'Cursos obligatorios',
    body: 'Acá vas a encontrar los cursos obligatorios que tenés que completar.',
    url: 'https://example.com/cursos-obligatorios',
  },
]

export const SIGN_TEXT = 'Cursos obligatorios'

// Diálogo de More (rioplatense). Se avanza con clic / Espacio / Enter / E.
export const DIALOGUE = [
  '¡Hola! Soy More. ¡Bienvenido/a Tsofer! Te estaba esperando.',
  'Acá en Tsoft aprender es parte del día a día, y en T University tenés toda la capacitación.',
  'Para arrancar, tenés que completar los cursos obligatorios. Es lo primero que hacemos todos.',
  'Te dejé todo en una hoja. ¡Tomá, es toda tuya!',
]

// Diálogo de Nico (editalo a gusto). Al terminar, se abre el enlace a Tsoft University.
export const NICO_DIALOGUE = [
  '¡Hola! Soy Nico, Tech Learning Trainer acá en Tsoft.',
  'Te puedo dar una mano con todo lo que tenga que ver con formación: cursos, capacitaciones y cómo sacarle el jugo a las herramientas.',
  'Además, te invito a conocer Tsoft University, nuestra plataforma de e-learning, con toda la capacitación en un solo lugar.',
  'Te dejo el enlace para que entres cuando quieras. ¡Cualquier duda, me preguntás!',
]

// Tarjeta con el enlace que se abre después de hablar con Nico (usa el mismo modal que la hoja de More)
export const NICO_LINK = {
  id: 'nico-link',
  title: 'Tsoft University',
  body: 'Nuestra plataforma de e-learning. Entrá cuando quieras y explorá toda la capacitación.',
  url: 'https://university.tsoftglobal.com',
}

// Diálogo de Dari (editalo a gusto). Al terminar, se abre la tarjeta con su mail.
export const DARI_DIALOGUE = [
  '¡Hola! Soy Dari, Training & Learning Head en Tsoft.',
  'Estoy a cargo de la formación acá: cursos, capacitaciones y todo lo que tenga que ver con aprender y crecer en la empresa.',
  'Podés consultarme por cualquier tema referido a formación, sin vueltas.',
  'Te dejo mi mail para que me escribas cuando quieras. ¡Te leo!',
]

// Tarjeta con el mail de Dari (usa el mismo modal que la hoja de More y el enlace de Nico)
export const DARI_CONTACT = {
  id: 'dari-contact',
  title: 'Escribile a Dari',
  body: 'Training & Learning Head. Consultale por cualquier tema de formación: dariela.urdaneta@tsoftglobal.com',
  url: 'mailto:dariela.urdaneta@tsoftglobal.com',
}

// Si el jugador vuelve a hablarle
export const DIALOGUE_AGAIN = ['¿Se te perdió la hoja? Quedate tranquilo/a, tomá otra vez.']

// ---------------------------------------------------------------------
// Oficinas. Cada una define su tamaño, dónde arranca el jugador, sus muebles y sus colisiones.
// ---------------------------------------------------------------------

// Rincón de bienvenida contra la pared del fondo: enredadera con neón, cartel, escritorio y More
function welcome(depth) {
  const panelZ = -depth / 2 + 0.225
  return {
    panelZ,
  }
}

// Asiento de un banco: b = fila, s = lado (+1 mira hacia el fondo, -1 hacia la entrada), i = lugar
// Los NPC se sientan acá. Para cambiarlos de lugar, tocá solo estos tres números en cada oficina.
function seatOf(bench, xs, { b, s, i }) {
  return {
    key: `${b}:${s}:${i}`,
    x: bench.x + xs[i],
    z: bench.rows[b] + s * (bench.d / 2 + 0.2),
    rot: s > 0 ? Math.PI : 0, // hacia dónde mira el personaje sentado (hacia el escritorio)
  }
}
export const AR_SEATS_X = [-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9]
export const CL_SEATS_X = [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5]

const benchesOf = (b) => b.rows.map((z, i) => ({ id: `b${i}`, x: b.x, z, w: b.len, d: b.d }))
const box = (id, o, w, d) => ({ id, x: o.x, z: o.z, w, d })

// ======================= ARGENTINA =======================
const arRoom = { w: 16, d: 22 }
const arW = welcome(arRoom.d)
const arBench = { x: 1.3, len: 9.4, d: 1.5, rows: [7.0, 3.2, -0.6, -4.4] }
const arBenches = benchesOf(arBench)
// i: 0 = punta del pasillo de lockers (en el medio de la fila no se llega: los bancos tapan el paso)
const arMore = seatOf(arBench, AR_SEATS_X, { b: 3, s: 1, i: 0 })
const arNico = seatOf(arBench, AR_SEATS_X, { b: 1, s: -1, i: 0 })
const arDari = seatOf(arBench, AR_SEATS_X, { b: 2, s: 1, i: 0 })
const arStorage = [5.1, 1.3, -2.5].map((z, i) => ({ id: `s${i}`, x: arBench.x, z, w: 8, d: 0.5 }))
const arNook = {
  table: { x: -6.1, z: -9.4, w: 1.5, d: 0.8 },
  poufs: [
    { x: -7.25, z: -9.4, r: 0.3 },
    { x: -4.95, z: -9.4, r: 0.3 },
  ],
}
const arColumn = { x: 7.3, z: -2.2, r: 0.3 }
const arCubes = { x: -3.9, z: arW.panelZ + 0.55 }
const arPlants = [
  { x: 6.7, z: arW.panelZ + 0.55, s: 1.1 },
  { x: -4.55, z: -7.2, s: 0.9 },
]

const ar = {
  id: 'ar',
  name: 'Argentina',
  room: arRoom,
  start: [-5.0, 1.7, 9.6], // al final del pasillo de lockers, mirando hacia la enredadera
  ...arW,
  npc: arMore,
  nico: arNico,
  dari: arDari,
  corridorX: -4.2, // límite entre las baldosas del pasillo y la alfombra
  lockers: { z0: 10.2, cols: 24, rows: 4, cellW: 0.5, cellH: 0.55, depth: 0.5 },
  bench: arBench,
  benches: arBenches,
  storage: arStorage,
  nook: arNook,
  column: arColumn,
  cubes: arCubes,
  plants: arPlants,
  // Stickers del piso (los textos son aproximados: editalos a gusto)
  stickers: [
    { x: -6.3, z: 6.4, rot: 0.35, text: 'Expansión del portafolio', sub: '2024' },
    { x: -5.5, z: 2.8, rot: -0.25, text: 'Alianza con HP' },
    { x: -6.5, z: -1.2, rot: 0.15, text: 'Crecemos juntos' },
  ],
  ceiling: {
    panels: [
      ...arBench.rows.flatMap((z) => [-1.5, 1.3, 4.1].map((x) => [x, z, 1.2, 0.3])),
      ...[8.4, 4.4, 0.4, -3.6].map((z) => [-6.1, z, 0.3, 1.2]),
      [-1.4, -8, 1.2, 0.3],
      [1.4, -8, 1.2, 0.3],
    ],
    spots: [
      ...[9.4, 7, 4.6, 2.2, -0.2, -2.6, -5, -7.4].map((z) => [-4.6, z]),
      [-6.1, -8.6],
      [5.6, -8.4],
    ],
    diffusers: [],
  },
  lights: [
    { pos: [1.3, 3.1, 5.1], color: '#ffe9c8', intensity: 14, distance: 14 },
    { pos: [1.3, 3.1, -2.5], color: '#ffe9c8', intensity: 14, distance: 14 },
    { pos: [-6.1, 3.0, 3], color: '#fff0d8', intensity: 7, distance: 12 },
    { pos: [-6.1, 3.0, -8.4], color: '#ffd9a8', intensity: 6, distance: 7 },
  ],
  colliders: [
    ...arBenches.map((b) => ({ ...b, w: b.w + 0.1, d: b.d + 1.3 })),
    ...arStorage,
    box('column', arColumn, arColumn.r * 2 + 0.1, arColumn.r * 2 + 0.1),
    box('cubes', arCubes, 0.8, 0.8),
    { id: 'nook-table', ...arNook.table },
    ...arNook.poufs.map((p, i) => box(`pouf${i}`, p, p.r * 2, p.r * 2)),
    ...arPlants.map((p, i) => box(`plant${i}`, p, 0.5, 0.5)),
  ],
}

// ======================= CHILE =======================
const clRoom = { w: 16, d: 24 }
const clW = welcome(clRoom.d)
const clBench = { x: -1.3, len: 8.6, d: 1.4, rows: [7.8, 4.2, 0.6, -3.0, -6.6] }
const clBenches = benchesOf(clBench)
const clMore = seatOf(clBench, CL_SEATS_X, { b: 3, s: -1, i: 5 })
const clNico = seatOf(clBench, CL_SEATS_X, { b: 1, s: -1, i: 5 })
const clDari = seatOf(clBench, CL_SEATS_X, { b: 2, s: -1, i: 5 })
// Cajoneras blancas al final de cada fila, del lado del pasillo oscuro
const clPedestals = clBench.rows.map((z, i) => ({
  id: `p${i}`,
  x: clBench.x + clBench.len / 2 + 0.25,
  z,
  w: 0.5,
  d: 1.2,
}))
// Recorrido nuevo: recepción, salas vidriadas, boxes, lockers y mesas de madera junto al ventanal
const clReception = { x: 7.35, z: 9.2, w: 0.8, d: 2.4 }
const clRooms = { x: 7.0, zs: [6.4, 4.0, 1.6, -0.8] } // tabique de vidrio y límites de las 3 salas
const clBooths = { x: 5.0, zs: [5.6, 3.5, 1.4] } // boxes de respaldo alto sobre el pasillo
const clPods = [
  { id: 'pod0', x: -5.2, z: -10.0, w: 2.0, d: 2.2 },
  { id: 'pod1', x: -0.8, z: -10.0, w: 2.0, d: 2.2 },
]
const clColumns = [8.4, 0.6, -7.0].map((z, i) => ({ id: `c${i}`, x: -7.3, z, r: 0.3 }))
const clPlants = [
  { x: 7.0, z: clW.panelZ + 0.55, s: 1.1 },
  { x: -6.8, z: clW.panelZ + 0.55, s: 1 },
]

const cl = {
  id: 'cl',
  name: 'Chile',
  room: clRoom,
  start: [6.25, 1.7, 10.4], // en el pasillo oscuro, mirando hacia el fondo
  ...clW,
  npc: clMore,
  nico: clNico,
  dari: clDari,
  corridorX: 4.2, // límite entre la alfombra de los escritorios y el pasillo oscuro
  bench: clBench,
  benches: clBenches,
  pedestals: clPedestals,
  columns: clColumns,
  reception: clReception,
  rooms: clRooms,
  booths: clBooths,
  pods: clPods,
  plants: clPlants,
  // Cartelitos colgantes con la historia de la empresa (leídos de las fotos del recorrido).
  // Los que no se leían bien (años de ISO 9001, GPTW, 1300) están aproximados: editalos a gusto.
  timeline: [
    { z: 10.0, y: 2.8, year: '1999', big: '', label: 'Cuando todo comenzó' },
    { z: 8.0, y: 2.85, year: '2003', big: '', label: 'Testing Factory' },
    { z: 6.0, y: 2.8, year: '2004', big: '', label: 'Expansión del Portafolio' },
    { z: 4.0, y: 2.85, year: '2006', big: '', label: 'Alianza con HP' },
    { z: 2.0, y: 2.8, year: '2007', big: '', label: 'Expansión a Chile' },
    { z: 0.0, y: 2.85, year: '', big: 'ISO 9001', label: 'Certificación' },
    { z: -2.0, y: 2.8, year: '2011', big: '', label: 'Llegamos a México' },
    { z: -4.0, y: 2.85, year: '2012', big: '', label: 'Nuevas oficinas' },
    { z: -6.0, y: 2.8, year: '2023', big: '', label: '¡Great Place to Work!' },
    { z: -8.0, y: 2.85, year: '', big: '+1300', label: 'Tsofers' },
  ],
  // Adornos de Fiestas Patrias (la foto es de septiembre): poné false para sacarlos
  festive: false,
  ceiling: {
    panels: [
      ...clBench.rows.flatMap((z) => [-4.4, -1.3, 1.8].map((x) => [x, z, 0.6, 0.6])),
      ...[9, 5, 1, -3, -7].map((z) => [6.1, z, 0.6, 0.6]),
    ],
    spots: [],
    diffusers: [
      [-2.9, 2.4],
      [0.2, -1.2],
      [-2.9, -4.8],
      [0.2, 6.0],
      [6.1, 3],
      [6.1, -5],
    ],
  },
  lights: [
    { pos: [-1.3, 3.1, 6.0], color: '#fff1dc', intensity: 14, distance: 14 },
    { pos: [-1.3, 3.1, 0.0], color: '#fff1dc', intensity: 14, distance: 14 },
    { pos: [-1.3, 3.1, -6.0], color: '#fff1dc', intensity: 14, distance: 14 },
    { pos: [6.1, 3.0, 2], color: '#fff1dc', intensity: 7, distance: 12 },
  ],
  colliders: [
    ...clBenches.map((b) => ({ ...b, w: b.w + 0.1, d: b.d + 1.3 })),
    ...clPedestals,
    { id: 'recepcion', ...clReception },
    { id: 'salas', x: 7.45, z: 2.8, w: 0.95, d: 7.4 },
    { id: 'boxes', x: clBooths.x, z: 3.5, w: 1.1, d: 6.2 },
    ...clPods,
    { id: 'armario', x: -3.0, z: -11.5, w: 1.0, d: 0.5 },
    ...clColumns.map((c) => box(c.id, c, c.r * 2 + 0.1, c.r * 2 + 0.1)),
    ...clPlants.map((p, i) => box(`plant${i}`, p, 0.5, 0.5)),
  ],
}

export const OFFICES = { ar, cl }

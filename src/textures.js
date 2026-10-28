import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Random con semilla: la oficina se ve igual en cada recarga
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}

function toTexture(c, repeat) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  if (repeat) {
    t.wrapS = RepeatWrapping
    t.wrapT = RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  return t
}

// Carga una imagen una sola vez. Si el archivo no existe resuelve null y se usa un dibujo de respaldo.
const imageCache = {}
function loadImage(src) {
  if (!imageCache[src]) {
    imageCache[src] = new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
  }
  return imageCache[src]
}
export const loadLogo = () => loadImage('/tsoft-logo.png') // logo de Tsoft
export const loadUniLogo = () => loadImage('/tuniversity-logo.png') // logo de T University

// ---------- Hoja de papel (con el logo arriba cuando está disponible) ----------
export function makePaperTexture() {
  const [c, g] = makeCanvas(256, 180)
  const draw = (logo) => {
    g.fillStyle = '#fbfaf5'
    g.fillRect(0, 0, 256, 180)
    if (logo) {
      const h = 30
      g.drawImage(logo, 20, 14, (logo.width / logo.height) * h, h)
    } else {
      g.fillStyle = '#2b2b2b'
      g.fillRect(20, 20, 90, 10)
    }
    g.fillStyle = '#b9b9b9'
    for (let y = 60; y < 160; y += 16) {
      g.fillRect(20, y, y % 32 ? 176 : 216, 6)
    }
  }
  draw(null)
  const t = toTexture(c)
  loadLogo().then((img) => {
    if (!img) return
    draw(img)
    t.needsUpdate = true
  })
  return t
}

// ---------- Cartel "Cursos obligatorios": placa blanca con el logo de T University arriba ----------
export function makeSignTexture(text) {
  const W = 1024
  const H = 340
  const [c, g] = makeCanvas(W, H)
  const t = toTexture(c)
  let logo = null

  const redraw = () => {
    g.fillStyle = '#f5f5f3'
    g.fillRect(0, 0, W, H)
    g.fillStyle = '#1f9ac0' // turquesa del logo de T University
    g.fillRect(0, H - 22, W, 22)

    g.textAlign = 'center'
    g.textBaseline = 'middle'
    if (logo) {
      const s = Math.min(640 / logo.width, 84 / logo.height)
      const dw = logo.width * s
      const dh = logo.height * s
      g.drawImage(logo, (W - dw) / 2, 28, dw, dh)
    } else {
      // Respaldo si falta el PNG del logo
      g.fillStyle = '#2b2b2b'
      g.font = 'bold 72px system-ui, Arial, sans-serif'
      g.fillText('T UNIVERSITY', W / 2, 70)
    }

    // Texto principal: se achica hasta entrar en el ancho
    let size = 130
    g.font = `bold ${size}px system-ui, Arial, sans-serif`
    while (g.measureText(text).width > 920 && size > 20) {
      size -= 4
      g.font = `bold ${size}px system-ui, Arial, sans-serif`
    }
    g.fillStyle = '#2b2b2b'
    g.fillText(text, W / 2, 212)
    t.needsUpdate = true
  }

  redraw()
  loadUniLogo().then((img) => {
    if (!img) return
    logo = img
    redraw()
  })
  return t
}

// ---------- Cartel de neón con el logo ----------

// Respaldo si no está el PNG del logo: dibuja "TSOFT" y la flecha roja
function neonFallback(g, W, H) {
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 200px system-ui, Arial, sans-serif'
  g.fillStyle = '#ffffff'
  g.shadowColor = '#7fd8ff'
  for (const blur of [40, 18, 6]) {
    g.shadowBlur = blur
    g.fillText('TSOFT', W * 0.45, H * 0.28)
  }
  g.fillStyle = '#ff3a4a'
  g.shadowColor = '#ff2a3a'
  for (const blur of [36, 16, 5]) {
    g.shadowBlur = blur
    g.beginPath()
    g.moveTo(W * 0.69, H * 0.17)
    g.lineTo(W * 0.75, H * 0.28)
    g.lineTo(W * 0.69, H * 0.39)
    g.closePath()
    g.fill()
  }
  g.shadowBlur = 0
}

// Convierte el logo real en neón (letras oscuras -> blanco con brillo celeste, flecha roja -> roja con brillo)
// y lo ubica en la parte de arriba del cartel
function neonFromImage(g, img, W, H) {
  const [, tg] = makeCanvas(W, H)
  const s = Math.min((W * 0.5) / img.width, (H * 0.52) / img.height)
  const dw = img.width * s
  const dh = img.height * s
  tg.drawImage(img, (W - dw) / 2, H * 0.28 - dh / 2, dw, dh)

  const src = tg.getImageData(0, 0, W, H).data
  const letters = tg.createImageData(W, H)
  const arrow = tg.createImageData(W, H)
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3] / 255
    if (a < 0.04) continue
    const r = src[i]
    const gr = src[i + 1]
    const b = src[i + 2]
    const lum = 0.299 * r + 0.587 * gr + 0.114 * b
    const redness = r - (gr + b) / 2
    if (redness > 50) {
      arrow.data[i] = 255
      arrow.data[i + 1] = 60
      arrow.data[i + 2] = 75
      arrow.data[i + 3] = Math.min(255, redness * 2.2) * a
    } else {
      const k = Math.min(1, Math.max(0, (200 - lum) / 120))
      if (k > 0) {
        letters.data[i] = 255
        letters.data[i + 1] = 255
        letters.data[i + 2] = 255
        letters.data[i + 3] = k * 255 * a
      }
    }
  }
  const toCanvas = (data) => {
    const [cc, cg] = makeCanvas(W, H)
    cg.putImageData(data, 0, 0)
    return cc
  }
  const lc = toCanvas(letters)
  const ac = toCanvas(arrow)

  g.shadowColor = '#7fd8ff'
  for (const blur of [48, 24, 8]) {
    g.shadowBlur = blur
    g.drawImage(lc, 0, 0)
  }
  g.shadowColor = '#ff2a3a'
  for (const blur of [44, 20, 6]) {
    g.shadowBlur = blur
    g.drawImage(ac, 0, 0)
  }
  g.shadowBlur = 0
}

export function makeNeonLogoTexture() {
  const W = 1600
  const H = 520
  const [c, g] = makeCanvas(W, H)
  const t = toTexture(c)
  let logo = null
  const redraw = () => {
    g.clearRect(0, 0, W, H)
    if (logo) neonFromImage(g, logo, W, H)
    else neonFallback(g, W, H)
    t.needsUpdate = true
  }
  redraw()
  // Cuando llega el logo, se vuelve a dibujar
  loadLogo().then((img) => {
    logo = img
    redraw()
  })
  return t
}

// ---------- Pared de enredadera ----------
export function makePlantTexture() {
  const W = 2048
  const H = 512
  const [c, g] = makeCanvas(W, H)
  const rand = rng(7)
  g.fillStyle = '#17331b'
  g.fillRect(0, 0, W, H)
  const greens = ['#1f4d26', '#2a6a30', '#35803a', '#256028', '#4a9a48', '#1a4220', '#5fb25a']
  for (let i = 0; i < 4200; i++) {
    const len = 18 + rand() * 40
    const wid = len * (0.35 + rand() * 0.2)
    g.save()
    g.translate(rand() * W, rand() * H)
    g.rotate(rand() * Math.PI * 2)
    g.globalAlpha = 0.75 + rand() * 0.25
    g.fillStyle = greens[Math.floor(rand() * greens.length)]
    g.beginPath()
    g.ellipse(0, 0, len / 2, wid / 2, 0, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = 'rgba(255,255,255,0.12)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(-len / 2, 0)
    g.lineTo(len / 2, 0)
    g.stroke()
    g.restore()
  }
  return toTexture(c)
}

// ---------- Alfombra en placas gris cálido ----------
export function makeCarpetTexture() {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(11)
  g.fillStyle = '#9b958b'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 3400; i++) {
    const x = rand() * 512
    const y = rand() * 512
    const len = 6 + rand() * 40
    g.strokeStyle =
      rand() > 0.5
        ? `rgba(196,190,178,${0.12 + rand() * 0.2})`
        : `rgba(72,68,62,${0.12 + rand() * 0.2})`
    g.lineWidth = 1 + rand() * 2
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + len, y + (rand() - 0.5) * 6)
    g.stroke()
  }
  // Juntas de las placas (la textura cubre 2 x 2 m: placas de 1 m)
  g.strokeStyle = 'rgba(55,52,46,0.28)'
  g.lineWidth = 3
  g.strokeRect(0, 0, 512, 512)
  g.beginPath()
  g.moveTo(256, 0)
  g.lineTo(256, 512)
  g.moveTo(0, 256)
  g.lineTo(512, 256)
  g.stroke()
  return toTexture(c, [6, 11])
}

// ---------- Hormigón del techo ----------
export function makeConcreteTexture() {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(23)
  g.fillStyle = '#b7b6b1'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 1400; i++) {
    const r = 4 + rand() * 34
    g.fillStyle =
      rand() > 0.5 ? `rgba(255,255,255,${rand() * 0.06})` : `rgba(40,40,40,${rand() * 0.07})`
    g.beginPath()
    g.arc(rand() * 512, rand() * 512, r, 0, Math.PI * 2)
    g.fill()
  }
  // Juntas de encofrado: al repetirse la textura forman paneles
  g.strokeStyle = 'rgba(70,70,70,0.35)'
  g.lineWidth = 3
  g.strokeRect(0, 0, 512, 512)
  return toTexture(c, [4, 4])
}

// ---------- Madera clara (tapas de mesa y tira de piso) ----------
export function makeWoodTexture(repeat = [1, 1], planks = false) {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(31)
  g.fillStyle = '#c9a374'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 220; i++) {
    const x = rand() * 512
    g.strokeStyle =
      rand() > 0.5
        ? `rgba(120,80,40,${0.05 + rand() * 0.1})`
        : `rgba(240,215,170,${0.05 + rand() * 0.1})`
    g.lineWidth = 1 + rand() * 3
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + (rand() - 0.5) * 20, 512)
    g.stroke()
  }
  if (planks) {
    g.strokeStyle = 'rgba(90,60,30,0.4)'
    g.lineWidth = 2
    for (const x of [0, 128, 256, 384]) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, 512)
      g.stroke()
    }
  }
  return toTexture(c, repeat)
}

// ---------- Ciudad detrás del ventanal ----------
export function makeSkylineTexture() {
  const W = 2048
  const H = 512
  const [c, g] = makeCanvas(W, H)
  const rand = rng(5)
  const sky = g.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#bcd6ea')
  sky.addColorStop(1, '#eef3f6')
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)

  const layers = [
    { base: 'rgb(176,190,201)', minH: 120, maxH: 260, win: 0.1 },
    { base: 'rgb(150,164,177)', minH: 150, maxH: 330, win: 0.14 },
    { base: 'rgb(118,132,146)', minH: 140, maxH: 380, win: 0.18 },
  ]
  for (const L of layers) {
    let x = -rand() * 60
    while (x < W) {
      const w = 70 + rand() * 120
      const h = L.minH + rand() * (L.maxH - L.minH)
      const top = H - 40 - h
      g.fillStyle = L.base
      g.fillRect(x, top, w, h)
      g.fillStyle = `rgba(255,255,255,${L.win})`
      for (let wy = top + 10; wy < H - 50; wy += 16) {
        for (let wx = x + 8; wx < x + w - 10; wx += 14) {
          if (rand() > 0.45) g.fillRect(wx, wy, 7, 9)
        }
      }
      x += w + rand() * 16 - 8
    }
  }
  g.fillStyle = '#5f666c'
  g.fillRect(0, H - 40, W, 40)
  return toTexture(c)
}

// ---------- Cara de More (estilo cartoon) ----------
// Se aplica como un parche curvo sobre la esfera de la cabeza. 560x400 px = 1.4 x 1.0 rad.
export function makeFaceTexture() {
  const W = 560
  const H = 400
  const [c, g] = makeCanvas(W, H)
  const ink = '#2a1410'
  g.lineCap = 'round'
  g.lineJoin = 'round'

  // Cachetes sonrojados
  for (const x of [90, 470]) {
    const grad = g.createRadialGradient(x, 268, 4, x, 268, 58)
    grad.addColorStop(0, 'rgba(238,105,105,0.5)')
    grad.addColorStop(1, 'rgba(238,105,105,0)')
    g.fillStyle = grad
    g.fillRect(x - 60, 208, 120, 120)
  }

  // Ojos grandes marrones
  for (const s of [-1, 1]) {
    const ex = 280 + s * 135
    const ey = 190
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.ellipse(ex, ey, 46, 38, 0, 0, Math.PI * 2)
    g.fill()

    // Iris, pupila y brillos, recortados al ojo
    g.save()
    g.beginPath()
    g.ellipse(ex, ey, 46, 38, 0, 0, Math.PI * 2)
    g.clip()
    g.fillStyle = '#4a2a18'
    g.beginPath()
    g.arc(ex, ey + 2, 30, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#120a06'
    g.beginPath()
    g.arc(ex, ey + 2, 15, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(ex - 11, ey - 10, 9, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.arc(ex + 12, ey + 12, 4.5, 0, Math.PI * 2)
    g.fill()
    g.restore()

    // Contorno y párpado superior grueso
    g.strokeStyle = ink
    g.lineWidth = 4
    g.beginPath()
    g.ellipse(ex, ey, 46, 38, 0, 0, Math.PI * 2)
    g.stroke()
    g.lineWidth = 11
    g.beginPath()
    g.ellipse(ex, ey, 48, 40, 0, Math.PI * 1.04, Math.PI * 1.96)
    g.stroke()

    // Pestañas en la punta externa
    g.lineWidth = 6
    g.beginPath()
    g.moveTo(ex + s * 40, ey - 16)
    g.lineTo(ex + s * 62, ey - 30)
    g.moveTo(ex + s * 44, ey - 4)
    g.lineTo(ex + s * 68, ey - 10)
    g.stroke()

    // Cejas gruesas y arqueadas
    g.strokeStyle = '#241711'
    g.lineWidth = 17
    g.beginPath()
    g.moveTo(280 + s * 62, 136)
    g.quadraticCurveTo(280 + s * 135, 92, 280 + s * 208, 132)
    g.stroke()
  }

  // Nariz chica
  g.strokeStyle = '#b97a5a'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(266, 232)
  g.quadraticCurveTo(280, 248, 294, 232)
  g.stroke()

  // Sonrisa grande con dientes y lengua
  const mouth = () => {
    g.beginPath()
    g.moveTo(175, 262)
    g.quadraticCurveTo(280, 282, 385, 262)
    g.quadraticCurveTo(360, 372, 280, 376)
    g.quadraticCurveTo(200, 372, 175, 262)
    g.closePath()
  }
  mouth()
  g.fillStyle = '#7a1f2b'
  g.fill()
  g.save()
  mouth()
  g.clip()
  g.fillStyle = '#ffffff'
  g.fillRect(160, 250, 240, 50)
  g.fillStyle = '#e0707a'
  g.beginPath()
  g.ellipse(280, 356, 50, 22, 0, 0, Math.PI * 2)
  g.fill()
  g.restore()
  mouth()
  g.strokeStyle = ink
  g.lineWidth = 8
  g.stroke()

  // Arruguitas de la sonrisa
  g.lineWidth = 5
  g.beginPath()
  g.moveTo(166, 248)
  g.quadraticCurveTo(156, 266, 170, 282)
  g.moveTo(394, 248)
  g.quadraticCurveTo(404, 266, 390, 282)
  g.stroke()

  return toTexture(c)
}

// =====================================================================
// Oficina de Argentina: texturas nuevas
// =====================================================================

// ---------- Baldosones gris cemento del pasillo (la textura cubre 1,8 x 1,8 m: 4 baldosas) ----------
export function makeTileTexture() {
  const S = 512
  const half = S / 2
  const [c, g] = makeCanvas(S, S)
  const rand = rng(41)
  const tones = ['#62656a', '#686b70', '#5d6065', '#6c6f73']
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      g.fillStyle = tones[tx + ty * 2]
      g.fillRect(tx * half, ty * half, half, half)
      for (let i = 0; i < 150; i++) {
        const r = 8 + rand() * 42
        g.fillStyle =
          rand() > 0.5 ? `rgba(255,255,255,${rand() * 0.05})` : `rgba(15,17,20,${rand() * 0.09})`
        g.beginPath()
        g.arc(tx * half + rand() * half, ty * half + rand() * half, r, 0, Math.PI * 2)
        g.fill()
      }
    }
  }
  g.strokeStyle = 'rgba(22,24,27,0.75)'
  g.lineWidth = 5
  g.strokeRect(0, 0, S, S)
  g.beginPath()
  g.moveTo(half, 0)
  g.lineTo(half, S)
  g.moveTo(0, half)
  g.lineTo(S, half)
  g.stroke()
  return toTexture(c, [2.1, 12.2])
}

// ---------- Escritorio de madera clara (abedul) ----------
export function makeDeskTexture(repeat = [1, 1]) {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(61)
  g.fillStyle = '#e0c9a2'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 200; i++) {
    const x = rand() * 512
    g.strokeStyle =
      rand() > 0.5 ? `rgba(150,110,60,${0.04 + rand() * 0.08})` : `rgba(255,240,205,${0.06 + rand() * 0.1})`
    g.lineWidth = 1 + rand() * 3
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + (rand() - 0.5) * 24, 512)
    g.stroke()
  }
  return toTexture(c, repeat)
}

// ---------- Cielorraso de placas blancas (la textura es una placa de 0,6 m; Ceiling define la repetición) ----------
export function makeCeilingTexture() {
  const S = 256
  const [c, g] = makeCanvas(S, S)
  const rand = rng(71)
  g.fillStyle = '#f3f2ee'
  g.fillRect(0, 0, S, S)
  for (let i = 0; i < 420; i++) {
    g.fillStyle = `rgba(120,118,112,${0.05 + rand() * 0.12})`
    g.fillRect(rand() * S, rand() * S, 1 + rand() * 2, 1 + rand() * 2)
  }
  g.strokeStyle = 'rgba(70,70,72,0.55)'
  g.lineWidth = 5
  g.strokeRect(0, 0, S, S)
  g.strokeStyle = 'rgba(255,255,255,0.7)'
  g.lineWidth = 2
  g.strokeRect(5, 5, S - 10, S - 10)
  return toTexture(c, [1, 1])
}

// ---------- Lockers numerados: una fila de puertas con número ----------
export function makeLockerTexture(cols, rows) {
  const cw = 100
  const ch = 110
  const [c, g] = makeCanvas(cols * cw, rows * ch)
  const rand = rng(53)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineJoin = 'round'
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const x = col * cw
      const y = row * ch
      const n = col * rows + row + 1
      const shade = 232 + Math.floor(rand() * 8)
      g.fillStyle = `rgb(${shade},${shade},${shade - 2})`
      g.fillRect(x, y, cw, ch)
      g.strokeStyle = 'rgba(70,72,75,0.8)'
      g.lineWidth = 3
      g.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3)
      // Rendijas de ventilación
      g.fillStyle = 'rgba(60,62,66,0.55)'
      for (let k = 0; k < 3; k++) g.fillRect(x + 22 + k * 20, y + 8, 12, 3)
      // Cerradura
      g.fillStyle = '#9da2a8'
      g.beginPath()
      g.arc(x + cw - 16, y + ch / 2 + 4, 6, 0, Math.PI * 2)
      g.fill()
      // Número: algunos en rojo macizo, el resto con contorno
      g.font = "bold 50px 'Arial Rounded MT Bold', 'Trebuchet MS', system-ui, sans-serif"
      if (rand() < 0.3) {
        g.strokeStyle = '#7a1018'
        g.lineWidth = 3
        g.strokeText(String(n), x + cw / 2 - 5, y + ch / 2 + 2)
        g.fillStyle = '#d9202f'
        g.fillText(String(n), x + cw / 2 - 5, y + ch / 2 + 2)
      } else {
        g.strokeStyle = '#4a4c50'
        g.lineWidth = 4
        g.strokeText(String(n), x + cw / 2 - 5, y + ch / 2 + 2)
        g.fillStyle = '#f4f4f1'
        g.fillText(String(n), x + cw / 2 - 5, y + ch / 2 + 2)
      }
    }
  }
  return toTexture(c)
}

// ---------- Listones de madera oscura (rincón lounge) ----------
export function makeSlatTexture() {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(83)
  const tones = ['#7a4426', '#6a3a20', '#85502c', '#5f331b']
  for (let i = 0; i < 8; i++) {
    g.fillStyle = tones[i % tones.length]
    g.fillRect(i * 64, 0, 64, 512)
    for (let k = 0; k < 22; k++) {
      const gx = i * 64 + 4 + rand() * 54
      g.strokeStyle = rand() > 0.5 ? 'rgba(30,14,6,0.22)' : 'rgba(255,200,150,0.12)'
      g.lineWidth = 1 + rand() * 1.5
      g.beginPath()
      g.moveTo(gx, 0)
      g.lineTo(gx + (rand() - 0.5) * 6, 512)
      g.stroke()
    }
    g.fillStyle = 'rgba(20,9,3,0.9)'
    g.fillRect(i * 64 + 60, 0, 4, 512)
  }
  return toTexture(c, [3.8, 1])
}

// ---------- Revestimiento gris tipo piedra ----------
export function makeStoneTexture() {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(97)
  g.fillStyle = '#4a4d51'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 260; i++) {
    const r = 10 + rand() * 60
    g.fillStyle =
      rand() > 0.5 ? `rgba(200,205,210,${rand() * 0.07})` : `rgba(10,12,14,${rand() * 0.14})`
    g.beginPath()
    g.ellipse(rand() * 512, rand() * 512, r, r * (0.4 + rand() * 0.6), rand() * 3, 0, Math.PI * 2)
    g.fill()
  }
  return toTexture(c, [2, 2])
}

// ---------- Bandera "gota" negra con el logo en vertical ----------
export function makeFlagTexture() {
  const W = 256
  const H = 1024
  const [c, g] = makeCanvas(W, H)
  g.beginPath()
  g.moveTo(14, 1008)
  g.lineTo(14, 16)
  g.bezierCurveTo(236, 6, 262, 400, 204, 640)
  g.bezierCurveTo(166, 800, 90, 920, 14, 1008)
  g.closePath()
  g.fillStyle = '#131316'
  g.fill()
  // Texto en vertical, de arriba hacia abajo
  g.save()
  g.translate(118, 360)
  g.rotate(Math.PI / 2)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 120px system-ui, Arial, sans-serif'
  g.fillText('TSOFT', 0, 0)
  g.restore()
  // Flecha roja hacia abajo
  g.fillStyle = '#d9202f'
  g.beginPath()
  g.moveTo(70, 742)
  g.lineTo(166, 742)
  g.lineTo(118, 840)
  g.closePath()
  g.fill()
  return toTexture(c)
}

// ---------- Cajón blanco con el logo ----------
export function makeCubeTexture() {
  const [c, g] = makeCanvas(256, 256)
  g.fillStyle = '#f6f6f3'
  g.fillRect(0, 0, 256, 256)
  g.strokeStyle = 'rgba(0,0,0,0.18)'
  g.lineWidth = 6
  g.strokeRect(0, 0, 256, 256)
  g.fillStyle = '#2b2b2b'
  g.font = 'bold 54px system-ui, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('TSOFT', 112, 128)
  g.fillStyle = '#d9202f'
  g.beginPath()
  g.moveTo(206, 108)
  g.lineTo(228, 128)
  g.lineTo(206, 148)
  g.closePath()
  g.fill()
  return toTexture(c)
}

// ---------- Sticker de piso: globo rojo y blanco con texto ----------
export function makeStickerTexture(text, sub) {
  const S = 512
  const [c, g] = makeCanvas(S, S)
  const blob = (R) => {
    g.beginPath()
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2
      const r = R * (1 + 0.045 * Math.sin(a * 9))
      const x = S / 2 + Math.cos(a) * r
      const y = S / 2 + Math.sin(a) * r
      if (i) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.closePath()
  }
  blob(240)
  g.fillStyle = '#d9202f'
  g.fill()
  blob(212)
  g.fillStyle = '#fbfaf5'
  g.fill()

  g.font = 'bold 62px system-ui, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const lines = []
  let cur = ''
  for (const w of text.split(' ')) {
    const t = cur ? `${cur} ${w}` : w
    if (g.measureText(t).width > 330 && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  lines.push(cur)
  const lh = 70
  const y0 = S / 2 - ((lines.length - 1) * lh) / 2 - (sub ? 22 : 0)
  g.fillStyle = '#d9202f'
  lines.forEach((l, i) => g.fillText(l, S / 2, y0 + i * lh))
  if (sub) {
    g.fillStyle = '#2b2b2b'
    g.font = 'bold 54px system-ui, Arial, sans-serif'
    g.fillText(sub, S / 2, y0 + lines.length * lh + 6)
  }
  return toTexture(c)
}

// ---------- Cartel de salida ----------
export function makeExitTexture() {
  const [c, g] = makeCanvas(512, 192)
  g.fillStyle = '#17935a'
  g.fillRect(0, 0, 512, 192)
  g.fillStyle = '#ffffff'
  g.font = 'bold 104px system-ui, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('SALIDA', 256, 100)
  return toTexture(c)
}

// ---------- Póster enmarcado del lounge ----------
export function makePosterTexture() {
  const [c, g] = makeCanvas(256, 360)
  g.fillStyle = '#1b1b1f'
  g.fillRect(0, 0, 256, 360)
  g.fillStyle = '#d9202f'
  g.fillRect(0, 232, 256, 30)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 34px system-ui, Arial, sans-serif'
  g.fillText('Capacitación', 128, 90)
  g.fillText('para todos', 128, 134)
  g.fillStyle = '#9aa0a6'
  g.fillRect(40, 290, 176, 6)
  g.fillRect(70, 312, 116, 6)
  return toTexture(c)
}

// ---------- Banner roll-up ----------
export function makeRollupTexture() {
  const [c, g] = makeCanvas(256, 768)
  g.fillStyle = '#f7f6f2'
  g.fillRect(0, 0, 256, 768)
  g.fillStyle = '#d9202f'
  g.beginPath()
  g.moveTo(0, 430)
  g.lineTo(256, 300)
  g.lineTo(256, 768)
  g.lineTo(0, 768)
  g.closePath()
  g.fill()
  g.fillStyle = '#2b2b2b'
  g.font = 'bold 66px system-ui, Arial, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('TSOFT', 118, 120)
  g.fillStyle = '#d9202f'
  g.beginPath()
  g.moveTo(206, 96)
  g.lineTo(232, 120)
  g.lineTo(206, 144)
  g.closePath()
  g.fill()
  g.fillStyle = '#ffffff'
  g.font = 'bold 40px system-ui, Arial, sans-serif'
  g.fillText('Somos', 128, 560)
  g.fillText('Tsofters', 128, 610)
  return toTexture(c)
}

// =====================================================================
// Oficina de Chile: texturas nuevas
// =====================================================================

// ---------- Alfombra del pasillo: placas gris oscuro con vetas claras (la textura cubre 2 x 2 m) ----------
export function makeCorridorCarpetTexture() {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(113)
  const tones = ['#4a4b50', '#54555a', '#44454a']
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const x = col * 256
      const y = row * 128
      const vertical = (row + col) % 2 === 0
      g.save()
      g.beginPath()
      g.rect(x, y, 256, 128)
      g.clip()
      g.fillStyle = tones[(row + col) % 3]
      g.fillRect(x, y, 256, 128)
      for (let i = 0; i < 90; i++) {
        const px = x + rand() * 256
        const py = y + rand() * 128
        const len = 10 + rand() * 50
        g.strokeStyle =
          rand() > 0.35
            ? `rgba(125,127,133,${0.12 + rand() * 0.2})`
            : `rgba(8,8,10,${0.2 + rand() * 0.2})`
        g.lineWidth = 1 + rand() * 2
        g.beginPath()
        g.moveTo(px, py)
        if (vertical) g.lineTo(px + (rand() - 0.5) * 3, py + len)
        else g.lineTo(px + len, py + (rand() - 0.5) * 3)
        g.stroke()
      }
      g.restore()
      g.strokeStyle = 'rgba(0,0,0,0.45)'
      g.lineWidth = 3
      g.strokeRect(x + 1.5, y + 1.5, 253, 125)
    }
  }
  return toTexture(c, [1, 1])
}

// ---------- Alfombra beige grisáceo de los escritorios (la textura cubre 2 x 2 m) ----------
export function makeBeigeCarpetTexture() {
  const [c, g] = makeCanvas(512, 512)
  const rand = rng(127)
  g.fillStyle = '#8c8377'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 3600; i++) {
    const x = rand() * 512
    const y = rand() * 512
    const len = 5 + rand() * 30
    g.strokeStyle =
      rand() > 0.5 ? `rgba(190,180,164,${0.12 + rand() * 0.2})` : `rgba(60,54,48,${0.12 + rand() * 0.2})`
    g.lineWidth = 1 + rand() * 2
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + len * 0.7, y + len * 0.7)
    g.stroke()
  }
  g.strokeStyle = 'rgba(50,45,40,0.3)'
  g.lineWidth = 3
  g.strokeRect(0, 0, 512, 512)
  g.beginPath()
  g.moveTo(256, 0)
  g.lineTo(256, 512)
  g.moveTo(0, 256)
  g.lineTo(512, 256)
  g.stroke()
  return toTexture(c, [1, 1])
}

// ---------- Santiago detrás del ventanal: cordillera, cerro y edificios claros ----------
export function makeSantiagoTexture() {
  const W = 2048
  const H = 512
  const [c, g] = makeCanvas(W, H)
  const rand = rng(131)
  const sky = g.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#9dbbd6')
  sky.addColorStop(1, '#e6edf1')
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)

  // Cordillera lejana y un cerro más cercano
  const ridge = (base, amp, color) => {
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, H)
    for (let x = 0; x <= W; x += 64) g.lineTo(x, base - rand() * amp)
    g.lineTo(W, H)
    g.closePath()
    g.fill()
  }
  ridge(250, 110, 'rgba(128,138,150,0.85)')
  ridge(300, 80, 'rgba(104,116,104,0.95)')

  const layers = [
    { base: 'rgb(214,212,206)', minH: 120, maxH: 250 },
    { base: 'rgb(190,189,184)', minH: 150, maxH: 320 },
    { base: 'rgb(232,230,224)', minH: 140, maxH: 360 },
  ]
  for (const L of layers) {
    let x = -rand() * 60
    while (x < W) {
      const w = 80 + rand() * 120
      const h = L.minH + rand() * (L.maxH - L.minH)
      const top = H - 40 - h
      g.fillStyle = L.base
      g.fillRect(x, top, w, h)
      // Balcones y ventanas
      for (let wy = top + 12; wy < H - 50; wy += 22) {
        g.fillStyle = 'rgba(255,255,255,0.55)'
        g.fillRect(x, wy + 12, w, 3)
        g.fillStyle = 'rgba(60,80,110,0.5)'
        for (let wx = x + 8; wx < x + w - 10; wx += 16) g.fillRect(wx, wy, 9, 11)
      }
      x += w + rand() * 14 - 6
    }
  }
  // Árboles y calle
  for (let i = 0; i < 70; i++) {
    g.fillStyle = `rgba(${60 + rand() * 30},${110 + rand() * 40},${60 + rand() * 20},0.95)`
    g.beginPath()
    g.ellipse(rand() * W, H - 44, 30 + rand() * 40, 24 + rand() * 20, 0, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#5f666c'
  g.fillRect(0, H - 34, W, 34)
  return toTexture(c)
}

// ---------- Cartelito colgante de la historia de la empresa (nube blanca con número rojo) ----------
export function makeTimelineSignTexture({ year, big, label }) {
  const S = 512
  const [c, g] = makeCanvas(S, S)
  const cloud = (R) => {
    g.beginPath()
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * 2
      const r = R * (1 + 0.06 * Math.sin(a * 8))
      const x = S / 2 + Math.cos(a) * r
      const y = S * 0.42 + Math.sin(a) * r * 0.78
      if (i) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.closePath()
  }
  cloud(228)
  g.fillStyle = '#fbf8f2'
  g.fill()
  g.strokeStyle = '#3a2323'
  g.lineWidth = 9
  g.stroke()

  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineJoin = 'round'
  if (big) {
    g.fillStyle = '#3a2323'
    g.font = 'bold 56px system-ui, Arial, sans-serif'
    g.fillText(year, S / 2, 128)
  }
  const head = big || year
  g.font = 'bold 170px system-ui, Arial, sans-serif'
  g.strokeStyle = '#3a2323'
  g.lineWidth = 12
  g.strokeText(head, S / 2, 250)
  g.fillStyle = '#d9202f'
  g.fillText(head, S / 2, 250)

  // Cinta roja con la leyenda
  let size = 64
  g.font = `bold ${size}px system-ui, Arial, sans-serif`
  while (g.measureText(label).width > 400 && size > 20) {
    size -= 4
    g.font = `bold ${size}px system-ui, Arial, sans-serif`
  }
  const bw = Math.max(260, g.measureText(label).width + 56)
  g.fillStyle = '#c8202e'
  g.strokeStyle = '#3a2323'
  g.lineWidth = 8
  g.beginPath()
  g.roundRect(S / 2 - bw / 2, 340, bw, 96, 22)
  g.fill()
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillText(label, S / 2, 390)
  return toTexture(c)
}

// ---------- Abanico de papel rojo, blanco y azul (Fiestas Patrias) ----------
export function makePinwheelTexture() {
  const S = 256
  const [c, g] = makeCanvas(S, S)
  const colors = ['#d52b1e', '#ffffff', '#0039a6']
  const n = 15
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[i % 3]
    g.beginPath()
    g.moveTo(S / 2, S / 2)
    g.arc(S / 2, S / 2, S / 2 - 3, (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2)
    g.closePath()
    g.fill()
    g.strokeStyle = 'rgba(0,0,0,0.18)'
    g.lineWidth = 2
    g.stroke()
  }
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.arc(S / 2, S / 2, 20, 0, Math.PI * 2)
  g.fill()
  return toTexture(c)
}

// ---------- Bandera de Chile ----------
export function makeChileFlagTexture() {
  const [c, g] = makeCanvas(300, 200)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 300, 100)
  g.fillStyle = '#d52b1e'
  g.fillRect(0, 100, 300, 100)
  g.fillStyle = '#0039a6'
  g.fillRect(0, 0, 100, 100)
  g.fillStyle = '#ffffff'
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 12 : 30
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const x = 50 + Math.cos(a) * r
    const y = 50 + Math.sin(a) * r
    if (i) g.lineTo(x, y)
    else g.moveTo(x, y)
  }
  g.closePath()
  g.fill()
  return toTexture(c)
}


// =====================================================================
// Oficina de Chile (versión con recorrido en fotos): texturas nuevas
// =====================================================================

// ---------- Vidrio esmerilado con líneas geométricas (las salas vidriadas del pasillo) ----------
export function makeFrostedFilmTexture() {
  const [c, g] = makeCanvas(512, 256)
  g.fillStyle = 'rgba(236,240,241,0.88)'
  g.fillRect(0, 0, 512, 256)
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.lineWidth = 3
  g.beginPath()
  for (const [x, y] of [[40, 20], [120, 236], [250, 10], [330, 246], [470, 30], [500, 200]]) {
    g.moveTo(256, 128)
    g.lineTo(x, y)
  }
  g.stroke()
  g.strokeStyle = 'rgba(120,130,134,0.35)'
  g.lineWidth = 1.5
  g.stroke()
  // Franja superior sin film (se ve a través)
  g.clearRect(0, 0, 512, 22)
  return toTexture(c)
}

// ---------- Lockers de madera clara con números (36 a 105) ----------
export function makeNumberedLockerTexture({ cols, rows, start }) {
  const cw = 96
  const ch = 84
  const [c, g] = makeCanvas(cols * cw, rows * ch)
  g.fillStyle = '#cdb99c'
  g.fillRect(0, 0, c.width, c.height)
  const rand = rng(77)
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(110,90,60,${0.05 + rand() * 0.08})`
    g.lineWidth = 1
    const x = rand() * c.width
    const y = rand() * c.height
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + 20 + rand() * 40, y + (rand() - 0.5) * 4)
    g.stroke()
  }
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 40px system-ui, Arial, sans-serif'
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const n = start + col * rows + row
      g.strokeStyle = 'rgba(70,56,40,0.55)'
      g.lineWidth = 3
      g.strokeRect(col * cw + 2, row * ch + 2, cw - 4, ch - 4)
      const red = n % 4 === 1 || n % 13 === 0
      g.lineWidth = 2
      g.strokeStyle = red ? '#d9202f' : '#26282b'
      g.fillStyle = red ? '#d9202f' : 'rgba(255,255,255,0.0)'
      if (red) g.fillText(String(n), col * cw + cw / 2, row * ch + ch / 2 + 2)
      else g.strokeText(String(n), col * cw + cw / 2, row * ch + ch / 2 + 2)
    }
  }
  return toTexture(c)
}

// ---------- Logo TSOFT en letras gris oscuro con la flecha roja (recepción) ----------
export function makeLogoWallTexture() {
  const [c, g] = makeCanvas(1024, 256)
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.font = 'bold 190px system-ui, Arial, sans-serif'
  g.fillStyle = '#3d3f43'
  g.fillText('TSOFT', 40, 130)
  const w = g.measureText('TSOFT').width
  g.fillStyle = '#d9202f'
  g.beginPath()
  g.moveTo(60 + w, 40)
  g.lineTo(60 + w + 120, 128)
  g.lineTo(60 + w, 216)
  g.lineTo(60 + w + 36, 128)
  g.closePath()
  g.fill()
  return toTexture(c)
}

// ---------- Diario mural "NOVEDADES" con avisos ----------
export function makeBoardTexture() {
  const [c, g] = makeCanvas(512, 384)
  g.fillStyle = '#f4f6f6'
  g.fillRect(0, 0, 512, 384)
  g.fillStyle = '#d9202f'
  g.fillRect(0, 0, 512, 64)
  g.fillStyle = '#ffffff'
  g.font = 'bold 44px system-ui, Arial, sans-serif'
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.fillText('NOVEDADES', 20, 34)
  const rand = rng(91)
  const cols = ['#ffffff', '#e8eef0', '#fbe9e7', '#e6f2e8']
  for (let i = 0; i < 9; i++) {
    const x = 18 + (i % 3) * 164
    const y = 84 + Math.floor(i / 3) * 96
    g.fillStyle = cols[Math.floor(rand() * cols.length)]
    g.fillRect(x, y, 146, 82)
    g.strokeStyle = 'rgba(0,0,0,0.25)'
    g.strokeRect(x, y, 146, 82)
    g.fillStyle = '#8a9296'
    for (let l = 0; l < 4; l++) g.fillRect(x + 10, y + 12 + l * 16, 90 + rand() * 40, 5)
  }
  return toTexture(c)
}

// ---------- Cartelito de escritorio "Aquí puro buen trato" ----------
export function makeTentCardTexture() {
  const [c, g] = makeCanvas(128, 160)
  g.fillStyle = '#f6c9d0'
  g.fillRect(0, 0, 128, 160)
  g.fillStyle = '#d9202f'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = 'bold 30px system-ui, Arial, sans-serif'
  ;['aquí', 'puro', 'buen', 'trato'].forEach((t, i) => g.fillText(t, 64, 30 + i * 34))
  return toTexture(c)
}

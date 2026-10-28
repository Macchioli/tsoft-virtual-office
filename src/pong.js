// Motor del Pong de Tsoft (estilo Atari): jugador a la izquierda vs la máquina a la derecha.
// Es lógica pura: la usan el arcade 3D (modo demo, máquina vs máquina) y la pantalla de juego.
export const W = 320
export const H = 240
const TOP = 20 // el campo de juego empieza debajo de la barra roja
const BOTTOM = H - 14
const PAD_W = 6
const PAD_H = 40
const BALL = 6
const LEFT_X = 14
const RIGHT_X = W - 14
const WIN = 7
const RED = '#d9202f'

export function createPong() {
  const s = {
    mode: 'attract', // 'attract' (demo) | 'play' | 'over'
    score: [0, 0],
    left: { y: H / 2 },
    right: { y: H / 2 },
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
    wait: 1,
    winner: null,
    t: 0,
    err: 0,
  }
  serve(s, 1)
  return s
}

function serve(s, dir) {
  const a = (Math.random() - 0.5) * 0.7
  s.ball.x = W / 2
  s.ball.y = (TOP + BOTTOM) / 2 + (Math.random() - 0.5) * 70
  s.ball.vx = Math.cos(a) * 150 * dir
  s.ball.vy = Math.sin(a) * 150
  s.wait = 0.9
  s.err = (Math.random() - 0.5) * 36 // error de puntería de la máquina en este saque
}

export function startGame(s) {
  s.mode = 'play'
  s.score = [0, 0]
  s.winner = null
  s.left.y = H / 2
  s.right.y = H / 2
  serve(s, Math.random() < 0.5 ? 1 : -1)
}

const clampY = (y) => Math.max(TOP + PAD_H / 2, Math.min(BOTTOM - PAD_H / 2, y))

function follow(p, targetY, speed, dt) {
  const d = targetY - p.y
  p.y = clampY(p.y + Math.max(-speed * dt, Math.min(speed * dt, d)))
}

// input: { axis: -1 | 0 | 1, delta: píxeles de mouse }. sfx(tipo) es opcional.
export function stepPong(s, dt, input = { axis: 0, delta: 0 }, sfx) {
  s.t += dt
  if (s.mode === 'over') return
  const b = s.ball

  // Paleta izquierda: el jugador (o una máquina en el modo demo)
  if (s.mode === 'play') {
    s.left.y = clampY(s.left.y + input.axis * 200 * dt + (input.delta || 0))
  } else {
    follow(s.left, b.vx < 0 ? b.y + s.err : H / 2, 140, dt)
  }
  // Paleta derecha: la máquina, con velocidad limitada (se le puede ganar)
  follow(s.right, b.vx > 0 ? b.y + s.err : H / 2, s.mode === 'play' ? 160 : 140, dt)

  if (s.wait > 0) {
    s.wait -= dt
    return
  }
  b.x += b.vx * dt
  b.y += b.vy * dt

  if (b.y < TOP + BALL / 2) {
    b.y = TOP + BALL / 2
    b.vy = Math.abs(b.vy)
    sfx?.('wall')
  } else if (b.y > BOTTOM - BALL / 2) {
    b.y = BOTTOM - BALL / 2
    b.vy = -Math.abs(b.vy)
    sfx?.('wall')
  }

  const hit = (pad, x, dir) => {
    if (Math.abs(b.y - pad.y) > PAD_H / 2 + BALL / 2) return
    const rel = (b.y - pad.y) / (PAD_H / 2)
    const speed = Math.min(Math.hypot(b.vx, b.vy) * 1.07, 330)
    const ang = rel * 0.9
    b.vx = Math.cos(ang) * speed * dir
    b.vy = Math.sin(ang) * speed
    b.x = x + dir * (PAD_W / 2 + BALL / 2)
    s.err = (Math.random() - 0.5) * 36
    sfx?.('hit')
  }
  if (b.vx < 0 && b.x - BALL / 2 <= LEFT_X + PAD_W / 2 && b.x > LEFT_X - PAD_W) hit(s.left, LEFT_X, 1)
  else if (b.vx > 0 && b.x + BALL / 2 >= RIGHT_X - PAD_W / 2 && b.x < RIGHT_X + PAD_W) hit(s.right, RIGHT_X, -1)

  if (b.x < -BALL || b.x > W + BALL) {
    const playerSide = b.x < 0 ? 1 : 0 // 1 = punto de la máquina
    s.score[playerSide] += 1
    sfx?.(playerSide === 1 ? 'lose' : 'win')
    if (s.score[playerSide] >= WIN) {
      if (s.mode === 'play') {
        s.mode = 'over'
        s.winner = playerSide === 0 ? 'player' : 'machine'
        sfx?.(s.winner === 'player' ? 'victory' : 'defeat')
      } else {
        s.score = [0, 0]
      }
    }
    if (s.mode !== 'over') serve(s, playerSide === 1 ? -1 : 1)
  }
}

function text(g, str, x, y, size, color, align = 'center') {
  g.font = `bold ${size}px "Courier New", monospace`
  g.textAlign = align
  g.textBaseline = 'middle'
  g.fillStyle = color
  g.fillText(str, x, y)
}

// Dibuja la pantalla del juego (320 x 240), toda con la marca de Tsoft
export function drawPong(g, s) {
  g.fillStyle = '#0b0f14'
  g.fillRect(0, 0, W, H)

  // Barra roja con el logo
  g.fillStyle = RED
  g.fillRect(0, 0, W, 16)
  text(g, 'TSOFT', W / 2 - 14, 8.5, 11, '#ffffff')
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.moveTo(W / 2 + 12, 4)
  g.lineTo(W / 2 + 22, 8.5)
  g.lineTo(W / 2 + 12, 13)
  g.lineTo(W / 2 + 15, 8.5)
  g.closePath()
  g.fill()

  // Red central
  g.fillStyle = 'rgba(255,255,255,0.35)'
  for (let y = TOP + 2; y < BOTTOM; y += 14) g.fillRect(W / 2 - 1, y, 2, 8)

  // Marcador
  text(g, String(s.score[0]), W / 2 - 40, 50, 30, '#ffffff')
  text(g, String(s.score[1]), W / 2 + 40, 50, 30, '#ffffff')

  // Paletas rojas con borde claro y pelota blanca
  for (const [x, p] of [[LEFT_X, s.left], [RIGHT_X, s.right]]) {
    g.fillStyle = RED
    g.fillRect(x - PAD_W / 2, p.y - PAD_H / 2, PAD_W, PAD_H)
    g.fillStyle = '#ffd5d8'
    g.fillRect(x - PAD_W / 2 + (x < W / 2 ? PAD_W - 2 : 0), p.y - PAD_H / 2, 2, PAD_H)
  }
  if (s.wait <= 0 || Math.floor(s.t * 8) % 2 === 0) {
    g.fillStyle = '#ffffff'
    g.fillRect(s.ball.x - BALL / 2, s.ball.y - BALL / 2, BALL, BALL)
  }

  // Línea de piso y pie
  g.fillStyle = RED
  g.fillRect(0, BOTTOM + 1, W, 1)
  text(g, 'TSOFT ARCADE', W / 2, H - 6, 8, '#7d8590')

  if (s.mode === 'attract' && Math.floor(s.t * 1.6) % 2 === 0) {
    g.fillStyle = 'rgba(11,15,20,0.75)'
    g.fillRect(W / 2 - 78, H / 2 + 52, 156, 20)
    text(g, 'INSERTÁ UNA FICHA', W / 2, H / 2 + 62, 12, '#ffffff')
  }
  if (s.mode === 'over') {
    g.fillStyle = 'rgba(11,15,20,0.85)'
    g.fillRect(40, 78, W - 80, 96)
    g.strokeStyle = RED
    g.lineWidth = 2
    g.strokeRect(40, 78, W - 80, 96)
    const won = s.winner === 'player'
    text(g, won ? '¡GANASTE!' : 'GANÓ LA MÁQUINA', W / 2, 106, won ? 22 : 16, '#ffffff')
    text(g, won ? 'Te ganaste otro café' : 'Revancha, Tsofer', W / 2, 130, 11, '#ff8a92')
    if (Math.floor(s.t * 2) % 2 === 0) text(g, 'ESPACIO / CLIC: JUGAR DE NUEVO', W / 2, 156, 9, '#ffffff')
  }
}

// Sonidos tipo chip (Web Audio). Solo se activan dentro del juego, después de un clic.
let audio = null
export function makeSfx() {
  const tone = (f, d, type = 'square', delay = 0) => {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)()
      const t = audio.currentTime + delay
      const o = audio.createOscillator()
      const g = audio.createGain()
      o.type = type
      o.frequency.value = f
      g.gain.setValueAtTime(0.05, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d)
      o.connect(g).connect(audio.destination)
      o.start(t)
      o.stop(t + d)
    } catch {
      /* sin audio, no pasa nada */
    }
  }
  return (kind) => {
    if (kind === 'hit') tone(480, 0.07)
    else if (kind === 'wall') tone(260, 0.05)
    else if (kind === 'win') tone(700, 0.12)
    else if (kind === 'lose') tone(140, 0.2)
    else if (kind === 'victory') [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'square', i * 0.13))
    else if (kind === 'defeat') [300, 240, 180].forEach((f, i) => tone(f, 0.2, 'sawtooth', i * 0.18))
  }
}

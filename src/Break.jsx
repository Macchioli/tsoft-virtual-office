import { useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { useFrame } from '@react-three/fiber'
import { OFFICES } from './data'
import { H, W, createPong, drawPong, stepPong } from './pong'

const RED = '#d9202f'
const FACE_ROOM = Math.PI // los muebles están contra la pared del frente y miran hacia -z (hacia la sala)

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Cartel discreto "Tómate un break": plaqueta oscura con letras claras
function makeBreakSign() {
  return canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#1d1f23'
    g.fillRect(0, 0, w, h)
    g.fillStyle = RED
    g.fillRect(0, h - 8, w, 8)
    g.fillStyle = '#f2f2f0'
    g.font = '300 50px system-ui, Arial, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('Tómate un break', w / 2 + 42, h / 2 - 4)
    // Taza chiquita
    g.strokeStyle = '#f2f2f0'
    g.lineWidth = 5
    g.strokeRect(34, 40, 34, 34)
    g.beginPath()
    g.arc(72, 56, 11, -Math.PI / 2, Math.PI / 2)
    g.stroke()
    g.beginPath()
    g.moveTo(42, 28)
    g.quadraticCurveTo(48, 16, 54, 28)
    g.stroke()
  })
}

// Marquesina del arcade: TSOFT + flecha roja + PONG
function makeMarquee() {
  return canvasTexture(512, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#e8303e')
    grad.addColorStop(1, '#a8121e')
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = 'bold 78px "Courier New", monospace'
    g.textAlign = 'left'
    g.textBaseline = 'middle'
    g.fillText('TSOFT', 28, h / 2 + 2)
    g.beginPath()
    g.moveTo(262, 30)
    g.lineTo(314, h / 2)
    g.lineTo(262, h - 30)
    g.lineTo(278, h / 2)
    g.closePath()
    g.fill()
    g.fillText('PONG', 332, h / 2 + 2)
  })
}

// ---------- Mueble de la máquina de café (contra la pared) ----------
function CoffeeCounter({ x, wallZ }) {
  const sign = useMemo(makeBreakSign, [])
  return (
    <>
      <group position={[x, 0, wallZ - 0.3]}>
        {/* Mueble blanco con tapa de madera clara */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.46, 0.84, 0.56]} />
          <meshStandardMaterial color="#efefec" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.865, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.6]} />
          <meshStandardMaterial color="#d9c3a3" roughness={0.6} />
        </mesh>
        {[-0.36, 0.36].map((dx) => (
          <mesh key={dx} position={[dx, 0.42, -0.285]}>
            <boxGeometry args={[0.02, 0.7, 0.01]} />
            <meshBasicMaterial color="#b9b9b4" />
          </mesh>
        ))}
        {/* Tarros y tazas sobre la mesada */}
        {[-0.5, -0.38].map((dx, i) => (
          <mesh key={dx} position={[dx, 0.95, 0.05]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.12 + i * 0.03, 14]} />
            <meshStandardMaterial color={i ? '#d9202f' : '#f2f2f0'} roughness={0.5} />
          </mesh>
        ))}
        {[0.42, 0.55].map((dx) => (
          <mesh key={dx} position={[dx, 0.93, 0.08]} castShadow>
            <cylinderGeometry args={[0.04, 0.032, 0.08, 14]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Cartel discreto sobre la mesada */}
      <mesh position={[x, 1.6, wallZ - 0.012]} rotation-y={FACE_ROOM}>
        <planeGeometry args={[0.85, 0.2125]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
    </>
  )
}

// ---------- La máquina de café: es lo que se apunta para tomar un café ----------
function CoffeeMachine({ x, wallZ }) {
  return (
    <group position={[x - 0.1, 0.89, wallZ - 0.3]} rotation-y={FACE_ROOM} userData={{ targetId: 'coffee' }}>
      <mesh position={[0, 0.23, -0.06]} castShadow>
        <boxGeometry args={[0.36, 0.46, 0.4]} />
        <meshStandardMaterial color="#1c1e22" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.49, -0.06]}>
        <boxGeometry args={[0.36, 0.06, 0.42]} />
        <meshStandardMaterial color="#2a2d32" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Frente: franja roja, botones, pico y bandeja con taza */}
      <mesh position={[0, 0.38, 0.145]}>
        <boxGeometry args={[0.3, 0.06, 0.012]} />
        <meshStandardMaterial color={RED} roughness={0.5} />
      </mesh>
      {[-0.08, 0, 0.08].map((bx) => (
        <mesh key={bx} position={[bx, 0.3, 0.145]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.015, 0.015, 0.015, 10]} />
          <meshStandardMaterial color="#d9d9d6" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0.13]}>
        <boxGeometry args={[0.05, 0.06, 0.07]} />
        <meshStandardMaterial color="#9ea3a8" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.03, 0.1]}>
        <boxGeometry args={[0.26, 0.02, 0.16]} />
        <meshStandardMaterial color="#8d9297" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.085, 0.1]}>
        <cylinderGeometry args={[0.04, 0.031, 0.08, 14]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
      {/* Depósito de granos */}
      <mesh position={[0, 0.58, -0.06]}>
        <cylinderGeometry args={[0.1, 0.12, 0.12, 16]} />
        <meshStandardMaterial color="#3b2a1e" roughness={0.6} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}

// ---------- Pantalla del arcade: el Pong en modo demo (máquina vs máquina) ----------
function ArcadeScreen() {
  const { tex, g, game } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return { tex: t, g: c.getContext('2d'), game: createPong() }
  }, [])
  const acc = useRef(0)
  useFrame((_, delta) => {
    acc.current += Math.min(delta, 0.1)
    if (acc.current < 1 / 24) return
    stepPong(game, acc.current)
    acc.current = 0
    drawPong(g, game)
    tex.needsUpdate = true
  })
  return (
    <mesh position={[0, 1.34, 0.268]} rotation-x={-0.16}>
      <planeGeometry args={[0.5, 0.375]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

// ---------- Gabinete del arcade con la marca de Tsoft: es lo que se apunta para jugar ----------
function ArcadeCabinet({ x, wallZ }) {
  const marquee = useMemo(makeMarquee, [])
  const body = { color: '#15171b', roughness: 0.5, metalness: 0.2 }
  return (
    <group position={[x, 0, wallZ - 0.4]} rotation-y={FACE_ROOM} userData={{ targetId: 'arcade' }}>
      {/* Cuerpo y laterales */}
      <mesh position={[0, 0.5, -0.02]} castShadow>
        <boxGeometry args={[0.7, 1.0, 0.7]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0, 1.5, -0.1]} castShadow>
        <boxGeometry args={[0.7, 1.0, 0.5]} />
        <meshStandardMaterial {...body} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.352, 1.0, -0.02]}>
          <boxGeometry args={[0.012, 2.0, 0.72]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
      ))}
      {/* Panel de control inclinado, con perilla y botones */}
      <mesh position={[0, 1.02, 0.3]} rotation-x={-0.28} castShadow>
        <boxGeometry args={[0.7, 0.07, 0.34]} />
        <meshStandardMaterial color={RED} roughness={0.45} />
      </mesh>
      <mesh position={[-0.14, 1.08, 0.3]}>
        <cylinderGeometry args={[0.045, 0.05, 0.05, 16]} />
        <meshStandardMaterial color="#f2f2f0" roughness={0.4} />
      </mesh>
      {[0.1, 0.2].map((bx) => (
        <mesh key={bx} position={[bx, 1.075, 0.3]}>
          <cylinderGeometry args={[0.028, 0.028, 0.03, 14]} />
          <meshStandardMaterial color="#f2f2f0" roughness={0.4} />
        </mesh>
      ))}
      {/* Bisel y pantalla */}
      <mesh position={[0, 1.34, 0.245]} rotation-x={-0.16}>
        <boxGeometry args={[0.6, 0.47, 0.02]} />
        <meshStandardMaterial color="#050607" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.33, 0.19]}>
        <boxGeometry args={[0.6, 0.5, 0.1]} />
        <meshStandardMaterial color="#0b0c0e" roughness={0.9} />
      </mesh>
      <ArcadeScreen />
      {/* Marquesina iluminada */}
      <mesh position={[0, 1.96, 0.16]}>
        <boxGeometry args={[0.7, 0.24, 0.06]} />
        <meshStandardMaterial color="#15171b" />
      </mesh>
      <mesh position={[0, 1.96, 0.192]}>
        <planeGeometry args={[0.66, 0.2]} />
        <meshBasicMaterial map={marquee} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Muebles del rincón (no se apuntan)
export function BreakCorner({ office }) {
  const b = OFFICES[office].breakSpot
  return <CoffeeCounter x={b.coffeeX} wallZ={b.wallZ} />
}

// Lo que se apunta (va dentro del grupo que recorre el raycaster)
export function BreakTargets({ office }) {
  const b = OFFICES[office].breakSpot
  return (
    <>
      <CoffeeMachine x={b.coffeeX} wallZ={b.wallZ} />
      <ArcadeCabinet x={b.arcadeX} wallZ={b.wallZ} />
    </>
  )
}

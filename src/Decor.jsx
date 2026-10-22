import { useMemo } from 'react'
import { DESK_HEIGHT, WALL_HEIGHT } from './data'
import {
  makeCeilingTexture,
  makeDeskTexture,
  makeExitTexture,
  makeNeonLogoTexture,
  makePlantTexture,
} from './textures'

export const HALF_PI = Math.PI / 2

// Random con semilla, para que la oficina se vea igual en cada recarga
export function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

// ---------- Pared (la sombra no se proyecta: la luz "viene de afuera") ----------
export function Wall({ position, args, color = '#efeee9' }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

// ---------- Cielorraso de placas, paneles LED, spots y difusores de aire ----------
export function Ceiling({ room, panels, spots = [], diffusers = [] }) {
  const map = useMemo(makeCeilingTexture, [])
  map.repeat.set(room.w / 0.6, room.d / 0.6)
  return (
    <>
      <mesh rotation-x={HALF_PI} position={[0, WALL_HEIGHT, 0]}>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial map={map} roughness={1} />
      </mesh>
      {panels.map(([x, z, w, d], i) => (
        <group key={i} position={[x, WALL_HEIGHT - 0.012, z]}>
          <mesh>
            <boxGeometry args={[w + 0.06, 0.02, d + 0.06]} />
            <meshStandardMaterial color="#d9d8d3" />
          </mesh>
          <mesh position={[0, -0.011, 0]}>
            <boxGeometry args={[w, 0.004, d]} />
            <meshBasicMaterial color="#fff0d0" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {spots.map(([x, z], i) => (
        <mesh key={i} position={[x, WALL_HEIGHT - 0.008, z]} rotation-x={HALF_PI}>
          <circleGeometry args={[0.08, 20]} />
          <meshBasicMaterial color="#fff6e2" toneMapped={false} />
        </mesh>
      ))}
      {diffusers.map(([x, z], i) => (
        <group key={i} position={[x, WALL_HEIGHT - 0.01, z]}>
          <mesh>
            <boxGeometry args={[0.62, 0.02, 0.62]} />
            <meshStandardMaterial color="#d2d3d1" />
          </mesh>
          <mesh position={[0, -0.011, 0]}>
            <boxGeometry args={[0.5, 0.004, 0.5]} />
            <meshStandardMaterial color="#8d9094" />
          </mesh>
          {[-0.15, -0.05, 0.05, 0.15].map((o) => (
            <mesh key={o} position={[0, -0.014, o]}>
              <boxGeometry args={[0.5, 0.004, 0.018]} />
              <meshStandardMaterial color="#c4c6c8" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

// Pocas luces puntuales (son caras): cada una cubre una zona
export function Lights({ list }) {
  return list.map((l, i) => (
    <pointLight key={i} position={l.pos} color={l.color} intensity={l.intensity} distance={l.distance} />
  ))
}

// ---------- Ventanal de piso a techo con persianas roller y la ciudad detrás ----------
// side: 'right' o 'left'. z0: dónde empieza el ventanal (termina en la pared de entrada).
export function WindowWall({
  room,
  side = 'right',
  z0,
  blinds,
  blindColor = '#c9ccce',
  frameColor = '#2a2d31',
  sky,
}) {
  const skyline = useMemo(sky, [sky])
  const sx = side === 'right' ? 1 : -1
  const x = (sx * room.w) / 2
  const len = room.d / 2 - z0
  const cz = z0 + len / 2
  const panes = blinds.length
  const pw = len / panes
  const frame = { color: frameColor, roughness: 0.5, metalness: 0.4 }
  return (
    <>
      {Array.from({ length: panes + 1 }, (_, i) => (
        <mesh key={i} position={[x - sx * 0.05, WALL_HEIGHT / 2, z0 + i * pw]}>
          <boxGeometry args={[0.1, WALL_HEIGHT, 0.1]} />
          <meshStandardMaterial {...frame} />
        </mesh>
      ))}
      {[0.05, WALL_HEIGHT - 0.05].map((y) => (
        <mesh key={y} position={[x - sx * 0.05, y, cz]}>
          <boxGeometry args={[0.1, 0.1, len]} />
          <meshStandardMaterial {...frame} />
        </mesh>
      ))}
      <mesh position={[x - sx * 0.05, WALL_HEIGHT / 2, cz]} rotation-y={-sx * HALF_PI}>
        <planeGeometry args={[len, WALL_HEIGHT]} />
        <meshStandardMaterial
          color="#a9c9db"
          transparent
          opacity={0.12}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
      {blinds.map((h, i) => (
        <group key={i} position={[x - sx * 0.14, 0, z0 + (i + 0.5) * pw]}>
          <mesh position={[0, WALL_HEIGHT - 0.1 - h / 2, 0]}>
            <boxGeometry args={[0.015, h, pw - 0.14]} />
            <meshStandardMaterial color={blindColor} roughness={0.9} />
          </mesh>
          <mesh position={[0, WALL_HEIGHT - 0.14, 0]}>
            <boxGeometry args={[0.1, 0.1, pw - 0.1]} />
            <meshStandardMaterial color={blindColor} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* La ciudad detrás del vidrio */}
      <mesh position={[x + sx * 16, 4.5, 0]} rotation-y={-sx * HALF_PI}>
        <planeGeometry args={[80, 20]} />
        <meshBasicMaterial map={skyline} toneMapped={false} />
      </mesh>
    </>
  )
}

// ---------- Pared del fondo: enredadera con el logo en neón ----------
export function PlantWall({ panelZ }) {
  const plants = useMemo(makePlantTexture, [])
  const neon = useMemo(makeNeonLogoTexture, [])
  const W = 5.6
  return (
    <>
      <mesh position={[0, WALL_HEIGHT / 2, panelZ - 0.06]}>
        <boxGeometry args={[W, WALL_HEIGHT, 0.12]} />
        <meshStandardMaterial color="#17331b" />
      </mesh>
      <mesh position={[0, WALL_HEIGHT / 2, panelZ + 0.003]}>
        <planeGeometry args={[W, WALL_HEIGHT]} />
        <meshStandardMaterial map={plants} roughness={1} />
      </mesh>
      <mesh position={[0, 2.72, panelZ + 0.02]}>
        <planeGeometry args={[4.6, 1.495]} />
        <meshBasicMaterial map={neon} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* El neón tiñe de celeste las plantas cercanas */}
      <pointLight position={[0, 2.72, panelZ + 0.9]} color="#aee6ff" intensity={4} distance={6} />
    </>
  )
}

// ---------- Mesa de madera clara (el escritorio del fondo y la mesa del lounge) ----------
export function Table({ x, z, w, d, legColor = '#f2f2f2' }) {
  const wood = useMemo(() => makeDeskTexture([w / 1.2, d / 1.2]), [w, d])
  const top = 0.04
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, DESK_HEIGHT - top / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, top, d]} />
        <meshStandardMaterial map={wood} roughness={0.6} />
      </mesh>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh
          key={i}
          position={[sx * (w / 2 - 0.12), (DESK_HEIGHT - top) / 2, sz * (d / 2 - 0.12)]}
          castShadow
        >
          <boxGeometry args={[0.06, DESK_HEIGHT - top, 0.06]} />
          <meshStandardMaterial color={legColor} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// ---------- Silla de malla negra con base cromada. El respaldo queda en +z local ----------
export function Chair({ x, z, rot, jacket, back = '#2b2e32' }) {
  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <mesh position={[0, 0.47, 0]}>
        <boxGeometry args={[0.46, 0.07, 0.46]} />
        <meshStandardMaterial color="#1f2124" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.85, 0.22]} rotation-x={-0.08}>
        <boxGeometry args={[0.44, 0.58, 0.05]} />
        <meshStandardMaterial color={back} roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.26, 0.66, 0.02]}>
          <boxGeometry args={[0.04, 0.04, 0.3]} />
          <meshStandardMaterial color="#17181b" />
        </mesh>
      ))}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.028, 0.032, 0.4, 8]} />
        <meshStandardMaterial color="#a8aeb4" metalness={0.7} roughness={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.06, 0]} rotation-y={(i * Math.PI) / 3}>
          <boxGeometry args={[0.62, 0.025, 0.04]} />
          <meshStandardMaterial color="#a8aeb4" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* Campera colgada del respaldo */}
      {jacket && (
        <mesh position={[0, 0.82, 0.29]}>
          <boxGeometry args={[0.52, 0.66, 0.1]} />
          <meshStandardMaterial color={jacket} roughness={0.95} />
        </mesh>
      )}
    </group>
  )
}

// ---------- Notebook: la base y la pantalla inclinada hacia atrás (la persona está en +z local) ----------
export function Laptop({ x, z, flip, lit }) {
  return (
    <group position={[x, DESK_HEIGHT, z]} rotation-y={flip ? Math.PI : 0}>
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.34, 0.016, 0.24]} />
        <meshStandardMaterial color="#2c2f33" roughness={0.5} metalness={0.4} />
      </mesh>
      <group position={[0, 0.016, -0.12]} rotation-x={-0.26}>
        <mesh position={[0, 0.11, 0]}>
          <boxGeometry args={[0.34, 0.22, 0.01]} />
          <meshStandardMaterial color="#1d2024" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.11, 0.0055]}>
          <planeGeometry args={[0.31, 0.19]} />
          <meshBasicMaterial color={lit ? '#46688f' : '#15171a'} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Planta en maceta ----------
export function Plant({ x, z, s = 1 }) {
  const rand = useMemo(() => rng(Math.floor(Math.abs(x * 100 + z * 10))), [x, z])
  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        a: (i / 9) * Math.PI * 2 + rand(),
        r: 0.05 + rand() * 0.14,
        y: 0.45 + rand() * 0.55,
        size: 0.13 + rand() * 0.08,
        c: ['#2f7a36', '#3c8f42', '#276a2d', '#4aa04a'][i % 4],
      })),
    [rand]
  )
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.34, 20]} />
        <meshStandardMaterial color="#2b2d31" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.02, 0.4, 6]} />
        <meshStandardMaterial color="#3d5a2c" />
      </mesh>
      {leaves.map((l, i) => (
        <mesh
          key={i}
          position={[Math.cos(l.a) * l.r, l.y, Math.sin(l.a) * l.r]}
          scale={[1, 0.8, 1]}
          castShadow
        >
          <sphereGeometry args={[l.size, 10, 8]} />
          <meshStandardMaterial color={l.c} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ---------- Columna redonda ----------
export function Column({ x, z, r, color = '#c6c8c8' }) {
  return (
    <mesh position={[x, WALL_HEIGHT / 2, z]} castShadow receiveShadow>
      <cylinderGeometry args={[r, r, WALL_HEIGHT, 32]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  )
}

// ---------- Cartel de salida colgado del techo. El texto mira hacia el interior (-z) ----------
export function ExitSign({ x, z }) {
  const map = useMemo(makeExitTexture, [])
  return (
    <group position={[x, 3.2, z]}>
      <mesh>
        <boxGeometry args={[0.55, 0.2, 0.06]} />
        <meshStandardMaterial color="#17935a" />
      </mesh>
      <mesh position={[0, 0, -0.032]} rotation-y={Math.PI}>
        <planeGeometry args={[0.52, 0.19]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  )
}
